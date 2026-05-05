// notify-email-events
//
// Supabase Edge Function que recibe webhooks de Resend (eventos del lifecycle
// de los emails: sent, delivered, bounced, complained, etc.) y manda alertas
// al equipo cuando los eventos son criticos.
//
// Resend firma los webhooks con el formato Svix (ver https://docs.svix.com/).
// Esta funcion verifica la firma antes de procesar el payload.
//
// SETUP REQUERIDO (una vez):
//
// 1. En Resend Dashboard → Webhooks → Add Endpoint:
//    - URL: https://<project>.supabase.co/functions/v1/notify-email-events
//    - Eventos: marcar TODOS los que te interesan (recomendado: todos los que
//      empiezan con `email.`).
//    - Resend te muestra un "Signing secret" tipo `whsec_xxxxx`.
//
// 2. Set en Supabase Secrets:
//      supabase secrets set RESEND_WEBHOOK_SECRET=whsec_xxxxx
//      supabase secrets set EMAIL_EVENTS_NOTIFY_TO="maxi@gmail.com,nahuel@gmail.com"
//      # opcional: cuales eventos disparan alerta por mail (default abajo)
//      supabase secrets set EMAIL_EVENTS_ALERT_TYPES="email.bounced,email.complained,email.delivery_delayed"
//
// 3. (No requiere Database Webhook — Resend llama directo al endpoint.)
//
// EVENTOS DE RESEND
// -----------------
// Por defecto solo alertamos en eventos criticos:
//   - email.bounced              (destinatario invalido o rechazo del MTA)
//   - email.complained           (marcado como spam — danino para reputation)
//   - email.delivery_delayed     (rate-limit / problemas temporales)
//
// El resto (sent, delivered, opened, clicked) se logean a console pero no
// disparan alerta. Si queres alertas para todos, agrega los tipos al env var
// EMAIL_EVENTS_ALERT_TYPES.

const env = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

const RESEND_API_KEY = env("RESEND_API_KEY");
const RESEND_WEBHOOK_SECRET = env("RESEND_WEBHOOK_SECRET");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ??
  "Iudex <equipo@notificaciones.iudex.com.ar>";
const NOTIFY_TO = (Deno.env.get("EMAIL_EVENTS_NOTIFY_TO") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ALERT_TYPES = new Set(
  (Deno.env.get("EMAIL_EVENTS_ALERT_TYPES") ??
    "email.bounced,email.complained,email.delivery_delayed")
    .split(",").map((s) => s.trim()).filter(Boolean),
);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

// --- Svix signature verification ---
// Resend usa Svix para firmar webhooks. Formato del secret: `whsec_<base64>`.
// El header `svix-signature` viene como `v1,<sigB64> v1,<sigB64> ...` — uno o
// mas valores separados por espacio. Verificamos contra TODOS y aceptamos si
// alguno coincide. Tambien verificamos timestamp para evitar replay attacks.

async function verifySvixSignature(
  body: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Anti-replay: rechazar payloads de mas de 5 minutos.
  const ts = Number.parseInt(svixTimestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 5 * 60) return false;

  // El secret viene como `whsec_<base64>` — decodificamos la parte base64.
  const secretBytes = Uint8Array.from(
    atob(secret.replace(/^whsec_/, "")),
    (c) => c.charCodeAt(0),
  );

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const toSign = new TextEncoder().encode(`${svixId}.${svixTimestamp}.${body}`);
  const sigBytes = await crypto.subtle.sign("HMAC", key, toSign);
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  // svixSignature puede tener multiples valores: "v1,abc v1,def".
  const presented = svixSignature.split(" ")
    .map((p) => p.split(",")[1])
    .filter(Boolean);

  return presented.includes(expected);
}

// --- Tipos de Resend webhook payloads ---
// Schema parcial — solo los campos que usamos. Documentacion completa:
// https://resend.com/docs/dashboard/webhooks/introduction
type ResendEvent = {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string };
    click?: { link?: string; ipAddress?: string };
    [k: string]: unknown;
  };
};

// --- Email de alerta al equipo ---
function buildAlertHtml(event: ResendEvent): string {
  const severity = event.type === "email.complained"
    ? "Critico"
    : event.type === "email.bounced"
    ? "Alta"
    : "Media";
  const color = severity === "Critico"
    ? "#c0392b"
    : severity === "Alta"
    ? "#d4843e"
    : "#c9a84c";

  const to = event.data.to?.join(", ") ?? "—";
  const subject = event.data.subject ?? "—";
  const emailId = event.data.email_id ?? "—";
  const bounceInfo = event.data.bounce
    ? `${event.data.bounce.type ?? "?"} / ${event.data.bounce.subType ?? "?"} — ${event.data.bounce.message ?? ""}`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f7f4ee;font-family:'Helvetica Neue',Arial,sans-serif;color:#0f0f0e;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid rgba(15,15,14,0.06);overflow:hidden;">
    <div style="height:4px;background:${color};"></div>
    <div style="padding:24px;">
      <p style="margin:0 0 4px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:${color};font-weight:600;">Severidad: ${severity}</p>
      <h2 style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:20px;color:#0f0f0e;">${event.type}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 0;color:#5a5a56;width:120px;">Cuando</td><td style="padding:6px 0;">${event.created_at}</td></tr>
        <tr><td style="padding:6px 0;color:#5a5a56;">Destinatario</td><td style="padding:6px 0;">${to}</td></tr>
        <tr><td style="padding:6px 0;color:#5a5a56;">Asunto</td><td style="padding:6px 0;">${subject}</td></tr>
        <tr><td style="padding:6px 0;color:#5a5a56;">Email ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${emailId}</td></tr>
        ${bounceInfo ? `<tr><td style="padding:6px 0;color:#5a5a56;">Detalle</td><td style="padding:6px 0;">${bounceInfo}</td></tr>` : ""}
      </table>
      <p style="margin:24px 0 0 0;font-size:12px;color:#5a5a56;">Ver en <a href="https://resend.com/emails/${emailId}" style="color:#c9a84c;">Resend Dashboard</a>.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendAlert(event: ResendEvent): Promise<void> {
  if (NOTIFY_TO.length === 0) {
    console.warn("alert_skipped_no_recipients", { type: event.type });
    return;
  }

  const subject = `[${event.type}] ${event.data.subject ?? event.data.email_id ?? "evento"}`;
  const html = buildAlertHtml(event);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: NOTIFY_TO,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("alert_send_failed", { type: event.type, status: res.status, data });
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const body = await req.text();

  const valid = await verifySvixSignature(body, req.headers, RESEND_WEBHOOK_SECRET);
  if (!valid) {
    return json(401, { error: "invalid_signature" });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return json(400, { error: "invalid_json" });
  }

  // Logueamos siempre (queda en Supabase Edge Function logs).
  console.log("resend_event", {
    type: event.type,
    email_id: event.data?.email_id,
    to: event.data?.to,
    subject: event.data?.subject,
  });

  // Alertamos solo en eventos criticos (configurables via env var).
  if (ALERT_TYPES.has(event.type)) {
    await sendAlert(event);
  }

  return json(200, { received: true, alerted: ALERT_TYPES.has(event.type) });
});
