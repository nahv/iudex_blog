# Redesign — "El escritorio" framing + Studio Canvas + mobile overlays

**Branch:** `feature/comunicar-investigacion-ia`
**Date:** 2026-04-20
**Author:** Nahuel (con Claude Code)

## Summary

Redesign integral del sitio siguiendo la estrategia de `docs/redesign-proposal.md`:

1. **Pivot de identidad del hero**: `estudio` → `escritorio` (instancia de app), con product-bar de plataformas (Mac · Windows · Linux) y scope reducido a Corrientes.
2. **Copy pass Stage 1** sobre las 7 páginas live: hero, pain, flow, features, value, CTAs y meta-tags reescritos contra las reglas del proposal §3. Cero banned words (`revolucionario`, `disruptivo`, `potente`, `solución integral`, `plataforma líder`) en live.
3. **Blog reorg**: publicada la historia de Nahuel, slugs renombrados al patrón `{tipo}-{slug}` (URLs cortas y consistentes), redirect stubs en las viejas URLs para preservar inbound links.
4. **Nueva sección Studio Canvas** en el home con 6 screenshots reales del producto (Inicio / Expediente / Notificaciones / Agenda / Ajustes / Nuevo escrito).
5. **Patrón de mobile overlay** (bottom-sheet drawer) extendido a 3 secciones largas: pain, flujo, detalles.
6. **Consolidación sitewide** del CTA `Abrí el escritorio`.
7. **Polish**: icons centrados en cards desktop, chrome de canvas removido porque las capturas ya traen el macOS window baked in.

Base conceptual: `docs/redesign-proposal.md` (brief estratégico, 1.5k palabras). Define el frame "Estudio de Inteligencia Jurídica", la estructura scrollytelling en 7 actos, las reglas de copy (before/after por audiencia), el sistema tipográfico y los signature elements (Pulso Jurídico, Cita que se compone, Conexión visible).

## Changes

### 1. Hero — pivot de identidad

Diagnóstico: `El estudio donde el derecho se piensa` leía como firma jurídica / espacio físico, no como app.

- **Noun swap** `estudio` → `escritorio` en el H1. `Escritorio` en español carga doble significado (escritorio físico + desktop de computadora), señala "app" por sí solo sin decir "software".
- **Platform product-bar** nuevo en el eyebrow: SVGs inline de Apple / Windows / Linux con labels de texto (`Mac · Windows · Linux`), centrados sobre el H1, separadores tipo dot. Patrón Apple-era (eyebrow como metadata de producto arriba del headline declarativo).
- **Subtitle** tightened y narrowed: `Investigar, conectar, decidir — en un mismo hilo. Hecho en Corrientes, para abogados y juzgados correntinos.`
- **"Estudio" sobrevive como concepto/metáfora**: canvas section `El estudio por dentro`, blog hero `Notas desde el estudio`, referencias al estudio como firma del usuario. Dualidad: `escritorio` = instancia de app; `estudio` = la práctica que habilita.

Archivos: `index.html` hero block, `public/css/styles.css` bloques `.hero__eyebrow--platforms`, `.hero__platform`, `.hero__platform-icon`, `.hero__platform-label`, `.hero__platform-sep`.

### 2. Consolidación sitewide del CTA

Reemplazo de los múltiples variants por una sola imperativa corta:

| Superficie | Antes | Ahora |
|---|---|---|
| Navbar CTA (8 páginas live) | `Solicitar acceso` | `Abrí el escritorio` |
| Hero primary CTA | `Solicitar acceso` | `Abrí el escritorio` |
| Hero secondary CTA | `Leer el blog` | `Leer el cuaderno` |
| Section CTA headings (home, about, investigación, contacto) | `Abrí el estudio` | `Abrí el escritorio` |
| Footer column heading (8 páginas) | `<h5>El estudio</h5>` | `<h5>El escritorio</h5>` |
| Footer brand tagline (8 páginas) | `El estudio donde el derecho se piensa...` | `El escritorio donde el derecho se piensa...` |
| Meta `<title>` + `og:title` home | `Iudex — El estudio...` | `Iudex — El escritorio...` |
| Contacto "Qué sigue" paso 3 | `Abrís el estudio` | `Abrís el escritorio` |
| Contacto page H1 | `Abrí el estudio` | `Abrí el escritorio` |
| Footer links internos | `Abrir el estudio` | `Abrir el escritorio` |

### 3. Copy pass — Stage 1 (proposal §3)

Banned words eliminadas de páginas live (grep de `revolucionari|disruptiv|potente|solución integral|plataforma líder|vos también podés` → 0 hits fuera de `blog/drafts/`).

Páginas reescritas:

- **`index.html`** — hero, pain section (6 items), solution intro `La idea / Del buscar al investigar`, stats reescaladas a números honestos, workflow (3 pasos con verbos del proposal: Preguntá · Conectá · Producí), features (7 cards), value proposition `Lo construimos como lo hubiéramos querido usar`, daily details (9 items), blog preview, CTA final `Abrí el escritorio`.
- **`blog/index.html`** — hero `Cuaderno de Iudex · Notas desde el estudio`, featured post, grid con las 3 notas live, filtros actualizados (`Todas · Historia · Caso de estudio`), newsletter box.
- **`blog/historia-maxi-bury.html`** — `potente` → `confiable`, title/meta tightened, post-nav alineado.
- **`blog/caso-demanda-laboral-corrientes.html`** — title/meta nuevos, microcopy pulida, `tres pasos` → `tres movimientos`, `expertise potenciada` → `tu lectura, tu decisión`.
- **`about/index.html`** — hero `Lo construimos como lo hubiéramos querido usar` (epigraph framing del proposal §2 Act VI), bios tightened, sección `Dos recorridos` con story cards repointeadas a las historias correctas (Nahuel + Maxi).
- **`contacto/index.html`** — hero `Abrí el escritorio`, trust badges, 4 FAQs reescritas, "Qué sigue después" (3 pasos), form heading, textarea prompt, botón submit, privacy line.
- **`investigacion/index.html`** — hero `Cada cita, rastreable`, 3 pasos renombrados a los verbos del proposal, 12 bullets rewritten, Corrientes focus block narrowed.

Meta-tags completos sitewide: `<title>`, `<meta description>`, `<meta keywords>`, `og:title`, `og:description`. Agregadas donde faltaban (`blog/index.html`, `investigacion/index.html`).

### 4. Blog — publicación de Nahuel, renames, URLs consistentes

Patrón de naming nuevo: `{tipo}-{slug}` (corto, legible en la URL bar).

| Antes | Ahora | Tipo |
|---|---|---|
| `blog/drafts/historia-fundador.html` (unpublished) | `blog/historia-nahuel-vallejos.html` ✨ **published** | historia |
| `blog/ia-aplicada-derecho-maxi-bury.html` | `blog/historia-maxi-bury.html` | historia |
| `blog/investigacion-jurisprudencial-corrientes.html` | `blog/caso-demanda-laboral-corrientes.html` | caso |

**Historia de Nahuel** (`blog/historia-nahuel-vallejos.html`):
- Cleaned del draft: removido `potente` → `robustas`, tightened SaaS-isms (`solución tecnológica` → `respuesta tecnológica`), `digitalizar` framing removido.
- Frame alineado: `estudio`/`escritorio` coexisten coherentemente.
- Meta-tags completos (title, description, keywords, og).
- Post-nav + cross-links a historia de Maxi.

**Redirect stubs** en las viejas URLs (preservan inbound links y SEO signal):
- `blog/ia-aplicada-derecho-maxi-bury.html` → `meta http-equiv="refresh"` + fallback `<script>window.location.replace(...)` → `historia-maxi-bury.html`.
- `blog/investigacion-jurisprudencial-corrientes.html` → igual → `caso-demanda-laboral-corrientes.html`.
- Ambos con `<meta name="robots" content="noindex,follow">` para que Google transfiera el signal al nuevo slug sin indexar el stub.

**Blog listing** (`blog/index.html`): 3 cards live (caso featured + 2 historias) + newsletter tile; filtros `Todas · Historia · Caso de estudio`.

**Links internos actualizados**: homepage blog preview, footer columns, about page "Leer historia" buttons, cross-links entre posts.

**Eliminado**: `blog/drafts/historia-fundador.html` (movido a live).

### 5. Scope narrowing — Corrientes solamente

Marketing copy scope claims reducidos (el producto aún está en MVP correntino):

| Superficie | Antes | Ahora |
|---|---|---|
| Hero subtitle | `...para toda Argentina.` | `...para abogados y juzgados correntinos.` |
| Home meta description | `abogados y juzgados de Argentina` | `abogados y juzgados de Corrientes` |
| Home CTA disclaimer | `Abre primero en Corrientes. Después, toda Argentina.` | `Disponible en Corrientes.` |
| `investigacion` h2 Corrientes block | `Desde el litigio del interior. Para toda Argentina.` | `Hecho en Corrientes, para Corrientes.` |
| `investigacion` lead del block | abrió al NEA + expansión país | restringido al PJ correntino |
| `investigacion` first stat tile | `Argentina` · Jurisprudencia propia | `Provincial` · Fueros, tribunales y formatos del PJ correntino |

**Preservado** (referencias factuales al corpus legal, no al scope de usuarios): `jurisprudencia argentina`, `fallos argentinos`, `corpus argentino`. El producto usa corpus argentino pero el target son abogados/juzgados correntinos.

### 6. Studio Canvas — sección nueva con 6 screenshots reales

Nueva sección entre `#flujo` y `#features` en el home: `<section class="studio-canvas" id="por-dentro">`.

**Estructura**:
- Header: eyebrow `Oficio diario` + H2 `El escritorio por dentro` + lead.
- Tabs horizontales (6): `Inicio · Expediente · Notificaciones · Agenda · Ajustes · Nuevo escrito`.
- Viewport: `aspect-ratio: 16 / 10`, `max-width: 1040px`, `border-radius: 16px`, shadow profundo.
- Panels absolutos con cross-fade (400ms opacity).
- `<img>` con `loading="lazy"`, `decoding="async"`, `object-fit: contain`, `object-position: center center`.
- Caption rotativa debajo por cada tab (strong title + descripción).

**Screenshots** en `public/assets/screenshots/`:

| # | File | Tab | Caption |
|---|---|---|---|
| 1 | `1.png` | Inicio | Expedientes del día, agenda próxima, valores del JUS al abrir la app |
| 2 | `2.png` | Expediente | Actuaciones, partes, documentos y notas en un solo hilo |
| 3 | `3.png` | Notificaciones | QR + cloud + archivado automático de cédulas electrónicas |
| 4 | `4.png` | Agenda | Vencimientos, audiencias, recordatorios sincronizados |
| 5 | `5.png` | Ajustes | Preferencias del equipo, usuarios, permisos, plantillas |
| 6 | `6.png` | Nuevo escrito | Plantillas propias con contexto del expediente ya cargado |

**Chrome removido**: las PNGs ya incluyen el macOS window chrome (traffic lights + title bar `Iudex · Módulo Abogados`), así que el `.studio-canvas__chrome` que había construido (mis propios dots + "Iudex · Desktop") fue eliminado — se veía doble. Viewport background ahora es `--cream-dark` (no `--ink`) para que cualquier letterbox se mezcle con el bg de la sección.

**Interacción**: tabs con `role="tablist"`, `aria-selected`, `aria-controls`. Caption con `aria-live="polite"`. Keyboard accessible.

**Nota de scope**: originalmente diseñada como placeholder para vistas de IA (Problema → Investigación → Conexión → Producción, per proposal §2 Act V). Cambio de scope: estas 6 son features offline/core del día a día. La IA se mostrará en otra superficie más adelante.

### 7. Mobile overlay pattern — extensión a 3 secciones

Stage 1 existente: `features-mobile-grid` (icono grid en mobile que abre bottom-sheet drawer). Extendido al mismo patrón en:

- **Pain section** (6 items) — 3×2 grid. Variante `--dark` (bg ink).
- **Detalles section** (9 items) — 3×3 grid. Variante `--dark` (bg ink).
- **Flujo section** (3 items) — 3×1 grid single row. Variante default (bg cream-dark).

**Componente genérico**: `.mobile-overlay-grid` + `.mobile-overlay-grid__item` + `.mobile-overlay-grid__label` + modificador `--dark`.

**CSS**:
- Desktop grids (`.pain__grid`, `#detalles .grid-3`, `#flujo .grid-3`) hidden en `@media (max-width: 768px)`.
- Mobile overlay grid con `grid-template-columns: repeat(3, minmax(0, 1fr))` (equal columns, no crece con el contenido). Fix del bug original donde las columnas eran 106/98/98 por `1fr` sin `minmax(0,...)`.
- Tiles: 42×42 ink icon wrapper con gold stroke SVG, label con `-webkit-line-clamp: 2`.
- Variante `--dark`: tile `rgba(cream, 0.04)`, icon wrapper `rgba(gold, 0.1)`, label cream.

**JS** (`public/js/main.js`):
- `overlayContent` object con 4 groups: `flujo`, `features`, `pain`, `detalles`. Cada group = array de `{title, tag, body}`.
- Attributes `data-overlay-group="..."` + `data-overlay-index="N"` en cada tile.
- Handler único genérico para todos los grids.
- Backward-compat con `.features-mobile-grid__item` existente (lee `data-feature` si no hay `data-overlay-index`).
- Close triggers: backdrop tap, handle bar, ESC key. `document.body.style.overflow = 'hidden'` mientras open.
- Data sincronizada con el copy de Stage 1 (`featureData` original estaba stale — del copy pre-Stage-1).

### 8. Polish — desktop card icons centrados

`.feature-card` y `.pain__item` ahora con `display: flex; flex-direction: column; align-items: center; text-align: center` base (antes solo aplicaba en `@media 768px`). Icons con `margin: 0 auto 24px`.

Afecta: workflow cards (Preguntá · Conectá · Producí), features grid (7 cards), detalles grid (9 cards), pain items (6 items). Consistente con el patrón premium feature-card (Apple / Linear / Stripe).

### 9. CSS cleanup

- Eliminado bloque `.studio-canvas__chrome*` (ya no se usa).
- Eliminado bloque `.studio-canvas__placeholder*` (no necesario con imágenes reales).
- Eliminado `.studio-canvas__panel.media-missing` class selector.

### 10. JS cleanup

- Removida toda la lógica de `video` / `media-missing` / `load()` / `preload` para el studio canvas.
- Handler simplificado: activa panel + caption, pausa `<video>` legacy si existiera (defensive, no asumido).
- Overlay handler body scroll lock agregado.
- Listener ESC global para cerrar overlay.

## Files touched

### Modified
- `index.html` — hero rewrite completo, nueva studio canvas section, mobile overlay grids (pain + flujo + detalles), copy pass completo, slug updates en blog preview + footer
- `blog/index.html` — hero `Cuaderno`, featured, grid (3 cards live), filtros, footer
- `blog/ia-aplicada-derecho-maxi-bury.html` — reemplazado por redirect stub
- `blog/investigacion-jurisprudencial-corrientes.html` — reemplazado por redirect stub
- `about/index.html` — hero, bios, story cards, CTAs, footer
- `contacto/index.html` — title, hero, trust badges, form, FAQ, CTAs, footer
- `investigacion/index.html` — hero, 3 steps, 12 bullets, Corrientes block, stat tiles, CTA, footer
- `public/css/styles.css` — hero platform bar (+ labels), studio canvas section (sin chrome), mobile overlay grid component (+ dark variant), feature-card/pain-item centering, cleanup (~400 LOC net add)
- `public/js/main.js` — `overlayContent` object (4 groups), overlay handler genérico (backward-compat), studio canvas tabs (simplificado post-chrome), ESC + scroll lock (~100 LOC net add)

### Created
- `blog/historia-nahuel-vallejos.html` — historia publicada desde draft, cleaned + framed
- `blog/historia-maxi-bury.html` — renamed desde `ia-aplicada-derecho-maxi-bury.html`
- `blog/caso-demanda-laboral-corrientes.html` — renamed desde `investigacion-jurisprudencial-corrientes.html`
- `public/assets/screenshots/1.png` → `6.png` — screenshots del producto (Mac window chrome baked in)
- `docs/changes/nahuel/2026-04-20-escritorio-redesign.md` — este documento
- `docs/redesign-proposal.md` — brief estratégico del redesign (fuente de verdad, preservado en el repo)

### Deleted
- `blog/drafts/historia-fundador.html` — movido a live como `historia-nahuel-vallejos.html`

## Verification

- Preview tested en 3 viewports: 375px mobile, 768px tablet, 1280px desktop.
- **Banned words live**: cero (`grep -i "revolucionari|disruptiv|potente|solución integral|plataforma líder"` → 0 hits fuera de `blog/drafts/`).
- **Dead internal links live**: cero (chequeados `historia-fundador`, `gestion-expedientes.html`, `automatizacion-legal.html` — refs restantes solo en `ui/navbar.html` reference component + drafts).
- **Console errors**: cero después de full reload con cache bust.
- **Meta tags**: completos en toda página tocada (`title`, `description`, `keywords`, `og:title`, `og:description`).
- **Mobile overlays**: tap → abre drawer con title/tag/body correctos; backdrop tap / handle tap / ESC key cierran; body scroll lock funciona.
- **Studio canvas**: los 6 tabs switchean correctamente, caption cross-fade, screenshot 1 renderiza nativamente (4320×2576 → contained en 16:10 viewport).
- **CTAs coherentes**: `Abrí el escritorio` sitewide; footer column + brand tagline + meta title alineados.

## Gaps / follow-ups

1. **AI surface pendiente**: el canvas originalmente iba a mostrar el flujo Problema → Investigación → Conexión → Producción (per proposal §2 Act V). Ese contenido queda pendiente para una página dedicada o una futura iteración del canvas.
2. **Demo videos reservados**: paths `public/assets/demos/{problema,investigacion,conexion,produccion}.{mp4,webp}` fueron diseñados inicialmente en el markup pero removidos junto con el chrome. Si más adelante se graba un demo de IA, es fácil reactivar el patrón tab-canvas con `<video>` en vez de `<img>`.
3. **Juzgados surface**: `docs/redesign-proposal.md §3` tiene una tabla de mensajes dedicados a juzgados (trazabilidad de criterio, convive con sistemas provinciales, datos no salen del juzgado). El sitio aún no tiene superficie dedicada para esta audiencia. Flagged como gap mayor para próxima iteración.
4. **Drafts legacy**: `blog/drafts/{escritura-repetitiva,gestion-expedientes,ux-software-legal}.html` siguen con banned words (`potentes` en historia-fundador.html ya no existe porque la historia fue publicada) y refs a slugs viejos. Solo se limpió y publicó `historia-fundador`. Cleanup pendiente si se los va a publicar.
5. **Email templates**: `docs/email-templates/welcome.html` tiene copy viejo (`plataforma pensada para el sistema judicial correntino`). Out of scope para este redesign, vale un pase separado.
6. **Image weight**: las 6 PNGs suman ~6.8 MB. Con `loading="lazy"` no bloquean first paint, pero un pase a WebP bajaría ~70%. No bloqueante; oportunidad de perf en otra iteración.
7. **Tablet breakpoint**: el umbral 768px hace que tablet-portrait use el mobile overlay grid, no la grid de 3 columnas desktop. Intencional (a 768px portrait las 3 columnas se apretan). Confirmar si la decisión está bien.
8. **Linux icon**: el Tux a 18px es más ambiguo que los iconos de Apple/Windows; funciona por contexto posicional. Alternativa: glyph `>_` de terminal. Por ahora OK.
9. **Stage 3 del proposal**: Acts II–VII del scrollytelling del home siguen sin implementar. Este redesign cubre Act I (hero), toca Act II-IV en forma de secciones existentes (pain/flujo/features) pero sin el tratamiento de canvas horizontal del proposal §2. Stage 3 es trabajo aparte, amerita un prompt separado.
