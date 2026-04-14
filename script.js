/* ═══════════════════════════════════════════════════════════
   FEMIX PLUMBING  —  script.js
   All interactive logic: theme, particles, nav, scroll,
   accordion, clock, form, modal, tone, back-to-top
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   1. THEME SYSTEM
───────────────────────────────────────────── */
(function () {
  const html    = document.documentElement;
  const btns    = document.querySelectorAll('.theme-pill button');
  const KEY     = 'femix-theme';
  const saved   = localStorage.getItem(KEY) || 'dark';

  function apply(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
    btns.forEach(b => {
      const active = b.dataset.theme === t;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  }

  apply(saved);
  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.theme)));

  // Sync with OS preference if no stored choice
  if (!localStorage.getItem(KEY)) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', e => apply(e.matches ? 'dark' : 'light'));
  }
})();

/* ─────────────────────────────────────────────
   2. PARTICLE CANVAS
───────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [], raf;

  function Pt() { this.init(); }
  Pt.prototype.init = function () {
    this.x   = Math.random() * W;
    this.y   = Math.random() * H;
    this.r   = Math.random() * 1.5 + 0.3;
    this.vx  = (Math.random() - 0.5) * 0.28;
    this.vy  = (Math.random() - 0.5) * 0.28;
    this.a   = Math.random();
    this.da  = (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
    this.hue = Math.random() < 0.5 ? 42 : 228; // gold or blue
  };

  function resize() {
    W = canvas.width  = innerWidth;
    H = canvas.height = innerHeight;
  }

  function spawn() {
    pts = Array.from(
      { length: Math.min(Math.floor(W * H / 13000), 85) },
      () => new Pt()
    );
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach((p, i) => {
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;
      p.a += p.da;
      if (p.a > 1 || p.a < 0) { p.da *= -1; p.a = Math.max(0, Math.min(1, p.a)); }

      // dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},65%,65%,${p.a * 0.75})`;
      ctx.fill();

      // connection lines
      for (let j = i + 1; j < pts.length; j++) {
        const dx = p.x - pts[j].x, dy = p.y - pts[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `hsla(${p.hue},60%,60%,${(1 - d / 110) * 0.09})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    raf = requestAnimationFrame(draw);
  }

  resize(); spawn(); draw();

  let deb;
  window.addEventListener('resize', () => {
    clearTimeout(deb);
    deb = setTimeout(() => { cancelAnimationFrame(raf); resize(); spawn(); draw(); }, 200);
  });
})();

/* ─────────────────────────────────────────────
   3. HEADER SCROLL ELEVATION
───────────────────────────────────────────── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header?.classList.toggle('elevated', window.scrollY > 40);
}, { passive: true });

/* ─────────────────────────────────────────────
   4. HAMBURGER + MOBILE MENU
───────────────────────────────────────────── */
const hamBtn  = document.getElementById('hamBtn');
const mobMenu = document.getElementById('mobMenu');

function closeMenu() {
  mobMenu?.classList.remove('open');
  hamBtn?.classList.remove('open');
  hamBtn?.setAttribute('aria-expanded', 'false');
}

hamBtn?.addEventListener('click', () => {
  const isOpen = mobMenu?.classList.toggle('open');
  hamBtn.classList.toggle('open', isOpen);
  hamBtn.setAttribute('aria-expanded', String(isOpen));
});

mobMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

document.addEventListener('click', e => {
  if (mobMenu?.classList.contains('open') &&
      !mobMenu.contains(e.target) &&
      !hamBtn.contains(e.target)) closeMenu();
});

/* ─────────────────────────────────────────────
   5. SCROLL REVEAL (IntersectionObserver)
───────────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.09, rootMargin: '0px 0px -45px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
  .forEach(el => revealObs.observe(el));

/* ─────────────────────────────────────────────
   6. SERVICE ACCORDION (one open at a time)
───────────────────────────────────────────── */
const svcCards = document.querySelectorAll('.svc-card');
svcCards.forEach(card => {
  card.addEventListener('toggle', function () {
    if (this.open) {
      svcCards.forEach(c => { if (c !== this && c.open) c.open = false; });
    }
  });
});

/* ─────────────────────────────────────────────
   7. LIVE CLOCK
───────────────────────────────────────────── */
function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;

  function tick() {
    const now  = new Date();
    const h    = now.getHours() % 12 || 12;
    const m    = String(now.getMinutes()).padStart(2, '0');
    const s    = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const day  = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const date = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

    el.innerHTML = `
      <span class="ck-date">${day} · ${date}</span>
      <span class="ck-time">${h}:${m}:${s} <small style="opacity:.6;font-size:.65em">${ampm}</small></span>
    `;
  }

  tick();
  setInterval(tick, 1000);
}
startClock();

/* ─────────────────────────────────────────────
   8. TONE / CHIME ON FORM SUCCESS
   Uses Web Audio API — no external dependency
───────────────────────────────────────────── */
function playSuccessTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Three-note ascending chime: C5 → E5 → G5
    const notes  = [523.25, 659.25, 783.99];
    const delays = [0, 0.18, 0.36];

    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type      = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delays[i]);

      // Soft bell envelope
      gain.gain.setValueAtTime(0, ctx.currentTime + delays[i]);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delays[i] + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delays[i] + 1.1);

      osc.start(ctx.currentTime + delays[i]);
      osc.stop(ctx.currentTime + delays[i] + 1.2);
    });
  } catch (err) {
    // AudioContext unavailable — fail silently
    console.warn('Audio unavailable:', err);
  }
}

/* ─────────────────────────────────────────────
   9. CONTACT FORM — fetch submit + tone
───────────────────────────────────────────── */
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const modal     = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

form?.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Highlight invalid fields
  const invalids = [...this.querySelectorAll(':invalid')];
  if (invalids.length) {
    invalids.forEach(f => {
      f.style.borderColor = 'rgba(239,68,68,0.7)';
      f.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.12)';
      f.addEventListener('input', () => {
        f.style.borderColor = '';
        f.style.boxShadow   = '';
      }, { once: true });
    });
    invalids[0].focus();
    return;
  }

  // Loading state
  const original = submitBtn.textContent;
  submitBtn.textContent = 'Sending…';
  submitBtn.disabled    = true;

  try {
    const res = await fetch(this.action, {
      method:  'POST',
      body:    new FormData(this),
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      form.reset();
      // Play chime BEFORE showing modal
      playSuccessTone();
      // Brief delay so tone starts before modal opens
      setTimeout(() => modal?.classList.add('active'), 80);
      submitBtn.textContent = original;
      submitBtn.disabled    = false;
    } else {
      submitBtn.textContent = '⚠ Error — Try Again';
      submitBtn.disabled    = false;
    }
  } catch {
    submitBtn.textContent = '⚠ Check Connection';
    submitBtn.disabled    = false;
  }
});

/* ─────────────────────────────────────────────
   10. MODAL CLOSE
───────────────────────────────────────────── */
function closeModal() { modal?.classList.remove('active'); }

modalClose?.addEventListener('click', closeModal);
modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─────────────────────────────────────────────
   11. BACK TO TOP
───────────────────────────────────────────── */
const btt = document.getElementById('btt');
window.addEventListener('scroll', () => {
  btt?.classList.toggle('show', window.scrollY > 500);
}, { passive: true });
btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ─────────────────────────────────────────────
   12. SMOOTH SCROLL — internal links
───────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--total-h')) || 100;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - headerH,
      behavior: 'smooth',
    });
  });
});

/* ─────────────────────────────────────────────
   13. FOOTER YEAR
───────────────────────────────────────────── */
const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();
