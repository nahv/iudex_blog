---
paths: ["**/public/css/**"]
---

# Reglas para estilos CSS

- Una sola hoja de estilos: `public/css/styles.css`. No crear archivos CSS adicionales.
- Usar CSS custom properties de `:root`. Nunca hardcodear colores.
  - Paleta: `--ink`, `--ink-soft`, `--ink-muted`, `--cream`, `--cream-dark`, `--gold`, `--gold-light`, `--white`, `--red-accent`.
- Tipografia via variables: `--font-display` (headings h1-h5), `--font-body` (texto), `--font-mono` (labels, codigo).
- Espaciado base: `var(--col)` (8px). Usar multiplos para margenes y paddings.
- Ancho maximo: `var(--max-w)` (1200px) via clase `.container`.
- Transiciones: usar `var(--ease-out)` y `var(--ease-in-out)`.
- Mobile-first: estilos base para mobile, media queries para tablet (768px) y desktop (1200px).
- Naming BEM: `block__element`, `block--modifier`.
- No `!important` (no hay CSS de terceros que sobreescribir).
- Nuevas secciones: seguir el patron de comentarios `/* === SECCION === */` del archivo.
