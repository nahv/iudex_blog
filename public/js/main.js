// ===========================
// IUDEX BLOG - Main JavaScript
// ===========================

// ---- Configuration ----
// Credentials are loaded from public/js/env.js (gitignored).
// See public/js/env.example.js for the template.
// If ENV is not loaded, everything degrades gracefully.
const SUPABASE_CONFIG = typeof ENV !== 'undefined' ? ENV.supabase : {};

// ---- Supabase client (lightweight REST wrapper) ----
const iudexDB = {
  async insert(table, data) {
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('YOUR_')) {
      return { error: null, data: null, mock: true };
    }
    const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text();
      let errorDetail;
      try { errorDetail = JSON.parse(text); } catch (e) { errorDetail = { message: text }; }
      // Unique constraint violation (duplicate email)
      if (response.status === 409 || (errorDetail.code === '23505')) {
        return { error: { duplicate: true, message: 'Email ya registrado' } };
      }
      return { error: { duplicate: false, message: errorDetail.message || 'Error al guardar' } };
    }
    return { error: null, data: null };
  },
};

document.addEventListener('DOMContentLoaded', () => {

  // ---- Navbar scroll effect ----
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ---- Mobile nav toggle ----
  const toggle = document.querySelector('.navbar__toggle');
  const links = document.querySelector('.navbar__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });
    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Intersection Observer for scroll animations ----
  const revealEls = document.querySelectorAll('.animate-on-scroll, .text-reveal, .stagger-children, .scale-in, .lead-reveal, .nexus-stack__item--reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  // ---- Parallax hero (subtle, Apple-style) ----
  const heroTitle = document.querySelector('.hero__title');
  const heroSub = document.querySelector('.hero__subtitle');
  const heroActions = document.querySelector('.hero__actions');
  if (heroTitle) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const rate = Math.min(scrollY / 3, 120);
          const opacity = Math.max(1 - scrollY / 600, 0);
          heroTitle.style.transform = `translateY(${rate * 0.4}px)`;
          heroTitle.style.opacity = opacity;
          if (heroSub) {
            heroSub.style.transform = `translateY(${rate * 0.25}px)`;
            heroSub.style.opacity = opacity;
          }
          if (heroActions) {
            heroActions.style.transform = `translateY(${rate * 0.15}px)`;
            heroActions.style.opacity = opacity;
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ---- Newsletter / CTA forms (email-only) ----
  document.querySelectorAll('.js-email-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      const email = input ? input.value.trim() : '';
      const originalText = btn.textContent;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormFeedback(form, 'Por favor ingresá un email válido.', false);
        return;
      }

      btn.textContent = 'Enviando...';
      btn.disabled = true;

      // Save to Supabase — el webhook dispara la Edge Function que envía
      // el welcome via SES y notifica al equipo.
      iudexDB.insert('registrations', {
        nombre: '',
        apellido: '',
        email: email,
        source: 'cta-' + (window.location.pathname.includes('blog') ? 'blog' :
                          window.location.pathname.includes('about') ? 'about' : 'home'),
      }).catch(() => {});

      // Show success (registration is saved to Supabase regardless of email)
      btn.textContent = '¡Listo!';
      if (input) input.value = '';
      showFormFeedback(form, '¡Gracias! Te avisaremos cuando Iudex esté disponible.', true);
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 4000);
    });
  });

  // ---- Contact form (full pre-access registration) ----
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot check
      const honeypot = contactForm.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        // Bot detected — simulate success silently
        contactForm.reset();
        showFormFeedback(contactForm, '¡Gracias por tu interés! Te enviamos un email con información sobre Iudex.', true);
        return;
      }

      const btn = contactForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      const formData = {
        nombre: contactForm.querySelector('#nombre').value.trim(),
        apellido: contactForm.querySelector('#apellido').value.trim(),
        email: contactForm.querySelector('#email').value.trim(),
        telefono: contactForm.querySelector('#telefono').value.trim() || null,
        perfil: contactForm.querySelector('#perfil').value || null,
        provincia: contactForm.querySelector('#provincia').value,
        fuero: contactForm.querySelector('#fuero').value || null,
        tamano: contactForm.querySelector('#tamano').value || null,
        mensaje: contactForm.querySelector('#mensaje').value.trim() || null,
        source: 'contact-form',
      };

      // Validate required fields
      if (!formData.nombre || !formData.apellido || !formData.email || !formData.provincia) {
        showFormFeedback(contactForm, 'Por favor completá todos los campos requeridos.', false);
        btn.textContent = original;
        btn.disabled = false;
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showFormFeedback(contactForm, 'Por favor ingresá un email válido.', false);
        btn.textContent = original;
        btn.disabled = false;
        return;
      }

      // Step 1: Save to Supabase
      const { error: dbError } = await iudexDB.insert('registrations', formData);

      if (dbError) {
        if (dbError.duplicate) {
          showFormFeedback(contactForm, 'Este email ya tiene una solicitud registrada. Si necesitás ayuda, escribinos a contacto@iudex.com.ar.', false);
          btn.textContent = original;
          btn.disabled = false;
          return;
        }
        // Non-duplicate DB error — still try to send emails
      }

      // El webhook de Supabase dispara la Edge Function que envía el welcome
      // institucional al usuario y la notificación al equipo via AWS SES.
      // Ver supabase/functions/send-inscription-email + docs/aws-ses-setup.md.

      // Step 2: Show success
      btn.textContent = '¡Solicitud enviada!';
      contactForm.reset();
      showFormFeedback(contactForm, '¡Gracias por tu interés! Te enviamos un email con información sobre Iudex.', true);
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 5000);
    });
  }

  // ---- Blog filter buttons ----
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.filter;
      document.querySelectorAll('.blog-card[data-category]').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = '';
          setTimeout(() => card.style.opacity = '1', 10);
        } else {
          card.style.opacity = '0';
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });

  // ---- Animated counter (easeOutExpo) ----
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  document.querySelectorAll('.js-counter').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2200;
    let start = null;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        requestAnimationFrame(function step(timestamp) {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const value = Math.round(easeOutExpo(progress) * target);
          el.textContent = value + (el.dataset.suffix || '');
          if (progress < 1) requestAnimationFrame(step);
        });
      }
    }, { threshold: 0.5 });

    observer.observe(el);
  });

  // ---- Auto-reveal above-the-fold elements ----
  document.querySelectorAll('.contact-hero .text-reveal, .hero .text-reveal, .post-hero .text-reveal').forEach(el => {
    setTimeout(() => el.classList.add('visible'), 200);
  });
  document.querySelectorAll('.contact-hero .lead-reveal, .hero .lead-reveal, .post-hero .lead-reveal, .page-hero .lead-reveal').forEach(el => {
    setTimeout(() => el.classList.add('visible'), 500);
  });

  // ---- Mobile overlay content (shared drawer, multiple groups) ----
  const overlayContent = {
    flujo: [
      { title: 'Contá el caso, no busques palabras', tag: 'Paso 1 · Preguntá', body: 'Describí el problema jurídico con tus propias palabras. La respuesta llega con fallos argentinos citados, cada afirmación atada a su fuente.' },
      { title: 'Jurisprudencia, doctrina y expediente, en el mismo hilo', tag: 'Paso 2 · Conectá', body: 'Lo que leés, lo que anotás y lo que archivás queda conectado al caso. Cada cita es rastreable. Ninguna respuesta sin fuente.' },
      { title: 'El escrito nace del trabajo, no de una plantilla vacía', tag: 'Paso 3 · Producí', body: 'La demanda, el recurso o la notificación se arman con el contexto del caso y las citas de tu propia investigación. Solo te queda la revisión final.' },
    ],
    features: [
      { title: 'Expedientes con memoria', tag: 'Expedientes', body: 'El caso entero en un hilo: estado, actuaciones, partes y documentos. Lo que pasó queda registrado. Lo que se viene, también.' },
      { title: 'Investigación con fuentes', tag: 'Investigación', body: 'Pregunta en lenguaje natural, respuesta con fallos argentinos citados y linkeados. Guardás sesiones por caso, comparás criterios, armás el argumento.' },
      { title: 'Escritura que arranca del caso', tag: 'Escritura', body: 'Demandas, recursos y notificaciones se componen con el contexto del expediente y las citas de tu investigación. Tu criterio, sobre trabajo ya hecho.' },
      { title: 'Gestión del estudio', tag: 'Gestión', body: 'Plazos que avisan antes del vencimiento, fichas de cliente con todo el contexto, modelos compartidos por el equipo y métricas reales del trabajo. Sin abrir una planilla.' },
    ],
    pain: [
      { title: 'Escritura que arranca de cero cada vez', tag: 'Fricción', body: 'Mismo encabezado, mismos párrafos, mismas cláusulas. Reescritas a mano, caso tras caso, porque el estudio no tiene memoria propia.' },
      { title: 'El expediente vive en doce lugares', tag: 'Fricción', body: 'Carpetas en el escritorio, PDFs en el correo, notas en papel, planilla aparte. Recomponer lo que tenés lleva más tiempo que pensar el caso.' },
      { title: 'Los plazos los lleva la memoria', tag: 'Fricción', body: 'Un vencimiento procesal depende de una alarma en el celular o de acordarte vos. Lo importante no debería vivir en un post-it.' },
      { title: 'Herramientas hechas para otro trabajo', tag: 'Fricción', body: 'Word, Excel y el correo no fueron pensados para el ejercicio jurídico. Te adaptás vos, todos los días, a la forma de pensar de un procesador de texto.' },
      { title: 'Cada escrito, una versión distinta', tag: 'Fricción', body: '¿Cuál era el modelo vigente? ¿El último enviado? ¿El que ya tenía los cambios pedidos? Sin historial común, la versión correcta se pierde.' },
      { title: 'Más causas, menos criterio', tag: 'Fricción', body: 'Crecer no debería costar horas. Sin método compartido, cada cliente nuevo agrega ruido en vez de rutina.' },
    ],
    detalles: [
      { title: 'Command palette · Ctrl+K', tag: 'Oficio', body: 'Abrí un expediente, disparás un escrito o saltás a un fallo sin tocar el mouse. La mano no abandona el teclado.' },
      { title: 'Variables del expediente', tag: 'Oficio', body: 'Escribís {DEMANDADO} en una plantilla y se autocompleta con los datos del caso. Cada estudio arma las que usa: {ACTOR}, {JUZGADO}, {MONTO}, fechas, número de expediente.' },
      { title: 'Tus causas entran de una', tag: 'Oficio', body: 'Iudex convive con los sistemas judiciales provinciales y trae el listado completo de expedientes. Sin carga manual caso por caso.' },
      { title: 'Línea de actuaciones, sola', tag: 'Oficio', body: 'Subís los PDFs del expediente y se ordenan por fecha. Con OCR: buscás por texto dentro de cualquier documento.' },
      { title: 'Sigue funcionando sin señal', tag: 'Oficio', body: 'Tribunales, colectivo, café con WiFi flojo. Seguís trabajando y Iudex sincroniza cuando vuelve la conexión.' },
      { title: 'Anotaciones sobre el PDF', tag: 'Oficio', body: 'Marcás, subrayás y dejás notas sobre el documento. Volvés seis meses después y la lectura anterior te está esperando.' },
      { title: 'Cálculos a mano', tag: 'Oficio', body: 'Valor del JUS, tasa de justicia, honorarios por etapa. Sin salir del expediente ni abrir una planilla aparte.' },
      { title: 'Historial del escrito', tag: 'Oficio', body: 'Cada versión queda registrada. Comparás v1 contra v3, volvés atrás, nunca pisás el trabajo anterior por accidente.' },
      { title: 'Trabajo compartido, sin copias', tag: 'Oficio', body: 'Un expediente, varios abogados del estudio. Permisos claros, una sola fuente de verdad — no tres copias en carpetas de Drive.' },
    ],
  };

  const overlay = document.getElementById('feature-overlay');
  if (overlay) {
    const openOverlay = (btn) => {
      const group = btn.dataset.overlayGroup || 'features';
      // Backwards-compat: legacy .features-mobile-grid__item uses data-feature
      const idx = parseInt(btn.dataset.overlayIndex ?? btn.dataset.feature, 10);
      const data = (overlayContent[group] || [])[idx];
      if (!data) return;
      const iconEl = document.getElementById('overlay-icon');
      const iconSource = btn.querySelector('.feature-card__icon');
      iconEl.innerHTML = iconSource ? iconSource.innerHTML : '';
      document.getElementById('overlay-title').textContent = data.title;
      document.getElementById('overlay-tag').textContent = data.tag;
      document.getElementById('overlay-body').textContent = data.body;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeOverlay = () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    // New group-aware grids (pain, detalles, and any future)
    document.querySelectorAll('.mobile-overlay-grid__item').forEach(btn => {
      btn.addEventListener('click', () => openOverlay(btn));
    });
    // Legacy features mobile grid
    document.querySelectorAll('.features-mobile-grid__item').forEach(btn => {
      btn.addEventListener('click', () => openOverlay(btn));
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const handle = overlay.querySelector('.feature-overlay__handle');
    if (handle) {
      handle.addEventListener('click', closeOverlay);
    }

    // ESC key closes the drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) closeOverlay();
    });
  }

  // ---- Studio scrolly (vertical stack with smooth scene transitions) ----
  const scrollySteps = document.querySelectorAll('.studio-scrolly__step');
  const scrollyMedias = document.querySelectorAll('.studio-scrolly__media');
  const scrollyDots = document.querySelectorAll('.studio-scrolly__progress-dot');
  const scrollyCaptions = document.querySelectorAll('.studio-scrolly__caption');
  let scrollyActive = 0;

  if (scrollySteps.length) {
    const activateStep = (index) => {
      scrollyActive = index;
      scrollySteps.forEach(s => {
        s.classList.toggle('is-active', s.dataset.scrollyStep === String(index));
      });
      scrollyMedias.forEach(m => {
        m.classList.toggle('is-active', m.dataset.scrollyImg === String(index));
      });
      scrollyDots.forEach(d => {
        d.classList.toggle('is-active', d.dataset.scrollyDot === String(index));
      });
      scrollyCaptions.forEach(c => {
        c.classList.toggle('is-active', c.dataset.scrollyCaption === String(index));
      });
    };

    const observer = new IntersectionObserver((entries) => {
      let best = null;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
      });
      if (best) {
        const idx = parseInt(best.target.dataset.scrollyStep, 10);
        if (!Number.isNaN(idx)) activateStep(idx);
      }
    }, {
      rootMargin: '-40% 0px -40% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    scrollySteps.forEach(step => observer.observe(step));
  }

  // ---- Image lightbox (fullscreen viewer + zoom) ----
  // Source list: studio-scrolly medias on the landing, generic
  // [data-lightbox-img] elements on other pages (investigación, etc.).
  const lightbox = document.getElementById('image-lightbox');
  const lightboxMedia = scrollyMedias.length
    ? scrollyMedias
    : document.querySelectorAll('[data-lightbox-img]');
  if (lightbox && lightboxMedia.length) {
    const lbImg = lightbox.querySelector('.image-lightbox__img');
    const lbCaption = document.getElementById('image-lightbox-caption');
    const lbLevel = document.getElementById('image-lightbox-zoom-level');
    const lbClose = lightbox.querySelector('.image-lightbox__close');
    const lbPrev = lightbox.querySelector('.image-lightbox__nav--prev');
    const lbNext = lightbox.querySelector('.image-lightbox__nav--next');
    const lbZoomBtns = lightbox.querySelectorAll('.image-lightbox__zoom-btn');
    const stepTitles = scrollyMedias.length
      ? Array.from(document.querySelectorAll('.studio-scrolly__step-title')).map(el => el.textContent.trim())
      : Array.from(lightboxMedia).map(el => el.dataset.lightboxCaption || el.alt || '');

    let currentIdx = 0;
    let zoom = 1;
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.5;

    const setZoom = (next, originX, originY) => {
      zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
      lbImg.style.transformOrigin = (originX != null && originY != null)
        ? `${originX}% ${originY}%`
        : 'center center';
      lbImg.style.transform = `scale(${zoom})`;
      lbImg.classList.toggle('is-zoomed', zoom > 1);
      if (lbLevel) lbLevel.textContent = Math.round(zoom * 100) + '%';
    };

    const loadImage = (idx) => {
      const total = lightboxMedia.length;
      currentIdx = ((idx % total) + total) % total;
      const src = lightboxMedia[currentIdx].getAttribute('src');
      const alt = lightboxMedia[currentIdx].getAttribute('alt') || '';
      lbImg.src = src;
      lbImg.alt = alt;
      if (lbCaption) lbCaption.textContent = `${String(currentIdx + 1).padStart(2, '0')} · ${stepTitles[currentIdx] || ''}`;
      setZoom(1);
    };

    const openLightbox = (idx) => {
      loadImage(idx);
      lightbox.hidden = false;
      // next frame so the transition runs
      requestAnimationFrame(() => lightbox.classList.add('is-open'));
      document.body.classList.add('has-lightbox-open');
    };

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('has-lightbox-open');
      setZoom(1);
      setTimeout(() => { lightbox.hidden = true; }, 250);
    };

    // Open triggers (sticky expand button + each mobile inline frame)
    document.querySelectorAll('[data-lightbox-open]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const raw = btn.dataset.lightboxOpen;
        const idx = raw === 'active' ? scrollyActive : parseInt(raw, 10) || 0;
        openLightbox(idx);
      });
    });

    // Close
    lbClose.addEventListener('click', closeLightbox);

    // ESC closes; arrows navigate
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') loadImage(currentIdx - 1);
      else if (e.key === 'ArrowRight') loadImage(currentIdx + 1);
      else if (e.key === '+' || e.key === '=') setZoom(zoom + ZOOM_STEP);
      else if (e.key === '-' || e.key === '_') setZoom(zoom - ZOOM_STEP);
      else if (e.key === '0') setZoom(1);
    });

    // Click backdrop (not the image) closes
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Navigation
    lbPrev.addEventListener('click', () => loadImage(currentIdx - 1));
    lbNext.addEventListener('click', () => loadImage(currentIdx + 1));

    // Zoom buttons
    lbZoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.zoom;
        if (v === 'reset') setZoom(1);
        else setZoom(zoom + parseFloat(v) * ZOOM_STEP);
      });
    });

    // Click image to toggle zoom on desktop, with focal point at click
    lbImg.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = lbImg.getBoundingClientRect();
      const ox = ((e.clientX - rect.left) / rect.width) * 100;
      const oy = ((e.clientY - rect.top) / rect.height) * 100;
      if (zoom === 1) setZoom(2, ox, oy);
      else setZoom(1);
    });

    // Wheel to zoom (desktop)
    lightbox.addEventListener('wheel', (e) => {
      if (lightbox.hidden) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom(zoom + delta);
    }, { passive: false });
  }

  // ---- Smooth active link highlighting ----
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      a.style.color = 'var(--ink)';
      a.style.fontWeight = '500';
    }
  });
});

// ---- Utility: show form feedback ----
function showFormFeedback(form, message, success) {
  let fb = form.querySelector('.form-feedback');
  if (!fb) {
    fb = document.createElement('p');
    fb.className = 'form-feedback';
    fb.style.cssText = `
      margin-top: 12px;
      font-size: 0.82rem;
      padding: 10px 14px;
      border-radius: 6px;
      transition: all 0.3s;
    `;
    form.appendChild(fb);
  }
  fb.textContent = message;
  fb.style.background = success ? 'rgba(201,168,76,0.1)' : 'rgba(192,57,43,0.1)';
  fb.style.color = success ? 'var(--gold)' : 'var(--red-accent)';
  fb.style.border = `1px solid ${success ? 'rgba(201,168,76,0.2)' : 'rgba(192,57,43,0.2)'}`;
}

// ---- Nexus orb (investigacion page + hero mini variant) ----
// Port of the IudexNexus widget — wave shell, orbit ring, constellation nodes
// and central orb with aurora swirl. Default state: listening.
function initNexusOrb() {
  const canvases = document.querySelectorAll('[data-nexus-orb]');
  canvases.forEach(initOneNexusOrb);
}

function initOneNexusOrb(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Variants:
  //   default ('full')  — investigación page, all layers, normal speed
  //   'mini'            — homepage hero badge: ambient, slower, fewer layers, lighter compositing
  const variant = canvas.dataset.nexusOrbVariant || 'full';
  const isMini = variant === 'mini';

  const C = {
    indigoDeep: { r: 26, g: 42, b: 92 },
    indigoCyan: { r: 43, g: 90, b: 138 },
    teal:       { r: 13, g: 61, b: 58 },
    tealLight:  { r: 26, g: 107, b: 101 },
    gold:       { r: 201, g: 168, b: 76 }
  };
  const rgba = (c, a) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;

  const NODE_BASE  = [0, 90, 198, 288];
  const NODE_SPEED = [1.0, 0.7, 1.3, 0.9];
  const NODE_COLOR = [C.indigoCyan, C.tealLight, C.indigoDeep, C.gold];

  const STATE = isMini
    ? { breatheSec: 5.0, orbitSec: 48.0, waveSec: 14.0, auroraSec: 28.0, waveAmp: 0.05, intensity: 0.55 }
    : { breatheSec: 2.0, orbitSec: 12.0, waveSec: 4.0, auroraSec: 9.0, waveAmp: 0.07, intensity: 0.7 };

  let cssSize = 0;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    cssSize = canvas.clientWidth;
    if (!cssSize) return;
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  let started = performance.now();
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => { visible = e.isIntersecting; });
    }, { threshold: 0 }).observe(canvas);
  }

  // Throttle to ~30fps on mini variant — ambient motion doesn't need 60fps
  // and frees the main thread for hero text + scrolling.
  const frameInterval = isMini ? 1000 / 30 : 0;
  let lastFrame = 0;

  function tick(now) {
    if (!visible || !cssSize) {
      requestAnimationFrame(tick);
      return;
    }
    if (frameInterval && now - lastFrame < frameInterval) {
      requestAnimationFrame(tick);
      return;
    }
    lastFrame = now;

    const t = (now - started) / 1000;
    const cx = cssSize / 2, cy = cssSize / 2;
    const baseR = cssSize * 0.28;
    const orbitR = baseR * 1.25;
    const nodeR  = baseR * (isMini ? 0.05 : 0.06);

    const breathe = (Math.sin((t / STATE.breatheSec) * Math.PI) + 1) / 2;
    const breatheScale = 0.94 + breathe * 0.06;
    const orbR = baseR * 0.65 * breatheScale;

    const orbit  = (t / STATE.orbitSec)  % 1;

    ctx.clearRect(0, 0, cssSize, cssSize);

    const wave   = (t / STATE.waveSec)   % 1;
    const aurora = (t / STATE.auroraSec) % 1;
    const waveR  = baseR * 1.55;
    drawWaveShell(cx, cy, waveR, wave, STATE.waveAmp);
    drawOrbitRing(cx, cy, orbitR);
    drawNodes(cx, cy, orbitR, nodeR, orbit);
    drawOrb(cx, cy, baseR, orbR, breathe, aurora, STATE.intensity);

    requestAnimationFrame(tick);
  }

  function drawWaveShell(cx, cy, radius, wavePhase, amplitude) {
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ringR = radius * (0.85 + i * 0.075);
      const phase = wavePhase * Math.PI * 2 + i * Math.PI / 3;
      ctx.beginPath();
      const segments = 80;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const r = ringR + Math.sin(a * 6 + phase) * (ringR * amplitude);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(C.indigoCyan, 0.20 - i * 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawOrbitRing(cx, cy, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(C.indigoCyan, 0.10);
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  function drawNodes(cx, cy, orbitR, nodeR, orbit) {
    for (let i = 0; i < 4; i++) {
      const ang = ((NODE_BASE[i] + orbit * 360 * NODE_SPEED[i]) % 360) * Math.PI / 180;
      const nx = cx + Math.cos(ang) * orbitR;
      const ny = cy + Math.sin(ang) * orbitR;
      const c = NODE_COLOR[i];

      ctx.save();
      ctx.filter = 'blur(4px)';
      ctx.beginPath();
      ctx.arc(nx, ny, nodeR * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = rgba(c, 0.20);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = rgba(c, 0.7);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawOrb(cx, cy, baseR, orbR, breathe, aurora, intensity) {
    const breatheBoost = breathe * 0.04;

    // outer glow
    ctx.save();
    const outerR = baseR * 1.85;
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
    g1.addColorStop(0,   rgba(C.indigoDeep, 0.13 + breatheBoost));
    g1.addColorStop(0.5, rgba(C.teal, 0.10));
    g1.addColorStop(1,   rgba(C.teal, 0));
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // core (offset top-left for light-source illusion)
    ctx.save();
    const offX = orbR * -0.2, offY = orbR * -0.25;
    const g2 = ctx.createRadialGradient(cx + offX, cy + offY, 0, cx, cy, orbR);
    g2.addColorStop(0,    rgba(C.indigoDeep, 1));
    g2.addColorStop(0.55, rgba(C.indigoCyan, 1));
    g2.addColorStop(1,    rgba(C.teal, 1));
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // aurora swirl + counter-rotating shimmer (conic gradients, additive)
    if (typeof ctx.createConicGradient === 'function') {
      const auroraAng = aurora * Math.PI * 2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const aurG = ctx.createConicGradient(auroraAng, cx, cy);
      aurG.addColorStop(0.0,  rgba(C.indigoCyan, 0));
      aurG.addColorStop(0.18, rgba(C.indigoCyan, 0.20 * intensity));
      aurG.addColorStop(0.42, rgba(C.tealLight, 0.16 * intensity));
      aurG.addColorStop(0.60, rgba(C.gold,       0.08 * intensity));
      aurG.addColorStop(0.80, rgba(C.indigoCyan, 0.16 * intensity));
      aurG.addColorStop(1.0,  rgba(C.indigoCyan, 0));
      ctx.fillStyle = aurG;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const shAng = -aurora * Math.PI * 2 + Math.PI;
      const shG = ctx.createConicGradient(shAng, cx, cy);
      shG.addColorStop(0.0,  'rgba(255,255,255,0)');
      shG.addColorStop(0.07, `rgba(255,255,255,${0.10 * intensity})`);
      shG.addColorStop(0.18, 'rgba(255,255,255,0)');
      shG.addColorStop(1.0,  'rgba(255,255,255,0)');
      ctx.fillStyle = shG;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // inner highlight (top-left lift)
    ctx.save();
    const hx = cx - orbR * 0.35, hy = cy - orbR * 0.4;
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, orbR * 0.6);
    hg.addColorStop(0, 'rgba(255,255,255,0.18)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // rim light
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(C.indigoCyan, 0.18 + breathe * 0.10);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNexusOrb);
} else {
  initNexusOrb();
}

// ---- Nexus banner reveal (typewriter title + staged orb sweep) ----
function initNexusReveal() {
  const banner = document.querySelector('.nexus-banner');
  if (!banner) return;

  const titleEl = banner.querySelector('.nexus-banner__title');
  if (!titleEl) return;

  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Pre-stage: clear title content, mark banner as staged
  titleEl.innerHTML = '';
  banner.classList.add('is-staged');

  const titleParts = [
    { text: 'Conocé a ', tag: null },
    { text: 'Nexus',     tag: 'em' }
  ];

  let played = false;
  const trigger = () => {
    if (played) return;
    played = true;
    runReveal();
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          io.disconnect();
          trigger();
        }
      });
    }, { threshold: 0.35 });
    io.observe(banner);
  } else {
    // Old browsers: skip the choreography
    titleEl.innerHTML = 'Conocé a <em>Nexus</em>';
    banner.classList.remove('is-staged');
    return;
  }

  // Safety net: if nothing has triggered after 6s (e.g. user landed past
  // the section), play anyway so the staged state never gets stuck.
  setTimeout(trigger, 6000);

  async function runReveal() {
    await typewrite(titleEl, titleParts, 70);
    await wait(350);
    banner.classList.add('is-revealed');
    banner.classList.remove('is-staged');
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function typewrite(container, parts, speedMs) {
    return new Promise((resolve) => {
      const totalChars = parts.reduce((sum, p) => sum + p.text.length, 0);
      let pos = 1;

      function render() {
        let remaining = pos;
        container.innerHTML = '';
        for (const part of parts) {
          const take = Math.min(Math.max(remaining, 0), part.text.length);
          if (take > 0) {
            const slice = part.text.slice(0, take);
            if (part.tag) {
              const el = document.createElement(part.tag);
              el.textContent = slice;
              container.appendChild(el);
            } else {
              container.appendChild(document.createTextNode(slice));
            }
          }
          remaining -= part.text.length;
          if (remaining < 0) break;
        }
      }

      function step() {
        if (pos > totalChars) { resolve(); return; }
        render();
        pos++;
        setTimeout(step, speedMs);
      }
      step();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNexusReveal);
} else {
  initNexusReveal();
}
