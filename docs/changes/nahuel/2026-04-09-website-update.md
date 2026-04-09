# Website Update — MVP Polish, Animations, Corrientes Focus
**Branch:** feature/website-update
**Date:** 2026-04-09
**Author:** Nahuel

## Summary
Actualizacion integral del sitio: reduccion de espacio en pagina Nosotros, actualizacion de perfil profesional (remocion de "autodidacta"), reescritura del story de fundador con enfasis en experiencia en administracion de justicia, foco geografico en Corrientes para el MVP, sistema de animaciones profesionales estilo Apple, grid de features mobile con overlay, menu mobile animado, actualizacion de blog con autores y placeholders para Maxi, y cambio de Instagram a LinkedIn en cards de fundadores.

## Changes

### Nosotros — Spacing fix
- Reducido `margin-top: 72px` y `padding-top: 56px` a 0 en `.team-profiles` en `public/css/styles.css`.
- Removido `border-top` separador.
- Section padding cambiado de `40px` a `0` en `about/index.html`.

### Perfil profesional — Remocion de "autodidacta"
- `about/index.html`: bio actualizada de "Desarrollador autodidacta con mas de diez anos de experiencia dentro del sistema judicial" a "Desarrollador con mas de diez anos de experiencia dentro del sistema de administracion de justicia".
- `blog/historia-fundador.html`: reescrito primer parrafo del story. Removido "autodidacta" y "como escribiente". Nuevo texto enfatiza conocimiento de primera mano del sistema de administracion de justicia.

### Corrientes — Foco geografico MVP
- `index.html`: agregado "abogados Corrientes", "juzgados Corrientes" a meta keywords. Agregado "Disponible primero en Corrientes, Argentina" bajo CTA disclaimer.
- `about/index.html`: agregado "abogados Corrientes", "juzgados Corrientes" a meta keywords.
- `contacto/index.html`: agregado meta keywords con foco en Corrientes.

### Animaciones — Sistema profesional Apple-style
**CSS (`public/css/styles.css`):**
- Nueva variable `--ease-apple: cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
- `.animate-on-scroll` mejorado: duracion 0.9s, `will-change` hint, easing `--ease-apple`.
- `.text-reveal` + `.text-reveal__inner`: animacion de headings con clip overflow y slide-up. `padding-bottom: 4px` para evitar clipping de descendentes (g, y, p).
- `.lead-reveal`: texto subordinado aparece con 350ms delay despues del heading.
- `.stagger-children`: auto-stagger de grid items con 80ms entre cada uno.
- `.scale-in`: animacion de escala 0.85 a 1.0 para stats.
- `.gold-line` + `@keyframes drawLine`: linea dorada animada.

**JS (`public/js/main.js`):**
- Observer unificado para todas las clases de animacion.
- Parallax hero: titulo, subtitulo y acciones con efecto parallax sutil + fade al scroll via `requestAnimationFrame`.
- Counter mejorado: curva `easeOutExpo` en vez de incrementos lineales, duracion 2200ms.
- Auto-reveal de elementos above-the-fold con delays escalonados.

**HTML aplicado:**
- `index.html`: `text-reveal` en todos los headings de seccion, `lead-reveal` en parrafos lead, `stagger-children` en grids de pain y features, `scale-in` en solution stats.
- `about/index.html`: `text-reveal` en headings, `lead-reveal` en leads, `stagger-children` en team grid y story links.

### Mobile features — Icon grid con overlay
- Nuevo HTML en `index.html`: grid de 6 botones iconicos (3x2) visible solo en mobile.
- Bottom sheet overlay con handle, titulo, tag y descripcion.
- CSS en media query 768px: `.features .grid-3` oculto, `.features-mobile-grid` visible.
- JS: click handler con datos de features, apertura/cierre de overlay.

### Mobile menu — Animacion y rediseno
- Menu slide-down con `max-height` + opacity transition y `backdrop-filter: blur(20px)`.
- Items con stagger animation (40ms entre cada uno).
- Links con padding vertical, separadores sutiles, CTA full-width al final.
- Hamburger animado a X con rotacion de spans.
- JS actualizado para toggle de clase `active` en boton.

### Blog — Fechas, autores y placeholders
- Todas las fechas actualizadas a "9 Abr 2026" / "9 de abril de 2026" en:
  - `blog/index.html` (listing)
  - `blog/escritura-repetitiva.html`
  - `blog/gestion-expedientes.html`
  - `blog/ux-software-legal.html`
  - `blog/historia-fundador.html`
  - `blog/ia-aplicada-derecho-maxi-bury.html`
  - `index.html` (blog preview cards)
- Nuevo estilo `.blog-card__author` (gold, mono, 0.74rem).
- Todos los posts existentes atribuidos a "Nahuel Vallejos".
- 3 entries placeholder para Maxi Bury (categoria "IA Legal", estado "Proximamente", opacity 0.65):
  1. "Que puede (y que no) hacer la IA en un estudio juridico hoy"
  2. "Automatizacion con contexto: por que la IA juridica necesita arquitectura"
  3. "Trazabilidad e IA: por que cada decision automatizada debe poder explicarse"
- Nuevo boton de filtro "IA Legal" en filter bar.

### Founder cards — LinkedIn
- `about/index.html`: links de Instagram reemplazados por LinkedIn con SVG icon (18x18).
  - Nahuel: `https://www.linkedin.com/in/nahuel-vallejos/`
  - Maxi: `https://www.linkedin.com/in/maxinbury-aiagents/`
- CSS: `.team-card__action svg` con `width: 18px; height: 18px`.

## Files modified
- `index.html`
- `about/index.html`
- `contacto/index.html`
- `blog/index.html`
- `blog/historia-fundador.html`
- `blog/escritura-repetitiva.html`
- `blog/gestion-expedientes.html`
- `blog/ux-software-legal.html`
- `blog/ia-aplicada-derecho-maxi-bury.html`
- `public/css/styles.css`
- `public/js/main.js`

## Testing
- [ ] Responsive: mobile 375px, tablet 768px, desktop 1200px
- [ ] Mobile menu animation open/close
- [ ] Mobile features icon grid + overlay
- [ ] All scroll animations trigger correctly
- [ ] Parallax hero effect smooth
- [ ] Counter easing visible
- [ ] Blog filter "IA Legal" works
- [ ] LinkedIn links open correctly
- [ ] No broken internal links
