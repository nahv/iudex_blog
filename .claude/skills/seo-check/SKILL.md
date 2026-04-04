---
name: seo-check
description: Verificar SEO basico de todas las paginas del sitio
allowed-tools: [Read, Glob, Grep, Bash]
---

# Verificacion SEO del sitio

## Procedimiento

1. **Escanear paginas**: Listar todos los archivos `.html` del proyecto con Glob.

2. **Verificar cada pagina**:
   - `<title>` presente y descriptivo
   - `<meta name="description">` presente y menor a 160 caracteres
   - `<meta name="keywords">` presente
   - `<meta property="og:title">` presente
   - `<meta property="og:description">` presente
   - `<link rel="canonical">` presente
   - `<html lang="es">` presente
   - HTML semantico: usa `<main>`, `<article>`, `<nav>`, `<footer>`

3. **Verificar imagenes**: Buscar tags `<img>` sin atributo `alt`.

4. **Verificar links internos**: Para cada `href` que apunte a un archivo local, verificar que el archivo destino existe.

5. **Reportar**: Presentar resultados en formato tabla:

   | Pagina | Issue | Severidad |
   |---|---|---|
   | index.html | Falta canonical | Media |

   Al final, resumen: X paginas verificadas, Y issues encontrados.

## Argumentos

$ARGUMENTS: Opcional. Path de una pagina especifica para verificar solo esa (ej: "blog/nuevo-post.html"). Sin argumentos = verificar todo el sitio.
