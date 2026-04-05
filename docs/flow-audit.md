# Auditoría de Flujos de Interacción del Usuario

**Fecha:** 2026-04-05
**Autor:** Nahuel
**Rama:** `feature/pre-access-registration`

---

## Resumen ejecutivo

El sitio iudex.app cuenta con 4 flujos de interacción que recopilan datos del usuario. Ninguno está funcional end-to-end: los formularios tienen lógica client-side completa pero los template IDs de EmailJS son placeholders, y no existe persistencia de datos (base de datos ni CRM).

---

## Flujo 1: Formulario de contacto / acceso anticipado

**Ubicación:** `contacto/index.html`

**Qué hace hoy:**
- Formulario completo con 8 campos: nombre, apellido, email, teléfono (opcional), provincia, área de práctica, tamaño del estudio, mensaje (opcional).
- Client-side: validación nativa HTML5 (`required`), botón cambia a "Enviando..." al submit.
- Al enviar, intenta disparar 2 emails vía EmailJS en paralelo (`Promise.all`):
  - `teamNotify` → notificación al equipo Iudex con todos los datos.
  - `autoReply` → email automático de bienvenida al usuario.
- Si EmailJS no carga, ejecuta un fallback simulado (muestra "¡Solicitud enviada!" sin enviar nada).
- Feedback visual vía `showFormFeedback()`.

**¿Funcional end-to-end?** No.

**Qué está roto o falta:**
1. **Template IDs son placeholders** — `YOUR_TEMPLATE_ID_1` y `YOUR_TEMPLATE_ID_2` en `main.js`. Los emails no se envían.
2. **No hay persistencia de datos** — EmailJS solo envía emails; si falla, la solicitud se pierde. No hay base de datos, spreadsheet ni CRM que registre las solicitudes.
3. **El fallback silencioso engaña al usuario** — Si EmailJS no carga (CDN caído, bloqueador de ads), el formulario simula éxito sin que el dato llegue a ningún lado.
4. **Sin validación custom** — Solo se usa `required` nativo. No se valida formato de email más allá del regex del JS, ni se sanitiza input.
5. **Sin rate limiting** — Un usuario podría enviar el formulario repetidamente.
6. **Sin protección anti-spam** — No hay reCAPTCHA ni honeypot.

---

## Flujo 2: CTA de email (landing page)

**Ubicación:** `index.html` (sección CTA al final de la página)

**Qué hace hoy:**
- Input de email + botón "Solicitar acceso".
- Validación client-side: regex de email, feedback visual.
- Al enviar, dispara el template `newsletter` de EmailJS con solo el email.
- Mismo fallback simulado si EmailJS no carga.

**¿Funcional end-to-end?** No.

**Qué está roto o falta:**
1. **Template ID placeholder** — `YOUR_TEMPLATE_ID_3`.
2. **No persiste el dato** — Igual que el flujo 1.
3. **Solo captura email** — No nombre ni contexto. Si alguien se registra por acá, el equipo no sabe quién es.
4. **No se distingue de newsletter** — Usa el template `newsletter`, pero el CTA dice "Solicitar acceso". Hay ambigüedad entre acceso anticipado y suscripción a newsletter.

---

## Flujo 3: CTA de email (página Nosotros)

**Ubicación:** `about/index.html` (sección CTA al final)

**Qué hace hoy:**
- Mismo componente que el Flujo 2: input de email + botón.
- Misma clase `js-email-form`, misma lógica, mismo template `newsletter`.

**¿Funcional end-to-end?** No. Mismos problemas que el Flujo 2.

---

## Flujo 4: Newsletter del blog

**Ubicación:** `blog/index.html` (tarjeta integrada en el grid de artículos)

**Qué hace hoy:**
- Card oscura (--ink bg) con input de email y botón "Suscribirme".
- Misma clase `js-email-form`, misma lógica, mismo template `newsletter`.

**¿Funcional end-to-end?** No. Mismos problemas que el Flujo 2.

**Nota adicional:** Este es el único flujo claramente etiquetado como newsletter ("Recibí los nuevos artículos"). Los otros CTAs dicen "Solicitar acceso" pero usan el mismo template.

---

## Flujos inexistentes

| Flujo | Estado |
|-------|--------|
| Login / autenticación | No existe. No hay área de usuario. |
| Sistema de comentarios en blog | No existe. Los artículos no tienen comentarios. |
| Desuscripción de email | No existe. No hay link de unsub en los templates. |
| Confirmación de email (double opt-in) | No existe. |

---

## Infraestructura actual

| Componente | Tecnología | Estado |
|-----------|-----------|--------|
| Frontend | HTML/CSS/JS estático | Funcional |
| Hosting | GitHub Pages | Funcional |
| DNS | Cloudflare | Funcional |
| Email service | EmailJS (client-side) | Parcialmente configurado (key y service OK, templates pendientes) |
| Base de datos | Ninguna | No existe |
| Analytics | Ninguno detectado | No existe |
| Anti-spam | Ninguno | No existe |

---

## Prioridades de corrección

1. **Crítico** — Agregar persistencia de datos (Supabase u otra DB) para no perder registros.
2. **Crítico** — Crear los templates de EmailJS o migrar a un servicio transaccional (Resend/SendGrid).
3. **Alto** — Eliminar el fallback silencioso que simula éxito sin enviar datos.
4. **Medio** — Separar conceptualmente "solicitar acceso" de "newsletter".
5. **Medio** — Agregar protección anti-spam (honeypot mínimo).
6. **Bajo** — Agregar double opt-in para newsletter.
