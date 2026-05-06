# Iudex Blog

Sitio web estatico y blog de marketing para iudex.com.ar. HTML5, CSS3, JavaScript vanilla (ES6+). Hosting en GitHub Pages, DNS en Cloudflare.
Producto: software de gestion judicial para abogados argentinos.

## Estructura

```
index.html              -> Landing page principal
blog/
  index.html            -> Listado de articulos con filtros por categoria
  *.html                -> Articulos individuales (escritura-repetitiva, gestion-expedientes, historia-fundador, ux-software-legal)
about/index.html        -> Pagina "Nosotros"
contacto/index.html     -> Formulario de contacto
public/css/styles.css   -> Hoja de estilos global (CSS variables, BEM)
public/js/main.js       -> JavaScript global (navbar, forms, animaciones, filtros)
ui/navbar.html          -> Componente navbar de referencia
emails/                 -> Templates HTML para envios manuales via Resend (beta-invite, etc)
scripts/                -> CLIs de operacion (send-beta-invite.mjs, build-blog.py)
supabase/               -> Edge Functions, migrations y config del backend de email
supabase/README.md      -> Spec completa del sistema de email (LEER antes de tocar email/registros)
```

## Comandos

```bash
# Servir localmente
python3 -m http.server 8000

# Deploy (GitHub Pages deploya automaticamente desde main)
git push origin main
```

## Convenciones

- **CSS**: Usar CSS custom properties de `:root` (--ink, --cream, --gold, etc.). No hardcodear colores. Naming BEM (block__element--modifier).
- **Tipografia**: `--font-display` (Playfair Display) para headings, `--font-body` (DM Sans) para body, `--font-mono` (DM Mono) para labels/code.
- **HTML**: Semantico (nav, main, section, article, footer). `lang="es"`. Toda pagina necesita title, meta description, meta keywords, og:title, og:description.
- **JS**: Vanilla ES6+ exclusivamente. Sin frameworks, sin build step. Todo en `public/js/main.js`.
- **Blog**: Cada articulo es un .html independiente en `blog/`. Al crear uno nuevo, agregar tambien la card en `blog/index.html`.
- **Links**: Paths relativos. Paginas raiz: `blog/index.html`. Sub-paginas: `../index.html`.
- **Imagenes**: Alt obligatorio. Formato SVG para iconos, WebP/PNG para fotos.
- **Email / Edge Functions**: Antes de modificar templates, Edge Functions, webhooks, scripts de email o cualquier cosa relacionada con `registrations`, leer `supabase/README.md`. Los cambios al stack de email (Resend, Notion sync, Cloudflare routing) requieren actualizar ese doc en el mismo commit.

## Ownership

- **Max**: config Claude Code, SEO, infraestructura (dominio, DNS, deploy), analytics
- **Nahue**: diseno, contenido, UI/UX, identidad visual
- Cambios cross-ownership requieren PR review.

## Definicion de done

- HTML valido y semantico
- Sin links internos rotos
- Responsive en 3 viewports: mobile (375px), tablet (768px), desktop (1200px)
- Meta tags completos (title, description, keywords, og)
- Navbar y footer consistentes entre todas las paginas

## Principios

@.specify/constitution.md
