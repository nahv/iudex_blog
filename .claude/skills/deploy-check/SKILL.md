---
name: deploy-check
description: Verificar que el sitio esta listo para deploy a GitHub Pages
allowed-tools: [Bash, Read, Glob, Grep]
---

# Verificacion pre-deploy

## Pasos

1. **HTML bien formado**: Verificar que todos los `.html` tienen `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>` con tags de cierre.

2. **Links internos validos**: Para cada `href` y `src` que apunte a archivos locales, verificar que el archivo destino existe en el repo.

3. **Assets existen**:
   - `public/css/styles.css` existe y no esta vacio
   - `public/js/main.js` existe y no esta vacio

4. **Sin referencias de desarrollo**: Buscar URLs de localhost, 127.0.0.1, o paths absolutos del sistema en archivos HTML.

5. **Consistencia de navbar**: Verificar que todas las paginas tienen los mismos links de navegacion (Inicio, Blog, Nosotros, Contacto, Solicitar acceso).

6. **Meta tags**: Verificar que todas las paginas tienen title y meta description.

7. **Resumen**: Reportar estado de cada paso en formato tabla:

   | Check | Estado |
   |---|---|
   | HTML bien formado | PASS |
   | Links internos | PASS |
   | Assets existen | PASS |
   | Sin refs de dev | PASS |
   | Navbar consistente | PASS |
   | Meta tags | PASS |

## Argumentos

$ARGUMENTS: Opcional. "quick" para solo verificar HTML y assets sin chequeo de links.
