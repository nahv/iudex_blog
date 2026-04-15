# Iudex MVP Playbook — Beta Cerrada

Guia operativa para la fase de acceso anticipado.
Objetivo: conseguir ~5 beta testers activos, recolectar feedback real, iterar.

### GitHub Secrets

Ir a repo Settings > Secrets and variables > Actions. Crear/actualizar:

| Secret                         | Valor                          |
|-------------------------------|--------------------------------|
| `SUPABASE_URL`                | URL del proyecto Supabase      |
| `SUPABASE_ANON_KEY`           | Anon key de Supabase           |
| `EMAILJS_PUBLIC_KEY`          | Public key de EmailJS          |
| `EMAILJS_SERVICE_ID`          | Service ID de EmailJS          |
| `EMAILJS_TEMPLATE_USER_CONFIRM`   | Template ID de confirmacion |
| `EMAILJS_TEMPLATE_FOUNDER_NOTIFY` | Template ID de notificacion |

### Local env.js

Para testear localmente, copiar `public/js/env.example.js` a `public/js/env.js` y completar con los mismos valores.

---

## 1. Criterios de Seleccion Beta

### Perfil ideal (prioridad alta)
- Abogado/a independiente o estudio chico (2-5 personas)
- Provincia: Corrientes (prioridad), luego NEA (Chaco, Misiones, Formosa, Entre Rios)
- Fuero: civil y comercial, laboral, o familia (mas cobertura de plantillas)
- Completo el campo "mensaje" (muestra engagement)
- Dolor claro articulado (expedientes, escritura, plazos)

### Perfil aceptable (prioridad media)
- Estudio mediano (6-15 personas) — mas complejo pero buen feedback
- Otras provincias con fuero compatible
- Sin mensaje pero perfil completo

### Descarte (prioridad baja)
- Perfil "Otro" (no es audiencia core)
- Equipos grandes (+15) — demasiado complejo para MVP
- Organismos judiciales — flujo diferente, no prioritario en MVP

---

## 2. Workflow Operativo

```
Registro entra
    |
    v
Founders reciben email con datos completos
    |
    v
Revisar en Supabase (Table Editor > registrations)
    |
    v
Evaluar contra criterios de seleccion
    |
    +---> Seleccionado: cambiar status a "selected"
    |         |
    |         v
    |     Contactar por WhatsApp/email en < 48h
    |     Agendar llamada de onboarding (15-20 min)
    |     Dar acceso a la plataforma
    |
    +---> Waitlist: cambiar status a "waitlist"
    |         |
    |         v
    |     Email manual: "Gracias, te tenemos en cuenta para
    |     la proxima tanda de invitaciones"
    |
    +---> No califica: cambiar status a "rejected"
              |
              v
          No contactar (el usuario ya recibio confirmacion automatica)
```

### Actualizacion de status en Supabase

Ir a Table Editor > registrations > click en la fila > editar campo `status`:
- `pending` → sin revisar
- `selected` → beta tester aceptado
- `waitlist` → buen perfil, espera proxima tanda
- `rejected` → no califica para beta

---

## 3. Onboarding de Beta Testers

### Llamada inicial (15-20 min)
1. Presentarse, agradecer el interes
2. Preguntar sobre su practica: cuantas causas maneja, que herramientas usa hoy, cual es su dolor principal
3. Explicar que es Iudex y que puede hacer hoy (sin prometer features futuras)
4. Dar acceso a la plataforma en vivo
5. Pedir que pruebe una tarea concreta en la proxima semana
6. Acordar canal de feedback (WhatsApp grupo o individual)

### Seguimiento semanal
- Semana 1: "Como te fue con [tarea]? Algo que te trabo?"
- Semana 2: "Que estas usando mas? Que te gustaria que funcione diferente?"
- Semana 3: "Si tuvieras que describir Iudex a un colega, que le dirias?"
- Semana 4: Review general + decision sobre extension/conversion

### Metricas a trackear
- Frecuencia de uso (logins por semana)
- Features mas usadas
- Bugs reportados
- NPS informal: "del 1 al 10, cuanto lo recomendarias?"
- Tasa de retencion: vuelven solos o hay que empujarlos?

---

## 4. Timeline

| Semana | Actividad |
|--------|-----------|
| 1      | Setup Supabase + EmailJS + deploy con nuevas credenciales |
| 1-2    | Testear flujo completo (registro, emails, Supabase) |
| 2-3    | Soft launch: compartir en canales target (colegio de abogados Corrientes, grupos WhatsApp, Instagram) |
| 3-4    | Revisar registros, seleccionar primeros 5 usuarios |
| 4-5    | Onboarding individual de cada beta tester |
| 5-8    | Feedback semanal, iteracion rapida en producto |
| 8+     | Evaluar: expandir beta, ajustar producto, o pivotar |

---

## 5. Canales de Difusion Sugeridos

- Instagram @iudex.ai (contenido sobre dolor + CTA a registro)
- WhatsApp directo a contactos abogados en Corrientes
- Colegio de Abogados de Corrientes (si hay canal digital)
- LinkedIn personal de Nahue y Maxi
- Blog posts con CTA de registro al final

---

## 6. Checklist Pre-Launch

- [ ] Supabase proyecto creado y tabla `registrations` lista
- [ ] RLS habilitado con policy INSERT-only
- [ ] EmailJS conectado con 2 templates funcionando
- [ ] GitHub Secrets actualizados (6 secrets)
- [ ] Deploy exitoso en GitHub Pages
- [ ] Test completo: registro → email usuario → email founders → dato en Supabase
- [ ] env.js local configurado para testing
- [ ] Blog build ejecutado (posts publicados correctos)
