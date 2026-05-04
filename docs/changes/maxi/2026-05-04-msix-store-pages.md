# Plan — Páginas requeridas para listing de Microsoft Store

**Owner**: Max (cloud / dominio / sitio público)
**Fecha**: 2026-05-04
**Origen**: Handoff de Nahue en `iudex3 PR #122` (rama `feature/msix-certificates`), doc `docs/release/HANDOFF_MAX_PARTNER_CENTER.md`.

---

## Por qué este trabajo

PR #122 en `iudex3` deja el pipeline de empaquetado MSIX listo para publicar Iudex Abogados e Iudex Juzgados en la Microsoft Store. Antes de la primera submission, Partner Center exige URLs públicas accesibles para:

1. **Privacy policy** — obligatoria si la app maneja datos del usuario (Iudex maneja causas).
2. **Terms of use** — soft-required, esperada por los reviewers.
3. **Support contact** — Microsoft prueba mandando mail durante la review.

Si las URLs dan 404 o el mail no responde, la submission se rechaza. No es código del binario: es metadata de la listing que se pega en formularios de Partner Center.

Este plan cubre **solamente** el lado del sitio `iudex.com.ar`. La parte de Partner Center (cuenta empresa, USD 19, verificación 3–7 días, reservar publisher, secrets a Nahue) está en `iudex3/docs/release/HANDOFF_MAX_PARTNER_CENTER.md` y es separada.

---

## Estado actual (verificado al 2026-05-04)

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| Política de privacidad publicada | ✅ Existe | `politica-privacidad/index.html` en `main` y `development` desde commit `c4fbc49` (Nahue, 2026-05-01). Ley 25.326 + AAIP, lista de proveedores (Supabase, Resend, GitHub Pages, Cloudflare, AWS), derechos del titular, jurisdicción Corrientes. |
| Footer linkea a privacidad | ✅ Hecho | `index.html`, `about/`, `contacto/`, `blog/index.html`, posts, `investigacion/`, `politica-privacidad/` |
| Términos de uso publicados | ❌ **No existe** | Nahue removió el placeholder "Términos" del footer del index en `c4fbc49` hasta que se cree la página real |
| `soporte@iudex.com.ar` activo | 🔍 Sin verificar | Mail vive en Zoho (fuera de este repo). Confirmar antes de la submission. |

**Brecha real**: una sola página faltante (`/terminos/`) y restaurar links en footers. La política de privacidad ya cumple lo que pide Microsoft.

---

## Scope de este trabajo (siguiente PR)

### In scope

1. **Crear `terminos/index.html`** siguiendo el mismo molde visual y estructura que `politica-privacidad/index.html` (navbar, hero, post-content, footer compartido). Contenido mínimo:
   - Aceptación de los términos.
   - Descripción del servicio (apps de escritorio Iudex Abogados / Juzgados, sitio web, formularios de contacto).
   - Cuentas y registro (cuándo aplica — hoy es waitlist, mañana login).
   - Uso aceptable y prohibiciones (no scraping, no reverse-engineering del binario, no abuso de los formularios).
   - Propiedad intelectual (el software es de los autores; el contenido del usuario sigue siendo del usuario).
   - Limitación de responsabilidad — Iudex es asistencia, no asesoramiento legal vinculante.
   - Modificaciones de los términos (preaviso, fecha de última actualización).
   - Jurisdicción: Tribunales de Corrientes (consistente con la política de privacidad).
   - Contacto: `contacto@iudex.com.ar`.

2. **Restaurar el link "Términos"** en el footer de:
   - `index.html`
   - `about/index.html`
   - `contacto/index.html`
   - `investigacion/index.html`
   - `blog/index.html` y todos los posts en `blog/*.html`
   - `politica-privacidad/index.html`

3. **Verificación operativa** (sin código, registrar resultado en este doc al cerrar):
   - `dig` apex resuelve a GitHub Pages.
   - `curl -I https://iudex.com.ar/politica-privacidad/` devuelve 200.
   - `curl -I https://iudex.com.ar/terminos/` devuelve 200 después del deploy.
   - `soporte@iudex.com.ar` recibe y responde un mail de prueba.

### Out of scope (tracked aparte)

- **Canonical URL en `politica-privacidad/index.html`** apunta a `https://iudex.app/...` en vez de `iudex.com.ar`. Bug menor preexistente, no bloquea Microsoft. Issue separado.
- **Landing hero / copy refresh**: el sitio ya tiene una landing decente; el handoff lo lista como "opcional pero recomendado". No bloquea la primera submission.
- **Revisión legal por abogado**: ambas páginas deben pasar por abogado **antes de la primera submission a la Store**, no antes de mergear. Quedan como `last-updated` con etiqueta de "draft sujeto a revisión legal" hasta esa pasada.
- **`soporte@iudex.com.ar` Zoho**: configuración manual en Zoho admin console, no toca este repo.
- **`iudex_blog` deploy a GitHub Pages**: ya está automatizado, no requiere cambios.

---

## Plan de ejecución

| Paso | Acción | Owner | Cuándo |
|------|--------|-------|--------|
| 1 | Mergear este PR de plan a `development` | Max + review | Hoy |
| 2 | Implementar `/terminos/` + restaurar footers en una rama nueva, PR a `development` | Max | Hoy / mañana |
| 3 | Mergear a `development` → `release` → `main` siguiendo flujo del repo | Max | Mismo día tras review |
| 4 | Verificar con `curl` que las URLs respondan 200 en producción | Max | Tras deploy |
| 5 | Configurar/confirmar `soporte@iudex.com.ar` en Zoho | Max | Hoy |
| 6 | Pasada legal de privacy + terms con abogado | Max | Antes de la primera submission a Store (no bloquea merge) |

---

## Definición de done de este plan

- [x] Plan documentado y mergeado a `development`.
- [ ] PR de implementación de `/terminos/` mergeado.
- [ ] `https://iudex.com.ar/politica-privacidad/` responde 200 en producción.
- [ ] `https://iudex.com.ar/terminos/` responde 200 en producción.
- [ ] `soporte@iudex.com.ar` recibe y responde mail de prueba.
- [ ] Pasada legal completada (bloqueante solo para submission, no para merge).

---

## Referencias cruzadas

- `iudex3` PR #122 — `feat(msix): Microsoft Store release pipeline...` (base `development`).
- `iudex3` `docs/release/HANDOFF_MAX_PARTNER_CENTER.md` — los pasos de Partner Center que corren en paralelo.
- `iudex3` `docs/release/MICROSOFT_STORE_HANDOFF.md` — referencia larga (contenido mínimo de privacy).
- `iudex_blog` commit `c4fbc49` — base de la política de privacidad ya publicada.
