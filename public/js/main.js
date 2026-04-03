// ===========================
// IUDEX BLOG - Main JavaScript
// ===========================

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
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  // ---- Intersection Observer for scroll animations ----
  const animEls = document.querySelectorAll('.animate-on-scroll');
  if (animEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    animEls.forEach(el => observer.observe(el));
  }

  // ---- Newsletter / CTA forms ----
  document.querySelectorAll('.js-email-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      const email = input ? input.value.trim() : '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormFeedback(form, 'Por favor ingresá un email válido.', false);
        return;
      }

      // Simulate submission
      const originalText = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = '¡Listo!';
        if (input) input.value = '';
        showFormFeedback(form, '¡Gracias! Te avisaremos cuando Iudex esté disponible.', true);
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 4000);
      }, 1000);
    });
  });

  // ---- Contact form ----
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = '¡Mensaje enviado!';
        showFormFeedback(contactForm, '¡Gracias por tu mensaje! Te responderemos a la brevedad.', true);
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 4000);
      }, 1200);
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

  // ---- Animated counter ----
  document.querySelectorAll('.js-counter').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.round(current) + (el.dataset.suffix || '');
          if (current >= target) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.5 });

    observer.observe(el);
  });

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