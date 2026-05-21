// status.js — health-check polling para el dashboard.
//
// 4 servicios: prod (api, nexus) + staging (staging.api, staging.nexus).
// Cada check intenta primero con CORS (para parsear el body si esta bien
// configurado) y si falla, hace fallback a `mode: 'no-cors'` para detectar
// reachability. Cuando un deploy arregle CORS, el detalle aparece solo.
//
// Despues de cada round, updatePulse() agrega los resultados y actualiza
// la "pulse strip" del top: contador de operativos / degradados / caidos.

const ENDPOINTS = {
  api: {
    url: 'https://api.iudex.com.ar/health',
    label: 'api',
    pillEl: '#status-pill-api',
    latencyEl: '#status-latency-api',
    detailEl: '#status-detail-api',
  },
  nexus: {
    url: 'https://nexus.iudex.com.ar/health',
    label: 'nexus',
    pillEl: '#status-pill-nexus',
    latencyEl: '#status-latency-nexus',
    detailEl: '#status-detail-nexus',
  },
  stagingApi: {
    url: 'https://staging.api.iudex.com.ar/health',
    label: 'staging.api',
    pillEl: '#status-pill-staging-api',
    latencyEl: '#status-latency-staging-api',
    detailEl: '#status-detail-staging-api',
  },
  stagingNexus: {
    url: 'https://staging.nexus.iudex.com.ar/health',
    label: 'staging.nexus',
    pillEl: '#status-pill-staging-nexus',
    latencyEl: '#status-latency-staging-nexus',
    detailEl: '#status-detail-staging-nexus',
  },
};

const POLL_INTERVAL_MS = 30_000;
const TIMEOUT_MS = 8_000;

let pollTimer = null;
const lastState = Object.fromEntries(
  Object.keys(ENDPOINTS).map((k) => [k, 'loading'])
);

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
    lastState[key] = 'down';
    return;
  }

  if (result.body) {
    const b = result.body;
    // nexus: { status, timestamp, agent_loaded }
    if (b.agent_loaded !== undefined) {
      const allOk = b.status === 'healthy' && b.agent_loaded === true;
      setPill(pill, allOk ? 'up' : 'degraded', allOk ? 'Operativo' : 'Degradado');
      if (detailEl) detailEl.textContent = b.agent_loaded
        ? `Agent cargado · ${b.status}`
        : `Agent NO cargado · ${b.status}`;
      lastState[key] = allOk ? 'up' : 'degraded';
      return;
    }
    // api: { status, db, redis, version }
    if (b.db !== undefined || b.redis !== undefined) {
      const allOk = b.status === 'ok' && b.db === 'ok' && b.redis === 'ok';
      setPill(pill, allOk ? 'up' : 'degraded', allOk ? 'Operativo' : 'Degradado');
      if (detailEl) detailEl.textContent = `db: ${b.db} · redis: ${b.redis} · v${b.version || '?'}`;
      lastState[key] = allOk ? 'up' : 'degraded';
      return;
    }
  }

  // No body parseable (opaque response del no-cors). Asumimos up sin detalle.
  setPill(pill, 'up', 'Operativo');
  if (detailEl) detailEl.textContent = 'Reachable (CORS limita el body)';
  lastState[key] = 'up';
}

function updatePulse() {
  const strip = $('#pulse-strip');
  const label = $('#pulse-label');
  const detail = $('#pulse-detail');
  if (!strip || !label || !detail) return;

  const entries = Object.entries(lastState);
  const total = entries.length;
  const down = entries.filter(([, s]) => s === 'down');
  const degraded = entries.filter(([, s]) => s === 'degraded');
  const up = entries.filter(([, s]) => s === 'up');
  const loading = entries.filter(([, s]) => s === 'loading');

  let kind = 'loading';
  let mainText = 'Checando servicios…';
  let detailText = '';

  if (loading.length === total) {
    kind = 'loading';
    mainText = 'Checando servicios…';
  } else if (down.length > 0) {
    kind = 'down';
    mainText = down.length === 1 ? '1 servicio caído' : `${down.length} servicios caídos`;
    detailText = down.map(([k]) => ENDPOINTS[k].label).join(' · ');
  } else if (degraded.length > 0) {
    kind = 'degraded';
    mainText = degraded.length === 1 ? '1 servicio degradado' : `${degraded.length} servicios degradados`;
    detailText = degraded.map(([k]) => ENDPOINTS[k].label).join(' · ');
  } else if (up.length === total) {
    kind = 'up';
    mainText = `${total} servicios operativos`;
  } else {
    // Mix: some loading, some up. Treat as up so far.
    kind = 'up';
    mainText = `${up.length}/${total} operativos · ${loading.length} checando`;
  }

  strip.className = `pulse-strip pulse-strip--${kind}`;
  label.textContent = mainText;
  detail.textContent = detailText;
}

function setUpdated() {
  const el = $('#status-updated');
  if (el) el.textContent = `actualizado ${fmtTime(new Date())}`;
}

async function checkWithFallback(url) {
  const corsResult = await checkCorsAware(url);
  if (corsResult.ok) return corsResult;
  const noCorsResult = await checkNoCors(url);
  if (noCorsResult.ok) {
    return { ok: true, latency: noCorsResult.latency, body: null };
  }
  return corsResult;
}

async function runChecks() {
  const keys = Object.keys(ENDPOINTS);
  const results = await Promise.all(
    keys.map((k) => checkWithFallback(ENDPOINTS[k].url))
  );
  keys.forEach((k, i) => renderResult(k, results[i]));
  updatePulse();
  setUpdated();
}

export function startStatusPolling() {
  runChecks();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(runChecks, POLL_INTERVAL_MS);
}

export function refreshStatusNow() {
  Object.keys(ENDPOINTS).forEach((k) => {
    setPill($(ENDPOINTS[k].pillEl), 'loading', 'Checando…');
    const lat = $(ENDPOINTS[k].latencyEl);
    if (lat) lat.textContent = '—';
    lastState[k] = 'loading';
  });
  updatePulse();
  runChecks();
}

export function stopStatusPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
