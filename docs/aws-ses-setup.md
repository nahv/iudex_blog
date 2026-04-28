# AWS SES — Auto-reply institucional para inscripciones

Runbook para montar y operar el envío de auto-replies de inscripciones del
sitio iudex.com.ar a través de AWS SES, en paralelo a EmailJS.

- **Identidad SES:** `notificaciones.iudex.com.ar`
- **Región:** `us-east-1`
- **AWS Account ID:** `847324761386`
- **Identity ARN:** `arn:aws:ses:us-east-1:847324761386:identity/notificaciones.iudex.com.ar`
- **Supabase project:** `iudex-mvp` (ref `zbysecepjvyyiufbliub`)
- **Function URL:** `https://zbysecepjvyyiufbliub.supabase.co/functions/v1/send-inscription-email`
- **Remitente:** `Iudex <equipo@notificaciones.iudex.com.ar>`
- **Reply-To:** `contacto@iudex.com.ar` (alias Cloudflare Email Routing → `iudexblog3@gmail.com`)
- **Puente:** Database Webhook de Supabase → Edge Function `send-inscription-email` → SES v2
- **Estado actual:** sandbox; identity verificada; DKIM publicado; pendiente production access.

## 0. Pre-requisitos

- Acceso al panel DNS de Cloudflare para `iudex.com.ar`.
- Cuenta AWS con permisos para SES, IAM, SNS, CloudWatch.
- Supabase CLI instalado (`npm i -g supabase`) y `supabase login`.
- Repo en la rama `feature/aws-ses-notificaciones`.

## 1. DNS en Cloudflare (subdominio `notificaciones.iudex.com.ar`)

> El apex `iudex.com.ar` no se modifica: queda con su MX/SPF/DMARC de
> Cloudflare Email Routing intactos.

En la consola SES → **Identities** → `notificaciones.iudex.com.ar` listar:

1. Los **3 CNAMEs DKIM** (`<token1>._domainkey...`, `<token2>...`, `<token3>...`).
2. La región donde está creada la identity (queda anotada arriba en cada record). Anotar como `AWS_REGION`.
3. La sección **Custom MAIL FROM domain**: configurar como `mail.notificaciones.iudex.com.ar` si no lo está.

Publicar en Cloudflare DNS (todos **DNS only**, sin proxy):

| Tipo  | Nombre                                                | Valor                                              | Notas |
|-------|-------------------------------------------------------|----------------------------------------------------|-------|
**Estado actual en Cloudflare (verificado 2026-04-28):**

| Tipo  | Nombre                                                | Valor                                              | Estado |
|-------|-------------------------------------------------------|----------------------------------------------------|--------|
| CNAME | `fmbif5hr6mg2dwnhn5bvvsmmhlkq4tdx._domainkey.notificaciones` | `fmbif5hr6mg2dwnhn5bvvsmmhlkq4tdx.dkim.amazonses.com` | ✅ |
| CNAME | `i66hcwjamlqubgz3zldquhvbkspxn7fn._domainkey.notificaciones` | `i66hcwjamlqubgz3zldquhvbkspxn7fn.dkim.amazonses.com` | ✅ |
| CNAME | `ilabb6j7d5vfojahpmjyuh6ki45e6mtn._domainkey.notificaciones` | `ilabb6j7d5vfojahpmjyuh6ki45e6mtn.dkim.amazonses.com` | ✅ |
| MX    | `equipo.notificaciones`                               | `10 feedback-smtp.us-east-1.amazonses.com`         | ✅ MAIL FROM |
| TXT   | `equipo.notificaciones`                               | `v=spf1 include:amazonses.com ~all`                | ✅ SPF MAIL FROM |
| TXT   | `_dmarc.notificaciones`                               | `v=DMARC1; p=none; rua=mailto:maxinbury@gmail.com` | ⚠️ cambiar a contacto@ |

> **Nota MAIL FROM:** SES tiene configurado `equipo.notificaciones.iudex.com.ar`
> como Custom MAIL FROM domain (estado `Successful`). Es no-convencional
> (lo habitual sería `mail.notificaciones`), pero funcional: DKIM, SPF y
> DMARC alinean correctamente porque la organizational domain coincide.
> Se mantiene como está para evitar re-verificación innecesaria.

### 1.1 Pendiente de DNS

**DMARC:** editar `TXT _dmarc.notificaciones` a:
```
v=DMARC1; p=none; rua=mailto:contacto@iudex.com.ar; fo=1
```
Único cambio DNS necesario antes de avanzar.

Verificación:

```bash
dig +short CNAME <token1>._domainkey.notificaciones.iudex.com.ar
dig +short MX mail.notificaciones.iudex.com.ar
dig +short TXT notificaciones.iudex.com.ar
dig +short TXT _dmarc.notificaciones.iudex.com.ar
```

En SES → Identities, refrescar hasta que aparezca `Verified` y `DKIM: Successful`.

## 2. AWS SES

### 2.1 Email identity de testing (sandbox)

Mientras la cuenta SES esté en sandbox solo se puede enviar a addresses
verificadas. Verificar `maxinbury@gmail.com` desde la consola SES → Identities
→ Create identity → Email address.

### 2.2 Configuration set

```bash
aws ses put-configuration-set \
  --configuration-set-name iudex-transactional \
  --region "$AWS_REGION"

aws ses put-configuration-set-reputation-metrics-enabled \
  --configuration-set-name iudex-transactional \
  --enabled \
  --region "$AWS_REGION"
```

Crear topics SNS y suscribir el alias humano:

```bash
aws sns create-topic --name ses-bounces    --region "$AWS_REGION"
aws sns create-topic --name ses-complaints --region "$AWS_REGION"

aws sns subscribe --topic-arn <arn-bounces>    --protocol email --notification-endpoint contacto@iudex.com.ar --region "$AWS_REGION"
aws sns subscribe --topic-arn <arn-complaints> --protocol email --notification-endpoint contacto@iudex.com.ar --region "$AWS_REGION"
```

Asociar como event destinations del config set (consola SES o
`aws ses create-configuration-set-event-destination`).

### 2.3 SES Template

Archivo `inscripcion-bienvenida-es.json` (no commitear; mantener junto al
runbook fuera del repo o en el bucket de assets internos):

```json
{
  "Template": {
    "TemplateName": "inscripcion-bienvenida-es",
    "SubjectPart": "Recibimos tu inscripción, {{nombre}}",
    "HtmlPart": "<!-- HTML institucional (cream/ink/gold), CSS inline, ver docs/emailjs-templates.md como referencia visual -->",
    "TextPart": "Hola {{nombre}},\\n\\nRecibimos tu inscripción a Iudex. En breve nos pondremos en contacto.\\n\\nEquipo Iudex"
  }
}
```

Crear/actualizar:

```bash
aws ses create-template --cli-input-json file://inscripcion-bienvenida-es.json --region "$AWS_REGION"
# o si ya existe:
aws ses update-template --cli-input-json file://inscripcion-bienvenida-es.json --region "$AWS_REGION"
```

> **Ownership:** Nahue diseña el HTML (tono institucional + 3 próximos pasos
> + firma "Equipo Iudex"). Variables disponibles: `{{nombre}}`, `{{perfil}}`,
> `{{provincia}}`. CSS inline obligatorio (los clientes de mail no cargan
> `<link>` ni `<style>` externos de forma confiable).

### 2.4 IAM user para la Edge Function

Recomendado: usar el MCP `aws-iam` para provisionar y simular la policy. Manualmente:

```bash
aws iam create-user --user-name iudex-ses-edge-fn
aws iam create-access-key --user-name iudex-ses-edge-fn
# guardar AccessKeyId / SecretAccessKey en un manager seguro
```

Inline policy (reemplazar `<account-id>` y `<AWS_REGION>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "SendOnlyAsEquipoNotificaciones",
    "Effect": "Allow",
    "Action": [
      "ses:SendEmail",
      "ses:SendTemplatedEmail",
      "ses:SendRawEmail"
    ],
    "Resource": "*",
    "Condition": {
      "StringEquals": {
        "ses:FromAddress": "equipo@notificaciones.iudex.com.ar"
      }
    }
  }]
}
```

> **Nota:** SES v2 `SendEmail` con `Content.Template` requiere a nivel IAM
> el action legacy `ses:SendTemplatedEmail` y autoriza contra la identity
> del destinatario (no solo la del remitente). Por eso el policy se
> restringe por la condición `ses:FromAddress` en lugar de por ARN de
> identity.

```bash
aws iam put-user-policy --user-name iudex-ses-edge-fn \
  --policy-name ses-send-inscripcion \
  --policy-document file://policy.json
```

### 2.5 Production access (sandbox exit)

Support Center → Service quota increase → SES Sending limits. Caso de uso:

> Auto-reply transaccional a usuarios que se inscriben voluntariamente en
> nuestro formulario de contacto en iudex.com.ar (software de gestión judicial
> para abogados argentinos). Volumen estimado: <500 mails/mes. Bounces y
> complaints gestionados vía SNS topics. List-Unsubscribe N/A (mail
> transaccional 1:1).

ETA típica: 24h.

## 3. Supabase Edge Function

### 3.1 Secretos

```bash
supabase secrets set \
  AWS_REGION=<region> \
  AWS_ACCESS_KEY_ID=<key> \
  AWS_SECRET_ACCESS_KEY=<secret> \
  SES_CONFIG_SET=iudex-transactional \
  SES_TEMPLATE=inscripcion-bienvenida-es \
  SES_FROM='Iudex <equipo@notificaciones.iudex.com.ar>' \
  SES_REPLY_TO=contacto@iudex.com.ar \
  WEBHOOK_SECRET=<random-32-bytes-hex>
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están disponibles por defecto.

### 3.2 Migración

```bash
supabase db push   # aplica supabase/migrations/20260428120000_registrations_ses_columns.sql
```

### 3.3 Deploy

```bash
supabase functions deploy send-inscription-email --no-verify-jwt
```

`--no-verify-jwt` porque la auth se hace con bearer del webhook.

### 3.4 Database Webhook

Supabase Studio → Database → Webhooks → Create:

- **Name:** `send-inscription-email-on-insert`
- **Table:** `public.registrations`
- **Events:** `INSERT`
- **Type:** HTTP Request
- **URL:** `https://zbysecepjvyyiufbliub.supabase.co/functions/v1/send-inscription-email`
- **HTTP Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <WEBHOOK_SECRET>`

## 4. Verificación end-to-end

1. **DNS:** los 4 `dig` de la sección 1 devuelven los valores esperados.
2. **Sandbox test:** SES Console → Send test email con `inscripcion-bienvenida-es`
   a `maxinbury@gmail.com`. En Gmail → Mostrar original → DKIM=PASS, SPF=PASS,
   DMARC=PASS.
3. **Insert manual:**
   ```sql
   insert into public.registrations (nombre, apellido, email, perfil, provincia, source)
   values ('Test', 'QA', 'maxinbury@gmail.com', 'abogado', 'Corrientes', 'manual-test');
   ```
   El webhook dispara, la fila queda con `ses_sent_at` y `ses_message_id`, llega
   el mail desde `equipo@notificaciones.iudex.com.ar`.
4. **End-to-end (post production access):** completar el form en `/contacto/`
   con un email externo. Confirmar:
   - Insert en `registrations`.
   - EmailJS envía sus 2 mails (sin regresión).
   - Edge Function envía el mail SES institucional.
   - Reply al mail SES cae en el forwarding de `contacto@iudex.com.ar`.
5. **Bounce test:** `INSERT` con email `bounce@simulator.amazonses.com`.
   Confirmar evento en SNS y métrica en CloudWatch.
6. **Idempotencia:** reenviar el mismo payload del webhook. La function
   responde `{ "skipped": "already_sent" }` y no duplica el envío.

## 5. Operación

- **Rotar Access Keys** del IAM user `iudex-ses-edge-fn` cada 90 días:
  crear nueva key, `supabase secrets set AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...`,
  redeploy de la function, eliminar la key anterior con `aws iam delete-access-key`.
- **Logs:** `supabase functions logs send-inscription-email --tail` para
  errores SES; CloudWatch para métricas de envío/bounce/complaint.
- **Pausar SES** (en caso de incidente): Supabase Studio → Webhooks →
  desactivar `send-inscription-email-on-insert`. EmailJS queda corriendo y
  los inscriptos siguen recibiendo el auto-reply legacy.

## 6. Costos esperados

A volumen actual (decenas a bajos cientos de inscripciones/mes), el costo
mensual estimado es **<USD 0.10**. Detalle en el plan asociado:
`/home/elotroyo/.claude/plans/genere-un-servicio-en-merry-cupcake.md`.

## 7. Open items

- Confirmar región AWS donde está creada la identity `notificaciones.iudex.com.ar`.
- Confirmar cuenta AWS (personal vs dedicada Iudex) antes de pedir production access.
- Definir fecha de corte de EmailJS (sugerencia: 2 semanas tras validar SES en producción).
