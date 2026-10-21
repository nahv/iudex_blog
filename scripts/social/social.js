/* Piezas para redes (2026-10-21): arma una pieza con las escenas del sitio
   y la deja quieta en el instante que se pida. render.mjs la maneja por CDP:

     __sc.armar(spec)        → prepara formato, escena y textos
     __sc.still(spec)        → un cuadro quieto (portada, paso k, cierre)
     __sc.reel(spec)         → prepara el reel y devuelve su duración (ms)
     __sc.cuadro(ms)         → deja el reel en el instante ms

   El reloj es nuestro: todas las animaciones y transiciones CSS se pausan y
   se les pone el tiempo a mano (document.getAnimations), y el avance de la
   escena sale de IudexEscena.escena(el).aplicar(p). Así cada cuadro es el
   mismo siempre, sin importar cuánto tarde el navegador en capturarlo.

   El <html> NO trae `motion` al cargar: nexus-escena.js corta antes de
   colgarse del scroll, y acá lo ponemos nosotros. */
(() => {
  const raiz = document.documentElement;
  const sc = document.getElementById('sc');
  const $ = (s, r = sc) => r.querySelector(s);
  const D = window.SOCIAL;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const suave = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  raiz.classList.add('motion');

  /* ---------- Reloj ---------- */
  const nacio = new Map();
  let tQuieto = 0;
  function reloj(t) {
    for (const a of document.getAnimations()) {
      if (!nacio.has(a)) nacio.set(a, t);
      a.pause();
      a.currentTime = Math.max(0, t - nacio.get(a));
    }
  }

  /* ---------- Escenas ---------- */
  let activa = null; // { id, el, aplicar, pasos }
  const motores = {};
  function motor(id) {
    if (motores[id]) return motores[id];
    const caja = $(`.sc__escena[data-escena="${id}"]`);
    let aplicar = () => {};
    if (id === 'hero') aplicar = motorHero(caja);
    else if (id === 'minis') aplicar = () => {};
    else if (id === 'dimensiones') aplicar = motorCapitulo(caja.querySelector('.c-chapter'));
    else aplicar = window.IudexEscena.escena(caja.querySelector('.nx-escena')).aplicar;
    motores[id] = { id, caja, aplicar };
    return motores[id];
  }

  // Los capítulos fijados del sitio (main.js): data-beat, --beat-progress
  // (con easing), --seg-progress y el paso activo. Mismas cuentas que allá.
  function motorCapitulo(cap) {
    cap.classList.add('is-on');
    const beats = [...cap.querySelectorAll('.c-chapter__beat')];
    const n = Math.max(beats.length, 1);
    return (p) => {
      const f = Math.min(n - 0.0001, p * n);
      const i = Math.floor(f);
      const seg = f - i;
      cap.dataset.beat = String(i);
      cap.style.setProperty('--progress', `${(p * 100).toFixed(2)}%`);
      cap.style.setProperty('--seg-progress', seg.toFixed(3));
      cap.style.setProperty('--beat-progress', suave(seg).toFixed(3));
      beats.forEach((b, k) => { if (k === i) b.setAttribute('data-active', 'true'); else b.removeAttribute('data-active'); });
    };
  }

  // El hero del sitio corre con setTimeout; acá lo mismo, pero por avance.
  function motorHero(caja) {
    const hero = caja.querySelector('.nx-hero');
    const pedido = hero.querySelector('.nx-hero__pedido');
    const resp = hero.querySelector('.nx-hero__resp');
    const t0 = hero.querySelector('.nx-hero__t0');
    const textoPedido = pedido.textContent;
    const partes = window.IudexEscena.partesDe(resp).map((p) => {
      if (p.nodo) { const n = p.nodo.cloneNode(true); n.classList.add('is-pop'); return { n, largo: 1 }; }
      return { n: document.createTextNode(''), texto: p.texto, largo: p.texto.length };
    });
    resp.textContent = '';
    partes.forEach((p) => resp.appendChild(p.n));
    const totalResp = partes.reduce((s, p) => s + p.largo, 0);
    return (p) => {
      const paso = p < 0.04 ? 0 : p < 0.34 ? 1 : p < 0.46 ? 2 : p < 0.72 ? 3 : p < 0.84 ? 4 : p < 0.93 ? 5 : -1;
      if (paso < 0) delete hero.dataset.paso; else hero.dataset.paso = String(paso);
      t0.dataset.estado = p < 0.84 ? 'pendiente' : p < 0.86 ? 'pulsado' : p < 0.93 ? 'enviando' : 'hecho';
      pedido.textContent = textoPedido.slice(0, Math.round(textoPedido.length * clamp((p - 0.04) / 0.28)));
      let resto = Math.round(totalResp * clamp((p - 0.46) / 0.24));
      for (const parte of partes) {
        if (parte.texto !== undefined) {
          const k = Math.min(parte.largo, resto);
          parte.n.data = parte.texto.slice(0, k);
          resto -= k;
        } else {
          parte.n.style.display = resto > 0 ? '' : 'none';
          resto = Math.max(0, resto - 1);
        }
      }
    };
  }

  function mostrarMini(nombre) {
    sc.querySelectorAll('.sc__mini').forEach((m) => {
      const si = m.dataset.mini === nombre;
      m.classList.toggle('is-activa', si);
      m.querySelector('.nx-grilla__item').classList.toggle('is-visible', si);
    });
  }

  /* ---------- Armado ---------- */
  function textosDe(spec) {
    const e = D.escenas[spec.escena] || {};
    return {
      eyebrow: spec.eyebrow ?? e.eyebrow ?? '',
      titulo: spec.titulo ?? e.titulo ?? '',
      sub: spec.sub ?? '',
      pasos: spec.pasos ?? e.pasos ?? [],
    };
  }

  // Lo que se ve de la escena (sin el orbe grande, que es decorado): la
  // unión de los rectángulos de todo lo visible.
  function limites(raizEscena) {
    // Opacidad efectiva (producto con los ancestros). Lo atenuado (< 0,6:
    // lo que «retrocede» en la escena) no cuenta: puede quedar cortado.
    const op = new Map();
    const opacidad = (n) => {
      if (n === raizEscena || !n) return 1;
      if (op.has(n)) return op.get(n);
      const cs = getComputedStyle(n);
      const v = cs.display === 'none' || cs.visibility === 'hidden' ? 0 : parseFloat(cs.opacity) * opacidad(n.parentElement);
      op.set(n, v);
      return v;
    };
    const visible = (n) => opacidad(n) >= 0.6;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    // Sólo los objetos (`.ob`) y el núcleo del orbe: los contenedores del
    // sitio tienen alto mínimo y medirían aire.
    for (const n of raizEscena.querySelectorAll('.ob, .ob-orbe-g__nucleo, .nx-tel__pantalla, .nx-dim__card, .nx-cinta, .nx-lente')) {
      const r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || !visible(n)) continue;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    return x0 === Infinity ? null : { x0, y0, x1, y1 };
  }

  // La cámara: zoom del bloque y traslado del que lo mueve.
  function camara(c) {
    $('.sc__zoom').style.setProperty('--zoom', c.k.toFixed(4));
    $('.sc__mover').style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`;
    return c;
  }

  // Zoom para llenar la caja con lo que se ve y centrado. `muestras` son
  // avances a medir juntos (el reel mide toda la escena, no un instante).
  function encajar(muestras = null, tope = 1.9, encuadre = null) {
    const mover = $('.sc__mover');
    const z = $('.sc__zoom');
    mover.style.transform = 'none';
    z.style.setProperty('--zoom', '1');
    const caja = $('.sc__stage').getBoundingClientRect();
    const medir = () => limites(activa.caja);
    let b = null;
    const unir = (r) => { if (!r) return; b = b ? { x0: Math.min(b.x0, r.x0), y0: Math.min(b.y0, r.y0), x1: Math.max(b.x1, r.x1), y1: Math.max(b.y1, r.y1) } : r; };
    if (muestras) {
      for (const p of muestras) { activa.aplicar(p); reloj(tQuieto += 10000); unir(medir()); }
    } else unir(medir());
    window.__scDebug = { b, caja: { w: caja.width, h: caja.height } };
    if (!b) return { k: 1, x: 0, y: 0 };
    // `encuadre` = [x0, y0, x1, y1] en fracciones de lo que se ve: acercar a
    // una parte del objeto (el resto se corta en el borde, desvanecido).
    if (encuadre) {
      const w = b.x1 - b.x0, h = b.y1 - b.y0;
      b = { x0: b.x0 + w * encuadre[0], y0: b.y0 + h * encuadre[1], x1: b.x0 + w * encuadre[2], y1: b.y0 + h * encuadre[3] };
    }
    // Aire: 90 px a los costados (el recorte 3:4 del perfil) y 36 arriba y abajo.
    const k = Math.min((caja.width - 180) / (b.x1 - b.x0), (caja.height - 72) / (b.y1 - b.y0), tope);
    // Después del zoom las posiciones escalan desde el origen del bloque.
    const o = z.getBoundingClientRect();
    const cx = o.left + ((b.x0 + b.x1) / 2 - o.left) * k;
    const cy = o.top + ((b.y0 + b.y1) / 2 - o.top) * k;
    return camara({ k, x: caja.left + caja.width / 2 - cx, y: caja.top + caja.height / 2 - cy });
  }

  function armar(spec) {
    sc.dataset.formato = spec.formato || 'post';
    sc.dataset.fondo = spec.fondo || 'cream';
    sc.dataset.pie = spec.pie === false ? 'no' : 'si';
    sc.dataset.titulo = spec.sinTitulo ? 'no' : 'si';
    sc.querySelectorAll('.sc__escena').forEach((n) => n.classList.toggle('is-activa', n.dataset.escena === spec.escena));
    activa = motor(spec.escena);
    if (spec.escena === 'minis') mostrarMini(spec.mini);
    const t = textosDe(spec);
    $('.sc__eyebrow').textContent = t.eyebrow;
    $('.sc__contador').textContent = spec.contador || '';
    $('.sc__t-texto').textContent = t.titulo;
    $('.sc__sub').textContent = t.sub;
    $('.sc__cierre-linea').textContent = spec.cierre || 'Pedíselo a Nexus.';
    $('.sc__cierre').style.opacity = '0';
    $('.sc__stage').style.opacity = '1';
    return { textos: t };
  }

  /* ---------- Cuadro quieto ---------- */
  function still(spec) {
    const { textos } = armar(spec);
    const modo = spec.modo || 'portada';
    sc.dataset.modo = modo;
    // El texto del paso es del reel: en un cuadro quieto no va (la portada
    // del reel lo heredaba del último cuadro).
    $('.sc__paso').style.opacity = '0';
    const n = Math.max(1, textos.pasos.length);
    let p = spec.p ?? 1;
    if (modo === 'paso') {
      const k = spec.paso || 0;
      p = spec.p ?? spec.pasosP?.[k] ?? (k + 0.995) / n;
      const ps = textos.pasos[k] || { b: '', t: '' };
      if (spec.tituloDelPaso !== false) {
        $('.sc__t-texto').textContent = ps.b;
        $('.sc__sub').textContent = ps.t;
      }
    }
    if (modo === 'cierre') $('.sc__cierre').style.opacity = '1';
    // Primero el estado de antes, después el pedido: así las transiciones
    // arrancan y el reloj las lleva hasta el final.
    activa.aplicar(Math.max(0, p - 0.02));
    reloj(tQuieto += 10000);
    activa.aplicar(p);
    reloj(tQuieto += 10000);
    if (spec.escena === 'minis') {
      // Los objetos de la base repiten un ciclo de 8 s: se muestran en el
      // cuadro donde ya terminaron (≈ 6,6 s).
      tQuieto += 16000 - (tQuieto % 8000);
      reloj(tQuieto);
      for (const a of document.getAnimations()) if (a instanceof CSSAnimation && a.effect?.target?.closest('.ob-mini')) nacio.set(a, tQuieto);
      reloj(tQuieto += spec.fase ?? 6600);
    }
    const zoom = encajar(null, spec.escena === 'minis' ? 2.5 : 1.9, spec.encuadre).k;
    return { p, zoom };
  }

  /* ---------- Reel ---------- */
  let plan = null;
  function reel(spec) {
    const { textos } = armar(spec);
    sc.dataset.modo = 'reel';
    const titulo = textos.titulo;
    const tTipeo = 350 + titulo.length * 42;
    const t0 = tTipeo + 650; // entra el escenario
    const msPaso = spec.msPaso || 3800;
    let tramos;
    if (spec.escena === 'minis') {
      tramos = (spec.minis || Object.keys(D.minis)).map((m) => ({ mini: m, b: D.minis[m].titulo, t: D.minis[m].texto }));
    } else if (textos.pasos.length) {
      tramos = textos.pasos.map((x) => ({ b: x.b, t: x.t }));
    } else {
      tramos = [{ b: spec.pasoB || '', t: spec.pasoT || '' }];
    }
    const fin = t0 + tramos.length * msPaso;
    const tCierre = fin + 900;
    const total = tCierre + (spec.msCierre || 2600);
    plan = { titulo, tTipeo, t0, msPaso, tramos, fin, tCierre, total, ultimoMini: null };
    // Una cámara por tramo, medida con el tramo terminado; el reel pasa de
    // una a otra con un movimiento suave (acerca lo que importa en cada paso).
    plan.camaras = [];
    for (let i = 0; i < tramos.length; i++) {
      if (tramos[i].mini) mostrarMini(tramos[i].mini);
      else activa.aplicar(spec.pasosP?.[i] ?? (i + 0.97) / tramos.length);
      reloj(tQuieto += 10000);
      plan.camaras.push(encajar(null, tramos[i].mini ? 2.5 : (spec.tope || 1.9), spec.encuadre));
    }
    if (spec.escena === 'minis') mostrarMini(null);
    // El reloj del reel arranca después de lo medido: lo que nació midiendo
    // no queda congelado.
    plan.base = (tQuieto += 10000);
    activa.aplicar(0);
    camara(plan.camaras[0]);
    return { total, tramos: tramos.length };
  }

  function cuadro(ms) {
    const P = plan;
    // Título tipeado, con el cursor dorado.
    const k = Math.round(P.titulo.length * clamp((ms - 350) / (P.tTipeo - 350)));
    $('.sc__t-texto').textContent = P.titulo.slice(0, k);
    // Escenario
    $('.sc__stage').style.opacity = String(suave(clamp((ms - P.t0 + 450) / 450)));
    const i = clamp(Math.floor((ms - P.t0) / P.msPaso), 0, P.tramos.length - 1);
    const u = clamp((ms - P.t0 - i * P.msPaso) / P.msPaso);
    const tramo = P.tramos[i];
    // Cámara: del encuadre del tramo anterior al de éste, en 900 ms.
    const a = P.camaras[Math.max(0, i - 1)], b = P.camaras[i];
    const m = i === 0 ? 1 : suave(clamp((ms - P.t0 - i * P.msPaso) / 900));
    if (tramo.mini) {
      if (P.ultimoMini !== tramo.mini) { P.ultimoMini = tramo.mini; mostrarMini(tramo.mini); }
      camara(b);
    } else {
      camara({ k: a.k + (b.k - a.k) * m, x: a.x + (b.x - a.x) * m, y: a.y + (b.y - a.y) * m });
      const n = P.tramos.length;
      const p = ms < P.t0 ? 0 : (i + suave(clamp((u - 0.06) / 0.74))) / n;
      activa.aplicar(clamp(p));
    }
    // El texto del paso entra y sale con el tramo.
    const paso = $('.sc__paso');
    paso.querySelector('b').textContent = tramo.b;
    paso.querySelector('span').textContent = tramo.t;
    const entra = clamp((ms - P.t0 - i * P.msPaso) / 300);
    const sale = i === P.tramos.length - 1 ? 1 : 1 - clamp((u - 0.93) / 0.07);
    const op = ms < P.t0 ? 0 : Math.min(suave(entra), sale);
    paso.style.opacity = String(op);
    paso.style.transform = `translateY(${(1 - suave(entra)) * 14}px)`;
    // Cierre
    $('.sc__cierre').style.opacity = String(suave(clamp((ms - P.tCierre) / 420)));
    reloj(P.base + ms);
  }

  window.__sc = { armar, still, reel, cuadro, datos: D };
})();
