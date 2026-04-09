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

      // Send auto-reply email (single template for all flows)
      if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.templateId) {
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
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

      // Step 2: Send auto-reply email via EmailJS (non-blocking)
      // Team notification is no longer needed — registrations are visible
      // in the Supabase dashboard (Table Editor → registrations).
      if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.templateId) {
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
        }).catch(() => {
          // Email failed but registration is saved in Supabase — acceptable
        });
      }

      // Step 3: Show success
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

  // ---- Mobile features overlay ----
  const featureData = [
    { title: 'Gestión de expedientes', tag: 'Core', body: 'Organizá todos tus casos en un solo lugar. Seguimiento de estado, historial de actuaciones, vinculación de documentos y partes involucradas.' },
    { title: 'Automatización de escritura', tag: 'IA legal', body: 'Generá escritos, demandas y notificaciones a partir de plantillas inteligentes. Solo completás los datos relevantes; Iudex hace el resto.' },
    { title: 'Alertas de vencimientos', tag: 'Alertas', body: 'Nunca más un plazo vencido. Iudex te notifica con anticipación sobre vencimientos procesales y fechas clave de cada expediente.' },
    { title: 'Gestión de clientes', tag: 'Clientes', body: 'Ficha completa por cliente con historial de casos, documentos y comunicaciones. Atendé mejor a tus clientes con información siempre a mano.' },
    { title: 'Biblioteca de plantillas', tag: 'Plantillas', body: 'Accedé a un catálogo de modelos de documentos legales para los casos más frecuentes. Personalizables y actualizables por el equipo del estudio.' },
    { title: 'Informes y métricas', tag: 'Análisis', body: 'Visualizá el estado de tu estudio: expedientes activos, tiempo promedio de resolución, carga de trabajo por abogado y más.' },
  ];

  const overlay = document.getElementById('feature-overlay');
  if (overlay) {
    document.querySelectorAll('.features-mobile-grid__item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.feature, 10);
        const data = featureData[idx];
        if (!data) return;
        const iconEl = document.getElementById('overlay-icon');
        iconEl.innerHTML = btn.querySelector('.feature-card__icon').innerHTML;
        document.getElementById('overlay-title').textContent = data.title;
        document.getElementById('overlay-tag').textContent = data.tag;
        document.getElementById('overlay-body').textContent = data.body;
        overlay.classList.add('active');
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    const handle = overlay.querySelector('.feature-overlay__handle');
    if (handle) {
      handle.addEventListener('click', () => overlay.classList.remove('active'));
    }
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
