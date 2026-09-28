// notify-event-lead — aviso de un lead de evento (NEA Tech 2026).
//
// Disparo: Database Webhook sobre INSERT en public.event_leads, con header
// `Authorization: Bearer <WEBHOOK_SECRET>` (mismo secreto que las otras
// funciones). Idempotente por `notified_at`.
//
// Acción:
//   1. Mail al equipo (RESEND_TEAM_TO) con la ficha completa y un link
//      directo para responder (WhatsApp o mail según lo que dejó).
//   2. Si dejó un email: acuse corto a la persona («te escribimos en 48 h»).
//      Si dejó WhatsApp no se le manda nada automático: lo contactamos a mano.
//   3. UPDATE event_leads SET notified_at (o notify_error).
//
// Ver supabase/README.md, sección «Leads de eventos».

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type EventLead = {
  id: string;
  created_at?: string;
  evento: string;
  origen: string;
  industria: string;
  industria_otra: string | null;
  problemas: string[] | null;
  problema: string | null;
  tamano: string | null;
  nombre: string;
  organizacion: string | null;
  contacto_tipo: "whatsapp" | "email";
  contacto: string;
  notified_at: string | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: EventLead;
  old_record: EventLead | null;
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
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") ?? "contacto@iudex.com.ar";
const RESEND_TEAM_TO = Deno.env.get("RESEND_TEAM_TO") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Link para responder: wa.me con el número normalizado a +54, o mailto. */
function linkRespuesta(lead: EventLead): string {
  if (lead.contacto_tipo === "email") return `mailto:${lead.contacto}`;
  let n = lead.contacto.replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (!n.startsWith("54")) n = `54${n}`;
  return `https://wa.me/${n}`;
}

function fila(etiqueta: string, valor: string | null | undefined): string {
  const v = valor && valor.trim() ? esc(valor.trim()) : "—";
  return `<tr><td style="padding:6px 16px 6px 0;color:#5a5a56;font:12px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${etiqueta}</td><td style="padding:6px 0;color:#0f0f0e;font:15px/1.5 'DM Sans',Arial,sans-serif">${v}</td></tr>`;
}

function mailEquipo(lead: EventLead): { subject: string; html: string; text: string } {
  const industria = lead.industria_otra?.trim() || lead.industria;
  const problemas = (lead.problemas ?? []).join(" · ");
  const link = linkRespuesta(lead);
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f7f4ee;padding:32px 16px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #edeae2;border-radius:12px;padding:28px">
<div style="font:12px 'DM Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#8a6b1c">Iudex Labs · ${esc(lead.evento)} · ${esc(lead.origen)}</div>
<h1 style="font:500 24px/1.25 'DM Sans',Arial,sans-serif;color:#0f0f0e;margin:10px 0 4px">${esc(lead.nombre)}${lead.organizacion ? ` · ${esc(lead.organizacion)}` : ""}</h1>
<div style="height:1px;background:#c9a84c;margin:16px 0 12px"></div>
<table role="presentation" style="border-collapse:collapse">
${fila("Industria", industria)}
${fila("Equipo", lead.tamano)}
${fila("Quiere resolver", problemas)}
${fila("En sus palabras", lead.problema)}
${fila(lead.contacto_tipo === "whatsapp" ? "WhatsApp" : "Email", lead.contacto)}
</table>
<p style="margin:24px 0 0"><a href="${link}" style="display:inline-block;background:#0f0f0e;color:#f7f4ee;text-decoration:none;font:500 14px 'DM Sans',Arial,sans-serif;padding:11px 18px;border-radius:8px">Responder por ${lead.contacto_tipo === "whatsapp" ? "WhatsApp" : "mail"}</a></p>
<p style="font:12px/1.5 'DM Sans',Arial,sans-serif;color:#5a5a56;margin:18px 0 0">Prometimos respuesta en 48 h.</p>
</div></body></html>`;
  const text = [
    `Nuevo lead ${lead.evento} (${lead.origen})`,
    `${lead.nombre}${lead.organizacion ? ` · ${lead.organizacion}` : ""}`,
    `Industria: ${industria}`,
    `Equipo: ${lead.tamano ?? "—"}`,
    `Quiere resolver: ${problemas || "—"}`,
    `En sus palabras: ${lead.problema ?? "—"}`,
    `${lead.contacto_tipo}: ${lead.contacto}`,
    `Responder: ${link}`,
  ].join("\n");
  const subject = `Lead NEA Tech — ${lead.nombre}${lead.organizacion ? ` (${lead.organizacion})` : ""} · ${industria}`;
  return { subject, html, text };
}

function mailAcuse(lead: EventLead): { subject: string; html: string; text: string } {
  const nombre = lead.nombre.trim().split(/\s+/)[0];
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f7f4ee;padding:32px 16px">
<div style="max-width:520px;margin:0 auto;font:16px/1.6 'DM Sans',Arial,sans-serif;color:#2a2a28">
<p style="font:500 22px/1.3 'DM Sans',Arial,sans-serif;color:#0f0f0e;margin:0 0 14px">Gracias, ${esc(nombre)}.</p>
<p style="margin:0 0 12px">Recibimos lo que nos contaste en NEA Tech. Lo leemos con calma y te escribimos en las próximas 48 horas con una primera idea concreta.</p>
<p style="margin:0 0 12px">Si querés sumar algo, respondé este mail.</p>
<div style="height:1px;background:#c9a84c;width:48px;margin:22px 0"></div>
<p style="margin:0;font-size:14px;color:#5a5a56">Nahuel y Max<br>Iudex Labs · iudex.com.ar</p>
</div></body></html>`;
  const text = `Gracias, ${nombre}.\n\nRecibimos lo que nos contaste en NEA Tech. Lo leemos con calma y te escribimos en las próximas 48 horas con una primera idea concreta.\n\nSi querés sumar algo, respondé este mail.\n\nNahuel y Max\nIudex Labs · iudex.com.ar`;
  return { subject: "Recibimos tu consulta — Iudex Labs", html, text };
}

async function resendSend(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  idempotencyKey: string;
}): Promise<{ id?: string; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "iudex-blog/notify-event-lead",
      "Idempotency-Key": opts.idempotencyKey,
    },
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
    return { error: typeof data?.message === "string" ? data.message : `resend_http_${res.status}` };
  }
  return { id: data?.id };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const auth = req.headers.get("authorization") ?? "";
  const presented = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (presented !== WEBHOOK_SECRET) return json(401, { error: "unauthorized" });

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (payload.type !== "INSERT" || payload.table !== "event_leads") {
    return json(200, { skipped: "not_an_insert_on_event_leads" });
  }

  const lead = payload.record;
  if (!lead?.id || !lead.nombre || !lead.contacto) return json(400, { error: "invalid_record" });
  if (lead.notified_at) return json(200, { skipped: "already_notified" });

  const errores: string[] = [];
  const equipo = RESEND_TEAM_TO.split(",").map((s) => s.trim()).filter(Boolean);
  if (equipo.length) {
    const m = mailEquipo(lead);
    // Responder desde el mail del equipo le escribe directo al lead si dejó email.
    const r = await resendSend({
      to: equipo,
      ...m,
      reply_to: lead.contacto_tipo === "email" ? lead.contacto : undefined,
      idempotencyKey: `event-lead-team-${lead.id}`,
    });
    if (r.error) errores.push(`team: ${r.error}`);
  } else {
    errores.push("team: RESEND_TEAM_TO vacío");
  }

  if (lead.contacto_tipo === "email") {
    const r = await resendSend({
      to: lead.contacto,
      ...mailAcuse(lead),
      idempotencyKey: `event-lead-ack-${lead.id}`,
    });
    if (r.error) errores.push(`ack: ${r.error}`);
  }

  await supabase
    .from("event_leads")
    .update(errores.length ? { notify_error: errores.join(" | ") } : { notified_at: new Date().toISOString() })
    .eq("id", lead.id);

  return json(errores.length ? 207 : 200, { ok: errores.length === 0, errores });
});
