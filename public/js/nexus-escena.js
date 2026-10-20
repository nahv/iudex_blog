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

  // Para los capítulos que vienen (F2/F3).
  window.IudexEscena = { split, tipear, escribir, partesDe, alVerse, linea, sleep };

  if (!conMovimiento) return;

  document.querySelectorAll('[data-split]').forEach(split);
  fuentes.then(() => requestAnimationFrame(() => {
    document.querySelectorAll('[data-split]').forEach((el) => el.classList.add('is-on'));
  }));
  document.querySelectorAll('[data-linea]').forEach(linea);

  /* ---------- El hero: «Pedíselo a Nexus.» ----------
     0 compositor vacío · 1 se tipea el pedido · 2 sale la burbuja y piensa
     · 3 responde con las citas · 4 caen las tarjetas · 5 la primera queda
     lista. Al terminar se saca `data-paso` y queda el estado final. */
  const hn = document.querySelector('.c-hero .hn');
  if (hn) {
    const q = hn.querySelector('.hn-q');
    const a = hn.querySelector('.hn-a');
    const typed = hn.querySelector('.hn-typed');
    const pedido = q.textContent;
    const respuesta = partesDe(a);
    let corrida = 0;
    const paso = (n) => { hn.dataset.paso = String(n); };

    const jugar = async () => {
      const id = ++corrida;
      const vivo = () => id === corrida;
      paso(0);
      typed.textContent = '';
      await fuentes;
      await sleep(600);
      if (!vivo()) return;
      paso(1);
      if (!(await tipear(typed, pedido, vivo))) return;
      await sleep(320);
      if (!vivo()) return;
      typed.textContent = '';
      paso(2);
      await sleep(1100);
      if (!vivo()) return;
      paso(3);
      if (!(await escribir(a, respuesta, vivo))) return;
      await sleep(260);
      if (!vivo()) return;
      paso(4);
      await sleep(1500);
      if (!vivo()) return;
      paso(5);
      await sleep(900);
      if (vivo()) delete hn.dataset.paso;
    };
    paso(0);
    jugar();
  }
})();
