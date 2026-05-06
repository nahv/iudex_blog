// Admin panel configuration.
// Allowlist en frontend es solo para UX (evita pedirle a Supabase un magic
// link para emails que no van a poder loguearse despues). La proteccion real
// esta en la Edge Function (server-side).
export const ADMIN_ALLOWLIST = [
  'nahuel@iudex.com.ar',
  'mbury@iudex.com.ar',
];

export function isAllowedEmail(email) {
  return ADMIN_ALLOWLIST.includes((email || '').trim().toLowerCase());
}
