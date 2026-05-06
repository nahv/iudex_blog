// Registry de templates disponibles en el composer.
// Cada template apunta a un .html en /emails/ que se fetchea on-demand.
// El frontend hace render con substituciones de Mustache (solo {{var}} por ahora).

export const TEMPLATES = [
  {
    key: 'beta-invite',
    name: 'Beta invite',
    description: 'Invitacion a un beta tester con link de descarga (Drive). 1-a-1, sin footer de unsub.',
    path: '/emails/beta-invite.html',
    suggestedSubject: '{{nombre}}, ya podés descargar Iudex',
    knownVars: ['nombre', 'drive_link'],
  },
  {
    key: 'blank-iudex',
    name: 'Blank con estetica Iudex',
    description: 'Layout de Iudex con un slot libre. Para anuncios, comunicados, mensajes ad-hoc.',
    path: '/emails/blank-iudex.html',
    suggestedSubject: '',
    knownVars: ['heading', 'body_html', 'cta_label', 'cta_url'],
  },
  {
    key: 'ad-hoc',
    name: 'Ad-hoc (HTML libre)',
    description: 'Escribi HTML directo, sin layout. Para usuarios avanzados / templates externos.',
    path: null, // ad-hoc no tiene template fuente; el body lo escribe el user.
    suggestedSubject: '',
    knownVars: [],
  },
];

/**
 * Detecta variables {{var}} en un string de HTML.
 * Devuelve un array de nombres unicos en orden de aparicion.
 */
export function detectVars(html) {
  if (!html) return [];
  const re = /\{\{(\w+)\}\}/g;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

/**
 * Renderiza un template con vars (Mustache-mini: {{var}}).
 * Soporta tambien {{#var}}...{{/var}} y {{^var}}...{{/var}} para parity con
 * el renderer de las Edge Functions, aunque el composer no expone estos
 * bloques al user (solo flat vars).
 */
export function renderTemplate(html, vars) {
  if (!html) return '';
  let out = html.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_m, key, body) => (vars[key] ? body : '')
  );
  out = out.replace(
    /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_m, key, body) => (vars[key] ? '' : body)
  );
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key) => vars[key] ?? '');
  return out;
}

/**
 * Fetch del HTML de un template desde el sitio publico.
 * Cache simple en memoria.
 */
const cache = new Map();
export async function loadTemplate(key) {
  const tpl = TEMPLATES.find((t) => t.key === key);
  if (!tpl || !tpl.path) return null;
  if (cache.has(key)) return cache.get(key);
  const res = await fetch(tpl.path);
  if (!res.ok) throw new Error(`No se pudo cargar template "${key}": HTTP ${res.status}`);
  const html = await res.text();
  cache.set(key, html);
  return html;
}
