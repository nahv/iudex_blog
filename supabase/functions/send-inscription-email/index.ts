// send-inscription-email
//
// Supabase Edge Function disparada por un Database Webhook sobre INSERT en
// public.registrations. Envía un auto-reply institucional vía AWS SES v2
// usando la SES Template `inscripcion-bienvenida-es` y marca la fila con
// ses_sent_at + ses_message_id para idempotencia.
//
// Auth del webhook: header `Authorization: Bearer <WEBHOOK_SECRET>`.
// Auth contra AWS: SigV4 con un IAM user dedicado (ver docs/aws-ses-setup.md).

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  SESv2Client,
  SendEmailCommand,
} from "npm:@aws-sdk/client-sesv2@3";

type RegistrationRow = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  perfil: string | null;
  provincia: string | null;
  source: string | null;
  ses_sent_at: string | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: RegistrationRow;
  old_record: RegistrationRow | null;
};

const env = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK_SECRET = env("WEBHOOK_SECRET");
const AWS_REGION = env("AWS_REGION");
const AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY");
const SES_CONFIG_SET = env("SES_CONFIG_SET");
const SES_TEMPLATE = env("SES_TEMPLATE");
const SES_FROM = env("SES_FROM");
const SES_REPLY_TO = Deno.env.get("SES_REPLY_TO") ?? "contacto@iudex.com.ar";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ses = new SESv2Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return json(401, { error: "unauthorized" });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  if (payload.type !== "INSERT" || payload.table !== "registrations") {
    return json(200, { skipped: "not_an_insert_on_registrations" });
  }

  const row = payload.record;
  if (!row?.email || !row.id) return json(400, { error: "invalid_record" });
  if (row.ses_sent_at) return json(200, { skipped: "already_sent" });

  const templateData = {
    nombre: row.nombre?.trim() || "Hola",
    perfil: row.perfil?.trim() || "",
    provincia: row.provincia?.trim() || "",
  };

  try {
    const result = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: SES_FROM,
        Destination: { ToAddresses: [row.email] },
        ReplyToAddresses: [SES_REPLY_TO],
        ConfigurationSetName: SES_CONFIG_SET,
        Content: {
          Template: {
            TemplateName: SES_TEMPLATE,
            TemplateData: JSON.stringify(templateData),
          },
        },
      }),
    );

    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        ses_sent_at: new Date().toISOString(),
        ses_message_id: result.MessageId ?? null,
      })
      .eq("id", row.id)
      .is("ses_sent_at", null);

    if (updateError) {
      console.error("update_failed", { id: row.id, err: updateError.message });
    }

    return json(200, { sent: true, messageId: result.MessageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ses_send_failed", { id: row.id, email: row.email, message });
    return json(502, { error: "ses_send_failed", message });
  }
});
