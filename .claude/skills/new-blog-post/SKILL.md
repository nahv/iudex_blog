---
name: new-blog-post
description: Crear un nuevo articulo de blog para iudex.com.ar
allowed-tools: [Read, Write, Edit, Glob, Grep]
---

# Crear nuevo articulo de blog

## Procedimiento

1. **Entender el tema**: Interpretar `$ARGUMENTS` como titulo o tema del articulo.

2. **Leer posts existentes**: Leer al menos 1 articulo existente en `blog/` para capturar la estructura exacta (head, navbar, post-hero, cuerpo, CTA, footer).

3. **Leer blog/index.html**: Entender el patron de cards para agregar la nueva entrada.

4. **Crear el articulo**: Escribir `blog/{slug-en-kebab-case}.html` siguiendo esta estructura:
   - `<head>`: charset, viewport, title con " - Iudex Blog", meta description (<160 chars), meta keywords, link a `../public/css/styles.css`, favicon
   - Navbar: copiar exactamente de otro articulo (links con `../`)
   - Post hero: category badge, fecha, tiempo de lectura, titulo h1, subtitulo
   - Cuerpo: secciones con h2/h3, parrafos, listas si aplica
   - CTA section: invitacion a probar Iudex
   - Footer: consistente con el resto del sitio
   - Script: link a `../public/js/main.js`

5. **Agregar card en blog/index.html**: Insertar una nueva `.blog-card` en la grid con:
   - `data-category` correcto (productividad, gestion, tecnologia, fundadores)
   - Imagen placeholder o SVG
   - Category badge, titulo, descripcion breve, link al articulo

6. **Verificar links**: Confirmar que todos los `href` y `src` relativos son correctos (`../` para sub-paginas).

## Argumentos

$ARGUMENTS: Titulo o tema del articulo (ej: "plazos procesales: como no perder nunca una fecha")
