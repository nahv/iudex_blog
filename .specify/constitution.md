# Constitucion Iudex Blog

## Principios inmutables

1. **Separacion contenido/presentacion/comportamiento**: HTML define estructura,
   CSS define estilo, JS define interactividad. No inline styles salvo excepciones
   minimas heredadas. No logica de negocio en HTML.

2. **Consistencia visual**: Usar las CSS custom properties de `:root`. No
   hardcodear colores, fuentes ni espaciados. Mantener la identidad Iudex
   (ink/cream/gold) en toda pagina nueva.

3. **SEO y accesibilidad**: Cada pagina lleva title, meta description, meta
   keywords, og:tags, alt en imagenes, aria-labels en botones interactivos.
   HTML semantico (nav, main, section, article, footer).

4. **Preview antes de commit**: Verificar cada cambio visualmente en al menos
   3 viewports (mobile 375px, tablet 768px, desktop 1200px) antes de commitear.

5. **Contenido alineado con el producto**: El blog es marketing para Iudex.
   Todo articulo debe ser relevante para abogados argentinos y reforzar el
   posicionamiento del producto.

6. **No romper lo que funciona**: Cambios incrementales. PRs chicos.
   No refactorizar "de paso" paginas que no son parte del ticket.
