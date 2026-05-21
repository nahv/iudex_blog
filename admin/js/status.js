// status.js — health-check polling para el dashboard.
//
// Cuatro servicios: prod (api, nexus) + staging (staging.api, staging.nexus).
// Cada check intenta primero con CORS (para parsear el body si está bien
// configurado) y si falla, hace fallback a `mode: 'no-cors'` para detectar
// reachability. Cuando un deploy arregle CORS, los detalles completos
// aparecen automáticamente sin cambiar nada acá.
//
// Polling cada 30 s. Botón "Refrescar" hace check inmediato.

const ENDPOINTS = {
  api: {
    url: 'https://api.iudex.com.ar/health',
    pillEl: '#status-pill-api',
    latencyEl: '#status-latency-api',
    detailEl: '#status-detail-api',
  },
  nexus: {
    url: 'https://nexus.iudex.com.ar/health',
    pillEl: '#status-pill-nexus',
    latencyEl: '#status-latency-nexus',
    detailEl: '#status-detail-nexus',
  },
  stagingApi: {
    url: 'https://staging.api.iudex.com.ar/health',
    pillEl: '#status-pill-staging-api',
    latencyEl: '#status-latency-staging-api',
    detailEl: '#status-detail-staging-api',
  },
  stagingNexus: {
    url: 'https://staging.nexus.iudex.com.ar/health',
    pillEl: '#status-pill-staging-nexus',
    latencyEl: '#status-latency-staging-nexus',
    detailEl: '#status-detail-staging-nexus',
  },
};

const POLL_INTERVAL_MS = 30_000;
const TIMEOUT_MS = 8_000;

let pollTimer = null;

function $(sel) { return document.querySelector(sel); }

function setPill(el, kind, label) {
  if (!el) return;
  el.className = `status-pill status-pill--${kind}`;
  el.innerHTML = `<span class="status-dot"></span> ${label}`;
}

function fmtLatency(ms) {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function fmtTime(date) {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function checkCorsAware(url) {
  // Para nexus (CORS=*): fetch normal, parsea JSON.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    const latency = performance.now() - t0;
    if (!res.ok) {
      return { ok: false, latency, error: `HTTP ${res.status}` };
    }
    const body = await res.json().catch(() => null);
    return { ok: true, latency, body };
  } catch (e) {
    const latency = performance.now() - t0;
    return { ok: false, latency, error: e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

async function checkNoCors(url) {
  // Para api (CORS bloqueado): mode: 'no-cors' resuelve con opaque
  // response si el server respondió cualquier cosa, rechaza si network falla.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = performance.now();
  try {
    await fetch(url, { signal: ctrl.signal, mode: 'no-cors', cache: 'no-store' });
    const latency = performance.now() - t0;
    return { ok: true, latency, body: null };
  } catch (e) {
    const latency = performance.now() - t0;
    return { ok: false, latency, error: e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

function renderResult(key, result) {
  const cfg = ENDPOINTS[key];
  const pill = $(cfg.pillEl);
  const latencyEl = $(cfg.latencyEl);
  const detailEl = $(cfg.detailEl);

  if (latencyEl) latencyEl.textContent = fmtLatency(result.latency);

  if (!result.ok) {
    setPill(pill, 'down', result.error === 'timeout' ? 'Timeout' : 'Caído');
    if (detailEl) detailEl.textContent = result.error === 'timeout'
      ? 'No respondió en 8 s.'
      : 'No se pudo conectar.';
    return;
  }

  // Reachable. Si tenemos body, mostramos detalle.
  if (result.body) {
    const b = result.body;
    // nexus: { status, timestamp, agent_loaded }
    if (b.agent_loaded !== undefined) {
      const allOk = b.status === 'healthy' && b.agent_loaded === true;
      setPill(pill, allOk ? 'up' : 'degraded', allOk ? 'Operativo' : 'Degradado');
      if (detailEl) detailEl.textContent = b.agent_loaded
        ? `Agent cargado · ${b.status}`
        : `Agent NO cargado · ${b.status}`;
      return;
    }
    // api: { status, db, redis, version }
    if (b.db !== undefined || b.redis !== undefined) {
      const allOk = b.status === 'ok' && b.db === 'ok' && b.redis === 'ok';
      setPill(pill, allOk ? 'up' : 'degraded', allOk ? 'Operativo' : 'Degradado');
      if (detailEl) detailEl.textContent = `db: ${b.db} · redis: ${b.redis} · v${b.version || '?'}`;
      return;
    }
  }

  // No body parseable (opaque response del no-cors). Asumimos up sin detalle.
  setPill(pill, 'up', 'Operativo');
  if (detailEl) detailEl.textContent = 'Reachable (CORS limita el body — ver footnote).';
}

function setUpdated() {
  const el = $('#status-updated');
  if (el) el.textContent = `Actualizado ${fmtTime(new Date())}`;
}

async function checkWithFallback(url) {
  // Try CORS-aware first to get the body. If it fails (CORS misconfigured
  // or genuinely unreachable), fall back to no-cors to disambiguate.
  const corsResult = await checkCorsAware(url);
  if (corsResult.ok) return corsResult;
  // Could be CORS-blocked OR network. no-cors will succeed if reachable.
  const noCorsResult = await checkNoCors(url);
  if (noCorsResult.ok) {
    return { ok: true, latency: noCorsResult.latency, body: null };
  }
  // Both failed — server is genuinely unreachable.
  return corsResult;
}

async function runChecks() {
  const keys = Object.keys(ENDPOINTS);
  const results = await Promise.all(
    keys.map((k) => checkWithFallback(ENDPOINTS[k].url))
  );
  keys.forEach((k, i) => renderResult(k, results[i]));
  setUpdated();
}

export function startStatusPolling() {
  runChecks();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(runChecks, POLL_INTERVAL_MS);
}

export function refreshStatusNow() {
  // Reset pills a loading antes del check para feedback visual inmediato.
  Object.keys(ENDPOINTS).forEach((k) => {
    setPill($(ENDPOINTS[k].pillEl), 'loading', 'Checando…');
    const lat = $(ENDPOINTS[k].latencyEl);
    if (lat) lat.textContent = '—';
  });
  runChecks();
}

export function stopStatusPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
