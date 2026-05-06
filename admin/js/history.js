// History — listado de los ultimos N envios manuales del admin panel.

import { requireAuth, signOut } from './auth.js';
import { configMissing } from './supabase.js';
import { listSentEmails, getSentEmail } from './api.js';

const $ = (s, r = document) => r.querySelector(s);

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function recipientsCell(row) {
  if (row.audience_name || row.audience_id) {
    return `<em>audience: ${escapeHtml(row.audience_name || row.audience_id)}</em><br><span style="color:#888;font-size:12px;">${row.recipients?.length || 0} destinatarios</span>`;
  }
  const r = row.recipients || [];
  if (r.length === 0) return '—';
  if (r.length === 1) return escapeHtml(r[0]);
  return `${escapeHtml(r[0])} <span style="color:#888;font-size:12px;">+${r.length - 1}</span>`;
}

function statusPill(row) {
  if (row.test_mode) {
    return '<span class="status-pill status-pill--test">test</span>';
  }
  if (row.status === 'sent') return '<span class="status-pill status-pill--sent">enviado</span>';
  if (row.status === 'failed') return '<span class="status-pill status-pill--failed">fallo</span>';
  return `<span class="status-pill">${escapeHtml(row.status)}</span>`;
}

async function showRowDetail(id) {
  try {
    const row = await getSentEmail(id);
    const dialog = $('#detail-dialog');
    $('#detail-subject').textContent = row.subject;
    $('#detail-meta').innerHTML = `
      <div><strong>Por:</strong> ${escapeHtml(row.sent_by)}</div>
      <div><strong>Cuando:</strong> ${formatDate(row.sent_at)}</div>
      <div><strong>Template:</strong> ${escapeHtml(row.template || '—')}</div>
      <div><strong>Estado:</strong> ${statusPill(row)}</div>
      <div><strong>Destinatarios:</strong> ${escapeHtml((row.recipients || []).join(', ')) || '—'}</div>
      ${row.audience_name ? `<div><strong>Audience:</strong> ${escapeHtml(row.audience_name)}</div>` : ''}
      ${row.resend_message_id ? `<div><strong>Resend ID:</strong> <code>${escapeHtml(row.resend_message_id)}</code> — <a href="https://resend.com/emails/${encodeURIComponent(row.resend_message_id)}" target="_blank">Ver en Resend</a></div>` : ''}
      ${row.error_message ? `<div style="color:#c0392b"><strong>Error:</strong> ${escapeHtml(row.error_message)}</div>` : ''}
    `;
    $('#detail-iframe').srcdoc = row.body_html || '<em>(sin html)</em>';
    dialog.showModal();
  } catch (e) {
    alert(`Error cargando detalle: ${e.message}`);
  }
}

async function init() {
  if (configMissing) {
    document.getElementById('config-banner').style.display = 'block';
    $('#current-email').textContent = '(config faltante)';
    $('#history-body').innerHTML = '';
    return;
  }

  let auth;
  try { auth = await requireAuth(); } catch { return; }
  $('#current-email').textContent = auth.email;
  $('#btn-logout').addEventListener('click', () => signOut('/admin/'));

  $('#detail-close').addEventListener('click', () => $('#detail-dialog').close());

  let rows;
  try {
    rows = await listSentEmails(50);
  } catch (e) {
    $('#history-body').innerHTML = `<tr><td colspan="5" style="color:#c0392b">Error: ${escapeHtml(e.message)}</td></tr>`;
    return;
  }
  if (rows.length === 0) {
    $('#history-body').innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <h3>Sin envios todavia</h3>
          <p>Cuando mandes el primer email desde <a href="/admin/emails/">el composer</a>, va a aparecer aca.</p>
        </div>
      </td></tr>
    `;
    return;
  }
  $('#history-body').innerHTML = rows.map((r) => `
    <tr data-id="${r.id}">
      <td class="col-when">${formatDate(r.sent_at)}<br><span style="font-size:11px;color:#aaa">${escapeHtml(r.sent_by)}</span></td>
      <td><strong>${escapeHtml(r.subject)}</strong><br><span style="font-size:12px;color:#888">${escapeHtml(r.template || '')}</span></td>
      <td>${recipientsCell(r)}</td>
      <td class="col-status">${statusPill(r)}</td>
      <td class="col-actions"><button class="btn btn--ghost btn--sm" data-id="${r.id}">Ver</button></td>
    </tr>
  `).join('');
  $('#history-body').querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => showRowDetail(btn.dataset.id));
  });
}

init();
