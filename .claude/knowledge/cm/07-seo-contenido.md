# SEO y Estrategia de Contenido - Iudex

## Meta Tags Requeridos por Página

Cada página del sitio debe tener un conjunto completo de meta tags para SEO y social sharing. Estos tags are critical for search rankings y cómo aparecemos en redes.

### Meta Tags Obligatorios

Todos estos tags deben estar en `<head>` de cada HTML:

```html
<!-- Encoding y viewport -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<html lang="es">

<!-- Title (crítico para SEO) -->
<title>Nombre de la Página - Iudex</title>

<!-- Description (aparece en Google results) -->
<meta name="description" content="Descripción breve (160 chars max) que resume el contenido.">

<!-- Keywords -->
<meta name="keywords" content="palabra1, palabra2, palabra3, palabra4, palabra5">

<!-- Author -->
<meta name="author" content="Iudex">

<!-- Open Graph (para redes sociales) -->
<meta property="og:type" content="website">
<meta property="og:title" content="Título optimizado para redes">
<meta property="og:description" content="Descripción para Facebook/LinkedIn">
<meta property="og:image" content="https://iudex.com.ar/assets/images/og-image.png">
<meta property="og:url" content="https://iudex.com.ar/pagina">
<meta property="og:site_name" content="Iudex">
<meta property="og:locale" content="es_AR">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Título para Twitter">
<meta name="twitter:description" content="Descripción para Twitter">
<meta name="twitter:image" content="https://iudex.com.ar/assets/images/twitter-image.png">
<meta name="twitter:site" content="@iudex.ai">

<!-- Canonical Link (evitar duplicados) -->
<link rel="canonical" href="https://iudex.com.ar/pagina">

<!-- Favicon -->
<link rel="icon" type="image/png" href="/assets/images/favicon.png">

<!-- Preconnect (optimización de velocidad) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- CSS -->
<link rel="stylesheet" href="/css/base.css">
```

---

## Keywords Principales

La estrategia de keywords de Iudex se centra en 3 áreas:

### Keywords de Alto Volumen (Difíciles)
- software gestion legal
- gestion expedientes
- abogados argentina
- legal tech argentina
- software judicial
- automatizacion legal

**Estrategia**: Atacar con blog posts educativos, no esperar ranking en landing (muy competitivos)

### Keywords Específicos (Medium Volumen)
- abogados corrientes argentina
- software legal offline
- gestion casos abogados
- workspace juridico
- expedientes digitales

**Estrategia**: Blog posts pueden rankear aquí, focus en long-tail

### Long-Tail Keywords (Bajo Volumen, Alta Intención)
- como organizar expedientes legales
- automatizacion de documentos legales
- software para abogados sin internet
- herramienta gestion expedientes argentina
- ux para software legal

**Estrategia**: Estos son los más fáciles de rankear. Cada blog post debe apuntar a 1-3 long-tail

### Keywords Locales (Geografía)
- software legal corrientes
- abogados corrientes argentina
- juzgados corrientes argentina
- herramientas legales argentina
- legal tech latinoamerica

**Estrategia**: Importante para MVP (focus en Corrientes)

### Keywords Branded
- iudex software
- iudex legal
- iudex abogados

**Estrategia**: Bajo volumen ahora, pero importante para retención/repeat searches

---

## Estructura SEO del Sitio

### Jerarquía de URLs (Claridad es importante)

```
iudex.com.ar/                           → Landing page
iudex.com.ar/blog/                      → Blog listado
iudex.com.ar/blog/escritura-repetitiva.html     → Post 1
iudex.com.ar/blog/gestion-expedientes.html      → Post 2
iudex.com.ar/blog/ux-software-legal.html        → Post 3
iudex.com.ar/about/                    → Sobre nosotros
iudex.com.ar/contacto/                 → Contacto
```

**Buenas prácticas**:
- URLs descriptivas (no /post/123)
- Minúsculas
- Guiones en lugar de guiones bajos (gestion-expedientes, no gestion_expedientes)
- No cambiar URLs (destroza SEO)

### Sitemap
Crear `/sitemap.xml` con todas las páginas:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://iudex.com.ar/</loc>
    <lastmod>2026-04-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://iudex.com.ar/blog/</loc>
    <lastmod>2026-04-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://iudex.com.ar/blog/escritura-repetitiva.html</loc>
    <lastmod>2026-04-08</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- Continuar para todos los posts -->
</urlset>
```

**Registrar en Google Search Console** después de publicar.

### robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /contacto (si queremos privado)

Sitemap: https://iudex.com.ar/sitemap.xml
```

---

## Contenido y Estructura HTML

### HTML Semántico

Google entiende mejor estructura cuando usas tags semánticos:

```html
<!-- BIEN: Estructura clara -->
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/blog">Blog</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Título del Artículo</h1>
    <section>
      <h2>Sección 1</h2>
      <p>Contenido...</p>
    </section>
    <section>
      <h2>Sección 2</h2>
      <p>Contenido...</p>
    </section>
  </article>
</main>

<footer>
  <p>© 2026 Iudex</p>
</footer>

<!-- MAL: Divs sin estructura -->
<div class="wrapper">
  <div class="header">
    <div class="nav"><!-- no usa nav tag --></div>
  </div>
  <div class="content">
    <div class="title">Título</div>
    <div>Contenido</div>
  </div>
</div>
```

### Headings Jerárquicos

Regla de oro: **1 h1 por página, máximo h3, sin saltar niveles**

```html
<!-- BIEN -->
<h1>Título de la página (solo 1)</h1>
<h2>Sección principal</h2>
<h3>Subsección</h3>
<h3>Otra subsección</h3>
<h2>Otra sección principal</h2>

<!-- MAL -->
<h1>Título</h1>
<h3>Subsección (saltó h2)</h3>
<h1>Otro título (h1 duplicado en página)</h1>
```

### Texto Alt en Imágenes

Descripción clara de qué está en la imagen (importante para SEO + accesibilidad):

```html
<!-- BIEN: Descriptivo, contiene keyword si natural -->
<img src="workspace-iudex.jpg" alt="Workspace de Iudex mostrando gestion de expedientes">

<!-- MAL: Genérico -->
<img src="image1.jpg" alt="Imagen">

<!-- MAL: Keyword stuffing -->
<img src="...jpg" alt="software legal gestion expedientes abogados argentina iudex">
```

### Links Internos

Links entre páginas del mismo sitio ayudan a SEO:

```html
<!-- En blog/index.html -->
<a href="/blog/gestion-expedientes.html">Cómo organizar expedientes</a>

<!-- En blog/escritura-repetitiva.html -->
<p>Para más sobre organización, <a href="/blog/gestion-expedientes.html">lee este artículo</a>.</p>

<!-- En landing -->
<a href="/blog/escritura-repetitiva.html">Leer sobre automatización</a>
```

**Strategia**:
- Cada post debe linkear a 2-3 otros posts (related content)
- Landing debería linkear a 2-3 blog posts principales
- About debería linkear a landing/blog

---

## Meta Tags por Página Específica

### Landing Page (/)

```html
<title>Iudex - Software de Gestión Legal para Abogados Argentinos</title>
<meta name="description" content="Organiza expedientes, automatiza documentos. Software offline-first para abogados argentinos. Acceso anticipado disponible.">
<meta name="keywords" content="software legal argentina, gestion expedientes, abogados argentina, legal tech, iudex">

<meta property="og:title" content="Iudex - Tu Escritorio Digital de Casos">
<meta property="og:description" content="Software moderno para organizar expedientes sin internet.">
<meta property="og:image" content="https://iudex.com.ar/assets/images/og-landing.png">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Iudex">
<meta name="twitter:description" content="Software legal diseñado para abogados argentinos">

<link rel="canonical" href="https://iudex.com.ar/">
```

### Blog Index (/blog)

```html
<title>Blog - Iudex</title>
<meta name="description" content="Articulos sobre productividad legal, automatizacion de documentos, UX para software legal, y legal tech en Argentina.">
<meta name="keywords" content="blog legal, productividad abogados, automatizacion legal, legal tech argentina">

<link rel="canonical" href="https://iudex.com.ar/blog/">
```

### Blog Post Individual

Ejemplo: `/blog/gestion-expedientes.html`

```html
<title>Gestión de Expedientes: Cómo Organizar 50+ Casos - Iudex Blog</title>
<meta name="description" content="Guía práctica para organizar expedientes sin que se pierdan documentos. Métodos digitales, workflow claro, sin caos.">
<meta name="keywords" content="gestion expedientes, organizar casos, workspace juridico, software expedientes">

<meta property="og:type" content="article">
<meta property="og:title" content="Gestión de Expedientes: Cómo Organizar 50+ Casos">
<meta property="og:description" content="Guía para abogados: cómo no perder documentos, expedientes, ni fechas de vencimiento.">
<meta property="og:image" content="https://iudex.com.ar/assets/images/blog/gestion-expedientes-og.png">
<meta property="og:url" content="https://iudex.com.ar/blog/gestion-expedientes.html">
<meta property="article:author" content="Nahuel">
<meta property="article:published_time" content="2026-04-08">

<link rel="canonical" href="https://iudex.com.ar/blog/gestion-expedientes.html">
```

### About (/about)

```html
<title>Sobre Nosotros - Iudex</title>
<meta name="description" content="Conocé el equipo detrás de Iudex. Abogados, developers, diseñadores obsesionados con legal tech argentina.">
<meta name="keywords" content="equipo iudex, founders legal tech argentina, startup legal tech">

<link rel="canonical" href="https://iudex.com.ar/about/">
```

### Contact (/contacto)

```html
<title>Solicitar Acceso Anticipado - Iudex</title>
<meta name="description" content="Completa el formulario para acceso anticipado a Iudex. Versión beta limitada para abogados argentinos.">
<meta name="keywords" content="acceso iudex, beta software legal, registro iudex">

<link rel="canonical" href="https://iudex.com.ar/contacto/">
```

---

## Reglas de SEO Estrictas

Seguir estas reglas religiosamente o perderemos puntos:

### Title Tags
- **Longitud**: 50-60 caracteres máximo (Google trunca después)
- **Contenido**: Palabra clave principal al inicio, marca al final
- **Naturalidad**: No keyword stuffing
- **Formato**: "Keyword - Marca" o "Título | Marca"

**Ejemplos BUENOS**:
- "Gestión de Expedientes: Cómo Organizar 50+ Casos - Iudex"
- "Iudex - Software Legal para Abogados Argentinos"
- "Por Qué los Abogados Pierden 2 Horas/Semana - Iudex Blog"

**Ejemplos MALOS**:
- "Iudex software legal gestion expedientes abogados argentina automatizacion" (too long, keyword stuffing)
- "Nuevo Artículo" (no keyword)
- "Software Legal Genérico Para Todos" (vague, no brand)

### Meta Descriptions
- **Longitud**: 150-160 caracteres (Google trunca después en desktop, 120 en mobile)
- **Contenido**: Resumen del contenido, con keyword naturalizada, CTA implícita
- **Llamado a acción**: "Lee cómo...", "Descubre...", "Guía para..."

**Ejemplos BUENOS**:
- "Guía práctica para organizar expedientes sin perder documentos. Métodos digitales, workflow claro, sin caos."
- "Descubre por qué los abogados pierden 40% del día en tareas administrativas y cómo optimizar tu flujo."

**Ejemplos MALOS**:
- "página sobre gestion de expedientes" (sin CTA, vague)
- "software legal gestion expedientes abogados argentina iudex" (keyword stuffing)

### Canonical URLs
- **Única por página**: Cada URL debe apuntar a sí misma como canonical
- **Protocolo HTTPS**: Siempre https://, no http://
- **Evitar duplicados**: Si existe /blog/post.html Y /blog/post/, canonical a una versión

```html
<!-- Correcto -->
<link rel="canonical" href="https://iudex.com.ar/blog/escritura-repetitiva.html">

<!-- Incorrecto (no www, no trailing slash inconsistente) -->
<link rel="canonical" href="http://iudex.com.ar/blog/escritura-repetitiva">
```

### Headings Hierarchy
- **h1**: Máximo 1 por página, contiene keyword principal
- **h2**: 2-5 por página, secciones claras
- **h3**: Subsecciones, máximo 2-3 por h2
- **Sin saltar**: No ir de h1 a h3 (siempre h1 > h2 > h3)

### Imágenes
- **Alt text obligatorio**: Cada imagen debe tener alt descriptivo
- **Tamaño optimizado**: <100KB, WebP preferido (mejor compresión)
- **Nombre descriptivo**: "gestion-expedientes-workflow.jpg" vs "image1.jpg"
- **Dimensiones apropriadas**: Servir tamaño exacto (no escalar en HTML)

---

## Estrategia de Contenido Integrada

El contenido del blog debe estar completamente alineado con producto y keywords.

### Mapping: Blog Posts → Keywords → Producto

| Artículo | Keyword Principal | Secundarias | Feature Iudex |
|----------|------------------|------------|---------------|
| "Escritura Repetitiva" | escritura repetitiva legal | automatizacion documentos | Templates + IA (future) |
| "Gestión de Expedientes" | gestion expedientes | organizar casos, workspace | Gestor + búsqueda |
| "UX para Software Legal" | ux software legal | diseño herramientas | Product design |
| "Historia del Fundador" | startup legal tech argentina | iudex historia | Brand storytelling |
| "IA Aplicada al Derecho" | ia legal argentina | legal tech ia | IA roadmap |

### Contenido Que Convierte

Cada post debe cumplir una función:

1. **Awareness**: "¿Por qué pierdo tiempo aquí?" (blog top-funnel)
2. **Consideration**: "¿Cómo resuelvo esto?" (blog mid-funnel)
3. **Decision**: "Iudex hace X" (mencion product, no salesy)

**Estructura típica**:
- Intro: problema relatable
- Body: soluciones generales (no Iudex-specific)
- Cierre: "Iudex automatiza esto" (subtle)
- CTA: "Solicitar acceso" (gentle)

### SEO On-Page Checklist

Para cada blog post:
- [ ] Title: 50-60 chars, keyword al inicio
- [ ] Meta description: 150-160 chars, con CTA
- [ ] h1: Único, keyword natural
- [ ] h2/h3: Jerárquico, keywords relacionadas
- [ ] Alt text: Todas las imágenes tienen descripción
- [ ] Links internos: 2-3 links a otros posts
- [ ] Longitud: 800+ palabras (ideal 1200-1500)
- [ ] Keyword density: 1-2% (natural, no stuffing)
- [ ] Readability: Párrafos cortos, listas, destacados
- [ ] Mobile: Testeado en 375px, legible
- [ ] Speed: Lighthouse >90 (imagen optimizada)

---

## Herramientas SEO Recomendadas

### Gratuitas
- **Google Search Console**: Monitorear rankings, indexación, errores
- **Google Analytics 4**: Tráfico, comportamiento usuarios
- **Lighthouse**: Auditar performance (built-in Chrome DevTools)
- **Ubersuggest (free tier)**: Keyword research básico
- **Screaming Frog (free tier)**: Auditoría técnica de sitio

### Pagadas (Nice-to-have)
- **SEMrush**: Keyword research, competitor analysis ($100+/mes)
- **Ahrefs**: Backlink analysis, keyword difficulty ($100+/mes)
- **Moz Pro**: SEO audit, rank tracking ($100+/mes)

**Recomendación para MVP**: Usar gratuitas, enfocarse en contenido de calidad primero.

---

## Calendario Editorial SEO

### Meses 1-3 (MVP Blog Content)
- Publicar 1-2 posts/semana
- Focus en long-tail keywords (más fácil rankear)
- Temas: Problemas reales de abogados
- Optimización: Meta tags, alt text, internal links

### Meses 4-6
- Mantener 1-2 posts/semana
- Empezar a rankear en top 10 para long-tail keywords
- Expandir a medium-difficulty keywords
- Republish + update posts viejos (ayuda ranking)

### Meses 7-12
- Target keywords competitivas (software legal, gestion expedientes)
- Construir autoridad con contenido profundo (pillar pages)
- Backlink building (partnerships, menciones)
- Esperamos entrar top 20 en keywords medios

---

## Monitoring y Análisis

### Google Search Console (Gratis, Obligatorio)
1. Registrar sitio
2. Monitorear:
   - Clicks (CTR)
   - Impressions
   - Posición promedio (ranking)
   - Queries (qué buscan para encontrar a Iudex)
3. Crear planilla mensual:

| Mes | Clicks | Impressions | CTR | Top Queries | Top Pages |
|-----|--------|------------|-----|-------------|-----------|
| Abril | 50 | 2000 | 2.5% | software legal | /blog/ |
| Mayo | 150 | 5000 | 3% | gestion expedientes | /blog/gestion... |

### Análisis de Ranking
Mensual, revisar:
- ¿Cuál es la posición promedio?
- ¿Qué queries me traen tráfico?
- ¿Qué posts no rankean todavía?
- ¿Hay oportunidades de optimización?

---

## Regla de Oro: Content > Tech

SEO es 80% contenido de calidad, 20% técnica.

**Prioritize**:
1. ✓ Blog posts útiles, bien escritos, keyword-optimized
2. ✓ Links internos estratégicos
3. ✓ Meta tags correctos
4. ✗ Técnica perfecta (sitemaps, robots.txt, velocidad)

Si tenemos que elegir entre:
- Escribir un post excelente (haz esto)
- vs Optimizar velocidad de carga en 1 segundo (después)

**Make content first, optimize later.**
