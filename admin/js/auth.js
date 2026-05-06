// Auth helpers para el admin panel.

import { supabase } from './supabase.js';
import { isAllowedEmail } from './config.js';

/**
 * Manda un magic link al email dado. Se rechaza client-side si el email no
 * esta en la allowlist (UX) — la proteccion real es server-side en la Edge
 * Function send-custom-email.
 */
export async function sendMagicLink(email, redirectPath) {
  const normalized = (email || '').trim().toLowerCase();
  if (!isAllowedEmail(normalized)) {
    return { error: 'Este email no esta autorizado para acceder al admin panel.' };
  }
  const redirectTo =
    window.location.origin + (redirectPath || '/admin/emails/');

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

/**
 * Devuelve la sesion actual o null.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session ?? null;
}

/**
 * Devuelve el email del user autenticado o null.
 */
export async function getCurrentEmail() {
  const session = await getSession();
  return session?.user?.email?.toLowerCase() ?? null;
}

/**
 * Cierra sesion y redirecciona al login.
 */
export async function signOut(redirectPath) {
  await supabase.auth.signOut();
  window.location.href = redirectPath || '/admin/';
}

/**
 * Garantiza sesion + email allowlisted. Si falta cualquiera, redirige al
 * login. Llamar al inicio de cada pagina autenticada.
 */
export async function requireAuth() {
  const session = await getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!session || !email) {
    window.location.href = '/admin/';
    throw new Error('redirect');
  }
  if (!isAllowedEmail(email)) {
    await signOut();
    throw new Error('not_allowed');
  }
  return { session, email };
}
