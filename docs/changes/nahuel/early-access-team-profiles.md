# Early Access Registration + Pagina Nosotros + Perfiles del equipo

**Fecha:** 2026-04-04
**Autor:** Nahuel
**Rama:** `feature/early-access-and-team`
**Base:** `development`

## Que se hizo

Implementacion del flujo de registro de acceso anticipado con EmailJS, creacion de pagina dedicada "Nosotros" con perfiles del equipo, y actualizacion general de fechas del sitio.

### 1. EmailJS — Sistema de emails automaticos

Integracion de EmailJS para reemplazar los formularios mock (simulados) con envios reales.

**Archivos modificados:**
- `public/js/main.js` — Logica principal de integracion:
  - Config centralizada (`EMAILJS_CONFIG`) con public key, service ID y template IDs
  - Inicializacion condicional de EmailJS (no rompe si el CDN falla)
  - Formulario de contacto: envia 2 emails en paralelo (`Promise.all`):
    - Email al equipo con todos los datos del formulario
    - Auto-reply al usuario con info del producto
  - Newsletter/CTA: envia 1 email de confirmacion al usuario
  - Manejo de errores con fallback a `hola@iudex.app`
  - Fallback graceful si EmailJS no esta cargado (mantiene UX simulada)

**CDN agregado a todas las paginas con formularios (8 archivos):**
- `index.html`
- `contacto/index.html`
- `about/index.html`
- `blog/historia-fundador.html`
- `blog/index.html`
- `blog/escritura-repetitiva.html`
- `blog/gestion-expedientes.html`
- `blog/ux-software-legal.html`

**Configuracion actual:**
- Public Key: `0f2bFDzG8i97sRFuw`
- Service ID: `service_8w861ob`
- Template IDs: pendientes de crear en dashboard de EmailJS

**Pendiente:**
- Crear 3 templates en EmailJS dashboard (ver `docs/emailjs-templates.md`)
- Reemplazar `YOUR_TEMPLATE_ID_1/2/3` en `main.js` con IDs reales
- Configurar origin restrictions en dashboard para el dominio

### 2. Pagina Nosotros (`about/index.html`)

Reescritura completa. Era un duplicado de la pagina de contacto, ahora es una pagina dedicada al equipo.

**Estructura:**
- Hero con titulo y subtitulo
- Seccion de equipo con 2 tarjetas lado a lado (grid 2 columnas)
- Link a la entrada de blog "historia del fundador"
- CTA de acceso anticipado con formulario de email
- Footer completo

**Perfiles del equipo:**
- **Nahuel Vallejos** — Fullstack / Apps & Devices (Flutter, UI/UX, SQLite/Drift, Backend, Multiplataforma)
- **Maxi Bury** — Cloud Infrastructure & AI (Docker, CI/CD, FastAPI, PostgreSQL, IA, Sync server-side) — bio placeholder

**Fotos:** preparado con `<img>` comentado apuntando a `public/assets/team/nahuel.jpg` y `maxi.jpg`. Directorio `public/assets/team/` creado.

### 3. CSS — Componentes de equipo (`public/css/styles.css`)

Nuevos componentes BEM agregados (+130 lineas):
- `.team-profiles` — contenedor con borde superior separador
- `.team-profiles__header` — encabezado de seccion
- `.team-profiles__grid` — grid de 2 columnas para tarjetas
- `.team-card` — tarjeta de perfil (flex column, centrada, cream-dark bg, 16px radius)
- `.team-card__avatar` — circulo 96px con inicial (ink bg, gold text), listo para `<img>`
- `.team-card__initial` — letra placeholder del avatar
- `.team-card__info` — contenedor de info centrado
- `.team-card__name` — nombre en Playfair Display
- `.team-card__role` — rol en DM Mono, uppercase, gold
- `.team-card__skills` — contenedor flex-wrap para pills de skills
- `.team-card__skill` — pill individual (misma estetica que `feature-card__tag`)
- `.team-card__bio` — texto descriptivo
- `.team-card__bio--placeholder` — variante italica para bios pendientes

**Responsive:** grid colapsa a 1 columna en `max-width: 768px`

### 4. Actualizacion de mensajes — Contacto (`contacto/index.html`)

Se eliminaron las referencias a "24 horas" porque aun no hay contacto personal:
- Hero: "nos ponemos en contacto en menos de 24 horas" → "te enviamos informacion de forma automatica y te contactaremos proximamente"
- Subtitulo del form: "Te respondemos en menos de 24 horas habiles" → "Vas a recibir un email automatico con toda la informacion"
- Paso 2 del "Que pasa despues": "Te contactamos en 24 horas" → "Recibis informacion sobre Iudex" + "Te contactaremos proximamente para coordinar una demo"

### 5. Actualizacion de fechas

Todas las fechas del sitio actualizadas a 4 de abril de 2026:
- Copyrights de footer: 2025 → 2026 (en los 8+ archivos HTML)
- Fechas de blog posts: todas a "4 Abr 2026" / "4 de abril de 2026"
- Afecta: `index.html`, `blog/index.html`, `blog/historia-fundador.html`, `blog/escritura-repetitiva.html`, `blog/gestion-expedientes.html`, `blog/ux-software-legal.html`, `contacto/index.html`, `ui/navbar.html`

### 6. Blog — historia-fundador.html

Se removio la seccion de perfiles de equipo que habia sido insertada en el articulo. El articulo queda limpio como entrada de blog de Nahuel, y los perfiles viven en la pagina Nosotros.

### 7. Templates de email (`docs/emailjs-templates.md`)

Documentacion con HTML listo para pegar en el dashboard de EmailJS:
- **Template 1 (teamNotify):** notificacion al equipo con todos los datos del formulario
- **Template 2 (autoReply):** email de bienvenida al usuario con info del producto
- **Template 3 (newsletter):** confirmacion de suscripcion

Todos los templates siguen la paleta del sitio (ink/cream/gold).

## Resumen de archivos

| Archivo | Accion |
|---------|--------|
| `about/index.html` | Reescritura completa (pagina Nosotros) |
| `public/js/main.js` | EmailJS integration (reemplazo de mocks) |
| `public/css/styles.css` | +130 lineas (componentes team) |
| `contacto/index.html` | Messaging update + EmailJS CDN |
| `blog/historia-fundador.html` | Remocion de team section + fecha + CDN |
| `index.html` | Fechas + CDN |
| `blog/index.html` | Fechas + CDN |
| `blog/escritura-repetitiva.html` | Fecha + CDN |
| `blog/gestion-expedientes.html` | Fecha + CDN |
| `blog/ux-software-legal.html` | Fecha + CDN |
| `ui/navbar.html` | Copyright 2026 |
| `docs/emailjs-templates.md` | Nuevo — templates HTML para EmailJS |
| `docs/changes/nahuel/early-access-team-profiles.md` | Nuevo — este archivo |
| `public/assets/team/` | Nuevo directorio — para fotos de perfil |

## Por que

El sitio necesitaba un flujo real de captacion de usuarios para el acceso anticipado. Los formularios eran mocks que no hacian nada. Con EmailJS, cada registro ahora genera un email real al equipo y un auto-reply profesional al usuario. La pagina Nosotros da identidad al equipo y complementa la narrativa del blog. Todo sin backend, manteniendo la arquitectura estatica del sitio.
