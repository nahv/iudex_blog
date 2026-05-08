// Composer — pagina principal del admin panel para mandar emails.
//
// Estado en memoria:
//   - state.template: key del template seleccionado
//   - state.subject, state.recipients, state.audienceId
//   - state.vars: { [varName]: value } para los slots del template
//   - state.bodyHtml: para ad-hoc (HTML libre)
//   - state.currentDraftId: si esta editando un draft existente
//
// Flujo de render del preview:
//   - Si template tiene path: fetch el .html, render con state.vars
//   - Si ad-hoc: usar state.bodyHtml directamente
//   - Cualquier cambio en form -> debounced render (200ms)

import { requireAuth, signOut } from './auth.js';
import { configMissing } from './supabase.js';
import { wireBurger } from './nav.js';
import {
  sendCustomEmail,
  listAudiences,
  listDrafts,
  createDraft,
  updateDraft,
  deleteDraft,
} from './api.js';
import { TEMPLATES, detectVars, renderTemplate, loadTemplate } from './templates.js';

// ============================================================================
// State
// ============================================================================
const state = {
  email: null,
  template: 'beta-invite',
  subject: '',
  recipientMode: 'direct', // 'direct' | 'audience'
  recipientsRaw: '',       // textarea raw input
  audienceId: '',
  audienceName: '',
  audiences: [],
  vars: {},
  bodyHtml: '',
  currentDraftId: null,
  drafts: [],
  templateRawCache: {},     // key -> raw html
  isSending: false,
};

// ============================================================================
// DOM helpers
// ============================================================================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseRecipientsRaw(raw) {
  if (!raw) return [];
  return raw
    .split(/[,\s\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

// ============================================================================
// Toasts
// ============================================================================
function toast(msg, kind = 'info', ms = 4000) {
  const container = $('#toasts') || (() => {
    const c = document.createElement('div');
    c.id = 'toasts';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// ============================================================================
// Render functions
// ============================================================================

/** Renderiza el panel de Variables segun el template seleccionado. */
async function renderVarsPanel() {
  const panel = $('#vars-panel');
  panel.innerHTML = '';

  const tpl = TEMPLATES.find((t) => t.key === state.template);
  if (!tpl) return;

  // Para ad-hoc no hay vars panel — el cuerpo se edita en otra textarea.
  if (state.template === 'ad-hoc') {
    panel.innerHTML = '<p class="vars-block__empty">Escribi tu HTML directamente en el campo "Body HTML" debajo.</p>';
    return;
  }

  // Cargar el template HTML y detectar vars.
  let rawHtml;
  try {
    rawHtml = await loadTemplate(state.template);
    state.templateRawCache[state.template] = rawHtml;
  } catch (e) {
    panel.innerHTML = `<p class="vars-block__empty" style="color:#c0392b">Error cargando template: ${escapeHtml(e.message)}</p>`;
    return;
  }
  const detected = detectVars(rawHtml);

  if (detected.length === 0) {
    panel.innerHTML = '<p class="vars-block__empty">Este template no tiene variables.</p>';
    return;
  }

  for (const varName of detected) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.style.marginBottom = '8px';
    const isMultiline = varName === 'body_html' || varName === 'mensaje';
    wrap.innerHTML = `
      <label class="field-label">{{${escapeHtml(varName)}}}</label>
      ${isMultiline
        ? `<textarea class="textarea" data-var="${escapeHtml(varName)}" rows="6" placeholder="(opcional)">${escapeHtml(state.vars[varName] || '')}</textarea>`
        : `<input class="input" data-var="${escapeHtml(varName)}" placeholder="(opcional)" value="${escapeHtml(state.vars[varName] || '')}" />`}
    `;
    panel.appendChild(wrap);
  }
  panel.querySelectorAll('[data-var]').forEach((el) => {
    el.addEventListener('input', (e) => {
      state.vars[e.target.dataset.var] = e.target.value;
      schedulePreview();
    });
  });
}

/** Render del preview en iframe. Debounced. */
let previewTimer = null;
function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 180);
}

async function renderPreview() {
  const iframe = $('#preview-iframe');
  let html;
  try {
    html = await getRenderedHtml();
  } catch (e) {
    html = `<pre style="padding:24px;color:#c0392b;font-family:monospace;">${escapeHtml(e.message)}</pre>`;
  }
  iframe.srcdoc = html;
}

/** Devuelve el HTML final (con vars resueltas) listo para mandar a Resend. */
async function getRenderedHtml() {
  const tpl = TEMPLATES.find((t) => t.key === state.template);
  if (!tpl) return '';

  if (state.template === 'ad-hoc') {
    return state.bodyHtml || '<p style="padding:24px;color:#888;font-family:sans-serif">(escribi HTML en el editor)</p>';
  }

  let rawHtml = state.templateRawCache[state.template];
  if (!rawHtml) {
    rawHtml = await loadTemplate(state.template);
    state.templateRawCache[state.template] = rawHtml;
  }
  return renderTemplate(rawHtml, state.vars);
}

/** Lista de drafts. */
async function renderDrafts() {
  const container = $('#drafts-list');
  try {
    state.drafts = await listDrafts(state.email);
  } catch (e) {
    container.innerHTML = `<p style="color:#c0392b">Error cargando drafts: ${escapeHtml(e.message)}</p>`;
    return;
  }
  if (state.drafts.length === 0) {
    container.innerHTML = '<p style="color:#888;padding:8px 16px;font-size:14px;">Sin drafts. <kbd>⌘S</kbd> guarda el actual.</p>';
    return;
  }
  container.innerHTML = state.drafts.map((d) => `
    <div class="draft-row">
      <div class="draft-row__title">${escapeHtml(d.title || '(sin titulo)')}</div>
      <div class="draft-row__meta">${timeAgo(d.updated_at)} ${state.currentDraftId === d.id ? '· editando' : ''}</div>
      <div class="draft-row__actions">
        <button class="btn btn--ghost btn--sm" data-action="load" data-id="${d.id}">Abrir</button>
        <button class="btn btn--ghost btn--sm" data-action="delete" data-id="${d.id}">Borrar</button>
      </div>
    </div>
  `).join('');
  container.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'load') loadDraftIntoComposer(id);
      else if (action === 'delete') deleteDraftAndRefresh(id);
    });
  });
}

async function deleteDraftAndRefresh(id) {
  if (!confirm('¿Borrar este draft?')) return;
  try {
    await deleteDraft(id);
    if (state.currentDraftId === id) state.currentDraftId = null;
    toast('Draft borrado', 'success');
    await renderDrafts();
  } catch (e) {
    toast(`Error: ${e.message}`, 'error');
  }
}

function loadDraftIntoComposer(id) {
  const d = state.drafts.find((x) => x.id === id);
  if (!d) return;
  state.template = d.template || 'beta-invite';
  state.subject = d.subject || '';
  state.audienceId = d.audience_id || '';
  state.recipientsRaw = (d.recipients || []).join(', ');
  state.recipientMode = d.audience_id ? 'audience' : 'direct';
  state.vars = d.variables || {};
  state.bodyHtml = d.body_html || '';
  state.currentDraftId = d.id;
  syncDOM();
  toast(`Draft "${d.title || 'sin titulo'}" cargado`, 'success');
}

// ============================================================================
// Send flow
// ============================================================================

async function doSend(testMode) {
  if (state.isSending) return;
  const tpl = TEMPLATES.find((t) => t.key === state.template);

  // Validate
  const subject = state.subject.trim();
  if (!subject) return toast('Falta el asunto', 'error');

  if (state.template === 'ad-hoc' && !state.bodyHtml.trim()) {
    return toast('Escribi el cuerpo HTML para ad-hoc', 'error');
  }

  let html;
  try {
    html = await getRenderedHtml();
  } catch (e) {
    return toast(`Error renderizando: ${e.message}`, 'error');
  }

  // Recipients
  let recipients = [];
  let audienceId = null;
  let audienceName = null;
  if (state.recipientMode === 'audience') {
    if (!state.audienceId) return toast('Elegi una audience', 'error');
    audienceId = state.audienceId;
    audienceName = state.audienceName;
  } else {
    recipients = parseRecipientsRaw(state.recipientsRaw);
    if (recipients.length === 0) {
      return toast('Agrega al menos un email valido', 'error');
    }
  }

  // Confirm en send no-test a >1 destinatario
  if (!testMode) {
    const totalDesc = audienceId
      ? `audience "${audienceName || audienceId}"`
      : `${recipients.length} destinatario(s)`;
    if (!confirm(`Mandar este email a ${totalDesc}?\n\nAsunto: "${subject}"\n\nEsta accion no se puede deshacer.`)) return;
  }

  state.isSending = true;
  setLoading(true, testMode ? 'Mandando test...' : 'Enviando...');

  try {
    const res = await sendCustomEmail({
      template: state.template,
      subject,
      html,
      recipients: recipients.length ? recipients : undefined,
      audience_id: audienceId || undefined,
      audience_name: audienceName || undefined,
      variables: state.vars,
      test_mode: !!testMode,
    });
    toast(
      testMode
        ? `Test enviado a vos (${state.email}). Revisa tu inbox.`
        : `Enviado a ${res.recipient_count || recipients.length} destinatario(s).`,
      'success',
      6000,
    );
    if (res.partial_errors?.length) {
      toast(`Atencion: ${res.partial_errors.length} envios fallaron. Ver History.`, 'error', 8000);
    }
  } catch (e) {
    console.error('send_failed', e);
    const detail = e.data?.message || e.message || 'Error desconocido';
    toast(`Error: ${detail}`, 'error', 6000);
  } finally {
    state.isSending = false;
    setLoading(false);
  }
}

function setLoading(on, msg) {
  $('#btn-send').disabled = on;
  $('#btn-test').disabled = on;
  $('#btn-save-draft').disabled = on;
  if (on && msg) {
    $('#btn-send').textContent = msg;
  } else {
    $('#btn-send').textContent = '📩 Enviar';
  }
}

// ============================================================================
// Drafts save
// ============================================================================
async function saveCurrentDraft() {
  const subject = state.subject.trim();
  const title =
    subject ||
    `Draft ${new Date().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })}`;
  const draftPayload = {
    title,
    template: state.template,
    subject,
    recipients: parseRecipientsRaw(state.recipientsRaw),
    audience_id: state.audienceId || null,
    variables: state.vars,
    body_html: state.bodyHtml || null,
  };
  try {
    if (state.currentDraftId) {
      await updateDraft(state.currentDraftId, draftPayload);
      toast('Draft actualizado', 'success');
    } else {
      const created = await createDraft(draftPayload, state.email);
      state.currentDraftId = created.id;
      toast('Draft guardado', 'success');
    }
    await renderDrafts();
  } catch (e) {
    toast(`Error guardando draft: ${e.message}`, 'error');
  }
}

// ============================================================================
// DOM sync (state -> UI)
// ============================================================================
function syncDOM() {
  $('#template-select').value = state.template;
  $('#subject-input').value = state.subject;
  $('#recipient-mode-direct').checked = state.recipientMode === 'direct';
  $('#recipient-mode-audience').checked = state.recipientMode === 'audience';
  $('#recipients-textarea').value = state.recipientsRaw;
  $('#audience-select').value = state.audienceId;
  $('#body-html-textarea').value = state.bodyHtml;
  toggleRecipientMode();
  toggleAdHocMode();
  renderVarsPanel().then(() => schedulePreview());
}

function toggleRecipientMode() {
  $('#recipients-direct-wrap').style.display =
    state.recipientMode === 'direct' ? 'block' : 'none';
  $('#recipients-audience-wrap').style.display =
    state.recipientMode === 'audience' ? 'block' : 'none';
}

function toggleAdHocMode() {
  $('#body-html-wrap').style.display =
    state.template === 'ad-hoc' ? 'block' : 'none';
}

// ============================================================================
// Init
// ============================================================================
async function init() {
  wireBurger();

  if (configMissing) {
    document.getElementById('config-banner').style.display = 'block';
    document.querySelectorAll('input,select,textarea,button').forEach((el) => {
      if (el.id !== 'btn-logout' && el.id !== 'btn-burger') el.disabled = true;
    });
    document.getElementById('current-email').textContent = '(config faltante)';
    return;
  }

  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return; // already redirected
  }
  state.email = auth.email;
  $('#current-email').textContent = state.email;

  // Populate template select
  const sel = $('#template-select');
  sel.innerHTML = TEMPLATES.map((t) =>
    `<option value="${t.key}">${escapeHtml(t.name)}</option>`
  ).join('');

  // Populate audiences
  try {
    const resp = await listAudiences();
    state.audiences = resp.audiences || [];
    const aSel = $('#audience-select');
    aSel.innerHTML =
      '<option value="">— Elegir audience —</option>' +
      state.audiences.map((a) =>
        `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)} (${a.contact_count ?? '?'} contactos)</option>`
      ).join('');
  } catch (e) {
    console.warn('No se pudieron cargar audiences:', e.message);
    $('#audience-select').innerHTML =
      `<option value="">(error cargando: ${escapeHtml(e.message)})</option>`;
  }

  // Bind events
  sel.addEventListener('change', (e) => {
    state.template = e.target.value;
    state.vars = {};
    const tpl = TEMPLATES.find((t) => t.key === state.template);
    if (tpl?.suggestedSubject && !state.subject) {
      state.subject = tpl.suggestedSubject;
      $('#subject-input').value = state.subject;
    }
    toggleAdHocMode();
    renderVarsPanel().then(() => schedulePreview());
  });

  $('#subject-input').addEventListener('input', (e) => {
    state.subject = e.target.value;
  });

  $$('input[name=recipient-mode]').forEach((r) => {
    r.addEventListener('change', () => {
      state.recipientMode = r.checked ? r.value : state.recipientMode;
      toggleRecipientMode();
    });
  });

  $('#recipients-textarea').addEventListener('input', (e) => {
    state.recipientsRaw = e.target.value;
  });

  $('#audience-select').addEventListener('change', (e) => {
    state.audienceId = e.target.value;
    const a = state.audiences.find((x) => x.id === e.target.value);
    state.audienceName = a?.name || '';
  });

  $('#body-html-textarea').addEventListener('input', (e) => {
    state.bodyHtml = e.target.value;
    schedulePreview();
  });

  $('#btn-send').addEventListener('click', () => doSend(false));
  $('#btn-test').addEventListener('click', () => doSend(true));
  $('#btn-save-draft').addEventListener('click', saveCurrentDraft);
  $('#btn-new').addEventListener('click', () => {
    if (state.subject || state.recipientsRaw) {
      if (!confirm('Descartar el contenido actual?')) return;
    }
    state.template = 'beta-invite';
    state.subject = '';
    state.recipientsRaw = '';
    state.audienceId = '';
    state.recipientMode = 'direct';
    state.vars = {};
    state.bodyHtml = '';
    state.currentDraftId = null;
    syncDOM();
  });

  $('#btn-logout').addEventListener('click', () => signOut('/admin/'));

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (!isMeta) return;
    if (e.key === 'Enter') { e.preventDefault(); doSend(false); }
    else if (e.key === 's') { e.preventDefault(); saveCurrentDraft(); }
    else if (e.key.toLowerCase() === 't') { e.preventDefault(); doSend(true); }
  });

  // Initial setup
  const initialTpl = TEMPLATES.find((t) => t.key === state.template);
  state.subject = initialTpl?.suggestedSubject || '';
  syncDOM();
  await renderDrafts();
}

init();
