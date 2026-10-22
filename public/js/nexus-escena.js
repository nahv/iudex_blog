/* ════════════════════════════════════════════════════════════════════
   Nexus al frente — piezas de movimiento (2026-10-20)

   Lo que traemos de NM Labs, pasado a tinta, crema y dorado:
   - palabras que entran con desenfoque ([data-split], sólo titulares);
   - tipeo de un pedido y respuesta que se escribe de a 1-3 letras;
   - chips de cita que aparecen (scale .6 → 1);
   - tarjetas de acción con su línea dorada arriba;
   - línea guiada por scroll ([data-linea], la usa «Así trabaja»).

   Regla: el HTML trae el estado final. El JS lo resetea y lo reproduce;
   sin JS, o con «reducir movimiento», se ve todo quieto y completo.
   `<html class="motion">` lo pone un script en el <head> antes de pintar.
   ════════════════════════════════════════════════════════════════════ */
(() => {
  const raiz = document.documentElement;
  const conMovimiento = raiz.classList.contains('motion');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Espera las fuentes, pero nunca más de 450 ms: el titular no se demora
  // por una conexión lenta.
  const fuentes = Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    sleep(450),
  ]);

  /* ---------- Palabras con desenfoque ---------- */
  function split(el) {
    const palabras = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', palabras.join(' '));
    el.textContent = '';
    palabras.forEach((p, i) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      w.style.setProperty('--i', i);
      w.textContent = p;
      el.appendChild(w);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- Tipeo y respuesta en vivo ---------- */
  async function tipear(el, texto, vivo, min = 28, max = 55) {
    el.textContent = '';
    for (const c of texto) {
      if (!vivo()) return false;
      el.textContent += c;
      await sleep(rnd(min, max));
    }
    return true;
  }

  // Toma el contenido final de `el` (texto y chips) y lo vuelve a escribir:
  // el texto de a 1-3 letras, los chips aparecen enteros.
  function partesDe(el) {
    return [...el.childNodes].map((n) =>
      n.nodeType === Node.TEXT_NODE ? { texto: n.data } : { nodo: n.cloneNode(true) });
  }
  async function escribir(el, partes, vivo) {
    el.textContent = '';
    for (const p of partes) {
      if (!vivo()) return false;
      if (p.nodo) {
        const chip = p.nodo.cloneNode(true);
        chip.classList.add('is-pop');
        el.appendChild(chip);
        await sleep(220);
        continue;
      }
      const t = document.createTextNode('');
      el.appendChild(t);
      for (let i = 0; i < p.texto.length;) {
        if (!vivo()) return false;
        const n = 1 + Math.floor(Math.random() * 3);
        t.data += p.texto.slice(i, i + n);
        i += n;
        await sleep(rnd(18, 40));
      }
    }
    return true;
  }

  // Corre `fn` la primera vez que `el` se ve.
  function alVerse(el, fn, umbral = 0.3) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold: umbral });
    io.observe(el);
  }

  /* ---------- Línea guiada por scroll ---------- */
  function linea(el) {
    const paradas = [...el.querySelectorAll('[data-parada]')];
    let pedido = false;
    const medir = () => {
      pedido = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const p = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / Math.max(1, r.height)));
      el.style.setProperty('--progress', p.toFixed(3));
      paradas.forEach((s, i) => s.classList.toggle('is-lit', p >= (i + 0.35) / paradas.length));
    };
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(medir); } }, { passive: true });
    addEventListener('resize', medir);
    medir();
  }

  /* ---------- Escenas fijadas que se recorren con el scroll ----------
     `.nx-escena` mide varias pantallas; adentro, `.nx-escena__fija` queda
     fija. Mientras se baja se escribe en la escena:
       --p     avance total 0..1
       --bp    avance dentro del paso actual 0..1
       data-beat = paso actual (0..n-1, n = data-pasos)
     y en cada `[data-desde]` (umbral 0..1) se pone `is-on` cuando --p lo
     pasa. `[data-tipeo]` muestra su texto en proporción a su tramo
     (`data-tipeo="desde hasta"`). Todo se puede volver para atrás. */
  function escena(el) {
    const pasos = Math.max(1, parseInt(el.dataset.pasos || '1', 10));
    const umbrales = [...el.querySelectorAll('[data-desde]')].map((n) => [n, parseFloat(n.dataset.desde)]);
    const tipeos = [...el.querySelectorAll('[data-tipeo]')].map((n) => {
      const [a, b] = n.dataset.tipeo.split(' ').map(parseFloat);
      return { n, a, b, texto: n.textContent, mostrado: -1 };
    });
    const textosPaso = [...el.querySelectorAll('[data-paso-texto]')];
    // `data-estados="a:0 b:.4 c:.8"`: el último cuyo umbral ya pasó.
    const estados = [...el.querySelectorAll('[data-estados]')].map((n) => ({
      n,
      lista: n.dataset.estados.trim().split(/\s+/).map((x) => {
        const [nombre, u] = x.split(':');
        return [nombre, parseFloat(u)];
      }),
    }));
    const pasosLinea = [...el.querySelectorAll('.nx-pasos')];
    let ultimoBeat = -1;
    // `aplicar(p)` pone la escena en el avance p sin mirar el scroll: lo usan
    // las piezas para redes (scripts/social), que la congelan cuadro a cuadro.
    const aplicar = (p) => {
      const f = Math.min(pasos - 0.0001, p * pasos);
      const beat = Math.floor(f);
      el.style.setProperty('--p', p.toFixed(4));
      pasosLinea.forEach((l) => l.style.setProperty('--p', p.toFixed(4)));
      el.style.setProperty('--bp', (f - beat).toFixed(4));
      if (beat !== ultimoBeat) {
        ultimoBeat = beat;
        el.dataset.beat = String(beat);
        textosPaso.forEach((t) => {
          const i = parseInt(t.dataset.pasoTexto, 10);
          t.classList.toggle('is-on', i === beat);
          t.classList.toggle('is-past', i < beat);
        });
      }
      for (const [n, u] of umbrales) n.classList.toggle('is-on', p >= u);
      for (const { n, lista } of estados) {
        let actual = lista[0][0];
        for (const [nombre, u] of lista) if (p >= u) actual = nombre;
        if (n.dataset.estado !== actual) n.dataset.estado = actual;
      }
      for (const t of tipeos) {
        const k = Math.min(1, Math.max(0, (p - t.a) / (t.b - t.a)));
        const cuantos = Math.round(t.texto.length * k);
        if (cuantos !== t.mostrado) {
          t.mostrado = cuantos;
          t.n.textContent = t.texto.slice(0, cuantos);
        }
        t.n.classList.toggle('is-tipeando', cuantos > 0 && cuantos < t.texto.length);
      }
    };
    const medir = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = el.offsetHeight - vh;
      aplicar(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1);
    };
    medir.aplicar = aplicar;
    return medir;
  }

  // Para los capítulos que vienen (F3).
  window.IudexEscena = { split, tipear, escribir, partesDe, alVerse, linea, escena, sleep };

  if (!conMovimiento) return;

  // Las escenas sólo se fijan con movimiento: sin él, la página las muestra
  // terminadas y en su altura natural (ver .motion .nx-escena en el CSS).
  const escenas = [...document.querySelectorAll('.nx-escena')].map(escena);
  if (escenas.length) {
    let pedidoEscenas = false;
    const todas = () => { pedidoEscenas = false; escenas.forEach((m) => m()); };
    const pedir = () => { if (!pedidoEscenas) { pedidoEscenas = true; requestAnimationFrame(todas); } };
    addEventListener('scroll', pedir, { passive: true });
    addEventListener('resize', pedir);
    todas();
  }

  document.querySelectorAll('[data-split]').forEach(split);
  fuentes.then(() => requestAnimationFrame(() => {
    document.querySelectorAll('[data-split]').forEach((el) => el.classList.add('is-on'));
  }));
  document.querySelectorAll('[data-linea]').forEach(linea);

  // La grilla de la base: cada objeto entra y repite su animación sólo
  // mientras se ve (se pausa fuera de pantalla).
  const itemsGrilla = document.querySelectorAll('.nx-grilla__item');
  if (itemsGrilla.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) e.target.classList.toggle('is-visible', e.isIntersecting);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    itemsGrilla.forEach((n) => io.observe(n));
  } else {
    itemsGrilla.forEach((n) => n.classList.add('is-visible'));
  }

  /* ---------- El hero: «Pedíselo a Nexus.» ----------
     0 nada · 1 se escribe el pedido · 2 Nexus piensa (el orbe acelera)
     · 3 responde con las citas · 4 caen las tres tarjetas · 5 la primera
     se confirma («Enviando…»). Al terminar se saca `data-paso` y queda el
     estado final: la primera tarjeta «Hecho». */
  const hero = document.querySelector('.nx-hero');
  if (hero) {
    const pedido = hero.querySelector('.nx-hero__pedido');
    const resp = hero.querySelector('.nx-hero__resp');
    const t0 = hero.querySelector('.nx-hero__t0');
    const textoPedido = pedido.textContent;
    const respuesta = partesDe(resp);
    let corrida = 0;
    const paso = (n) => { hero.dataset.paso = String(n); };

    // Teléfono (2026-10-20, Nahuel): primero la escena, después el texto.
    // `html.intro-movil` (puesto antes de pintar) esconde el titular y sube
    // la escena hasta arriba; al terminar se saca y todo baja a su lugar.
    const intro = raiz.classList.contains('intro-movil');
    const terminarIntro = () => raiz.classList.remove('intro-movil');
    if (intro) {
      const stage = document.querySelector('.c-hero__stage');
      raiz.style.setProperty('--intro-shift', '0px');
      const arriba = stage.getBoundingClientRect().top + scrollY;
      raiz.style.setProperty('--intro-shift', `${Math.round(84 - arriba)}px`);
      // Si alguien baja mientras corre, el texto aparece igual.
      addEventListener('scroll', terminarIntro, { once: true, passive: true });
    }

    const jugar = async () => {
      const id = ++corrida;
      const vivo = () => id === corrida;
      paso(0);
      t0.dataset.estado = 'pendiente';
      pedido.textContent = '';
      await fuentes;
      await sleep(500);
      if (!vivo()) return;
      paso(1);
      if (!(await tipear(pedido, textoPedido, vivo, 22, 46))) return;
      await sleep(300);
      if (!vivo()) return;
      paso(2);
      await sleep(1400);
      if (!vivo()) return;
      paso(3);
      if (!(await escribir(resp, respuesta, vivo))) return;
      await sleep(300);
      if (!vivo()) return;
      paso(4);
      await sleep(1600);
      if (!vivo()) return;
      t0.dataset.estado = 'pulsado';
      await sleep(160);
      if (!vivo()) return;
      paso(5);
      t0.dataset.estado = 'enviando';
      await sleep(1100);
      if (!vivo()) return;
      t0.dataset.estado = 'hecho';
      delete hero.dataset.paso;
      await sleep(700);
      terminarIntro();
    };
    paso(0);
    t0.dataset.estado = 'pendiente';
    jugar();
  }
})();
