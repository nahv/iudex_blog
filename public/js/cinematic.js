/* ===========================================================
   Iudex — Cinematic motion
   - Hero entrance + subtle pointer parallax on stage
   - Chapter pinned scroll progress -> active shot + beat
   - Optional Lenis smooth scroll (deferred, low-priority)
   =========================================================== */

(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------- Hero entrance ----------- */
  const hero = document.querySelector('.c-hero');
  if (hero) {
    hero.dataset.state = 'enter';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hero.dataset.state = 'in';
      });
    });
  }

  /* ----------- Hero pointer parallax ----------- */
  const stage = document.querySelector('.c-hero__stage');
  if (stage && !reduceMotion && matchMedia('(min-width: 980px)').matches) {
    let raf = 0;
    let tx = 0, ty = 0;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Range -10..10 px
      tx = ((e.clientX - cx) / (r.width / 2)) * 10;
      ty = ((e.clientY - cy) / (r.height / 2)) * 10;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = 0;
      stage.style.setProperty('--px', tx.toFixed(2));
      stage.style.setProperty('--py', ty.toFixed(2));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* ----------- Chapter pinned progress ----------- */
  const chapters = document.querySelectorAll('.c-chapter');
  if (chapters.length && 'IntersectionObserver' in window) {
    const update = (chapter) => {
      const rect = chapter.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = chapter.offsetHeight - vh; // sticky window height
      if (total <= 0) return;
      // raw 0..1 across the chapter
      const raw = Math.min(1, Math.max(0, -rect.top / total));
      chapter.style.setProperty('--progress', `${(raw * 100).toFixed(2)}%`);

      // Activate the right shot/beat based on segmented progress
      const shots = chapter.querySelectorAll('.c-shot');
      const beats = chapter.querySelectorAll('.c-chapter__beat');
      const segments = Math.max(shots.length, beats.length, 1);
      const idx = Math.min(segments - 1, Math.floor(raw * segments));

      const setActive = (el, on) => {
        if (on) el.setAttribute('data-active', 'true');
        else el.removeAttribute('data-active');
      };
      shots.forEach((s, i) => setActive(s, i === idx));
      beats.forEach((b, i) => setActive(b, i === idx));

      const rail = chapter.querySelector('.c-chapter__rail-fill');
      if (rail) rail.style.setProperty('--progress', `${(raw * 100).toFixed(2)}%`);
    };

    let ticking = false;
    const tick = () => {
      ticking = false;
      chapters.forEach(update);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(tick);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Initial activation
    chapters.forEach((c) => {
      const firstShot = c.querySelector('.c-shot');
      const firstBeat = c.querySelector('.c-chapter__beat');
      if (firstShot) firstShot.setAttribute('data-active', 'true');
      if (firstBeat) firstBeat.setAttribute('data-active', 'true');
    });
    tick();
  }

  /* ----------- Image fallback: show "capture pending" overlay ----------- */
  document.querySelectorAll('.c-shot img, .c-window img').forEach((img) => {
    const showPending = () => {
      const host = img.closest('.c-shot, .c-window');
      if (!host || host.querySelector('.c-shot__pending')) return;
      const label = img.getAttribute('alt') || 'Captura pendiente';
      const ph = document.createElement('div');
      ph.className = 'c-shot__pending';
      ph.innerHTML = `<strong>${label}</strong><span>captura pendiente</span>`;
      host.appendChild(ph);
      img.style.opacity = '0';
    };
    if (!img.complete) {
      img.addEventListener('error', showPending, { once: true });
      img.addEventListener('load', () => {
        if (img.naturalWidth === 0) showPending();
      }, { once: true });
    } else if (img.naturalWidth === 0) {
      showPending();
    }
  });

  /* ----------- Lenis smooth scroll (optional, lazy) -----------
     We load Lenis from CDN only if the user hasn't requested reduced motion.
     Falls back silently if the CDN is blocked.
  */
  if (!reduceMotion) {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js';
    s.async = true;
    s.onload = () => {
      if (!window.Lenis) return;
      const lenis = new window.Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
      });
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    };
    s.onerror = () => { /* silently fall back to native scroll */ };
    document.head.appendChild(s);
  }
})();
