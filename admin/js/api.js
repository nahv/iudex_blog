// Wrapper para llamar Edge Functions del admin con el JWT del usuario.

import { supabase } from './supabase.js';
import { getSession } from './auth.js';

const cfg = window.ENV?.supabase || {};
const FUNCTIONS_BASE = (cfg.url || '').replace(
  /\.supabase\.co$/,
  '.supabase.co/functions/v1',
) || '';

async function authedFetch(path, init = {}) {
  const session = await getSession();
  if (!session) throw new Error('No session');

  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  const res = await fetch(`${FUNCTIONS_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Manda un email custom (template o ad-hoc).
 *
 * @param {Object} payload
 * @param {string} payload.template      - 'beta-invite' | 'blank-iudex' | 'ad-hoc' | etc
 * @param {string} payload.subject       - asunto
 * @param {string} payload.html          - HTML final ya renderizado
 * @param {string[]=} payload.recipients - emails directos (para 1-a-1)
 * @param {string=} payload.audience_id  - id de Resend audience (alternativo)
 * @param {string=} payload.audience_name- nombre cacheado para audit
 * @param {Object=} payload.variables    - vars usadas (audit)
 * @param {boolean=} payload.test_mode   - si true: manda solo al user auth con [TEST]
 */
export async function sendCustomEmail(payload) {
  return authedFetch('/send-custom-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Lista las audiencias de Resend con conteo de contactos activos.
 */
export async function listAudiences() {
  return authedFetch('/list-audiences', { method: 'GET' });
}

// ===== Drafts (CRUD via Supabase REST con RLS por owner = email) =====

export async function listDrafts(email) {
  const { data, error } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('owner', email)
    .order('updated_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function createDraft(draft, email) {
  const { data, error } = await supabase
    .from('email_drafts')
    .insert({ ...draft, owner: email })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDraft(id, patch) {
  const { data, error } = await supabase
    .from('email_drafts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDraft(id) {
  const { error } = await supabase.from('email_drafts').delete().eq('id', id);
  if (error) throw error;
}

// ===== History (lectura de sent_emails) =====

export async function listSentEmails(limit = 30) {
  const { data, error } = await supabase
    .from('sent_emails')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getSentEmail(id) {
  const { data, error } = await supabase
    .from('sent_emails')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
