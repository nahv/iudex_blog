# Plan de Automatización de Flujos de Usuario

**Fecha:** 2026-04-05
**Autor:** Nahuel
**Rama:** `feature/pre-access-registration`

---

## Decisiones de stack

### ¿Por qué Supabase + EmailJS?

El sitio es estático (HTML/CSS/JS, GitHub Pages). No hay backend propio ni build step. Necesitamos:

1. **Persistencia de datos** accesible desde el browser → **Supabase** (PostgreSQL + REST API + JS client gratuito).
2. **Emails transaccionales** → **EmailJS** (ya integrado en el proyecto con public key y service ID configurados).

Alternativas evaluadas:

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| Supabase | Free tier generoso, REST API, RLS, dashboard para ver registros | Requiere crear proyecto | **Elegido para storage** |
| Google Sheets API | Simple | Auth compleja desde client-side, rate limits | Descartado |
| Airtable | UI amigable | Free tier limitado, API key expuesta | Descartado |
| EmailJS | Ya en el proyecto, simple | Solo envía emails, no persiste | **Elegido para emails** (ya existente) |
| Resend | API moderna, templates | Requiere backend/edge function | Futuro (cuando haya backend) |
| Loops/Mailchimp | CRM + email marketing | Overkill para fase actual | Futuro (newsletter madura) |

---

## Flujo 1: Pre-access Registration (IMPLEMENTAR AHORA)

### Diagrama

```
Usuario completa formulario
        ↓
  Validación client-side
        ↓
  ┌─────────────────────────┐
  │ Supabase INSERT          │ ← Persistencia
  │ tabla: registrations     │
  └─────────┬───────────────┘
            ↓
  ┌─────────────────────────┐
  │ EmailJS send (paralelo)  │ ← Notificaciones
  │ 1. Team notify           │
  │ 2. Auto-reply al user    │
  └─────────┬───────────────┘
            ↓
  Feedback visual al usuario
  ("¡Gracias! Te enviamos un email.")
```

### Campos del formulario

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| nombre | text | Sí | |
| apellido | text | Sí | |
| email | email | Sí | Validación regex |
| telefono | tel | No | |
| provincia | select | Sí | 24 provincias argentinas |
| fuero | select | No | Área de práctica principal |
| tamano | select | No | Tamaño del estudio |
| mensaje | textarea | No | Pain point principal |

### Supabase — Tabla `registrations`

```sql
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  provincia TEXT NOT NULL,
  fuero TEXT,
  tamano TEXT,
  mensaje TEXT,
  source TEXT DEFAULT 'contact-form',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para evitar duplicados por email
CREATE UNIQUE INDEX registrations_email_unique ON registrations (email);

-- Row Level Security: solo INSERT desde anon
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON registrations FOR INSERT
  TO anon
  WITH CHECK (true);

-- No permitir SELECT/UPDATE/DELETE desde anon
```

### EmailJS — Templates necesarios

Los templates HTML ya están documentados en `docs/emailjs-templates.md`. Se necesitan crear en el dashboard de EmailJS:

1. **teamNotify** — Email al equipo con los datos del formulario.
2. **autoReply** — Email de bienvenida al usuario (ver sección de email content abajo).

### Email de bienvenida (auto-reply)

**Tono:** Cálido, profesional, sin hype.

**Contenido:**
- Agradecimiento por el interés
- Confirmación de que recibimos la solicitud
- Mensaje de que nos pondremos en contacto
- NO mencionar fecha específica, demo, ni meeting
- Logo de Iudex como header
- Estilo visual del sitio (ink/cream/gold palette)

**Template:** Se creará como archivo HTML independiente en `docs/email-templates/welcome.html` para referencia y para copiar a EmailJS.

### Lógica client-side

```
1. Validar campos requeridos
2. Deshabilitar botón, mostrar "Enviando..."
3. INSERT en Supabase (await)
   - Si el email ya existe: mostrar "Ya tenés una solicitud registrada"
   - Si falla: mostrar error, no enviar email
4. Enviar emails vía EmailJS (paralelo, no bloqueante)
   - Si falla: el registro ya está guardado, loguear error silencioso
5. Mostrar "¡Gracias!" + reset form
```

### Protección anti-spam

- Campo honeypot invisible (`<input name="website" style="display:none">`)
- Si tiene valor → rechazar silenciosamente
- Futuro: reCAPTCHA v3 cuando el tráfico aumente

---

## Flujo 2: Newsletter (DISEÑO — NO IMPLEMENTAR AÚN)

### Diagrama propuesto

```
Usuario ingresa email en CTA
        ↓
  Validación client-side
        ↓
  ┌─────────────────────────┐
  │ Supabase INSERT          │
  │ tabla: newsletter_subs   │
  └─────────┬───────────────┘
            ↓
  ┌─────────────────────────┐
  │ EmailJS: confirmación    │
  │ "Gracias por suscribirte"│
  └─────────┬───────────────┘
            ↓
  Feedback visual
```

### Tabla propuesta: `newsletter_subs`

```sql
CREATE TABLE newsletter_subs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'cta',  -- 'cta-home', 'cta-about', 'blog-card'
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);
```

### Separación de concerns

Actualmente los CTAs de email ("Solicitar acceso") y el formulario de newsletter ("Suscribirme") usan el mismo template `newsletter`. Se propone:

- **CTAs de "Solicitar acceso"** en homepage y about → redirigir a `contacto/index.html` en vez de ser formularios inline. El acceso anticipado requiere más datos que solo el email.
- **Newsletter del blog** → Mantener como formulario inline de email-only, pero guardar en tabla separada `newsletter_subs`.

### Email de confirmación de newsletter

- Asunto: "Gracias por suscribirte al blog de Iudex"
- Contenido breve: confirmación + link al blog + nota de frecuencia ("cada dos semanas")
- Sin datos personales adicionales

---

## Flujo CTA homepage/about: rediseño propuesto

Los CTAs de email en homepage y about actualmente simulan un registro con solo el email. Propuesta:

**Opción A (implementar ahora):** Convertir el CTA en un formulario inline con nombre + email que haga INSERT en `registrations` con `source = 'cta-home'` o `source = 'cta-about'`.

**Opción B (alternativa):** Mantener como link directo a `contacto/index.html`.

**Decisión:** Opción A para el CTA de homepage (captura rápida de leads). El formulario completo de contacto queda como canal principal.

---

## Configuración necesaria

### Supabase (pasos manuales)

1. Crear proyecto en supabase.com
2. Ejecutar el SQL de la tabla `registrations`
3. Copiar la URL del proyecto y la anon key
4. Configurar en `main.js` (constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY`)

### EmailJS (pasos manuales)

1. Crear los 3 templates en el dashboard (HTML ya documentado)
2. Copiar los template IDs
3. Reemplazar `YOUR_TEMPLATE_ID_1/2/3` en `main.js`
4. Configurar origin restrictions para `iudex.app` y `iudex.com.ar`

---

## Cronograma

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Formulario de contacto → Supabase + EmailJS | **Implementar ahora** | P0 |
| CTA homepage → mini-form con Supabase | **Implementar ahora** | P0 |
| Welcome email HTML template | **Implementar ahora** | P0 |
| Honeypot anti-spam | **Implementar ahora** | P1 |
| Newsletter → tabla separada | Diseñado, pendiente | P2 |
| Double opt-in newsletter | Futuro | P3 |
| Migración a Resend (con backend) | Futuro | P3 |
| reCAPTCHA v3 | Futuro | P3 |
