# Sitio Web - Iudex

## Estructura del Sitio

El sitio de Iudex es estático (HTML + CSS + vanilla JS) con enfoque en simplicidad, velocidad y conversión.

### Páginas Principales

#### index.html - Landing Page
**Ruta**: `/` (raíz del sitio)

**Estructura visual** (de arriba hacia abajo):
1. **Header/Navegación**
   - Logo Iudex (izq)
   - Links: Blog, Sobre Nosotros, Contacto
   - CTA secundaria: "Acceso anticipado" (botón en header, top derecha)

2. **Hero Section**
   - Headline: "Organiza tus expedientes, automatiza tu escritura"
   - Subheadline: "Software moderno diseñado para abogados argentinos. Funciona sin internet."
   - Visual: Mockup del app (screenshot centrado)
   - CTA principal: "Solicitar acceso anticipado" (botón destacado, gold)
   - CTA secundaria: "Ver demo" (link tipo botón, secondary)

3. **Pain Points Section**
   - 3 columnas (mobile: stack vertical):
     - "40% de tu tiempo en tareas administrativas"
     - "Documentos repetitivos que no automatizan"
     - "Búsqueda manual de jurisprudencia"
   - Cada punto con pequeño icono (stroke, gold)

4. **Features Principales**
   - Grid 2x2 o 1 columna (mobile):
     - "Workspace unificado": organiza expedientes, documentos, anotaciones
     - "Escritos automáticos": templates, variables, historial
     - "Offline-first": funciona sin internet
     - "Para Argentina": JUS, fueros, procedimientos locales
   - Cada feature con pequeño screenshot o icono

5. **Stats Section** (opcional, si tenemos datos)
   - "X abogados en testing"
   - "Y expedientes gestionados"
   - "Z features implementadas"

6. **CTA Secundaria**
   - "¿Curioso? Lee nuestro blog"
   - Preview de 3 últimos posts (título, excerpt, fecha)

7. **Equipo**
   - "Quiénes somos" (brevísimo)
   - 2-3 fotos + nombre + rol (Nahuel, Maxi, otros)
   - Link a página "Sobre Nosotros"

8. **Footer**
   - Logo Iudex
   - Links: Privacy, Terms, Blog, Twitter, LinkedIn
   - Email: contacto@iudex.com.ar
   - "© 2026 Iudex"

---

#### blog/index.html - Listado de Artículos
**Ruta**: `/blog`

**Estructura**:
1. **Header**: "Blog de Iudex"
2. **Filtros**:
   - Categorías como botones: Todos, Productividad, Gestion, Automatizacion, UX Legal, IA Legal, Historia
   - (JS: al hacer click, filtra posts por data-category)
3. **Grid de Posts**:
   - Cada post es una tarjeta:
     - Thumbnail (imagen pequeña, 400x250px)
     - Título
     - Excerpt (primeras 150 caracteres)
     - Badge de categoría (gold, small)
     - Autor (nombre pequeño, mono font)
     - Fecha (ej: "8 de abril, 2026")
     - Tiempo de lectura (ej: "7 minutos")
     - Link "Leer más"
   - Grid responsivo: 3 columnas desktop, 1 mobile

4. **Footer**: igual al landing

---

#### blog/*.html - Artículos Individuales
**Ruta**: `/blog/escritura-repetitiva.html`, `/blog/gestion-expedientes.html`, etc.

**Estructura**:
1. **Hero del artículo**:
   - Badge de categoría (gold, pequeño)
   - Título (grande, Playfair)
   - Autor (nombre, foto pequeña circular, fecha, tiempo de lectura)
   - Línea visual (separator)

2. **Contenido** (Markdown convertido a HTML):
   - Párrafos
   - Headings (h2, h3)
   - Listas
   - Blockquotes (citadas, con borde gold izq)
   - Imágenes con caption

3. **CTA al Final**:
   - Recuadro destacado (fondo cream dark)
   - "¿Interesado en optimizar tu práctica legal?"
   - Breve descripción de Iudex (2 líneas)
   - Botón: "Solicitar acceso"

4. **Footer**: igual

**Metadatos en HTML** (en `<head>`):
```html
<title>Título del artículo - Iudex Blog</title>
<meta name="description" content="...">
<meta name="keywords" content="...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<link rel="canonical" href="...">
```

---

#### about/index.html - Página "Sobre Nosotros"
**Ruta**: `/about`

**Estructura**:
1. **Header**: "Quiénes somos"
2. **Misión y Visión**:
   - Párrafo: "Somos un equipo de abogados, desarrolladores y diseñadores construyendo herramientas modernas para la realidad legal argentina"
   - Visión: "Un futuro donde cada abogado tiene acceso a tecnología que lo empodera, no lo complica"

3. **Equipo**:
   - 3-4 miembros con:
     - Foto (circular, fondo gold)
     - Nombre
     - Rol (Developer, Legal, Design, etc.)
     - Breve bio (2 líneas)
     - Links: LinkedIn, Twitter (si aplica)

4. **Valores** (optional, si queremos):
   - "Simplicidad" (feature que resuelve un problema realmente)
   - "Credibilidad" (software confiable)
   - "Accesibilidad" (no software prohibitivo)

5. **CTA**:
   - "¿Queres estar en el primer acceso?"
   - Formulario de contacto (simplificado, 3 campos: nombre, email, mensaje)
   - Botón: "Enviar"

6. **Footer**: igual

---

#### contacto/index.html - Formulario de Acceso Anticipado
**Ruta**: `/contacto`

**Estructura**:
1. **Header**: "Solicitar acceso anticipado"
2. **Subtext**: "Completa el formulario y nos contactaremos en los próximos días"

3. **Formulario** (8 campos):
   - Nombre (text, required)
   - Apellido (text, required)
   - Email (email, required, unique)
   - Teléfono (tel, required)
   - Provincia (select dropdown, required)
   - Fuero especializado (select dropdown: penal, civil, laboral, familia, otro)
   - Tamaño de estudio (select: solo/a, 2-5, 6-15, 16+)
   - Mensaje (textarea: "¿Por qué te interesa Iudex?", optional)

   **Campos invisibles** (honeypot anti-spam):
   - website (display: none)

4. **Validación**:
   - Client-side (JS): campos requeridos, email format
   - Si error: mensaje rojo debajo del campo
   - Si éxito: "Gracias! Revisa tu email"

5. **Flujo de envío**:
   - Click "Enviar" → deshabilitar botón, mostrar spinner "Enviando..."
   - INSERT en Supabase (tabla `registrations`)
   - Si email existe: "Ya tenemos tu solicitud registrada"
   - Si éxito: enviar 2 emails vía EmailJS:
     - **teamNotify**: "Nueva solicitud de acceso" → equipo
     - **autoReply**: "Bienvenido/a a Iudex" → usuario
   - Mostrar "Gracias!" + reset form

6. **Footer**: igual

---

### Estructura de Directorios

```
/
├── index.html (landing)
├── css/
│   ├── base.css (variables, reset)
│   ├── layout.css (grid, flexbox)
│   ├── typography.css (fonts, headings)
│   ├── components.css (buttons, cards, forms)
│   ├── pages.css (estilos por página)
│   └── responsive.css (mobile, tablet, desktop)
├── js/
│   ├── main.js (init, event listeners)
│   ├── blog-filter.js (filtrado de categorías)
│   ├── form-handler.js (validación y envío del formulario)
│   ├── email-integration.js (EmailJS + Supabase)
│   └── animations.js (scroll reveals, parallax)
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-mockup.png
│   │   └── team/
│   │       ├── nahuel.jpg
│   │       ├── maxi.jpg
│   │       └── ...
│   ├── fonts/
│   │   ├── PlayfairDisplay-*.woff2
│   │   ├── DMSans-*.woff2
│   │   └── DMMono-*.woff2
│   └── icons/
│       ├── offline.svg
│       ├── automation.svg
│       └── ...
├── blog/
│   ├── index.html
│   ├── escritura-repetitiva.html
│   ├── gestion-expedientes.html
│   ├── ux-software-legal.html
│   ├── historia-fundador.html
│   └── ia-aplicada-derecho-maxi-bury.html
├── about/
│   └── index.html
├── contacto/
│   └── index.html
└── feed.xml (optional RSS)
```

---

## Stack Técnico

### Frontend
- **HTML5**: Semántico (nav, main, article, section, footer)
- **CSS3**: Variables CSS, flexbox, grid, responsive
- **JavaScript (ES6+)**: Vanilla (sin frameworks)
  - Event listeners para formularios
  - Fetch API para envío de datos
  - DOM manipulation
  - No build step (archivos .js simples)

### Hosting y Dominio
- **Host**: GitHub Pages (`nahvallejos.github.io` → custom domain)
- **Dominio**: `iudex.com.ar` (DNS vía Cloudflare)
- **HTTPS**: Automático vía GitHub Pages + Cloudflare
- **CDN**: Cloudflare (caching, seguridad)

### Servicios Externos Integrados

#### EmailJS (Client-side)
- **Propósito**: Enviar emails transaccionales sin backend
- **SDK**: Cargar vía CDN
- **Setup**:
  - Crear cuenta en EmailJS.com
  - Crear 3 templates:
    1. **teamNotify** (ID: `template_team_notify`)
       - Para: `team@iudex.com.ar`
       - Subject: "Nueva solicitud de acceso anticipado de {{nombre}} {{apellido}}"
       - Body: Datos del formulario + contacto

    2. **autoReply** (ID: `template_auto_reply`)
       - Para: `{{email}}`
       - Subject: "Bienvenido/a a Iudex"
       - Body: Agradecimiento, confirmación, "nos contactaremos pronto"

    3. **newsletter** (ID: `template_newsletter`)
       - Para: `{{email}}`
       - Subject: "Confirmación: Te suscribiste al blog de Iudex"
       - Body: Confirmación simple, links a blog

  - Config en JS:
    ```javascript
    emailjs.init('PUBLIC_KEY'); // Obtener de EmailJS
    emailjs.send('SERVICE_ID', 'template_teamNotify', {
      nombre: formData.nombre,
      email: formData.email,
      // ...
    });
    ```

#### Supabase (Backend)
- **Propósito**: Persistencia de datos (registrations, newsletter subs)
- **Tabla**: `registrations`
  ```sql
  CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL,
    provincia TEXT NOT NULL,
    fuero TEXT,
    tamano TEXT,
    mensaje TEXT,
    source TEXT, -- 'landing', 'blog', 'instagram', etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **RLS** (Row Level Security):
  - Permitir INSERT desde anónimos (publicación)
  - Permitir SELECT solo para autenticados (equipo)
  - No DELETE/UPDATE desde cliente
- **API**: Rest API con Supabase (Fetch desde JS)

#### Cloudflare DNS
- **Propósito**: Resolver iudex.com.ar → GitHub Pages
- **Setup**:
  - Registrar dominio (.com.ar)
  - Apuntar DNS a Cloudflare nameservers
  - Crear CNAME: `iudex.com.ar` → `nahvallejos.github.io`
  - SSL automático vía Cloudflare

---

## Flujos de Interacción

### Flujo 1: Formulario de Contacto (/contacto)

```
Usuario llena formulario
      ↓
JS valida campos (client-side)
      ↓
Si error: mostrar mensaje rojo
Si OK: deshabilitar botón, "Enviando..."
      ↓
fetch('/api/registrations') POST a Supabase
      ↓
Si email existe: "Ya tenes una solicitud registrada"
Si error: "Hubo un error, intentá de nuevo"
Si OK:
  - EmailJS: enviar teamNotify a team@iudex.com.ar
  - EmailJS: enviar autoReply a usuario
  - Mostrar "Gracias! Revisa tu email"
  - Reset formulario
      ↓
(opcional) Analytics: trackEvent('form_submitted')
```

### Flujo 2: CTA Email en Landing

```
Usuario ve botón "Solicitar acceso anticipado" en hero
      ↓
Click → scroll a #formulario-contacto (o abre modal inline)
      ↓
Seguir flujo 1 (mismo formulario)
```

### Flujo 3: CTA Email en About

```
Usuario en /about ve CTA secundaria
      ↓
Click → scroll a formulario o abre modal
      ↓
Seguir flujo 1
```

### Flujo 4: Newsletter del Blog

```
Usuario ve "Suscribirte al blog" en final de artículo
      ↓
Input solo email + botón "Suscribirse"
      ↓
JS valida email format
      ↓
fetch a Supabase (tabla newsletter_subs)
      ↓
Si OK: EmailJS envía autoReply (template_newsletter)
      ↓
Mostrar "Gracias! Revisa tu email"
```

### Flujo 5: Filtrado de Blog

```
Usuario en /blog/index.html
      ↓
Click en categoría (ej: "IA Legal")
      ↓
JS ejecuta: document.querySelectorAll(`[data-category="ia-legal"]`)
      ↓
Mostrar posts, ocultar otros (fade out/in)
      ↓
URL actualiza con #ia-legal (optional)
```

---

## Estado Actual (Limitaciones Conocidas)

### Problemas en MVP

#### EmailJS Templates No Funcionales End-to-End
- **Problema**: Templates de EmailJS son placeholders, no tienen contenido real
- **Impacto**: Usuario llena formulario, click enviar, pero email que recibe es genérico
- **Fix**: Escribir templates HTML lindos en EmailJS.com

#### No hay Persistencia de Datos
- **Problema**: Supabase no está configurado, formulario no INSERT
- **Impacto**: Equipo no recibe solicitudes, no hay base de datos de leads
- **Fix**:
  1. Crear cuenta Supabase
  2. Crear tabla `registrations`
  3. Obtener URL y public key
  4. Integrar en form-handler.js

#### Fallback Silencioso Engaña al Usuario
- **Problema**: Si EmailJS CDN no carga, el formulario se envía "silenciosamente" (sin email real)
- **Impacto**: Usuario cree que se envió, pero nada pasó
- **Fix**: Agregar error handling, mostrar "Error al enviar, intentá de nuevo"

#### Sin Analytics
- **Problema**: No sabemos cuántos clics, conversiones, fuentes de tráfico
- **Fix**: Integrar Google Analytics (GA4) o Plausible

#### Sin reCAPTCHA
- **Problema**: Spam bots pueden llenar el formulario
- **Fix**: Agregar reCAPTCHA v3 (invisible, no molesta UX)

#### Sin Rate Limiting
- **Problema**: Un bot puede spammear 1000 registros/minuto
- **Fix**: Rate limit en Supabase RLS o backend (no disponible en MVP)

#### Honeypot Anti-Spam Implementado (Bueno)
- Campo invisible `website` que solo bots llenan
- Si no está vacío, ignorar el form
- **Mejora**: Pero aún vulnerable, reCAPTCHA es más seguro

---

## CSS System

### Variables CSS

Definidas en `css/base.css`:

```css
:root {
  /* Colores */
  --ink: #0F0F0E;
  --cream: #F7F4EE;
  --gold: #C9A84C;
  --gold-light: #D4B95E;
  --cream-dark: #EDEAE2;
  --white: #FFFFFF;
  --red-accent: #D64545; /* para errores/alerts */

  /* Tipografía */
  --font-display: "Playfair Display", serif;
  --font-body: "DM Sans", sans-serif;
  --font-mono: "DM Mono", monospace;

  /* Espaciado (base 8px) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Bordes */
  --border-radius: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 24px;

  /* Sombras */
  --shadow-sm: 0 2px 4px rgba(15, 15, 14, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 15, 14, 0.1);
  --shadow-lg: 0 12px 24px rgba(15, 15, 14, 0.15);

  /* Breakpoints (mobile-first) */
  --bp-sm: 375px;
  --bp-md: 768px;
  --bp-lg: 1200px;
}
```

### Tipografía

**Playfair Display**:
- h1: 48px (desktop), 32px (mobile), weight 700
- h2: 36px (desktop), 24px (mobile), weight 700
- h3: 28px (desktop), 20px (mobile), weight 400 o 700

**DM Sans**:
- body: 16px (desktop), 14px (mobile), weight 400
- buttons: 16px, weight 500
- labels: 14px, weight 500

**DM Mono**:
- code: 12px, weight 400
- labels: 12px, weight 500

### Sistema de Espaciado

- Márgenes: 60px (desktop), 30px (tablet), 16px (mobile)
- Espaciado vertical entre secciones: 24px
- Espaciado entre elementos: 16px
- Micro-espaciado: 8px

Múltiplos de 8px (4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, ...)

### BEM Naming

```css
/* Block */
.button { }

/* Element (block__element) */
.button__label { }

/* Modifier (block--modifier o block__element--modifier) */
.button--primary { }
.button__icon--large { }
```

### Media Queries (Mobile-First)

```css
/* Base: mobile (375px+) */
.container {
  padding: var(--space-md); /* 16px */
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--space-lg); /* 24px */
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .container {
    padding: var(--space-xl); /* 32px */
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

### Componentes Base

**Botones**:
- Primary: fondo gold, texto ink, hover gold-light
- Secondary: borde gold, fondo transparent, texto gold
- Disabled: opacidad 0.5, cursor not-allowed

**Tarjetas**:
- Fondo cream, borde rounded (12px), shadow-md
- Padding: var(--space-lg)

**Formularios**:
- Input: borde cream-dark, padding 12px, font DM Sans 14px
- Focus: borde gold, shadow none
- Error: borde red-accent, mensaje rojo 12px

**Links**:
- Color gold, underline on hover
- No underline por defecto

---

## Animaciones

### Reveal on Scroll
```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Parallax Hero
```javascript
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  hero.style.backgroundPosition = `0 ${window.scrollY * 0.5}px`;
});
```

### Text Reveal (Fade-in per letra o palabra)
```css
.text-reveal {
  overflow: hidden;
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### Stagger Children (efecto cascada)
```css
.list {
  --stagger: 50ms;
}

.list__item {
  animation: slideIn 0.6s ease-out;
  animation-delay: calc(var(--stagger) * var(--index));
}
```

---

## SEO Basics

Cada página debe tener:
1. `<title>` descriptivo (<60 chars)
2. `<meta name="description">` (<160 chars)
3. `<meta name="keywords">` (5-10 keywords)
4. `<meta property="og:title">`, `og:description` (para redes)
5. `<link rel="canonical">` (evitar duplicados)
6. `<html lang="es">` (especificar idioma)
7. Headings jerárquicos (h1 único, h2/h3 para secciones)
8. Alt text en imágenes
9. Links internos entre blog posts
10. URLs descriptivas

Ejemplo (landing):
```html
<title>Iudex - Software de Gestión Legal para Abogados Argentinos</title>
<meta name="description" content="Organiza expedientes, automatiza documentos. Software offline-first diseñado para abogados argentinos.">
<meta name="keywords" content="software legal, gestion expedientes, abogados argentina, legal tech">
```

---

## Checklist de Lanzamiento

Antes de publicar el sitio:
- [ ] Todas las páginas tienen meta tags completos
- [ ] Logo y fotos optimizadas (<100KB)
- [ ] Fonts cargadas vía Google Fonts o local (no system fonts)
- [ ] EmailJS templates configurados y testeados
- [ ] Supabase tabla y RLS configurados
- [ ] Formularios validados (client-side)
- [ ] Error handling para emails fallidos
- [ ] Mobile responsive (testeado en 375px, 768px, 1200px)
- [ ] Analytics integrado (GA4 o similar)
- [ ] Sitemap.xml generado
- [ ] robots.txt configurado
- [ ] DNS apuntando a GitHub Pages
- [ ] HTTPS activo
- [ ] Lighthouse score >90
- [ ] No console errors
