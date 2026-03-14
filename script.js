/* ════════════════════════════════════════════════
   LITECHANGE — Main Script
   ════════════════════════════════════════════════ */

// ── Nav scroll ──────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile burger ────────────────────────────────
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger?.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(isOpen));
  burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
});
mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

// ── Intersection observer (fade-up) ─────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── Active nav link ──────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const link = document.querySelector(`.nav__links a[href="#${entry.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navObserver.observe(s));

// ── Hero canvas — particle network ──────────────
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], raf;
  const N = 55;
  const MAX_DIST = 140;
  const LITE_GREEN = 'rgba(200,255,60,';
  const BLUE = 'rgba(74,144,184,';

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-.3, .3),
      vy: rand(-.2, .2),
      r: rand(1.5, 3),
      pulse: rand(0, Math.PI * 2),
      type: Math.random() > .7 ? 'blue' : 'green'
    };
  }

  function init() {
    particles = Array.from({ length: N }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `${LITE_GREEN}${alpha})`;
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
    }

    // dots
    particles.forEach(p => {
      p.pulse += 0.025;
      const glow = .5 + Math.sin(p.pulse) * .3;
      const col = p.type === 'blue' ? BLUE : LITE_GREEN;

      // glow halo
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, `${col}${glow * .4})`);
      grad.addColorStop(1, `${col}0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${col}${glow})`;
      ctx.fill();

      // move
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  resize();
  init();
  draw();
})();

// ── Counter animation ────────────────────────────
function animateCounter(el, target, suffix = '') {
  const duration = 1400;
  const start = performance.now();
  const startVal = 0;

  function update(ts) {
    const elapsed = ts - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * ease);
    el.textContent = current.toLocaleString('fr-FR') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const val = parseFloat(el.dataset.val);
    const suf = el.dataset.suffix || '';
    if (!isNaN(val)) animateCounter(el, val, suf);
    statsObserver.unobserve(el);
  });
}, { threshold: .5 });

// Mark stat values for animation
document.querySelectorAll('.stat__value').forEach(el => {
  const text = el.textContent.trim();
  const num = parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  const suffix = text.replace(/[\d\s,.]/g, '');
  if (!isNaN(num)) {
    el.dataset.val = num;
    el.dataset.suffix = suffix;
    el.textContent = '0';
    statsObserver.observe(el);
  }
});

// ── Form submit ──────────────────────────────────
const demoForm = document.getElementById('demoForm');
demoForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = demoForm.querySelector('button[type="submit"]');
  btn.textContent = 'Demande envoyée — réponse sous 24h';
  btn.style.background = 'var(--lc-color-success-500)';
  btn.style.color = '#fff';
  btn.disabled = true;
  btn.setAttribute('aria-label', 'Demande envoyée avec succès');
  // Announce to screen readers
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.className = 'sr-only';
  liveRegion.textContent = 'Votre demande de démo a été envoyée. Réponse sous 24 heures.';
  demoForm.appendChild(liveRegion);
});

// ── Smooth scroll for anchor links ──────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Keyboard accessibility: nav active style ────
const style = document.createElement('style');
style.textContent = `
  .nav__links a.active { color: var(--lc-color-paper-200); }
  .nav__links a.active::after {
    content: '';
    display: block;
    height: 2px;
    background: var(--lc-color-lite-300);
    margin-top: 2px;
    border-radius: 1px;
  }
  .form__input::placeholder { color: var(--lc-color-paper-500); }
  [data-theme="light"] .form__input::placeholder { color: var(--lc-color-paper-600); }
`;
document.head.appendChild(style);
