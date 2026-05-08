// Dashboard — landing del admin panel.
// Maneja auth, greeting, navbar mobile, y orquesta el polling de status.

import { requireAuth, signOut } from './auth.js';
import { configMissing } from './supabase.js';
import { startStatusPolling, refreshStatusNow } from './status.js';
import { wireBurger } from './nav.js';

const $ = (s, r = document) => r.querySelector(s);

function greeting(hour) {
  if (hour < 6) return 'Buenas noches';
  if (hour < 13) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function setGreeting(email) {
  const now = new Date();
  const name = (email || '').split('@')[0] || '';
  const display = name.charAt(0).toUpperCase() + name.slice(1);
  $('#greeting').textContent = `${greeting(now.getHours())}${display ? ', ' + display : ''}`;
  // toLocaleDateString returns lowercase weekday in es-AR ("jueves, 7 de mayo de 2026").
  // Capitalize only the first letter; keep "de" / "mayo" as-is.
  const date = now.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  $('#greeting-meta').textContent = date.charAt(0).toUpperCase() + date.slice(1);
}

async function init() {
  wireBurger();

  if (configMissing) {
    document.getElementById('config-banner').style.display = 'block';
    $('#current-email').textContent = '(config faltante)';
    setGreeting('');
    return;
  }

  let auth;
  try { auth = await requireAuth(); } catch { return; }
  $('#current-email').textContent = auth.email;
  setGreeting(auth.email);
  $('#btn-logout').addEventListener('click', () => signOut('/admin/'));

  // Status polling (no requiere auth — solo pings públicos a /health).
  startStatusPolling();
  $('#btn-refresh-status').addEventListener('click', () => {
    refreshStatusNow();
  });
}

init();
