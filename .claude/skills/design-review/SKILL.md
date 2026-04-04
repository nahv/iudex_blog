---
name: design-review
description: Revisar cambios de UI/HTML/CSS contra convenciones del proyecto
allowed-tools: [Read, Glob, Grep, Bash]
---

# Review de cambios de diseno

## Checklist de revision

Revisar los archivos modificados en el ultimo commit o cambios pendientes contra estas reglas:

### CSS
- [ ] Usa CSS custom properties (--ink, --cream, --gold, etc.), no colores hardcodeados
- [ ] Naming sigue convencion BEM (block__element--modifier)
- [ ] No hay `!important`
- [ ] Nuevos estilos usan las variables de tipografia (--font-display, --font-body, --font-mono)
- [ ] Espaciados usan multiplos de var(--col)

### HTML
- [ ] Navbar es consistente con el resto de paginas
- [ ] Footer es consistente con el resto de paginas
- [ ] Meta tags completos (title, description, keywords, og:title, og:description)
- [ ] HTML semantico (nav, main, section, article, footer)
- [ ] Links relativos correctos (root vs sub-directorio)

### Interactividad
- [ ] Elementos nuevos con animacion llevan clase `animate-on-scroll`
- [ ] No hay inline styles salvo donde el patron ya existia
- [ ] Formularios usan `showFormFeedback()` para feedback

### Accesibilidad
- [ ] `aria-label` en botones interactivos (toggle, CTA)
- [ ] `alt` en todas las imagenes
- [ ] Contraste adecuado (ink sobre cream, gold sobre ink)

### Responsive
- [ ] Sin scroll horizontal en mobile
- [ ] Texto legible en todos los viewports
- [ ] Navbar toggle funciona en mobile

## Argumentos

$ARGUMENTS: Rango de commits o archivos a revisar (ej: "HEAD~2..HEAD" o "blog/"). Sin argumentos = revisar cambios pendientes (git diff).
