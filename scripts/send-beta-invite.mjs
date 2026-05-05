#!/usr/bin/env node
// scripts/send-beta-invite.mjs
//
// Manda un email de invitacion a la beta privada via Resend API (transaccional,
// sin footer de unsubscribe). Lee el template de emails/beta-invite.html y
// reemplaza {{nombre}} + {{drive_link}}.
//
// Requiere RESEND_API_KEY en el entorno. La forma recomendada es un .env en la
// raiz del repo (ya esta gitignored):
//
//     RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
//
// Uso (con .env):
//   node --env-file=.env scripts/send-beta-invite.mjs \
//     --to "alguien@example.com" \
//     --name "Maria" \
//     --link "https://drive.google.com/drive/folders/..."
//
// Uso (con env var inline):
//   RESEND_API_KEY=re_xxx node scripts/send-beta-invite.mjs --to ... --name ... --link ...
//
// Flags opcionales:
//   --from     override del FROM (default "Iudex <equipo@notificaciones.iudex.com.ar>")
//   --reply    override del Reply-To (default "contacto@iudex.com.ar")
//   --subject  override del subject (default "<name>, ya podes descargar Iudex")
//   --dry-run  imprime el payload pero no envia

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, "../emails/beta-invite.html");

const DEFAULTS = {
  from: "Iudex <equipo@notificaciones.iudex.com.ar>",
  reply: "contacto@iudex.com.ar",
};

function parseArgs(argv) {
  const args = { _flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args._flags.add(key);
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function render(template, vars) {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => vars[key] ?? "",
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "error: RESEND_API_KEY no esta definida.\n" +
        "agregala a un .env en la raiz del repo o pasala inline.",
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const missing = ["to", "name", "link"].filter((k) => !args[k]);
  if (missing.length) {
    console.error(`error: faltan flags: ${missing.map((m) => `--${m}`).join(", ")}`);
    console.error("uso: --to <email> --name <nombre> --link <drive_url>");
    process.exit(1);
  }

  const from = args.from ?? DEFAULTS.from;
  const replyTo = args.reply ?? DEFAULTS.reply;
  const subject = args.subject ?? `${args.name}, ya podés descargar Iudex`;
  const dryRun = args._flags.has("dry-run");

  const template = await readFile(TEMPLATE_PATH, "utf-8");
  const html = render(template, {
    nombre: escapeHtml(args.name),
    drive_link: escapeHtml(args.link),
  });

  const payload = {
    from,
    to: args.to,
    reply_to: replyTo,
    subject,
    html,
  };

  if (dryRun) {
    console.log("dry-run — no se envia. payload:");
    console.log(JSON.stringify({ ...payload, html: `[${html.length} chars]` }, null, 2));
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("envio fallo:", res.status, data);
    process.exit(1);
  }
  console.log("ok — message id:", data.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
