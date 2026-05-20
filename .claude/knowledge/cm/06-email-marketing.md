# Email Marketing - Iudex

## Stack Tecnológico Actual

El sistema de email de Iudex usa **Resend** como proveedor único, con **Supabase** para persistencia y disparo automático mediante Database Webhooks + Edge Functions.

> **Nota histórica**: El plan original (en versiones previas de este doc) era EmailJS client-side. Brevemente se probó AWS SES. Ambos fueron descartados; Resend ganó por mejor deliverability, soporte para Audiences/Broadcasts, y APIs limpias para uso transaccional + marketing en el mismo proveedor. Las columnas `ses_*` en `registrations` quedaron como legacy.

### Resend

- **Propósito**: Envío transaccional (auto-replies, notificaciones internas, invitaciones one-shot) y futuras broadcasts a listas.
- **Dominio verificado**: `notificaciones.iudex.com.ar` (subdominio transaccional con SPF/DKIM/DMARC).
- **FROM por defecto**: `Iudex <equipo@notificaciones.iudex.com.ar>`.
- **Reply-To por defecto**: `contacto@iudex.com.ar` (las respuestas humanas caen acá).
- **Audiences activas**: `Beta testers` (creada manualmente para distribución de builds privados).
- **API key**: en Supabase Secrets como `RESEND_API_KEY`. Para envíos manuales locales se usa un `.env` en la raíz del repo (gitignored).

### Supabase

- **Tabla `registrations`**: leads que solicitaron acceso anticipado vía la landing.
- **Database Webhook** sobre INSERT en `public.registrations` → dispara la Edge Function `send-inscription-email`.
- **Idempotencia**: columnas `email_sent_at` + `email_message_id` evitan reenvíos en retries del webhook. Las columnas legacy `ses_sent_at` + `ses_message_id` se siguen chequeando para no duplicar envíos antiguos.
- **Tabla futura `newsletter_subs`**: suscriptores al blog (todavía no implementada — ver "Flujos Futuros").

### Resumen visual

```
[Landing form / Script manual]
            |
            v
    [Supabase: registrations]   ← INSERT
            |
            | Database Webhook (Bearer WEBHOOK_SECRET)
            v
   [Edge Function: send-inscription-email]
            |
            | API call (idempotency-key por row.id)
            v
        [Resend]
            |
       +----+----+
       |         |
   [Welcome    [Founder
    al user]   notify al equipo]
```

---

## Templates Productivos

Los HTMLs de email viven en dos lugares según su naturaleza:

### Templates disparados por Edge Function

Ubicación: `supabase/functions/send-inscription-email/`

| Archivo | Destinatario | Cuándo se dispara |
|---|---|---|
| `welcome.html` | Usuario que se registra en la landing | Al recibirse INSERT en `registrations` |
| `founder-notify.html` | Equipo (`RESEND_TEAM_TO`) | Idem, en paralelo |

Ambos están envueltos en `welcome.ts` / `founder-notify.ts` que los exportan como string para Deno. La función usa un mini-renderer Mustache compatible con `{{var}}`, `{{#var}}...{{/var}}` (truthy block) y `{{^var}}...{{/var}}` (falsy block).

### Templates manuales (fuera de Edge Function)

Ubicación: `emails/`

| Archivo | Destinatario | Cómo se manda |
|---|---|---|
| `beta-invite.html` | Beta testers (one-off, build privado) | `scripts/send-beta-invite.mjs --to ... --name ... --link ...` |

Estos templates **no** están envueltos en TS — son HTML puro. El script los lee con `fs.readFile`, hace render manual de `{{nombre}}` y `{{drive_link}}`, y dispara la API de Resend directamente. No pasan por Edge Function porque son envíos puntuales, manuales, sin persistencia en `registrations`.

---

## Diseño visual común

Todos los templates respetan la identidad de marca (ver `00-identidad-marca.md`):

- **Fondo**: `#f7f4ee` (cream) con card central `#ffffff` con borde sutil.
- **Acento**: línea gold-gradient (`linear-gradient(90deg,#c9a84c,#e8c97a)`) en el tope de la card.
- **Tipografía**: `Georgia, 'Playfair Display', serif` para H1; `'Helvetica Neue', Arial, sans-serif` para body (Playfair vía web fonts no se carga confiablemente en clientes de email — Georgia es el fallback estable).
- **Labels de sección**: 11px, uppercase, `letter-spacing:0.12em`, color `#c9a84c`.
- **CTA**: fondo `#0f0f0e` (ink), texto `#c9a84c` (gold), bordes 10px.
- **Footer**: centrado, 13px gris para "Equipo Iudex", link a `contacto@iudex.com.ar` en gold, disclaimer 11px gris claro.

Cuando se cree un template nuevo, copiar la estructura base de `welcome.html` o `beta-invite.html` y adaptar el contenido. No reinventar la estética por cada email.

---

## Flujo Automático: Registro en Landing

Secuencia exacta cuando un visitante completa el formulario en la landing:

### Paso 1 — Validación client-side
- Campos requeridos: `nombre`, `apellido`, `email` (formato), `telefono`, `provincia`.
- Si falla validación: mensaje rojo bajo el campo, no se envía.

### Paso 2 — Anti-spam (honeypot)
- Campo invisible `name="website"` debe estar vacío.
- Si está lleno (bot lo completó): silenciosamente ignorar el submit. No alertar.

### Paso 3 — INSERT en Supabase
```js
const { data, error } = await supabase
  .from('registrations')
  .insert([{ nombre, apellido, email, telefono, provincia, fuero, tamano, mensaje, source: 'landing' }]);
```
- `email` tiene UNIQUE constraint. Si error code `23505`: "Ya tenés una solicitud registrada con ese email".
- Otros errores: "Error al registrar, intentá de nuevo".

### Paso 4 — Database Webhook (automático)
Supabase dispara automáticamente el webhook configurado:
- URL: la Edge Function `send-inscription-email`.
- Header: `Authorization: Bearer <WEBHOOK_SECRET>`.
- Body: `{ type: 'INSERT', table: 'registrations', record: {...} }`.

### Paso 5 — Edge Function envía vía Resend
Lógica en `supabase/functions/send-inscription-email/index.ts`:

1. Valida auth header contra `WEBHOOK_SECRET`.
2. Skip si `email_sent_at` o `ses_sent_at` ya están seteados (idempotencia).
3. Renderiza `welcome.html` con vars del row → POST a `https://api.resend.com/emails` con `Idempotency-Key: user-<row.id>`.
4. Si `RESEND_TEAM_TO` está seteada: renderiza `founder-notify.html` y manda al equipo con `Idempotency-Key: team-<row.id>` y `reply_to: <email-del-lead>`.
5. Update de `registrations` con `email_sent_at = now()` y `email_message_id = <resend-id>`.

### Paso 6 — UI de éxito
Cliente muestra "Gracias, revisá tu email en los próximos minutos" y resetea el form.

**Importante**: Los emails NO bloquean la respuesta al usuario. Si Resend falla, el row queda en `registrations` igual y el equipo lo procesa manualmente.

---

## Flujo Manual: Invitación a Beta Privada

Cuando un beta tester aprobado debe recibir un build privado:

```bash
node --env-file=.env scripts/send-beta-invite.mjs \
  --to "tester@example.com" \
  --name "Nombre" \
  --link "https://drive.google.com/drive/folders/..."
```

Variables del template:
- `{{nombre}}` → del flag `--name`
- `{{drive_link}}` → del flag `--link`

El subject por defecto es `<Nombre>, ya podés descargar Iudex` (override con `--subject`). FROM y Reply-To son los defaults productivos. El envío va por API directa (no Broadcast), así que **no se adjunta footer de unsubscribe** — apropiado para una invitación 1-a-1, no marketing masivo.

Para múltiples testers a la vez, usar **Broadcasts de Resend** con la audience `Beta testers` (ver siguiente sección).

---

## Mailing Lists y Broadcasts

Para envíos a múltiples personas (newsletter del blog, anuncios de producto, etc.) la primitiva correcta es **Resend Audiences + Broadcasts**, no la API transaccional.

### Diferencias clave

| Aspecto | API transaccional | Broadcasts |
|---|---|---|
| Destinatarios | 1 a la vez | Audience completa |
| Footer unsubscribe | No se adjunta | Se adjunta automático (regulatorio) |
| Tracking | Open/click por mensaje | Por broadcast + por contacto |
| Uso correcto | Auto-replies, invitaciones 1-a-1, password resets | Newsletter, anuncios, drip campaigns |

### Audiences activas

- **`Beta testers`**: contactos invitados al programa privado. Por ahora se manejan también vía `send-beta-invite.mjs` (no Broadcast) porque la cantidad es chica y queremos copy personalizado por persona.

### Cuándo migrar a Broadcasts

Cuando cualquiera de estas se cumpla:
- Más de ~10 personas en una misma audiencia recibiendo el mismo contenido.
- Se publica un nuevo artículo del blog y queremos avisar a la lista.
- Queremos tracking agregado de open/click rate.
- Necesitamos respetar unsubscribes automáticamente.

### Tabla futura: `newsletter_subs`

Cuando se implemente suscripción al blog:

```sql
CREATE TABLE newsletter_subs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP NULL,
  resend_contact_id TEXT  -- ID del contacto en la audience de Resend
);

ALTER TABLE newsletter_subs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anons" ON newsletter_subs
  FOR INSERT WITH CHECK (true);
```

El flujo previsto:
1. Usuario se suscribe en el blog → INSERT en `newsletter_subs` con `verified=false`.
2. Edge Function manda email de confirmación con token.
3. Click en token → update `verified=true` + agregar a Resend Audience vía API.
4. Si Resend reporta unsubscribe → sync de vuelta a Supabase con `unsubscribed_at`.

---

## Email de Bienvenida (Profundización)

El email de bienvenida es crítico porque es el primer contacto directo con el usuario. Debe ser honesto, cálido, y establecer expectativas correctas.

### Estructura Óptima

**Asunto** (35-50 caracteres):
```
Bienvenido/a a Iudex
```
- Corto, personalizado con nombre.
- Sin "hype" (no "¡Bienvenido a la revolución legal tech!").

**Preheader** (85-100 caracteres, visible antes de abrir):
```
Gracias por tu interés. Nos contactaremos pronto.
```
- Complementa el subject.
- Realista, no overpromise.

**Opening** (primeras líneas, antes de scrollear):
```
Hola {{nombre}},

Gracias por registrarte para acceso anticipado a Iudex.
```
- Personalizado con nombre.
- Directo, sin spam template.

**Cuerpo Principal**:
1. **Confirmación**: "Recibimos tu solicitud" (fecha/hora).
2. **Próximos pasos**: "Nos pondremos en contacto en X días".
3. **Qué esperar**: "Te preguntaremos sobre tu práctica".
4. **Recursos**: "Mientras, podés leer nuestro blog".
5. **Cierre**: "Gracias por creer en esto".

**CTA** (máximo 2):
- Primaria: link a blog ("Leer artículos").
- Secundaria: link a Instagram ("Seguir en redes").
- **NO**: "Ver demo" (si no existe), "Descargar app" (si no existe).

**Footer**:
- Copyright año actual.
- Email de contacto (`contacto@iudex.com.ar`).
- Unsubscribe link (si aplica — solo en Broadcasts).

### Tono

**Qué HACER**:
- Ser genuino, no corporate.
- Reconocer que es early stage (transparencia).
- Expresar gratitud sincera.
- Sugerir cómo agregar valor mientras espera.

**Qué EVITAR**:
- "¡Estamos revolucionando la industria legal!" (hype).
- "Acceso exclusivo VIP a nuestro producto" (no es tan exclusivo).
- Promesas sobre fecha de lanzamiento (no existe).
- "Consultas legales gratis" (responsabilidad legal).
- Demasiados links (confunde).

---

## Anti-Spam (Honeypot)

Implementación de honeypot field para evitar bots en el form de la landing:

### HTML
```html
<div class="form-group form-group--hidden">
  <label for="website">Website (dejar vacío)</label>
  <input type="text" id="website" name="website" style="display: none;">
</div>
```

### JavaScript
```javascript
const honeypot = document.querySelector('[name="website"]').value.trim();
if (honeypot !== '') {
  console.warn('Honeypot triggered - likely bot submission');
  return false;
}
```

**Por qué funciona**: los bots llenan todos los campos (incluso invisibles). Los humanos dejan el honeypot vacío porque no ven el campo.

**Limitación**: bots sofisticados detectan honeypots. Solución futura si hay spam: reCAPTCHA v3.

---

## Flujos Futuros de Email

### Double Opt-In (Confirmación)
**Cuándo implementar**: cuando newsletter tenga >50 suscriptores.
**Proceso**:
1. Usuario se suscribe → row en `newsletter_subs` con `verified=false`.
2. Edge Function manda email con link de confirmación (token único).
3. Click en link → endpoint de confirmación marca `verified=true`.
4. Usuario es agregado a la audience de Resend.
5. Recibe primer email de bienvenida.

**Beneficio**: reduce fake emails, aumenta deliverability, cumple con buenas prácticas.

### Newsletter Automática
**Cuándo**: cuando el blog tenga ritmo regular (≥1 post/mes).
**Setup**:
- Trigger: nuevo post publicado → query a `newsletter_subs WHERE verified AND unsubscribed_at IS NULL`.
- Send: vía Resend Broadcasts (no transaccional) para que el footer de unsubscribe se incluya automáticamente.
- Template: card resumen del post con CTA al artículo completo.

### Drip Campaign
**Idea**: serie de emails post-registro para mantener engagement.
```
Día 0:  Bienvenida (welcome.html actual)
Día 2:  "Cómo optimizar tu workflow" (educativo)
Día 5:  Case study: abogado que ahorró 10 horas/semana
Día 10: "¿Seguís interesado?" (re-engagement)
```
**Implementación**: requiere job scheduler (cron en Supabase Edge Functions o GitHub Actions). No para MVP.

---

## Métricas

Cuando haya volumen suficiente, Resend Dashboard ya tracker:

- **Deliverability**: % entregado vs bounces.
- **Open rate**: % que abre el email.
- **Click-through rate**: % que clickea CTA.
- **Conversion rate**: % que registra después de email (tracking propio en landing).
- **Unsubscribe rate**: % que se da de baja (solo Broadcasts).

**Targets iniciales**:
- Deliverability: >95%.
- Open rate: >25% (estándar transaccional).
- CTR: >5%.
- Conversion: >1% (venta), >10% (lead).

---

## Checklist de Email Marketing

Antes de lanzar emails:

- [x] Resend configurado con dominio `notificaciones.iudex.com.ar` (SPF/DKIM/DMARC OK).
- [x] Supabase tabla `registrations` con RLS activo.
- [x] Edge Function `send-inscription-email` deployada.
- [x] Database Webhook configurado con `WEBHOOK_SECRET`.
- [x] Templates productivos: `welcome.html`, `founder-notify.html`, `beta-invite.html`.
- [x] Audience `Beta testers` creada en Resend.
- [x] Script `scripts/send-beta-invite.mjs` para envíos manuales.
- [ ] Form validación client-side completa (incluir si aún no está).
- [ ] Honeypot implementado en form de landing.
- [ ] Spam folder testing (mandar a Gmail/Outlook/Hotmail y verificar inbox).
- [ ] UTMs en links del blog/redes para tracking de fuente.
- [ ] Tabla `newsletter_subs` (cuando se implemente suscripción al blog).

---

## Ejemplos de Variación de Tono

### Bienvenida más personal (alternativa al `welcome.html` actual)

Si en algún momento queremos un tono aún más íntimo (por ejemplo para invitaciones beta):

```
Subject: Bienvenido/a a Iudex (sin formalismos)

Hola {{nombre}},

Gracias por registrarte.

Honestamente, recibir tu email me pone contento. Significa que hay
abogados ahí afuera que sienten lo mismo que yo sentía: frustración
con procesos manuales que roban tiempo.

Iudex es mi respuesta a eso. Software creado POR abogados PARA abogados.

En los próximos días me contacto personalmente para entender tu caso
y ver si Iudex puede ayudarte.

Un abrazo,
Nahuel

---
P.D.: Si ves bugs, features raras, o cosas feas... es porque estamos
en beta. Lo importante es que resuelve problemas reales. Tu feedback
es gold para nosotros.
```

### Email de seguimiento (Día 3)
```
Subject: Seguimos aquí (no es spam, es info útil)

Hola {{nombre}},

Hace 3 días registraste para Iudex. Quería asegurarme de que recibiste
nuestro primer email.

Mientras te contacto personalmente, te dejo unos resources:

→ Blog: "Escritura repetitiva" — Por qué escribir lo mismo 10x es un desperdicio
→ Instagram: @iudex.ai — Tips diarios de productividad legal
→ Preguntas?: Contame en DM de Instagram

Nos hablamos pronto,
Nahuel
```

---

## Compliance y Privacy

### GDPR / Argentina
- [x] Términos de privacidad publicados en `politica-privacidad/index.html`.
- [ ] Unsubscribe link en cada email de marketing (auto vía Broadcasts).
- [ ] Política de retención de datos definida.
- [ ] Endpoint para "delete my data" (cuando haya volumen).

### Datos sensibles — Qué NO guardar en email
- Passwords (obvio).
- Números de expedientes confidenciales.
- Datos de clientes del abogado (privacidad abogado-cliente).
- Cualquier cosa que el equipo no debería ver casualmente.

### Seguridad
- HTTPS obligatorio en formulario de la landing.
- Supabase RLS activo (no public read en `registrations`).
- `RESEND_API_KEY` solo en Supabase Secrets y `.env` local (nunca en cliente, nunca commiteada).
- `WEBHOOK_SECRET` rotable: si se filtra, regenerarlo en Supabase y actualizar la Edge Function.
