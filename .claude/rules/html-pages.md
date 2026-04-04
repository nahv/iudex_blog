---
paths: ["**/*.html"]
---

# Reglas para paginas HTML

- Todo archivo HTML empieza con `<!DOCTYPE html>` y `<html lang="es">`.
- `<head>` obligatorio: charset UTF-8, viewport, title, meta description (<160 chars), meta keywords, og:title, og:description, link a stylesheet, favicon SVG.
- Navbar debe ser consistente entre todas las paginas. Copiar el patron exacto de las paginas existentes (no inyeccion dinamica).
- Footer debe ser consistente entre todas las paginas.
- Naming de clases: BEM (`block__element`, `block--modifier`). Respetar patrones existentes: `hero__title`, `navbar__links`, `blog-card__date`.
- Articulos de blog: incluir category badge, fecha de publicacion y tiempo de lectura estimado en el hero.
- Links relativos: paginas raiz enlazan hacia abajo (`blog/index.html`), sub-paginas enlazan hacia arriba (`../index.html`).
- Agregar clase `animate-on-scroll` a secciones que deban aparecer con fade-in al scroll.
- Al crear un nuevo blog post, actualizar tambien la grid de cards en `blog/index.html` con el atributo `data-category` correcto.
- Usar HTML semantico: `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`. No `<div>` donde un tag semantico aplique.
