// send-custom-email
//
// Edge Function llamada desde /admin/emails para enviar un email custom
// (template o ad-hoc) via Resend. Triple proteccion: JWT del gateway + JWT
// decode + allowlist de emails.
//
// Auth flow:
//   1. Frontend obtiene JWT de Supabase Auth (magic link a `<email>@iudex.com.ar`).
//   2. Frontend POST aca con `Authorization: Bearer <jwt>`.
//   3. Gateway de Supabase valida la firma del JWT (verify_jwt = true en config.toml).
//   4. Esta funcion decodea el payload, extrae `email`, lo lowercasea, y verifica
//      que este en `ADMIN_ALLOWLIST`. Si no -> 403.
//   5. Render + Resend.send + log a public.sent_emails.
//
// SETUP REQUERIDO:
//   - supabase secrets set ADMIN_ALLOWLIST="nahuel@iudex.com.ar,mbury@iudex.com.ar"
//   - Tabla public.sent_emails creada (ver migrations/20260506130000_admin_panel_tables.sql)
//   - En supabase/config.toml: [functions.send-custom-email] verify_jwt = true

import { createClient } from "npm:@supabase/supabase-js@2";

type SendBody = {
  template: string;                    // 'beta-invite' | 'blank-iudex' | 'ad-hoc' | nombre del template
  subject: string;
  recipients?: string[];               // emails directos (1-a-1 o multi)
  audience_id?: string;                // o audience de Resend (alternativo a recipients)
  audience_name?: string;              // para auditar en history
  variables?: Record<string, string>;  // vars que el frontend uso para renderizar (audit)
  html: string;                        // HTML final ya renderizado (frontend hizo la sustitucion)
  test_mode?: boolean;                 // si true: override recipients = [user_email] + prefix [TEST]
};

const env = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = env("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ??
  "Iudex <equipo@notificaciones.iudex.com.ar>";
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") ?? "contacto@iudex.com.ar";

// Allowlist de emails autorizados a usar el admin panel.
// Setear como secret: ADMIN_ALLOWLIST="nahuel@iudex.com.ar,mbury@iudex.com.ar"
const ADMIN_ALLOWLIST = (Deno.env.get("ADMIN_ALLOWLIST") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Decode JWT payload sin verificar firma (eso lo hace el gateway antes).
// Solo extraemos el `email` claim.
function extractEmailFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    // base64url -> base64
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(
      Math.ceil(parts[1].length / 4) * 4,
      "=",
    );
    const payload = JSON.parse(atob(b64));
    return typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

type ResendSendResult = { id?: string; error?: string };

async function resendSend(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  idempotencyKey?: string;
}): Promise<ResendSendResult> {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
    "User-Agent": "iudex-blog/send-custom-email",
  };
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: RESEND_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      reply_to: opts.reply_to ?? RESEND_REPLY_TO,
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

// Cuando se especifica audience_id, listamos los contactos via Resend API y
// mandamos transactional a cada uno. Limite practico ~50 (Resend permite mas
// pero sobre eso conviene Broadcasts).
async function listAudienceContacts(audienceId: string): Promise<string[]> {
  const res = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}` },
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : `audience_list_http_${res.status}`,
    );
  }
  const data = await res.json();
  return (data?.data ?? [])
    .filter((c: { unsubscribed?: boolean }) => !c.unsubscribed)
    .map((c: { email: string }) => c.email);
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // --- Auth ---
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json(401, { error: "missing_bearer_token" });
  const jwt = auth.slice(7);

  const userEmail = extractEmailFromJwt(jwt);
  if (!userEmail) return json(401, { error: "invalid_jwt_payload" });

  if (!ADMIN_ALLOWLIST.includes(userEmail)) {
    console.warn("admin_send_blocked_not_in_allowlist", { email: userEmail });
    return json(403, { error: "not_in_allowlist" });
  }

  // --- Parse + validate body ---
  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  if (!body.subject?.trim()) return json(400, { error: "missing_subject" });
  if (!body.html?.trim()) return json(400, { error: "missing_html" });
  if (!body.template?.trim()) return json(400, { error: "missing_template_key" });

  const hasRecipients = Array.isArray(body.recipients) && body.recipients.length > 0;
  const hasAudience = !!body.audience_id;
  if (!hasRecipients && !hasAudience) {
    return json(400, { error: "missing_recipients_or_audience" });
  }

  // --- Resolve recipients ---
  let recipients: string[] = [];
  let audienceName = body.audience_name ?? null;

  if (body.test_mode) {
    // Override: solo al usuario auth, prefix [TEST]
    recipients = [userEmail];
  } else if (hasAudience) {
    try {
      recipients = await listAudienceContacts(body.audience_id!);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("audience_fetch_failed", { audience_id: body.audience_id, msg });
      return json(502, { error: "audience_fetch_failed", message: msg });
    }
    if (recipients.length === 0) {
      return json(400, { error: "audience_empty_or_all_unsubscribed" });
    }
  } else {
    recipients = body.recipients!;
  }

  const subject = body.test_mode ? `[TEST] ${body.subject}` : body.subject;
  const text = htmlToText(body.html);

  // --- Send via Resend ---
  // Para 1-a-1: un solo Resend.send con `to` array (todos en mismo To).
  // Para audiencia: 1 envio por destinatario (cada uno con su propio To).
  // Diferencia: con audience cada contacto recibe un email "personal", no ve a los demas.
  let resendMessageId: string | undefined;
  let firstError: string | undefined;
  const sendResults: Array<{ email: string; id?: string; error?: string }> = [];

  if (hasAudience && !body.test_mode) {
    // Send 1-by-1 para audience
    for (const email of recipients) {
      const result = await resendSend({
        to: email,
        subject,
        html: body.html,
        text,
        idempotencyKey: `admin-audience-${body.audience_id}-${email}-${Date.now()}`,
      });
      sendResults.push({ email, ...result });
      if (result.error && !firstError) firstError = result.error;
      if (result.id && !resendMessageId) resendMessageId = result.id;
    }
  } else {
    // 1-a-1 multi-recipient: un solo send
    const result = await resendSend({
      to: recipients,
      subject,
      html: body.html,
      text,
      idempotencyKey: `admin-${userEmail}-${Date.now()}`,
    });
    sendResults.push({ email: recipients.join(","), ...result });
    if (result.error) firstError = result.error;
    resendMessageId = result.id;
  }

  // --- Audit log ---
  const status = firstError ? "failed" : "sent";
  const { error: insertError } = await supabaseAdmin
    .from("sent_emails")
    .insert({
      sent_by: userEmail,
      template: body.template,
      subject,
      recipients,
      audience_id: body.audience_id ?? null,
      audience_name: audienceName,
      resend_message_id: resendMessageId ?? null,
      variables: body.variables ?? null,
      body_html: body.html,
      status,
      error_message: firstError ?? null,
      test_mode: !!body.test_mode,
    });
  if (insertError) {
    console.error("audit_insert_failed", insertError.message);
    // No fallamos el response — el envio ya se hizo.
  }

  if (firstError && !resendMessageId) {
    return json(502, {
      error: "send_failed",
      message: firstError,
      results: sendResults,
    });
  }

  return json(200, {
    sent: true,
    message_id: resendMessageId,
    recipient_count: recipients.length,
    test_mode: !!body.test_mode,
    partial_errors: sendResults.filter((r) => r.error),
  });
});
