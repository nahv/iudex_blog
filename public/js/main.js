// ===========================
// IUDEX BLOG - Main JavaScript
// ===========================

// ---- Configuration ----
// Credentials are loaded from public/js/env.js (gitignored).
// See public/js/env.example.js for the template.
// If ENV is not loaded, everything degrades gracefully.
const EMAILJS_CONFIG = typeof ENV !== 'undefined' ? ENV.emailjs : {};
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

  // ---- EmailJS init ----
  if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey) {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  }

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
  const revealEls = document.querySelectorAll('.animate-on-scroll, .text-reveal, .stagger-children, .scale-in, .lead-reveal');
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

      // Save to Supabase (non-blocking for CTA forms)
      iudexDB.insert('registrations', {
        nombre: '',
        apellido: '',
        email: email,
        source: 'cta-' + (window.location.pathname.includes('blog') ? 'blog' :
                          window.location.pathname.includes('about') ? 'about' : 'home'),
      }).catch(() => {});

      // Send confirmation email to user
      if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.templateUserConfirm) {
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateUserConfirm, {
          email: email,
          nombre: '',
        }).catch(() => {});
      }

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

      // Step 2: Send confirmation email to user
      if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.templateUserConfirm) {
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateUserConfirm, {
          nombre: formData.nombre,
          email: formData.email,
        }).catch(() => {});
      }

      // Step 3: Send notification email to founders
      if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.templateFounderNotify) {
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateFounderNotify, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono || 'No proporcionado',
          perfil: formData.perfil || 'No seleccionado',
          provincia: formData.provincia,
          fuero: formData.fuero || 'No seleccionado',
          tamano: formData.tamano || 'No seleccionado',
          mensaje: formData.mensaje || 'Sin mensaje',
        }).catch(() => {});
      }

      // Step 4: Show success
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
      { title: 'Atajos de tipeo', tag: 'Oficio', body: 'Tipeás ,dr y se expande a "Dr. [tu firma completa]". Cada uno arma sus propias abreviaciones.' },
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

  // ---- Studio scrolly (Apple-style scroll-driven showcase) ----
  const scrollySteps = document.querySelectorAll('.studio-scrolly__step');
  const scrollyMedias = document.querySelectorAll('.studio-scrolly__media');
  const scrollyDots = document.querySelectorAll('.studio-scrolly__progress-dot');

  if (scrollySteps.length && scrollyMedias.length) {
    const activateStep = (index) => {
      scrollySteps.forEach(s => {
        s.classList.toggle('is-active', s.dataset.scrollyStep === String(index));
      });
      scrollyMedias.forEach(m => {
        m.classList.toggle('is-active', m.dataset.scrollyImg === String(index));
      });
      scrollyDots.forEach(d => {
        d.classList.toggle('is-active', d.dataset.scrollyDot === String(index));
      });
    };

    // Trigger when the step crosses the viewport's middle band (40%–60%).
    const observer = new IntersectionObserver((entries) => {
      // Among intersecting entries, pick the one with greatest visible ratio.
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
      // Triggers when the step's center is in the middle 20% of the viewport.
      rootMargin: '-40% 0px -40% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    scrollySteps.forEach(step => observer.observe(step));
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
