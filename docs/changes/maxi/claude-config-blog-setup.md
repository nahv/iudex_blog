# Setup configuracion Claude Code para iudex_blog

**Fecha:** 2026-04-04
**Autor:** Max
**Rama:** `feature/claude-config-setup`

## Que se hizo

Adaptacion completa de la configuracion de Claude Code de iudex3 (Flutter desktop) al repo iudex_blog (sitio estatico HTML/CSS/JS).

### Archivos creados

- `CLAUDE.md` — instrucciones base (proyecto, estructura, comandos, convenciones, ownership)
- `.specify/constitution.md` — 6 principios inmutables adaptados al blog
- `.claude/rules/html-pages.md` — reglas para edicion de HTML
- `.claude/rules/styles.md` — reglas para CSS
- `.claude/rules/javascript.md` — reglas para JS
- `.claude/rules/blog-content.md` — reglas para contenido del blog
- `.claude/skills/new-blog-post/SKILL.md` — crear articulo nuevo
- `.claude/skills/seo-check/SKILL.md` — verificar SEO
- `.claude/skills/design-review/SKILL.md` — review de UI/CSS
- `.claude/skills/deploy-check/SKILL.md` — verificacion pre-deploy
- `.claude/skills/buenas-practicas/SKILL.md` — documentar buenas practicas del stack
- `docs/claude-code-setup.md` — documentacion completa del setup
- `docs/changes/maxi/claude-config-blog-setup.md` — este archivo

### Ramas creadas

- `release` — pre-produccion
- `development` — integracion
- `feature/claude-config-setup` — esta rama de trabajo

## Por que

Mantener coherencia de workflow AI-first entre iudex3 e iudex_blog. Mismo equipo, mismo producto, misma filosofia de trabajo — adaptada al stack mas simple del blog. Sin esta config, Claude Code no tiene contexto del proyecto ni reglas que seguir.
