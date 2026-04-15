# MVP Beta Registration System + Blog Fix + Corrientes Focus

**Fecha:** 2026-04-14
**Autor:** Nahuel
**Rama:** `feature/mvp-beta-system`
**Base:** `development`

## Que se hizo

Tres ejes principales: (1) fix del blog build que mostraba posts no publicados, (2) sistema de registro MVP con doble email (confirmacion al usuario + notificacion a founders), y (3) foco exclusivo en Corrientes para el lanzamiento beta.

### 1. Fix blog published flag (`scripts/build-blog.py`)

El build script renderizaba TODOS los posts en `blog/index.html` y en la homepage sin importar el flag `published` de `posts.json`. El flag solo controlaba si se copiaba el HTML de `drafts/` a `blog/`, pero la card siempre aparecia.

**Cambios:**
- Blog grid: solo renderiza posts con `published: true` o `placeholder: true`
- Homepage preview: solo muestra posts con `published: true`
- Featured post: solo se muestra si ademas de `featured: true` tiene `published: true`
- Filter bar: solo muestra categorias de posts visibles
- Si no hay featured post publicado, la seccion se limpia (no queda contenido viejo)

### 2. Remocion de placeholders (`blog/posts.json`)

Eliminados los 3 posts placeholder (IA Legal) que mostraban "Proximamente". El grid ahora solo muestra posts reales publicados + la card de newsletter.

### 3. Sistema de registro MVP — doble email

**`public/js/env.example.js`:**
- `templateId` reemplazado por `templateUserConfirm` + `templateFounderNotify`

**`public/js/main.js`:**
- Formularios CTA (home, blog, about): envian solo email de confirmacion al usuario
- Formulario de contacto: envia DOS emails:
  1. Confirmacion al usuario (templateUserConfirm) — solo nombre + email
  2. Notificacion a founders (templateFounderNotify) — datos completos del registro

**`.github/workflows/deploy.yml`:**
- Secrets actualizados: `EMAILJS_TEMPLATE_ID` reemplazado por `EMAILJS_TEMPLATE_USER_CONFIRM` + `EMAILJS_TEMPLATE_FOUNDER_NOTIFY`

### 4. Templates de email (`docs/email-templates/`)

**`user-confirm.html` — Confirmacion al usuario:**
- Tema claro (cream/white) consistente con la web
- Saludo personalizado con `{{nombre}}`
- 3 pasos numerados: revisamos tu solicitud, te contactamos, acceso sin costo
- Callout box con WhatsApp de contacto
- CTA "Conocer Iudex"
- Footer con email + ubicacion

**`founder-notify.html` — Notificacion a founders:**
- Tema oscuro (ink) para diferenciarse visualmente en la bandeja
- Badge "Nueva solicitud" en header
- Nombre + email destacados
- Grid de datos: perfil, ciudad, fuero, equipo, telefono
- Seccion de mensaje del usuario (quote estilizado)
- Botones de accion: "Responder" (mailto) y "WhatsApp" (wa.me)

### 5. Foco Corrientes

Actualizadas TODAS las referencias de "Argentina" / "argentinos" a "Corrientes" / "correntino":

- `index.html`: title, meta tags, "Disenado para abogados de Corrientes", "Adaptado al sistema judicial correntino"
- `blog/index.html`: title, meta tags, lead text
- `about/index.html`: meta tags, bio de Maxi, manifiesto
- `contacto/index.html`: meta description, hero text, dropdown de provincia simplificado a "Corrientes" (preseleccionado) + "Otra ciudad"
- `docs/email-templates/welcome.html`: copy de producto
- `docs/emailjs-templates.md`: copy de producto

### 6. SQL para Supabase (`scripts/supabase-setup.sql`)

Script listo para ejecutar en Supabase SQL Editor:
- Tabla `registrations` con columna `status` (pending/selected/waitlist/rejected) para tracking de seleccion beta
- Constraint unique en email
- RLS habilitado: INSERT-only para anon, full access para authenticated
- Default de `provincia` cambiado a 'Corrientes'

### 7. MVP Playbook (`scripts/MVP-PLAYBOOK.md`)

Documento operativo para la fase beta:
- Criterios de seleccion de beta testers (perfil ideal, aceptable, descarte)
- Workflow operativo: registro → revision → seleccion/waitlist/rechazo
- Guia de onboarding (llamada inicial 15-20 min)
- Metricas a trackear (uso, NPS, retencion)
- Timeline de 8 semanas
- Canales de difusion sugeridos
- Checklist pre-launch

## Resumen de archivos

| Archivo | Accion |
|---------|--------|
| `scripts/build-blog.py` | Modificado — filtro por published flag |
| `blog/posts.json` | Modificado — removidos 3 placeholders |
| `blog/index.html` | Modificado — regenerado por build (sin placeholders, meta Corrientes) |
| `index.html` | Modificado — regenerado por build + meta Corrientes |
| `about/index.html` | Modificado — meta + copy Corrientes |
| `contacto/index.html` | Modificado — meta + hero + dropdown Corrientes |
| `public/js/main.js` | Modificado — doble email (user confirm + founder notify) |
| `public/js/env.example.js` | Modificado — nuevos template IDs |
| `.github/workflows/deploy.yml` | Modificado — nuevos secret names |
| `docs/email-templates/user-confirm.html` | Nuevo — template confirmacion usuario |
| `docs/email-templates/founder-notify.html` | Nuevo — template notificacion founders |
| `docs/email-templates/welcome.html` | Modificado — copy Corrientes |
| `docs/emailjs-templates.md` | Modificado — copy Corrientes |
| `scripts/supabase-setup.sql` | Nuevo — SQL setup tabla registrations |
| `scripts/MVP-PLAYBOOK.md` | Nuevo — playbook operativo beta |
| `docs/changes/nahuel/mvp-beta-registration-system.md` | Nuevo — este archivo |

## Configuracion pendiente (manual)

1. **Supabase:** Crear proyecto, ejecutar `scripts/supabase-setup.sql`
2. **EmailJS:** Crear 2 templates con HTML de `docs/email-templates/user-confirm.html` y `founder-notify.html`
3. **GitHub Secrets:** Actualizar 6 secrets (ver MVP-PLAYBOOK.md)
4. **env.js local:** Copiar `env.example.js` → `env.js` y completar para testing

## Por que

El sitio necesitaba tres cosas para estar listo para el MVP: (1) que el blog respete el flag de publicacion, (2) un sistema de registro que notifique a los founders en tiempo real y no solo guarde datos en Supabase, y (3) un enfoque geografico claro en Corrientes para el lanzamiento beta. Con estos cambios el sitio esta operativamente listo para recibir registros reales.
