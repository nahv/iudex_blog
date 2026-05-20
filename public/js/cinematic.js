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

  /* ----------- Chapter pinned progress -----------
     We only touch chapters whose sticky window is on-screen — outside
     that range there's nothing to update and the cost of an unconditional
     scroll listener is wasted. IntersectionObserver gives us cheap
     enter/leave; rAF batches the per-frame work to one layout pass. */
  const chapters = Array.from(document.querySelectorAll('.c-chapter'));
  if (chapters.length && 'IntersectionObserver' in window) {
    const active = new Set();

    const update = (chapter) => {
      const rect = chapter.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = chapter.offsetHeight - vh;
      if (total <= 0) return;
      const raw = Math.min(1, Math.max(0, -rect.top / total));
      chapter.style.setProperty('--progress', `${(raw * 100).toFixed(2)}%`);

      const shots = chapter.querySelectorAll('.c-shot');
      const beats = chapter.querySelectorAll('.c-chapter__beat');
      const segments = Math.max(shots.length, beats.length, 1);
      const idxF = Math.min(segments - 0.0001, raw * segments);
      const idx = Math.floor(idxF);
      // Per-segment fractional progress (0..1) — drives the in-shot
      // motion so scrolling feels continuous, not stepped.
      const segP = idxF - idx;
      chapter.style.setProperty('--seg-progress', segP.toFixed(3));

      for (let i = 0; i < shots.length; i++) {
        const on = i === idx;
        const cur = shots[i].getAttribute('data-active') === 'true';
        if (on !== cur) {
          if (on) shots[i].setAttribute('data-active', 'true');
          else shots[i].removeAttribute('data-active');
        }
      }
      for (let i = 0; i < beats.length; i++) {
        const on = i === idx;
        const cur = beats[i].getAttribute('data-active') === 'true';
        if (on !== cur) {
          if (on) beats[i].setAttribute('data-active', 'true');
          else beats[i].removeAttribute('data-active');
        }
      }

      const rail = chapter.querySelector('.c-chapter__rail-fill');
      if (rail) rail.style.setProperty('--progress', `${(raw * 100).toFixed(2)}%`);
    };

    let ticking = false;
    const tick = () => {
      ticking = false;
      active.forEach(update);
    };
    const onScroll = () => {
      if (!ticking && active.size) {
        ticking = true;
        requestAnimationFrame(tick);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Toggle which chapters drive updates based on visibility (with a
    // generous margin so we always catch the lead-in/out frames).
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) active.add(e.target);
        else active.delete(e.target);
      }
      // Run once so the freshly-entered chapter snaps to the right state.
      onScroll();
    }, { rootMargin: '50% 0px' });

    chapters.forEach((c) => {
      io.observe(c);
      const firstShot = c.querySelector('.c-shot');
      const firstBeat = c.querySelector('.c-chapter__beat');
      if (firstShot) firstShot.setAttribute('data-active', 'true');
      if (firstBeat) firstBeat.setAttribute('data-active', 'true');
      update(c);
    });
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

  /* ----------- Native scroll only -----------
     Lenis was loaded here before but added inertia on top of macOS
     trackpad's native momentum, making the scroll feel "swimming".
     Native scroll is already smooth on every platform that ships with
     the kind of input device legal professionals use. */
})();
