// send-inscription-email
//
// Supabase Edge Function disparada por un Database Webhook sobre INSERT en
// public.registrations. Envia dos mails via Resend:
//   1) Welcome al usuario que recien se inscribio
//   2) Notificacion interna al equipo
// Marca la fila con email_sent_at + email_message_id para idempotencia.
//
// Auth del webhook: header `Authorization: Bearer <WEBHOOK_SECRET>`.
// Auth contra Resend: API key (`RESEND_API_KEY`) en Supabase Secrets.

import { createClient } from "npm:@supabase/supabase-js@2";
import welcomeHtml from "./welcome.ts";
import founderNotifyHtml from "./founder-notify.ts";

type RegistrationRow = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  perfil: string | null;
  provincia: string | null;
  fuero: string | null;
  tamano: string | null;
  mensaje: string | null;
  source: string | null;
  created_at: string | null;
  ses_sent_at: string | null;
  email_sent_at: string | null;
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
const RESEND_API_KEY = env("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ??
  "Iudex <equipo@notificaciones.iudex.com.ar>";
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") ??
  "contacto@iudex.com.ar";
const RESEND_TEAM_TO = Deno.env.get("RESEND_TEAM_TO") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

// Mini renderer compatible con el subset de Mustache que usan los templates:
//   {{var}}              -> sustitucion
//   {{#var}}...{{/var}}  -> bloque si var es truthy
//   {{^var}}...{{/var}}  -> bloque si var es falsy
function render(tpl: string, vars: Record<string, string>): string {
  let out = tpl.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_m, key, body) => (vars[key] ? body : ""),
  );
  out = out.replace(
    /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_m, key, body) => (vars[key] ? "" : body),
  );
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key) => vars[key] ?? "");
  return out;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&[a-z]+;/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

type ResendSendResult = { id?: string; error?: string };

async function resendSend(opts: {
  from: string;
  to: string | string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}): Promise<ResendSendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "iudex-blog/send-inscription-email",
      "Idempotency-Key": opts.idempotencyKey,
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      reply_to: opts.reply_to,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: typeof data?.message === "string"
        ? data.message
        : `resend_http_${res.status}`,
    };
  }
  return { id: data?.id };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // Aceptamos dos formatos: `Bearer <secret>` o `<secret>` directo. La UI de
  // Database Webhooks de Supabase a veces guarda el header sin el prefijo
  // `Bearer`, asi que toleramos ambas variantes.
  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (presented !== WEBHOOK_SECRET) {
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
  if (row.email_sent_at || row.ses_sent_at) {
    return json(200, { skipped: "already_sent" });
  }

  const nombre = row.nombre?.trim() ?? "";
  const apellido = row.apellido?.trim() ?? "";

  const userVars: Record<string, string> = {
    nombre,
    perfil: row.perfil?.trim() ?? "",
    provincia: row.provincia?.trim() ?? "",
  };

  const teamVars: Record<string, string> = {
    id: row.id,
    nombre: nombre || "—",
    apellido: apellido || "—",
    email: row.email,
    telefono: row.telefono?.trim() || "—",
    perfil: row.perfil?.trim() || "—",
    provincia: row.provincia?.trim() || "—",
    fuero: row.fuero?.trim() || "—",
    tamano: row.tamano?.trim() || "—",
    mensaje: row.mensaje?.trim() || "—",
    source: row.source?.trim() || "—",
    created_at: row.created_at ?? new Date().toISOString(),
  };

  const userHtml = render(welcomeHtml, userVars);
  const teamHtml = render(founderNotifyHtml, teamVars);

  const userSubject = nombre
    ? `Hola ${nombre}, recibimos tu solicitud — Iudex`
    : "Recibimos tu solicitud — Iudex";
  const teamSubject = `Nueva solicitud — ${teamVars.nombre} ${teamVars.apellido}`.trim();

  // RESEND_TEAM_TO acepta una sola direccion o varias separadas por coma
  // (ej: "maxi@gmail.com,nahuel@gmail.com"). Resend acepta arrays en el
  // campo `to` con hasta 50 destinatarios por mensaje.
  const teamRecipients = RESEND_TEAM_TO
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let teamMessageId: string | undefined;
  let teamError: string | undefined;
  if (teamRecipients.length > 0) {
    const result = await resendSend({
      from: RESEND_FROM,
      to: teamRecipients,
      reply_to: row.email,
      subject: teamSubject,
      html: teamHtml,
      text: htmlToText(teamHtml),
      idempotencyKey: `team-${row.id}`,
    });
    teamMessageId = result.id;
    teamError = result.error;
    if (teamError) {
      console.error("team_notify_failed", { id: row.id, message: teamError });
    }
  }

  const userResult = await resendSend({
    from: RESEND_FROM,
    to: row.email,
    reply_to: RESEND_REPLY_TO,
    subject: userSubject,
    html: userHtml,
    text: htmlToText(userHtml),
    idempotencyKey: `user-${row.id}`,
  });
  const userMessageId = userResult.id;
  const userError = userResult.error;
  if (userError) {
    console.error("user_welcome_failed", {
      id: row.id,
      email: row.email,
      message: userError,
    });
  }

  if (userMessageId || teamMessageId) {
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        email_sent_at: new Date().toISOString(),
        email_message_id: userMessageId ?? teamMessageId ?? null,
      })
      .eq("id", row.id)
      .is("email_sent_at", null);

    if (updateError) {
      console.error("update_failed", { id: row.id, err: updateError.message });
    }
  }

  if (!userMessageId && !teamMessageId) {
    return json(502, { error: "all_sends_failed", userError, teamError });
  }

  return json(200, {
    sent: true,
    userMessageId,
    teamMessageId,
    userError,
    teamError,
  });
});
