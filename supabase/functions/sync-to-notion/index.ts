// sync-to-notion
//
// Supabase Edge Function disparada por un Database Webhook sobre INSERT en
// public.registrations. Crea una pagina en una base de Notion con los datos
// del lead. Idempotente: chequea por "Lead ID" antes de crear, asi que
// reintentos del webhook no duplican la pagina.
//
// SETUP REQUERIDO (una vez):
//
// 1. Crear una integration en https://www.notion.so/my-integrations
//    - Tipo: "Internal"
//    - Capabilities: Read content, Update content, Insert content
//    - Copiar el "Internal Integration Secret" → NOTION_API_KEY
//
// 2. Crear una database en Notion con estas propiedades exactas (case-sensitive):
//
//    | Propiedad   | Tipo          | Notas                                |
//    |-------------|---------------|--------------------------------------|
//    | Nombre      | Title         | Propiedad principal (default)        |
//    | Apellido    | Rich text     |                                      |
//    | Email       | Email         |                                      |
//    | Telefono    | Phone number  |                                      |
//    | Provincia   | Select        | Iudex auto-crea options              |
//    | Perfil      | Select        |                                      |
//    | Fuero       | Select        |                                      |
//    | Tamano      | Select        |                                      |
//    | Mensaje     | Rich text     |                                      |
//    | Source      | Select        | landing / contacto / otro            |
//    | Lead ID     | Rich text     | Usado para dedup (NO cambiar nombre) |
//    | Created at  | Date          |                                      |
//    | Status      | Status        | Manual; default "Pendiente"          |
//
// 3. Conectar la integration a la database:
//    En la database → ⋯ menu → "Connections" → buscar tu integration → Confirm.
//
// 4. Copiar el ID de la database desde la URL:
//    https://notion.so/<workspace>/<DATABASE_ID>?v=...
//                                  ^^^^^^^^^^^^
//    Ese hex de 32 chars (con o sin guiones) → NOTION_DATABASE_ID
//
// 5. Set en Supabase Secrets:
//      supabase secrets set NOTION_API_KEY=secret_xxxxx
//      supabase secrets set NOTION_DATABASE_ID=xxxxxxxx
//
// 6. Configurar Database Webhook en Supabase:
//    Dashboard → Database → Webhooks → Create
//      Name:    sync-to-notion
//      Table:   public.registrations
//      Events:  INSERT
//      Type:    Supabase Edge Functions
//      Function: sync-to-notion
//      Headers: Authorization = Bearer <WEBHOOK_SECRET>  (mismo que send-inscription-email)

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
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: RegistrationRow;
  old_record: RegistrationRow | null;
};

const NOTION_VERSION = "2022-06-28";

const env = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

const NOTION_API_KEY = env("NOTION_API_KEY");
const NOTION_DATABASE_ID = env("NOTION_DATABASE_ID");
const WEBHOOK_SECRET = env("WEBHOOK_SECRET");

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

// Helpers para construir properties de Notion. Notion espera shapes especificos
// por tipo de propiedad — estos helpers encapsulan eso.
function richText(value: string | null | undefined) {
  if (!value) return { rich_text: [] };
  return { rich_text: [{ text: { content: value.slice(0, 2000) } }] };
}

function title(value: string | null | undefined) {
  return { title: [{ text: { content: (value ?? "").slice(0, 2000) } }] };
}

function email(value: string | null | undefined) {
  return { email: value ?? null };
}

function phone(value: string | null | undefined) {
  return { phone_number: value ?? null };
}

function select(value: string | null | undefined) {
  if (!value) return { select: null };
  // Notion auto-crea options nuevos. Truncamos a 100 chars (limite de Notion).
  return { select: { name: value.slice(0, 100) } };
}

function date(value: string | null | undefined) {
  if (!value) return { date: null };
  return { date: { start: value } };
}

async function notionFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Busca si ya existe una pagina con el mismo Lead ID (idempotencia).
// Retorna page id si existe, null si no.
async function findExistingPage(leadId: string): Promise<string | null> {
  const result = await notionFetch(
    `/databases/${NOTION_DATABASE_ID}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          property: "Lead ID",
          rich_text: { equals: leadId },
        },
        page_size: 1,
      }),
    },
  );

  if (!result.ok) {
    console.error("notion_query_failed", { status: result.status, data: result.data });
    return null;
  }

  const pages = result.data?.results ?? [];
  return pages[0]?.id ?? null;
}

async function createNotionPage(row: RegistrationRow): Promise<{ id?: string; error?: string }> {
  const fullName = [row.nombre, row.apellido].filter(Boolean).join(" ").trim() || row.email;

  const properties: Record<string, unknown> = {
    "Nombre": title(fullName),
    "Apellido": richText(row.apellido),
    "Email": email(row.email),
    "Telefono": phone(row.telefono),
    "Provincia": select(row.provincia),
    "Perfil": select(row.perfil),
    "Fuero": select(row.fuero),
    "Tamano": select(row.tamano),
    "Mensaje": richText(row.mensaje),
    "Source": select(row.source),
    "Lead ID": richText(row.id),
    "Created at": date(row.created_at),
  };

  const result = await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties,
    }),
  });

  if (!result.ok) {
    return {
      error: typeof result.data?.message === "string"
        ? result.data.message
        : `notion_http_${result.status}`,
    };
  }

  return { id: result.data?.id };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  // Mismo formato de auth que send-inscription-email: tolera "Bearer X" o "X" pelado.
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

  // Idempotencia: si ya existe una pagina con este Lead ID, no crear duplicado.
  const existingId = await findExistingPage(row.id);
  if (existingId) {
    return json(200, { skipped: "already_synced", page_id: existingId });
  }

  const result = await createNotionPage(row);
  if (result.error) {
    console.error("notion_create_failed", { id: row.id, message: result.error });
    return json(502, { error: "notion_create_failed", message: result.error });
  }

  return json(200, { synced: true, page_id: result.id });
});
