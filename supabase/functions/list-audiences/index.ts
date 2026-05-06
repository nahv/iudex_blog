// list-audiences
//
// Helper Edge Function para que el admin panel pueda popular el dropdown
// de audiencias sin exponer RESEND_API_KEY al frontend.
//
// Devuelve la lista de audiencias del workspace de Resend, con conteo de
// contactos no-unsubscribed por cada una.
//
// Auth: misma que send-custom-email — JWT del gateway + allowlist server-side.
//
// SETUP: ya cubierto por los secrets de send-custom-email (RESEND_API_KEY +
// ADMIN_ALLOWLIST). Marcar verify_jwt = true en supabase/config.toml.

const env = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

const RESEND_API_KEY = env("RESEND_API_KEY");
const ADMIN_ALLOWLIST = (Deno.env.get("ADMIN_ALLOWLIST") ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });

function extractEmailFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json(401, { error: "missing_bearer_token" });
  const userEmail = extractEmailFromJwt(auth.slice(7));
  if (!userEmail) return json(401, { error: "invalid_jwt_payload" });
  if (!ADMIN_ALLOWLIST.includes(userEmail)) return json(403, { error: "not_in_allowlist" });

  const res = await fetch("https://api.resend.com/audiences", {
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return json(502, {
      error: "resend_list_audiences_failed",
      message: data?.message ?? `http_${res.status}`,
    });
  }

  // Para cada audience, contar contactos no-unsubscribed (best-effort).
  const audiences = data?.data ?? [];
  const enriched = await Promise.all(
    audiences.map(async (a: { id: string; name: string }) => {
      try {
        const cRes = await fetch(
          `https://api.resend.com/audiences/${a.id}/contacts`,
          { headers: { "Authorization": `Bearer ${RESEND_API_KEY}` } },
        );
        const cData = await cRes.json();
        const contacts = cData?.data ?? [];
        const active = contacts.filter((c: { unsubscribed?: boolean }) =>
          !c.unsubscribed
        ).length;
        return { id: a.id, name: a.name, contact_count: active, total: contacts.length };
      } catch {
        return { id: a.id, name: a.name, contact_count: null, total: null };
      }
    }),
  );

  return json(200, { audiences: enriched });
});
