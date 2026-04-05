# Claude Code Setup — Configuracion AI-first para Iudex Blog

**Creado:** 2026-04-04
**Autores:** Max (maxinbury), Nahue (nahvallejos)

---

## Objetivo

Configurar Claude Code para el sitio web y blog de Iudex, adaptando la configuracion ya probada en iudex3 (Flutter desktop) al stack estatico del blog. Esta configuracion establece reglas, skills y principios que guian a Claude Code para mantener coherencia en las entregas.

## Contexto

Iudex Blog es el sitio web de marketing de iudex.com.ar: landing page, blog con articulos para abogados, paginas de about y contacto. Stack: HTML5 + CSS3 + JavaScript vanilla, hosting en GitHub Pages, DNS en Cloudflare.

El equipo es el mismo que iudex3:
- **Max** — config Claude Code, SEO, infraestructura (dominio, DNS, deploy)
- **Nahue** — diseno, contenido, UI/UX, identidad visual

Se adapto la configuracion de iudex3 porque:
1. Mantener coherencia de workflow AI-first entre ambos proyectos
2. El blog es mas simple pero igualmente se beneficia de reglas y skills
3. No reinventar la rueda: misma estructura de archivos, adaptada al stack

## Que se creo

### Archivos nuevos (13 en total)

```
iudex_blog/
  CLAUDE.md                                    # Instrucciones base para Claude Code
  .specify/
    constitution.md                            # 6 principios inmutables del blog
  .claude/
    settings.local.json                        # Config local (MCP servers) — ya existia
    rules/
      html-pages.md                            # Reglas al editar *.html
      styles.md                                # Reglas al editar public/css/
      javascript.md                            # Reglas al editar public/js/ o ui/
      blog-content.md                          # Reglas al editar blog/
    skills/
      new-blog-post/SKILL.md                   # /new-blog-post — crear articulo nuevo
      seo-check/SKILL.md                       # /seo-check — verificar SEO de paginas
      design-review/SKILL.md                   # /design-review — checklist de review UI
      deploy-check/SKILL.md                    # /deploy-check — verificar pre-deploy
      buenas-practicas/SKILL.md                # /buenas-practicas — docs del stack web
  docs/
    claude-code-setup.md                       # Este archivo
    changes/maxi/claude-config-blog-setup.md   # Registro del cambio
```

### Detalle de cada componente

#### CLAUDE.md
Archivo que Claude Code carga al inicio de cada sesion. Contiene descripcion del proyecto, estructura de archivos, comandos, convenciones (CSS variables, BEM, HTML semantico, JS vanilla), ownership y definicion de done.

#### .specify/constitution.md
6 principios inmutables adaptados del blog:
1. **Separacion contenido/presentacion/comportamiento**
2. **Consistencia visual** — CSS variables, identidad ink/cream/gold
3. **SEO y accesibilidad** — meta tags, aria-labels, HTML semantico
4. **Preview antes de commit** — 3 viewports
5. **Contenido alineado con el producto** — marketing para abogados
6. **No romper lo que funciona** — cambios incrementales

#### .claude/rules/ (4 archivos)
Reglas que se cargan automaticamente segun el archivo que Claude este editando:

| Archivo | Se activa cuando tocas | Reglas clave |
|---|---|---|
| `html-pages.md` | `**/*.html` | DOCTYPE, lang="es", meta tags, BEM, navbar consistente, links relativos |
| `styles.md` | `**/public/css/**` | CSS variables, single stylesheet, BEM, mobile-first, no !important |
| `javascript.md` | `**/public/js/**`, `**/ui/**` | Vanilla ES6+, querySelector, IntersectionObserver, no console.log |
| `blog-content.md` | `**/blog/**` | Audiencia abogados, meta tags, categorias, actualizar index |

#### .claude/skills/ (5 skills)
Workflows invocables con `/skill-name` desde Claude Code:

| Skill | Comando | Que hace |
|---|---|---|
| `new-blog-post` | `/new-blog-post` | Crea articulo HTML + agrega card en blog/index.html |
| `seo-check` | `/seo-check` | Verifica SEO: meta tags, links, imagenes, semantica |
| `design-review` | `/design-review` | Revisa cambios contra checklist de CSS/HTML/a11y |
| `deploy-check` | `/deploy-check` | Verifica que el sitio esta listo para GitHub Pages |
| `buenas-practicas` | `/buenas-practicas` | Investiga y documenta buenas practicas del stack web |

## Como funciona la arquitectura de contexto

```
Siempre cargado (cada sesion):
  CLAUDE.md ──import──> .specify/constitution.md

Carga automatica por ruta (on-demand):
  .claude/rules/html-pages.md     cuando tocas *.html
  .claude/rules/styles.md         cuando tocas public/css/
  .claude/rules/javascript.md     cuando tocas public/js/ o ui/
  .claude/rules/blog-content.md   cuando tocas blog/

Carga por invocacion (on-demand):
  /new-blog-post      solo cuando lo invocas
  /seo-check          solo cuando lo invocas
  /design-review      solo cuando lo invocas
  /deploy-check       solo cuando lo invocas
  /buenas-practicas   solo cuando lo invocas
```

## Estrategia de ramas

- `main` — produccion, GitHub Pages deploya desde aca. Solo merge via PR.
- `release` — pre-produccion, staging antes de merge a main.
- `development` — integracion, donde se mergean las feature branches.
- `feature/{nombre}` — ramas de trabajo para features o config.

## Relacion con iudex3

Esta configuracion fue adaptada de los 14 archivos de Claude Code de iudex3 (Flutter desktop). Los principios son equivalentes pero ajustados al stack:

| iudex3 | iudex_blog |
|---|---|
| Offline-first (SQLite) | No aplica (sitio estatico) |
| Trazabilidad judicial | No aplica (no hay data layer) |
| Separacion UI/data (Riverpod) | Separacion HTML/CSS/JS |
| Test-first | Preview-first (3 viewports) |
| Contratos antes de impl | Contenido alineado con producto |
| No romper lo que funciona | No romper lo que funciona |
| `/db-migration` | `/new-blog-post` |
| `/backend-review` | `/design-review` |
| `/create-spec` | `/seo-check` |
| `/run-checks` | `/deploy-check` |
| `/buenas-practicas` | `/buenas-practicas` |

## Para Nahue

Si Nahue usa Claude Code en este repo:
- Las rules de `html-pages.md` y `blog-content.md` se cargan cuando edita HTML
- Puede usar `/new-blog-post` para crear articulos nuevos
- Puede usar `/design-review` para revisar sus cambios
- Los principios de `constitution.md` aplican a ambos
