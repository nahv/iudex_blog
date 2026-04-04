---
name: buenas-practicas
description: Recopilar documentacion oficial, buenas practicas y patrones de las tecnologias del sitio Iudex Blog
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Agent]
disable-model-invocation: true
---

# Recopilacion de documentacion y buenas practicas

Investiga, recopila y documenta buenas practicas, patrones recomendados y referencias oficiales para las tecnologias que usa Iudex Blog. El resultado se guarda en `docs/tech/` organizado por tema.

## Stack del proyecto

### Core
- **HTML5** — Elementos semanticos, meta tags, Open Graph, accesibilidad
- **CSS3** — Custom properties, Flexbox, Grid, animaciones, transiciones, media queries
- **JavaScript ES6+** — IntersectionObserver, fetch, template literals, event delegation, DOM API

### Hosting & Infra
- **GitHub Pages** — Deploy automatico desde main, custom domains, CNAME
- **Cloudflare** — DNS, caching, SSL/TLS, page rules

### SEO & Marketing
- **SEO on-page** — Meta tags, structured data (JSON-LD), sitemap.xml, robots.txt
- **Open Graph** — og:title, og:description, og:image para redes sociales
- **Performance** — Core Web Vitals, lazy loading, font loading strategies

### Accesibilidad
- **WCAG 2.1 AA** — Contraste, aria-labels, navegacion por teclado, roles semanticos

## Procedimiento

### 1. Identificar el tema

Interpretar `$ARGUMENTS` para determinar que investigar. Puede ser:
- Una tecnologia especifica: "css custom properties", "intersection observer", "github pages"
- Un patron/practica: "seo para blogs", "web performance", "accesibilidad formularios"
- Un problema: "font loading strategy", "responsive images", "caching con cloudflare"
- General: "todas" o sin argumento = generar indice completo del stack

### 2. Investigar

Para cada tema, buscar en este orden de prioridad:

1. **Documentacion oficial** — Siempre la fuente primaria
   - MDN Web Docs para HTML, CSS, JavaScript
   - web.dev para performance y buenas practicas web
   - GitHub Docs para GitHub Pages
   - Cloudflare Docs para DNS y caching

2. **Buenas practicas establecidas** — Patrones probados
   - Core Web Vitals y metricas de performance
   - Patrones de accesibilidad (WCAG)
   - SEO tecnico (Google Search Central)
   - Responsive design patterns

3. **Patrones relevantes al proyecto** — Aplicados a Iudex Blog
   - BEM naming en CSS
   - CSS custom properties para theming
   - Vanilla JS patterns (no-framework approach)
   - Static site best practices

### 3. Documentar

Guardar el resultado en `docs/tech/{tema}.md` con esta estructura:

```markdown
# {Tecnologia/Tema} — Referencia para Iudex Blog

**Ultima actualizacion:** {fecha}

## Resumen
{Que es, por que lo usamos en Iudex Blog, en que archivos se usa}

## Documentacion oficial
- {Link 1}: {que encontras ahi}
- {Link 2}: {que encontras ahi}

## Buenas practicas
### {Practica 1}
{Explicacion + ejemplo de codigo si aplica}

### {Practica 2}
{Explicacion + ejemplo de codigo si aplica}

## Patrones recomendados para Iudex Blog
{Como aplicar estas practicas especificamente en nuestro proyecto}

## Errores comunes a evitar
- {Error 1}: {por que y como evitarlo}
- {Error 2}: {por que y como evitarlo}

## Referencias adicionales
- {Articulos, videos, repos de ejemplo relevantes}
```

### 4. Actualizar indice

Mantener `docs/tech/INDEX.md` con links a todos los documentos generados:

```markdown
# Documentacion tecnica — Iudex Blog Stack

| Tema | Archivo | Ultima actualizacion |
|---|---|---|
| {tema} | [{tema}.md]({tema}.md) | {fecha} |
```

## Argumentos

$ARGUMENTS: Tema a investigar. Ejemplos:
- "css custom properties" — buenas practicas de variables CSS
- "seo blog legal" — SEO especifico para blogs de nicho legal
- "github pages custom domain" — configuracion de dominio personalizado
- "intersection observer" — patrones de lazy loading y animaciones al scroll
- "accesibilidad formularios" — formularios accesibles (labels, aria, focus)
- "web performance" — optimizacion de Core Web Vitals
- "todas" — generar indice completo con resumen de cada tecnologia
