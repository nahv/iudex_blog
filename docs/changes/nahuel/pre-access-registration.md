# Pre-Access Registration + Automated Welcome Email

**Fecha:** 2026-04-05
**Autor:** Nahuel
**Rama:** `feature/pre-access-registration`
**Base:** `development`

## Qué se hizo

Implementación del sistema de persistencia de registros de acceso anticipado con Supabase, mejora del flujo de formularios existentes, creación de template de email de bienvenida con identidad visual de Iudex, y documentación de auditoría y plan de automatización.

### 1. Auditoría de flujos existentes (`docs/flow-audit.md`)

Análisis completo de los 4 flujos de interacción del usuario:
- Formulario de contacto/acceso anticipado (`contacto/index.html`)
- CTA email landing page (`index.html`)
- CTA email página Nosotros (`about/index.html`)
- Newsletter del blog (`blog/index.html`)

Hallazgos principales: ningún flujo era funcional end-to-end (template IDs placeholder, sin persistencia de datos, fallback silencioso que simula éxito).

### 2. Plan de automatización (`docs/workflow-plan.md`)

Diseño del stack de automatización:
- **Supabase** para persistencia (tabla `registrations` con RLS)
- **EmailJS** para emails transaccionales (ya integrado)
- Diagrama de flujo, esquema de tabla SQL, lógica de deduplicación por email

Incluye diseño (no implementación) del flujo de newsletter con tabla separada `newsletter_subs`.

### 3. Supabase — Persistencia de registros

**`public/js/main.js`:**
- Nuevo módulo `iudexDB` con función `insert()` usando la REST API directa (sin SDK pesado)
- Credenciales externalizadas a `public/js/env.js` (gitignored); `main.js` lee del global `ENV`
- `env.example.js` committed como template para que cualquier dev sepa qué llenar
- Detección de duplicados (HTTP 409 / código 23505) con mensaje específico al usuario
- Degradación graceful si env.js no está cargado o no está configurado (mock mode)

**Flujo del formulario de contacto (reescrito):**
1. Validación client-side (campos requeridos + regex email)
2. Check honeypot anti-spam
3. INSERT en Supabase (bloqueante — si falla por duplicado, para)
4. Envío de emails vía EmailJS (no bloqueante — si falla, el registro está guardado)
5. Feedback visual

**Flujo CTA email-only (mejorado):**
- Ahora también guarda en Supabase con `source` dinámico (`cta-home`, `cta-about`, `cta-blog`)
- Permite rastrear de dónde viene cada registro

### 4. Protección anti-spam

**`contacto/index.html`:**
- Campo honeypot invisible (`name="website"`, posicionado fuera de viewport, `tabindex=-1`, `aria-hidden=true`)
- Si tiene valor al submit → simula éxito sin enviar datos (engaña al bot)

### 5. Email de bienvenida (`docs/email-templates/welcome.html`)

Template HTML responsive para el auto-reply al usuario:
- **Header:** Logo `icon.png` centrado con border-radius
- **Contenido:** Saludo personalizado ({{nombre}}), confirmación de recepción, descripción de Iudex, 4 features principales, próximos pasos
- **Tono:** Cálido y profesional, sin hype, sin mencionar demos ni fechas
- **Diseño:** Paleta ink/cream/gold, tipografía Helvetica Neue/Georgia, barra dorada de acento
- **Compatibilidad:** Tables para layout (Outlook/Gmail), inline CSS only, MSO conditionals
- **CTA:** Link al blog

### 6. Supabase CDN

Agregado el script de Supabase JS a todas las páginas que tienen formularios:
- `index.html`
- `contacto/index.html`
- `about/index.html`
- `blog/index.html`
- `blog/historia-fundador.html`
- `blog/escritura-repetitiva.html`
- `blog/gestion-expedientes.html`
- `blog/ux-software-legal.html`
- `blog/ia-aplicada-derecho-maxi-bury.html`

### 7. Directorio de assets

Creado `assets/` en la raíz del proyecto para `icon.png` (referenciado en el template de email).

## Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `docs/flow-audit.md` | Nuevo — auditoría de flujos |
| `docs/workflow-plan.md` | Nuevo — plan de automatización |
| `docs/email-templates/welcome.html` | Nuevo — template email bienvenida |
| `docs/changes/nahuel/pre-access-registration.md` | Nuevo — este archivo |
| `public/js/main.js` | Modificado — Supabase integration, honeypot, async form handler |
| `contacto/index.html` | Modificado — honeypot field, Supabase CDN |
| `index.html` | Modificado — Supabase CDN |
| `about/index.html` | Modificado — Supabase CDN |
| `blog/index.html` | Modificado — Supabase CDN |
| `blog/historia-fundador.html` | Modificado — Supabase CDN |
| `blog/escritura-repetitiva.html` | Modificado — Supabase CDN |
| `blog/gestion-expedientes.html` | Modificado — Supabase CDN |
| `blog/ux-software-legal.html` | Modificado — Supabase CDN |
| `blog/ia-aplicada-derecho-maxi-bury.html` | Modificado — Supabase CDN |
| `assets/` | Nuevo directorio — para icon.png |

## Configuración pendiente (manual)

1. **Supabase:** Crear proyecto, ejecutar SQL de `docs/workflow-plan.md`, copiar URL y anon key a `main.js`
2. **EmailJS:** Crear templates en dashboard, copiar IDs a `main.js`
3. **Icon:** Colocar `icon.png` en `assets/`

## Por qué

El sitio tenía formularios que no hacían nada real. Con esta implementación, cada registro de acceso anticipado se persiste en Supabase (no se pierde aunque EmailJS falle) y dispara un email de bienvenida profesional. La arquitectura mantiene el sitio 100% estático (sin backend propio) usando Supabase REST API directa y EmailJS client-side.
