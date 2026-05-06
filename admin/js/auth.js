// Auth helpers para el admin panel.

import { supabase, configMissing } from './supabase.js';
import { isAllowedEmail } from './config.js';

function ensureSupabase() {
  if (configMissing || !supabase) {
    throw new Error(
      'config_missing: copiá public/js/env.example.js a public/js/env.js y completá los valores.'
    );
  }
}

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
  try {
    ensureSupabase();
  } catch (e) {
    return { error: e.message };
  }
  const redirectTo =
    window.location.origin + (redirectPath || '/admin/emails/');

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: redirectTo,
      // Importante: false porque tenemos signups deshabilitados a nivel
      // de proyecto (Auth → Settings → "Allow new users to sign up" = OFF).
      // Los users del admin se crean manualmente en Dashboard. Si esto
      // fuese true, signInWithOtp intenta signup primero y devuelve 422
      // "Signups not allowed for this instance".
      shouldCreateUser: false,
    },
  });
  if (error) {
    // Mensaje mas amigable para el caso comun (user no existe).
    if (
      error.message?.includes('Signups not allowed') ||
      error.message?.toLowerCase().includes('user not found') ||
      error.status === 422 ||
      error.status === 400
    ) {
      return {
        error:
          'No encontramos una cuenta con ese email. Pediles a un admin que te agregue manualmente en Supabase Auth.',
      };
    }
    return { error: error.message };
  }
  return { ok: true };
}

/**
 * Devuelve la sesion actual o null.
 */
export async function getSession() {
  if (configMissing || !supabase) return null;
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
  if (supabase) await supabase.auth.signOut();
  window.location.href = redirectPath || '/admin/';
}

/**
 * Garantiza sesion + email allowlisted. Si falta cualquiera, redirige al
 * login. Llamar al inicio de cada pagina autenticada.
 */
export async function requireAuth() {
  if (configMissing) {
    // No redirigimos — la pagina muestra el banner de config-missing.
    throw new Error('config_missing');
  }
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
