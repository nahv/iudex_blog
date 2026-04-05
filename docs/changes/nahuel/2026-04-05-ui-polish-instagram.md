# UI Polish + Instagram Integration + Dual Audience
**Branch:** feature/ui-polish-instagram-cm
**Date:** 2026-04-05
**Author:** Nahuel

## Summary
Ajustes visuales (navbar, mobile centering, solution visual), eliminacion del mockup de solucion, reemplazo de todas las redes sociales por Instagram (@iudex.ai), ampliacion de audiencia para incluir juzgados y equipos judiciales, nuevo campo de perfil profesional en el formulario de contacto, plan de content management para Instagram, y documento de parametros de UI para Notion.

## Changes

### Navbar icon
- Logo-mark de 32x32px a 36x36px en `public/css/styles.css` para alinear con el texto "Iudex".

### Solution mockup removal
- Eliminado `.solution__mockup` del HTML en `index.html` (sidebar + main panel + doc-lines).
- Eliminados todos los estilos CSS: `.solution__mockup`, `.solution__sidebar`, `.solution__sidebar-item`, `.solution__main-panel`, `.solution__doc-line`, `@keyframes shimmer`.
- Eliminada regla responsive en breakpoint 768px.

### Solution visual — mobile fix y centrado
- Stats (`.solution__stat`) centrados con `align-items: center; text-align: center` en desktop y mobile.
- En breakpoint 768px: stats grid a 1 columna, padding reducido a 24px, font-size de numeros a 2.5rem.

### Mobile centering (index.html)
- En `max-width: 768px`: `.feature-card` y `.pain__item` con `text-align: center; align-items: center`.
- Iconos centrados con `margin-left/right: auto`.

### Testimonial beta tester
- Comentado (HTML comment) el bloque de testimonio de Marcela R. en la seccion value proposition de `index.html`. Listo para descomentar cuando haya testimonios reales.

### Social media → Instagram
- **Archivos modificados:** `index.html`, `about/index.html`, `contacto/index.html`, `blog/index.html`, `blog/escritura-repetitiva.html`, `ui/navbar.html`
- Todos los iconos de LinkedIn, Twitter/X reemplazados por un unico icono de Instagram apuntando a `https://www.instagram.com/iudex.ai`
- Team cards en about: links a LinkedIn personal → link a @iudex.ai
- Contacto: detalle LinkedIn → detalle Instagram con link navegable

### Contacto — WhatsApp e Instagram navegables
- Instagram `@iudex.ai` ahora es un link clickeable a `https://www.instagram.com/iudex.ai`
- WhatsApp: placeholder reemplazado por 2 numeros reales con links a `wa.me/`:
  - +54 9 3794 504737
  - +54 9 3794 004023

### Dual audience: abogados + juzgados
- **Archivos modificados:** todos los HTML (12 archivos) + `public/js/main.js`
- Titles, meta descriptions, og tags actualizados para incluir "juzgados" / "equipos judiciales"
- Footers: "Software para abogados" → "Software para abogados y juzgados" (10 archivos)
- CTAs: "lista de abogados" → "lista de profesionales del derecho"
- Value proposition: "Disenado para el abogado real" → "Disenado para el profesional legal real"
- Blog hub: "Recursos para el abogado" → "Recursos para el profesional del derecho"
- Newsletter CTAs: "contenido util para abogados" → "contenido util para profesionales del derecho"
- Blog article body text sin cambios (contenido editorial).

### Contact form — nuevo campo de perfil
- Nuevo `<select id="perfil">` con opciones: Abogado/a independiente, Estudio juridico, Juzgado, Organismo judicial, Otro.
- "Tamano del estudio" → "Tamano del equipo", opciones generalizadas ("personas" en vez de "abogados").
- `public/js/main.js`: campo `perfil` agregado al objeto `formData`.
- **Requiere**: `ALTER TABLE registrations ADD COLUMN perfil TEXT;` en Supabase.

### About page — spacing
- Reducido padding-top de la seccion team de 96px a 40px para cerrar el espacio excesivo con el hero.

### New files created
- `docs/cm/instagram-plan.md` — Plan completo de CM para Instagram (10 secciones).
- `docs/cm/instagram-ui-parameters-notion.md` — Documento Notion-ready con parametros de UI: paleta, tipografia, formatos, dimensiones, plantillas base, reglas de composicion, calendario y flujo de aprobacion.
- `docs/changes/nahuel/2026-04-05-ui-polish-instagram.md` — Este archivo.

## Notes
- Los blog posts sin iconos sociales en footer (historia-fundador, gestion-expedientes, ia-aplicada-derecho-maxi-bury, ux-software-legal) no requirieron cambios de iconos, pero si se actualizaron sus footer taglines y newsletter CTAs.
- Pendiente ejecutar en Supabase: `ALTER TABLE registrations ADD COLUMN perfil TEXT;`
- El testimonio de Marcela R. esta comentado, no eliminado. Descomentar cuando se tengan testimonios verificados.
