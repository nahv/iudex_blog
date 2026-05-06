# Sistema de email — Iudex

Spec completa del workflow de email del proyecto. Cubre los 4 servicios involucrados (Resend, Supabase, Cloudflare, Notion), las 5 Edge Functions, el admin panel web, los scripts manuales, y todos los env vars / webhooks / DNS requeridos.

> Si cambia algo del sistema (nueva función, nuevo flag, secret renombrado, ruta DNS modificada), **actualizar este doc en el mismo commit**. Es la fuente de verdad para que Claude Code y futuros devs entiendan la arquitectura.

---

## Resumen

| Capa | Servicio | Para qué |
|---|---|---|
| Envío | **Resend** | Transaccional (welcome, founder-notify, beta-invite) + futuras Broadcasts. Domain `notificaciones.iudex.com.ar`. |
| Persistencia | **Supabase** | Tabla `registrations` (leads). Edge Functions (Deno) ejecutan la lógica disparada por Database Webhooks. |
| Recepción | **Cloudflare Email Routing** | Forward de `*@iudex.com.ar` a inboxes de Gmail/iCloud. |
| CRM-lite | **Notion** | Database con pages auto-creadas por cada lead. Para gestión humana del pipeline. |
| Eventos | **Resend Webhooks (Svix)** | Lifecycle events (bounced, complained, etc.) → alertas al equipo. |
| Admin | **Página `/admin/`** (estática + Edge Functions) | UI web para que Maxi+Nahuel manden emails ad-hoc o con templates, con preview live, drafts e history. |

---

## Arquitectura

### Outbound — registro automático desde landing

```
[Visitante completa form en landing/contacto]
                    │
                    ▼
       [iudexDB.insert en public/js/main.js]
                    │  (Supabase REST API anon)
                    ▼
      [INSERT en public.registrations]
                    │
                    │ (Supabase dispara dos Database Webhooks en paralelo,
                    │  ambos con Authorization: Bearer <WEBHOOK_SECRET>)
        ┌───────────┴───────────┐
        ▼                       ▼
[send-inscription-email]  [sync-to-notion]
        │                       │
        │                       ▼
        │              [Notion API: create page]
        │                       │
        │                       ▼
        │              [Página en Notion DB]
        │
        ├──► Resend.send (welcome) ──► email del lead
        │
        └──► Resend.send (founder-notify) ──► RESEND_TEAM_TO (multi-recipient)
                    │
                    ▼ (después de cada envío)
        [UPDATE registrations SET email_sent_at, email_message_id]
```

### Outbound — invitación manual a beta tester (CLI)

```
[Operador (Nahuel/Maxi) en CLI local]
                    │
                    ▼
[node scripts/send-beta-invite.mjs --to ... --name ... --link ...]
                    │
                    │  (lee emails/beta-invite.html, hace render
                    │   manual de {{nombre}} y {{drive_link}})
                    ▼
            [Resend API: emails]
                    │
                    ▼
        [Email al beta tester]
```

No pasa por DB ni por Edge Functions. Es 100% local + Resend.

### Outbound — admin panel (UI web)

```
[Maxi/Nahuel en https://iudex.com.ar/admin/]
                    │
                    │  Login con magic link a {nahuel,mbury}@iudex.com.ar
                    │  → Cloudflare → Gmail/iCloud → click → JWT en localStorage
                    ▼
[Composer page: pick template, fill vars, preview live]
                    │
                    │  POST /functions/v1/send-custom-email
                    │  con Authorization: Bearer <JWT>
                    ▼
[Gateway Supabase] valida firma JWT (verify_jwt = true)
                    │
                    ▼
[send-custom-email Edge Function]
                    │
                    ├──► Decode JWT, extrae email
                    ├──► Verifica email ∈ ADMIN_ALLOWLIST (server-side)
                    ├──► Render: el HTML ya viene resuelto del frontend
                    ├──► Resend.send (transactional, 1-N to o iterando audience)
                    └──► INSERT en public.sent_emails (audit log)
```

El admin panel consume tres surfaces de Supabase:
- **Edge Function `send-custom-email`** — envía vía Resend con allowlist server-side.
- **Edge Function `list-audiences`** — popula el dropdown sin exponer RESEND_API_KEY al browser.
- **Tablas `sent_emails` + `email_drafts`** — RLS garantiza que solo authenticated users ven el historial, y cada user solo sus propios drafts.

### Lifecycle events de Resend → alertas al equipo

```
[Resend procesa un email]
                    │
                    │  (genera evento email.delivered/bounced/complained/etc)
                    ▼
[Resend webhook → POST a notify-email-events]
   con headers svix-id, svix-timestamp, svix-signature
                    │
                    ▼
       [notify-email-events Edge Function]
                    │
                    ├──► Verifica firma Svix con RESEND_WEBHOOK_SECRET
                    │    (si falla → 401)
                    │
                    ├──► Anti-replay (rechaza > 5 min de antigüedad)
                    │
                    ├──► console.log del evento (siempre)
                    │
                    └──► Si event.type ∈ EMAIL_EVENTS_ALERT_TYPES:
                              │
                              ▼
                     [Resend.send (alerta) → EMAIL_EVENTS_NOTIFY_TO]
```

### Inbound — emails recibidos en `@iudex.com.ar`

```
[Email externo a algo@iudex.com.ar]
                    │
                    │  (MX records → Cloudflare Email Routing)
                    ▼
       ┌────────────┼────────────────┐
       ▼            ▼                ▼
   nahuel@      mbury@        catch-all (*)
       │            │                │
       ▼            ▼                ▼
nahvallejos@   maximiliano.    iudexblog3@
gmail.com      bury@icloud      gmail.com
                                     │
                                     │  (Gmail filters)
                              ┌──────┴──────┐
                              ▼             ▼
                        nahvallejos@   maximiliano.
                        gmail.com      bury@icloud.com
```

---

## Componentes

### Edge Functions (Supabase)

Las tres viven en `supabase/functions/<name>/index.ts`. Todas tienen `verify_jwt = false` definido en `supabase/config.toml` — es crítico, sin eso el gateway de Supabase rechaza los webhooks con 401.

#### `send-inscription-email`

- **Trigger**: Database Webhook sobre `INSERT` en `public.registrations`.
- **Auth**: header `Authorization: Bearer <WEBHOOK_SECRET>` (tolera con o sin prefix `Bearer`).
- **Idempotencia**: skip si `row.email_sent_at` o `row.ses_sent_at` (legacy) ya están seteados.
- **Acción**:
  1. Renderiza `welcome.html` con vars del row (`nombre`, `perfil`, `provincia`).
  2. Renderiza `founder-notify.html` con vars del row (todos los campos).
  3. `Resend.send` welcome al `row.email` con `Idempotency-Key: user-<row.id>`.
  4. Si `RESEND_TEAM_TO` no está vacío: `Resend.send` founder-notify a la lista (split por coma, hasta 50 destinatarios) con `Idempotency-Key: team-<row.id>`. Reply-To del founder-notify = email del lead, así contestar reenvía al lead directamente.
  5. UPDATE en `registrations` con `email_sent_at = now()` y `email_message_id`.
- **Templates**: `welcome.html` + `founder-notify.html` envueltos en `welcome.ts` + `founder-notify.ts` (TS export de string para que Deno los importe).
- **Renderer Mustache mínimo** soporta `{{var}}`, `{{#var}}...{{/var}}` (truthy), `{{^var}}...{{/var}}` (falsy).

#### `sync-to-notion`

- **Trigger**: Database Webhook sobre el mismo `INSERT` en `public.registrations` (webhook **separado** del de send-inscription-email).
- **Auth**: idéntico — `Authorization: Bearer <WEBHOOK_SECRET>`.
- **Idempotencia**: query a Notion filtrando por la property "Lead ID" del row.id antes de crear la página. Si ya existe, retorna `skipped: already_synced`.
- **Acción**: crea una page en la Notion database con 12 properties mapeadas del row.
- **Sin tracking en DB**: no usa columnas tipo `notion_synced_at` (decisión: dedup en runtime para evitar migración SQL).

#### `notify-email-events`

- **Trigger**: webhook de Resend (configurado en Resend Dashboard → Webhooks). Resend usa Svix para firmar.
- **Auth**: verificación de firma Svix HMAC-SHA256 sobre `${svixId}.${svixTimestamp}.${body}`. Anti-replay window de 5 minutos.
- **Acción**:
  1. `console.log` del evento (visible en Supabase Edge Function logs).
  2. Si `event.type ∈ EMAIL_EVENTS_ALERT_TYPES`: manda email de alerta (HTML branded con barra de severidad coloreada por tipo) a `EMAIL_EVENTS_NOTIFY_TO`.
  - Default alert types: `email.bounced`, `email.complained`, `email.delivery_delayed`. Override via env var.

#### `send-custom-email`

- **Trigger**: HTTP POST desde el admin panel (`/admin/emails/`).
- **Auth**: Triple proteccion — gateway valida JWT (verify_jwt = true), código decodifica el JWT y extrae `email`, allowlist `ADMIN_ALLOWLIST` (env var) chequea el email server-side. Si falla cualquiera → 401/403 sin tocar Resend.
- **Acción**:
  1. Recibe payload con HTML ya renderizado (el frontend hizo la sustitución de `{{vars}}`).
  2. Si `test_mode`: override recipients = [user_email] + prefix `[TEST]` en subject.
  3. Si `audience_id`: lista contactos de la audience (Resend API), filtra unsubscribed, manda 1 email transactional por contacto (cada uno solo ve su email en To).
  4. Si `recipients` directo: 1 envío con `to: [...recipients]`.
  5. INSERT en `public.sent_emails` con `sent_by = email del JWT`, `template`, `subject`, `recipients`, `body_html`, `status`, etc.

#### `list-audiences`

- **Trigger**: HTTP GET desde el admin panel.
- **Auth**: misma que `send-custom-email` (JWT + allowlist).
- **Acción**: lista las audiencias del workspace de Resend con conteo de contactos no-unsubscribed por cada una. Existe para no exponer `RESEND_API_KEY` al browser cuando el admin necesita poblar el dropdown de audiences.

### Templates HTML

| Path | Quién lo manda | Destinatario | Disparo |
|---|---|---|---|
| `supabase/functions/send-inscription-email/welcome.html` | `send-inscription-email` | Usuario que se registró | DB webhook |
| `supabase/functions/send-inscription-email/founder-notify.html` | `send-inscription-email` | Equipo (`RESEND_TEAM_TO`) | DB webhook |
| `emails/beta-invite.html` | `scripts/send-beta-invite.mjs` | Beta tester individual | Manual desde CLI |

**Estética común**: ver `welcome.html` o `beta-invite.html`. Cream `#f7f4ee` background, card central con linea gold-gradient `linear-gradient(90deg,#c9a84c,#e8c97a)` arriba, Georgia/Playfair en H1, labels uppercase gold con `letter-spacing:0.12em`, CTA ink `#0f0f0e` con texto gold `#c9a84c`. Cuando crear template nuevo, copiar la estructura de uno existente — no reinventar.

### Scripts

#### `scripts/send-beta-invite.mjs`

Sender CLI sin dependencias para invitaciones manuales a beta. Lee `emails/beta-invite.html`, renderiza variables, llama a Resend API directamente. **No pasa por DB ni Edge Function** — uso para envíos one-shot.

```bash
node --env-file=.env scripts/send-beta-invite.mjs \
  --to "tester@example.com" \
  --name "Nombre" \
  --link "https://drive.google.com/drive/folders/..."
```

Flags: `--to`, `--name`, `--link` (requeridos); `--from`, `--reply`, `--subject`, `--dry-run` (opcionales). Lee `RESEND_API_KEY` de `.env` local.

Para envíos a múltiples beta testers (>10 con copy idéntico): migrar a Resend Broadcasts con la audience `Beta testers`. La diferencia clave: Broadcasts adjunta un footer de unsubscribe automático (regulatorio para marketing). El script no — es transaccional.

### Admin panel — frontend

Ubicación en el repo: `admin/` (subroute servido por GitHub Pages junto al resto del sitio).

```
admin/
├── index.html              → Login con magic link
├── emails/
│   ├── index.html          → Composer (template/ad-hoc, preview live, send)
│   └── history.html        → Listado de últimos 50 envíos con detalle
├── css/
│   └── admin.css           → Estilos del panel (extiende paleta Iudex)
└── js/
    ├── config.js           → ADMIN_ALLOWLIST hardcodeada (UX hint, no security)
    ├── supabase.js         → Cliente Supabase desde CDN (esm.sh)
    ├── auth.js             → sendMagicLink, getSession, requireAuth, signOut
    ├── api.js              → Wrapper con Bearer JWT auto-inyectado para calls a las Edge Functions + CRUD de drafts/history
    ├── templates.js        → Registry de templates + render Mustache-mini
    ├── composer.js         → Lógica de la página composer
    └── history.js          → Lógica de la página history
```

**Templates disponibles** en el composer (registrados en `admin/js/templates.js`):
- `beta-invite` — fetch `/emails/beta-invite.html`, vars: `nombre`, `drive_link`.
- `blank-iudex` — fetch `/emails/blank-iudex.html`, vars: `heading`, `body_html`, `cta_label`, `cta_url`.
- `ad-hoc` — sin template fuente; el body lo escribe el user en una textarea (HTML libre, sin wrapper).

**Auth flow**: magic link con Supabase Auth a `nahuel@iudex.com.ar` o `mbury@iudex.com.ar`. El link viaja Cloudflare Email Routing → Gmail/iCloud → click → sesión persistente en `localStorage`. Allowlist enforced en frontend (UX) **y** en Edge Function (security).

**Keyboard shortcuts** en composer: `⌘↩` enviar, `⌘T` test (manda solo al user auth con prefijo `[TEST]`), `⌘S` guardar draft.

### Tablas (Supabase)

#### `public.registrations`

```sql
-- Columnas (basado en uso en Edge Functions)
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
email               text NOT NULL UNIQUE
nombre              text
apellido            text
telefono            text
perfil              text
provincia           text
fuero               text
tamano              text
mensaje             text
source              text   -- ej: 'contact-form', 'cta-home'. Tiene CHECK constraint en RLS.
created_at          timestamptz DEFAULT now()
email_sent_at       timestamptz   -- nuevo, neutro (Resend)
email_message_id    text          -- nuevo, neutro (Resend)
ses_sent_at         timestamptz   -- legacy AWS SES (se chequea para idempotencia)
ses_message_id      text          -- legacy AWS SES
```

- **RLS activo**. INSERT permitido para `anon` con `WITH CHECK` (probablemente filtrado por `source`). SELECT solo para `authenticated`.
- Lookups sobre `email_sent_at IS NULL` para identificar pendientes.

#### `public.sent_emails`

Audit log del admin panel. Ver migration `20260506130000_admin_panel_tables.sql`.

```sql
sent_by           text not null              -- email del JWT (ej: nahuel@iudex.com.ar)
sent_at           timestamptz default now()
template          text                        -- 'beta-invite' | 'blank-iudex' | 'ad-hoc' | etc
subject           text not null
recipients        text[] default '{}'         -- destinos directos
audience_id       text                        -- si fue por audience de Resend
audience_name     text                        -- cacheado para history
resend_message_id text                        -- id del primer envío
variables         jsonb                       -- vars usadas (audit / repetir)
body_html         text                        -- HTML final enviado
status            text default 'sent'         -- 'sent' | 'failed'
error_message     text
test_mode         boolean default false
```

- **RLS activo**. SELECT permitido a `authenticated`. INSERT solo via service_role (Edge Function).

#### `public.email_drafts`

Borradores del composer. Ver mismo archivo de migration.

```sql
owner        text not null               -- email del autor (auth.jwt() ->> 'email')
created_at   timestamptz default now()
updated_at   timestamptz default now()
title        text default 'Sin titulo'
template     text
subject      text
recipients   text[] default '{}'
audience_id  text
variables    jsonb
body_html    text                        -- para template = 'ad-hoc'
```

- **RLS activo**. CRUD restringido a `auth.jwt() ->> 'email' = owner`. Cada user solo ve y edita sus propios drafts.

### Domain config

#### Outbound (Resend)

Domain verificado en Resend: **`notificaciones.iudex.com.ar`** (subdominio de envío). Tiene SPF/DKIM/DMARC configurados en Cloudflare DNS. Sólo para enviar — no recibe.

- FROM productivo: `Iudex <equipo@notificaciones.iudex.com.ar>`
- Reply-To productivo: `contacto@iudex.com.ar` (rebota a Cloudflare → iudexblog3 → fan-out)

#### Inbound (Cloudflare Email Routing)

Domain: **`iudex.com.ar`**. Email Routing habilitado, MX apuntando a Cloudflare.

| Source | Type | Destination |
|---|---|---|
| `nahuel@iudex.com.ar` | Custom | `nahvallejos@gmail.com` |
| `mbury@iudex.com.ar` | Custom | `maximiliano.bury@icloud.com` |
| `*@iudex.com.ar` | Catch-all | `iudexblog3@gmail.com` |

**`iudexblog3@gmail.com`** es la inbox compartida. Tiene 2 filters de Gmail que reenvían cada email entrante a `nahvallejos@gmail.com` y `maximiliano.bury@icloud.com` (forward chain). Las dos forwarding addresses están verificadas en Settings → Forwarding and POP/IMAP. La pestaña "Forward all" está deshabilitada — el fan-out es por filters.

Si en el futuro queremos fan-out paralelo más robusto (sin depender del Gmail intermedio), usar Cloudflare **Email Worker** con `message.forward()` múltiple.

---

## Configuración

### Secrets en Supabase

Cargar en https://supabase.com/dashboard/project/zbysecepjvyyiufbliub/functions/secrets

| Key | Requerido por | Notas |
|---|---|---|
| `RESEND_API_KEY` | send-inscription-email, notify-email-events | API key de Resend |
| `WEBHOOK_SECRET` | send-inscription-email, sync-to-notion | Bearer secret compartido con los DB Webhooks |
| `RESEND_FROM` | (opcional) | Default: `Iudex <equipo@notificaciones.iudex.com.ar>` |
| `RESEND_REPLY_TO` | (opcional) | Default: `contacto@iudex.com.ar` |
| `RESEND_TEAM_TO` | send-inscription-email | Comma-separated. Multi-recipient para founder-notify. |
| `NOTION_API_KEY` | sync-to-notion | Internal Integration Secret de Notion |
| `NOTION_DATABASE_ID` | sync-to-notion | UUID puro **sin** `?v=...` ni otros query params |
| `RESEND_WEBHOOK_SECRET` | notify-email-events | Empieza con `whsec_`. De Resend Dashboard → Webhooks |
| `EMAIL_EVENTS_NOTIFY_TO` | notify-email-events | Comma-separated. Quién recibe alertas de eventos críticos |
| `EMAIL_EVENTS_ALERT_TYPES` | (opcional) | Default: `email.bounced,email.complained,email.delivery_delayed` |
| `ADMIN_ALLOWLIST` | send-custom-email, list-audiences | Comma-separated. Emails autorizados a usar el admin panel. Ej: `nahuel@iudex.com.ar,mbury@iudex.com.ar` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | (auto) | Auto-provistos por Supabase |

### Database Webhooks en Supabase

https://supabase.com/dashboard/project/zbysecepjvyyiufbliub/database/hooks

**Dos webhooks** sobre `public.registrations`, ambos con event `INSERT`:

| Name | Type | Function | Authorization header |
|---|---|---|---|
| `send-inscription-email-on-insert` (o similar) | Supabase Edge Functions | `send-inscription-email` | `Bearer <WEBHOOK_SECRET>` |
| `sync-to-notion-on-insert` | Supabase Edge Functions | `sync-to-notion` | `Bearer <WEBHOOK_SECRET>` (mismo valor) |

**⚠️ Importante**: el UI de Supabase auto-puebla `Authorization` con un JWT del service_role cuando creás un webhook nuevo. **Tenés que sobreescribirlo manualmente** con el `Bearer <WEBHOOK_SECRET>` custom — caso contrario el código de la función rechaza con 401.

### Webhook en Resend

https://resend.com/webhooks → Add Endpoint

- **URL**: `https://zbysecepjvyyiufbliub.supabase.co/functions/v1/notify-email-events`
- **Events**: marcar todos los `email.*` que interesen (recomendado: los 7 — sent, delivered, delivery_delayed, bounced, complained, opened, clicked).
- **Signing secret**: copiar el `whsec_...` que muestra Resend → guardar en Supabase Secrets como `RESEND_WEBHOOK_SECRET`.

### Notion

#### Integration

Crear una en https://www.notion.so/my-integrations:
- **Type**: Internal
- **Capabilities**: Read content, Update content, Insert content
- Copiar el "Internal Integration Secret" → `NOTION_API_KEY`

#### Database

Crear una full-page database en Notion con **estas properties exactas** (case-sensitive, sin acentos, mantener espacios donde hay):

| Property | Type |
|---|---|
| Nombre | Title |
| Apellido | Text |
| Email | Email |
| Telefono | Phone |
| Provincia | Select |
| Perfil | Select |
| Fuero | Select |
| Tamano | Select |
| Mensaje | Text |
| Source | Select |
| Lead ID | Text |
| Created at | Date |
| Status | Status (manual) |

**Conectar la integration a la database**: en la database → ⋯ → Connections → buscar tu integration ("Iudex Sync") → Confirm. Sin esto, la API tira `Could not find database`.

**Database ID**: copiar **solo** el UUID de la URL, sin `?v=...`:
```
https://notion.so/<workspace>/3570ddcd8dbc80f3ac27f88e47235a3f?v=...
                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                              esto es lo que va en NOTION_DATABASE_ID
```

### Admin panel — Supabase Auth

Para que el magic link funcione:

1. **Habilitar Email auth** en Supabase Dashboard → Authentication → Providers → Email → ON.
2. **Disable signups** (recomendado): Dashboard → Authentication → Settings → "Allow new users to sign up" = OFF. Combinado con la allowlist server-side, esto previene cualquier intento de signup no autorizado.
3. **Crear los users iniciales** manualmente: Dashboard → Authentication → Users → "Add user" → Email: `nahuel@iudex.com.ar`, `mbury@iudex.com.ar`. Esto los registra sin password — el magic link funciona porque el user existe.
4. **Configurar Site URL** en Settings → Authentication → URL Configuration:
   - Site URL: `https://iudex.com.ar`
   - Redirect URLs (whitelist): `https://iudex.com.ar/admin/emails/`, `https://iudex.com.ar/admin/`
5. **Custom email template** (opcional): Authentication → Email Templates → Magic Link. Se puede personalizar el HTML del email del magic link para que matchee la estética Iudex.
6. **Setear `ADMIN_ALLOWLIST`** en Functions → Secrets con los mismos emails.

### Admin panel — Migración SQL

Aplicar `supabase/migrations/20260506130000_admin_panel_tables.sql` antes del primer uso. Opciones:

```bash
# Via CLI (recomendado)
supabase db push

# O pegar el SQL en Dashboard → SQL Editor → Run
```

### `.env` local (para scripts)

`.env` en la raíz del repo (gitignored). Ver `.env.example` para referencia:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Se carga via `node --env-file=.env <script>`.

### Cloudflare Email Routing

https://dash.cloudflare.com → `iudex.com.ar` → Email → Email Routing

1. **Get Started** (si no está habilitado) — agrega MX records al DNS automáticamente.
2. **Destination addresses** — agregar y verificar (cada destino recibe email de confirmación):
   - `nahvallejos@gmail.com`
   - `maximiliano.bury@icloud.com`
   - `iudexblog3@gmail.com`
3. **Routing rules** — crear las custom + catch-all (ver tabla en sección "Inbound" arriba).

### Gmail filters en `iudexblog3@gmail.com`

1. Settings → Forwarding and POP/IMAP → agregar y **verificar** ambas forwarding addresses (`nahvallejos@gmail.com` y `maximiliano.bury@icloud.com`).
2. **No** habilitar "Forward all incoming mail" (eso solo permite UN destino).
3. Settings → Filters and Blocked Addresses → Create a new filter:
   - **Has the words**: `to:iudexblog3@gmail.com`
   - **Action**: Forward it to → seleccionar uno de los dos.
   - Crear el filter.
4. Repetir el paso 3 para el segundo destino.

Resultado: cada email a iudexblog3 queda en esa inbox + se forwardea a las dos personales.

---

## Deploy

### Edge Functions

**No hay CI** — el deploy es manual desde local.

```bash
cd /path/to/iudex_blog
git checkout development && git pull   # tener el código actualizado

supabase functions deploy send-inscription-email
supabase functions deploy sync-to-notion
supabase functions deploy notify-email-events
supabase functions deploy send-custom-email
supabase functions deploy list-audiences

# Migrations (admin panel)
supabase db push
```

`supabase/config.toml` tiene `verify_jwt = false` para las tres funciones — sin eso, los webhooks devuelven 401 a nivel del gateway. Si algún deploy queda con `verify_jwt = true` por error, el síntoma es 401 con `execution_id: null` en los logs (ver "Diagnóstico").

**No hace falta Docker corriendo** para deploys remotos. El warning "Docker is not running" se puede ignorar.

### Setup inicial de Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref zbysecepjvyyiufbliub
```

### Sitio estático (landing/blog)

Auto-deploy a GitHub Pages on push a `main`. Ver `.github/workflows/deploy.yml`. El workflow inyecta `public/js/env.js` con `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde GitHub Secrets.

---

## Diagnóstico de problemas comunes

### Form submitea pero no llega ningún email

1. **Verificar que la fila se creó en `registrations`**: Studio en https://supabase.com/dashboard/project/zbysecepjvyyiufbliub/editor.
2. **Ir a logs**: https://supabase.com/dashboard/project/zbysecepjvyyiufbliub/logs/edge-functions.

| Síntoma en logs | Causa | Fix |
|---|---|---|
| Sin entradas para `send-inscription-email` | Database Webhook no configurado o desactivado | Crear/activar en Database → Hooks |
| `status 401` con `execution_id: null` | JWT verification del gateway de Supabase | Re-deployar con `--no-verify-jwt`, asegurar que `supabase/config.toml` lo tenga |
| `status 401` con `execution_id != null` | El header `Authorization` del webhook no matchea `WEBHOOK_SECRET` | Editar el webhook, sobreescribir el JWT auto-poblado con `Bearer <WEBHOOK_SECRET>` |
| `status 502` con `Missing env var: X` | Falta cargar el secret X | Settings → Secrets |
| `status 200` pero `userError` o `teamError` en body | Resend rechazó el envío | Mensaje del error apunta a la causa |

### Sync a Notion no funciona pero send-inscription sí

Mirá logs específicos de `sync-to-notion` (los HTTP request logs muestran 502; los function logs incluyen el `console.error` con el mensaje real de Notion API).

| Mensaje del error | Causa | Fix |
|---|---|---|
| `Could not find database with ID` | Integration no conectada a la DB, **o** `NOTION_DATABASE_ID` con `?v=...` | Conectar via ⋯ → Connections / sanitizar el ID |
| `body.parent.database_id should be a valid uuid` | El secret tiene caracteres no-UUID (típicamente el query string del URL) | Recortar a solo el UUID |
| `body failed validation. Property "X" does not exist` | Property en Notion con nombre distinto al que el código manda | Renombrar la property en Notion (ver tabla en "Configuración → Notion → Database") |
| `status 200` con `skipped: already_synced` | Mismo `Lead ID` ya existe | Cargar registro nuevo (email distinto) |

### Webhooks de Resend devuelven 401

| `execution_id` | Causa |
|---|---|
| `null` | JWT verification del gateway. Re-deployar `notify-email-events` con `--no-verify-jwt`. |
| no-null | Firma Svix inválida. Verificar `RESEND_WEBHOOK_SECRET` matchea el de Resend Dashboard. |

### Emails de Iudex caen en spam o Promotions

- Revisar SPF/DKIM/DMARC del subdominio `notificaciones.iudex.com.ar` en Resend Dashboard → Domains → debería decir "Verified" para los tres.
- Para forwards de Gmail filters: marcar mensajes "Mover a Inbox principal" + "Hacer esto siempre con mensajes de este remitente" — Gmail aprende.
- Reputation se construye con tiempo y volumen consistente. Los primeros emails de un dominio nuevo a veces caen en Promotions hasta que el destinatario interactúa.

### Resend reintentos exponenciales

Si ves clusters de 401s en logs (varios intentos seguidos a `notify-email-events` con timestamps cercanos), es Resend reintentando un evento fallido. Svix retries hasta 5 veces con backoff exponencial. **Una vez fixado el secret/auth, los retries siguientes (que pueden tardar minutos) van a llegar al endpoint correctamente** — no hace falta hacer nada adicional.

---

## Decisiones de diseño

### Por qué dos DB Webhooks en lugar de uno con fan-out interno

Considerado: una sola Edge Function que llame a Notion + Resend. Decidí separar por:

- **Aislamiento de fallas**: Notion API caída no rompe el envío de email al lead.
- **Deploy independiente**: cambiar la lógica de Notion sin redeployar la crítica de email.
- **Single responsibility**: una función = una integración externa.

Costo: un click más en la UI de Supabase al hacer setup. Vale la pena.

### Por qué dedup de Notion via query en lugar de columna en `registrations`

Sin columna nueva (`notion_synced_at`/`notion_page_id`), cada invocación hace 1 query a Notion antes del create para chequear si ya existe una page con ese `Lead ID`. Costo: ~50ms latencia extra por evento.

Trade-off OK con el volumen actual (decenas de leads/mes). Si crece, agregar la columna es una migración trivial — el código ya queda listo para usarla simplemente cambiando el orden del check.

### Por qué alertas selectivas en notify-email-events

Si alertaramos en TODOS los eventos (`sent`, `delivered`, `opened`, `clicked`), serían 4-5 alertas por cada email enviado — saturaría las inboxes del equipo sin valor.

Default whitelist (`email.bounced`, `email.complained`, `email.delivery_delayed`) son los que requieren acción humana. El resto se loguea para visibilidad pasiva (Resend Dashboard tiene mejor UI para analytics agregados).

### Por qué transactional API para beta-invite en lugar de Broadcasts

- Cada beta-invite va a una persona específica con copy potencialmente personalizado.
- Para 1-a-1 no queremos el footer de unsubscribe que Broadcasts inyecta automáticamente.
- Cuando crezca a >10 invitaciones con mismo copy, migrar a Broadcasts (audience `Beta testers` ya existe).

### Por qué `notificaciones.iudex.com.ar` como subdominio en lugar de `iudex.com.ar`

Aislamiento de reputation. Si en algún momento una campaña genera complaints, sólo afecta el subdominio de envío — `iudex.com.ar` queda limpio para futuros usos (ej: cambiar de proveedor, agregar correos personales con Workspace, etc.).

---

## Referencias rápidas

- **Project ref Supabase**: `zbysecepjvyyiufbliub`
- **Resend Dashboard**: https://resend.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/zbysecepjvyyiufbliub
- **Notion Database**: https://www.notion.so/3570ddcd8dbc80f3ac27f88e47235a3f
- **Cloudflare Dashboard**: https://dash.cloudflare.com → iudex.com.ar → Email
