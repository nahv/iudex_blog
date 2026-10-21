// Renderiza las piezas de scripts/social/piezas.json (2026-10-21).
//
//   node scripts/social/render.mjs                 # todas
//   node scripts/social/render.mjs r03 c02         # las que empiezan así
//   OUT=~/Desktop/redes node scripts/social/render.mjs
//
// Sirve el sitio desde la raíz del repo, abre pieza.html en Chrome headless
// (Chrome for Testing de la caché de Playwright, o CHROME=<binario>) y lo
// maneja por CDP: posts y carruseles a JPG (y el carrusel también a PDF para
// LinkedIn), reels cuadro a cuadro a MP4 con ffmpeg. Sin dependencias: Node
// 24 trae WebSocket y fetch.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile, readdir, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../..');
const OUT = resolve((process.env.OUT || join(AQUI, 'out')).replace(/^~/, homedir()));
const FPS = 30;
const ALTO = { post: 1350, carrusel: 1350, 'carrusel-minis': 1350, reel: 1920, cuadrado: 1080 };

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };

function servir() {
  const srv = createServer(async (req, res) => {
    const ruta = join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!ruta.startsWith(RAIZ) || !existsSync(ruta)) { res.writeHead(404).end(); return; }
    try {
      res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] || 'application/octet-stream' });
      res.end(await readFile(ruta));
    } catch { res.writeHead(404).end(); }
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

async function chrome() {
  let bin = process.env.CHROME;
  if (!bin) {
    const cache = join(homedir(), 'Library/Caches/ms-playwright');
    const dirs = existsSync(cache) ? (await readdir(cache)).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
    for (const d of dirs) {
      for (const arq of ['chrome-mac-arm64', 'chrome-mac-x64', 'chrome-mac']) {
        const b = join(cache, d, arq, 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
        if (existsSync(b)) { bin = b; break; }
      }
      if (bin) break;
    }
  }
  if (!bin) throw new Error('No encuentro Chrome: pasá CHROME=<binario>');
  const datos = await mkdtemp(join(tmpdir(), 'iudex-social-'));
  const proc = spawn(bin, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${datos}`,
    '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  const ws = await new Promise((ok, mal) => {
    let buf = '';
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) ok(m[1]);
    });
    proc.on('exit', () => mal(new Error('Chrome se cerró:\n' + buf)));
  });
  return { proc, ws };
}

function cdp(url) {
  const sock = new WebSocket(url);
  let id = 0;
  const espera = new Map();
  sock.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && espera.has(m.id)) {
      const [ok, mal] = espera.get(m.id);
      espera.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    }
  };
  const abierto = new Promise((ok) => { sock.onopen = ok; });
  const send = async (method, params = {}, sessionId) => {
    await abierto;
    const n = ++id;
    sock.send(JSON.stringify({ id: n, method, params, sessionId }));
    return new Promise((ok, mal) => espera.set(n, [ok, mal]));
  };
  return { send, cerrar: () => sock.close() };
}

async function pagina(c, puerto) {
  const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => c.send(m, p, sessionId);
  await s('Page.enable');
  await s('Runtime.enable');
  const ev = async (expr) => {
    const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  let altoActual = 0;
  const tamano = async (alto) => {
    if (alto === altoActual) return;
    altoActual = alto;
    await s('Emulation.setDeviceMetricsOverride', { width: 1080, height: alto, deviceScaleFactor: 1, mobile: false });
  };
  await tamano(1350);
  await s('Page.navigate', { url: `http://127.0.0.1:${puerto}/scripts/social/pieza.html` });
  for (let i = 0; i < 100; i++) {
    if (await ev('document.readyState === "complete" && !!window.__sc').catch(() => false)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await ev('document.fonts.ready.then(() => true)');
  const foto = async (calidad = 94) => {
    await ev('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');
    const r = await s('Page.captureScreenshot', { format: 'jpeg', quality: calidad, captureBeyondViewport: false });
    return Buffer.from(r.data, 'base64');
  };
  return { ev, foto, tamano };
}

function correr(cmd, args, entrada) {
  return new Promise((ok, mal) => {
    const p = spawn(cmd, args, { stdio: [entrada ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('exit', (c) => (c === 0 ? ok() : mal(new Error(`${cmd} salió ${c}\n${err.slice(-800)}`))));
    if (entrada) entrada(p.stdin);
  });
}

const J = (o) => JSON.stringify(o);

async function hacerReel(pg, pz, dir) {
  await pg.tamano(1920);
  const spec = { ...pz, formato: 'reel' };
  const { total } = await pg.ev(`__sc.reel(${J(spec)})`);
  const cuadros = Math.ceil((total / 1000) * FPS);
  const salida = join(dir, `${pz.id}.mp4`);
  let pipe;
  const ff = correr('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', salida],
  (stdin) => { pipe = stdin; });
  for (let f = 0; f < cuadros; f++) {
    await pg.ev(`__sc.cuadro(${(f * 1000) / FPS})`);
    const img = await pg.foto(92);
    if (!pipe.write(img)) await new Promise((r) => pipe.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`\r  ${pz.id} ${f}/${cuadros}`);
  }
  pipe.end();
  await ff;
  // Portada del reel: la escena terminada, con el título.
  await pg.ev(`__sc.still(${J({ ...spec, modo: 'portada', p: pz.portadaP ?? 1 })})`);
  await writeFile(join(dir, `${pz.id}-portada.jpg`), await pg.foto(95));
  process.stdout.write(`\r  ${pz.id} ${cuadros} cuadros · ${(total / 1000).toFixed(1)} s\n`);
}

async function hacerSlides(pg, pz, dir) {
  await pg.tamano(1350);
  const base = { ...pz, formato: 'post' };
  const slides = [];
  if (pz.tipo === 'post') {
    slides.push({ ...base, modo: 'portada', p: 1 });
  } else if (pz.tipo === 'carrusel') {
    const n = await pg.ev(`(__sc.datos.escenas[${J(pz.escena)}].pasos || []).length`);
    slides.push({ ...base, modo: 'portada', p: 1 });
    for (let k = 0; k < n; k++) slides.push({ ...base, modo: 'paso', paso: k, contador: `${k + 1} / ${n}` });
    slides.push({ ...base, modo: 'cierre', p: 1 });
  } else if (pz.tipo === 'carrusel-minis') {
    const minis = await pg.ev('Object.keys(__sc.datos.minis)');
    slides.push({ ...base, escena: 'minis', mini: minis[0], modo: 'portada' });
    minis.forEach((m, k) => slides.push({ escena: 'minis', mini: m, formato: 'post', modo: 'portada', eyebrow: m,
      contador: `${k + 1} / ${minis.length}`,
      titulo: `__mini_t`, sub: `__mini_p` }));
    slides.push({ ...base, escena: 'minis', mini: minis[0], modo: 'cierre' });
  }
  const archivos = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (s.titulo === '__mini_t') {
      const m = await pg.ev(`__sc.datos.minis[${J(s.mini)}]`);
      s.titulo = m.titulo; s.sub = m.texto;
    }
    const info = await pg.ev(`__sc.still(${J(s)})`);
    if (process.env.DEBUG) console.log('   ', i + 1, JSON.stringify(info), JSON.stringify(await pg.ev('window.__scDebug')));
    const nombre = slides.length > 1 ? `${pz.id}-${String(i + 1).padStart(2, '0')}.jpg` : `${pz.id}.jpg`;
    await writeFile(join(dir, nombre), await pg.foto(95));
    archivos.push(join(dir, nombre));
  }
  if (archivos.length > 1) {
    // LinkedIn: el carrusel se sube como documento (PDF, una página por slide).
    await correr('python3', ['-I', join(AQUI, 'a_pdf.py'), join(dir, `${pz.id}.pdf`), ...archivos]);
  }
  console.log(`  ${pz.id} ${archivos.length} slide(s)`);
}

const filtros = process.argv.slice(2);
const { piezas } = JSON.parse(await readFile(join(AQUI, 'piezas.json'), 'utf8'));
const elegidas = piezas.filter((p) => !filtros.length || filtros.some((f) => p.id.startsWith(f)));
await mkdir(OUT, { recursive: true });
const srv = await servir();
const { proc, ws } = await chrome();
const c = cdp(ws);
try {
  const pg = await pagina(c, srv.address().port);
  for (const pz of elegidas) {
    const dir = join(OUT, pz.id);
    await mkdir(dir, { recursive: true });
    if (pz.tipo === 'reel') await hacerReel(pg, pz, dir);
    else await hacerSlides(pg, pz, dir);
  }
  console.log(`listo → ${OUT}`);
} finally {
  c.cerrar();
  proc.kill();
  srv.close();
}
