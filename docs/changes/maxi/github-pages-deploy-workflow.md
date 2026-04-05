# GitHub Actions workflow para deploy a GitHub Pages

**Fecha:** 2026-04-05
**Autor:** Max
**Rama:** `feature/github-pages-deploy`

## Que se hizo

Configuracion de deploy automatico del sitio a GitHub Pages exclusivamente cuando se hace push a `main`.

### Archivos creados

- `.github/workflows/deploy.yml` — Workflow de GitHub Actions que:
  - Se ejecuta solo en push a `main`
  - Usa `actions/deploy-pages@v4` (metodo oficial de GitHub)
  - Control de concurrencia: no cancela deploys en progreso
  - Permisos minimos: read contents, write pages, write id-token

- `.gitignore` — Excluye archivos que no deben subir al repo:
  - `.codex` (archivo local vacio)
  - `dominio-y-correo-iudex-com-ar.md` (guia operativa local, no es parte del sitio)
  - `.claude/settings.local.json` (config personal de MCP servers)

- `.nojekyll` — Archivo vacio que le indica a GitHub Pages que no procese el sitio con Jekyll (el generador de sitios estaticos por defecto de GitHub Pages). Sin esto, Jekyll podria ignorar carpetas que empiecen con punto o intentar interpretar archivos con frontmatter YAML.

## Paso manual requerido

En GitHub: **Settings → Pages → Build and deployment → Source** debe cambiarse de "Deploy from a branch" a **"GitHub Actions"**. Sin esto, el workflow no tiene permisos para publicar.

## Por que

Antes no habia control sobre cuando se desplegaba el sitio. Con este workflow, el flujo es:
1. Trabajar en feature branches
2. Mergear a `development` (integracion)
3. Mergear a `release` (pre-prod)
4. Mergear a `main` → deploy automatico a iudex.com.ar

Solo el push a `main` actualiza el dominio. Pushear a cualquier otra rama no dispara el deploy.
