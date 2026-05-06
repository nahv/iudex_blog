// Supabase client del admin panel.
//
// Espera SUPABASE_URL + SUPABASE_ANON_KEY en window.ENV (inyectado por
// .github/workflows/deploy.yml en public/js/env.js). Para dev local hay
// que copiar public/js/env.example.js → public/js/env.js y completar.
//
// Si el config falta, exportamos `configMissing = true` y un cliente null.
// Las paginas del admin chequean este flag y muestran un banner con
// instrucciones — no intentamos llamar a Supabase con valores invalidos.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cfg = (typeof window !== 'undefined' && window.ENV?.supabase) || {};
const hasValidConfig =
  typeof cfg.url === 'string' &&
  cfg.url.startsWith('https://') &&
  !cfg.url.includes('YOUR_PROJECT') &&
  typeof cfg.anonKey === 'string' &&
  cfg.anonKey.length > 20 &&
  !cfg.anonKey.includes('YOUR_');

export const configMissing = !hasValidConfig;

export const supabase = hasValidConfig
  ? createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
