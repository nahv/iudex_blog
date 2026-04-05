---
paths: ["**/public/js/**", "**/ui/**"]
---

# Reglas para JavaScript

- Vanilla ES6+ exclusivamente. Sin npm, sin bundlers, sin transpilacion.
- Todo el JS va en `public/js/main.js`. No crear archivos JS adicionales salvo componentes en `ui/`.
- Wrap de inicializacion dentro de `DOMContentLoaded`.
- Usar `querySelector` / `querySelectorAll`, no `getElementById`.
- Animaciones al scroll: `IntersectionObserver` (patron existente en main.js).
- Formularios: validacion client-side. Feedback via `showFormFeedback(form, message, success)` (ya existe en main.js).
- No dejar `console.log` en codigo commiteado.
- Preferir event delegation para elementos repetidos (blog cards, filter buttons).
- No manipular estilos inline desde JS salvo para animaciones transitorias. Preferir toggle de clases CSS.
