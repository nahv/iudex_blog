// Supabase client singleton para el admin panel.
// Usa SUPABASE_URL + SUPABASE_ANON_KEY de window.ENV (inyectado por
// .github/workflows/deploy.yml en public/js/env.js).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cfg = (typeof window !== 'undefined' && window.ENV?.supabase) || {};
if (!cfg.url || !cfg.anonKey) {
  console.error(
    '[admin] Supabase config missing. Asegurate de que public/js/env.js esta cargado.'
  );
}

export const supabase = createClient(
  cfg.url || 'https://invalid.supabase.co',
  cfg.anonKey || 'invalid-key',
  { auth: { persistSession: true, autoRefreshToken: true } }
);
