/* ═══════════════════════════════════════════════════════════
   FEMIX PLUMBING v2 — script.js
   SPA interactions · 3D tilt · Carousel · Chatbot (Claude)
   Notifications · PWA-ready · Fintech micro-interactions
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. LOADER
───────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader')?.classList.add('hidden');
    // Trigger hero animations
    document.querySelectorAll('.hero-section .fade-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120);
    });
  }, 1400);
});

/* ─────────────────────────────────────────────
   2. THEME SYSTEM
───────────────────────────────────────────── */
(function () {
  const html = document.documentElement;
  const btns = document.querySelectorAll('.theme-pill button');
  const KEY  = 'femix-theme';

  function apply(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
    btns.forEach(b => {
      const on = b.dataset.theme === t;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  const saved = localStorage.getItem(KEY);
  if (saved) {
    apply(saved);
  } else {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(dark ? 'dark' : 'light');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light');
    });
  }

  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.theme)));
})();

/* ─────────────────────────────────────────────
   3. TOAST NOTIFICATION SYSTEM
───────────────────────────────────────────── */
const Toast = {
  container: document.getElementById('toastContainer'),

  show(msg, type = 'info', duration = 4000) {
    const icons = { success: '✓', error: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '📢'}</span>
      <span class="toast-msg">${msg}</span>
      <button class="toast-close" aria-label="Close">✕</button>
    `;
    this.container.appendChild(toast);

    const remove = () => {
      toast.classList.add('leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, duration);
    return toast;
  },

  success(msg, d) { return this.show(msg, 'success', d); },
  error(msg, d)   { return this.show(msg, 'error', d); },
  info(msg, d)    { return this.show(msg, 'info', d); }
};

/* ─────────────────────────────────────────────
   4. PARTICLE CANVAS
───────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [], raf;

  class Pt {
    constructor() { this.reset(); }
    reset() {
      this.x   = Math.random() * W;
      this.y   = Math.random() * H;
      this.r   = Math.random() * 1.4 + 0.2;
      this.vx  = (Math.random() - 0.5) * 0.25;
      this.vy  = (Math.random() - 0.5) * 0.25;
      this.a   = Math.random();
      this.da  = (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
      this.hue = Math.random() < 0.4 ? 42 : Math.random() < 0.7 ? 228 : 190;
    }
  }

  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
  const spawn  = () => { pts = Array.from({ length: Math.min(Math.floor(W * H / 14000), 80) }, () => new Pt()); };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;
      p.a = Math.max(0, Math.min(1, p.a + p.da));
      if (p.a <= 0 || p.a >= 1) p.da *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},65%,65%,${p.a * 0.7})`;
      ctx.fill();

      for (let j = i + 1; j < pts.length; j++) {
        const dx = p.x - pts[j].x, dy = p.y - pts[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 105) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `hsla(${p.hue},55%,60%,${(1 - d / 105) * 0.08})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }
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
   5. HEADER — scroll elevation + active nav
───────────────────────────────────────────── */
const header = document.getElementById('header');
const totalH = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--total-h')) || 98;

window.addEventListener('scroll', () => {
  header?.classList.toggle('elevated', window.scrollY > 40);
}, { passive: true });

/* ─────────────────────────────────────────────
   6. MOBILE DRAWER
───────────────────────────────────────────── */
const hamBtn    = document.getElementById('hamBtn');
const mobDrawer = document.getElementById('mobDrawer');
const mobOverlay = document.getElementById('mobOverlay');

function openDrawer() {
  mobDrawer?.classList.add('open');
  mobOverlay?.classList.add('visible');
  hamBtn?.classList.add('open');
  hamBtn?.setAttribute('aria-expanded', 'true');
  mobDrawer?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  mobDrawer?.classList.remove('open');
  mobOverlay?.classList.remove('visible');
  hamBtn?.classList.remove('open');
  hamBtn?.setAttribute('aria-expanded', 'false');
  mobDrawer?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

hamBtn?.addEventListener('click', () => mobDrawer?.classList.contains('open') ? closeDrawer() : openDrawer());
mobOverlay?.addEventListener('click', closeDrawer);

/* ─────────────────────────────────────────────
   7. SPA SMOOTH NAVIGATION
───────────────────────────────────────────── */
function scrollToSection(id) {
  const el = document.getElementById(id) || document.querySelector(id);
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - totalH(),
    behavior: 'smooth'
  });
  closeDrawer();
}

document.querySelectorAll('[data-nav], a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    scrollToSection(href);
  });
});

/* ─────────────────────────────────────────────
   8. SECTION INTERSECTION + SIDE DOTS + NAV ACTIVE
───────────────────────────────────────────── */
const sections  = document.querySelectorAll('[data-section]');
const sideDots  = document.querySelectorAll('.dot');
const navLinks  = document.querySelectorAll('.nav-link[data-section]');

const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      sideDots.forEach(d => d.classList.toggle('active', d.dataset.target === id));
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObs.observe(s));

sideDots.forEach(dot => {
  dot.addEventListener('click', () => scrollToSection('#' + dot.dataset.target));
});

/* ─────────────────────────────────────────────
   9. SCROLL REVEAL
───────────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObs.observe(el));

/* ─────────────────────────────────────────────
   10. HERO FADE-UP (non-hero sections)
───────────────────────────────────────────── */
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-up:not(.hero-section .fade-up)').forEach(el => fadeObs.observe(el));

/* ─────────────────────────────────────────────
   11. LIVE CLOCK
───────────────────────────────────────────── */
(function () {
  const el = document.getElementById('clock');
  if (!el) return;

  function tick() {
    const now  = new Date();
    const h    = String(now.getHours() % 12 || 12).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const s    = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const day  = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const date = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

    el.innerHTML = `<span class="ck-date">${day} · ${date}</span><span class="ck-time">${h}:${m}:${s} <small style="opacity:.55;font-size:.64em">${ampm}</small></span>`;
  }
  tick();
  setInterval(tick, 1000);
})();

/* ─────────────────────────────────────────────
   12. SERVICES TAB SYSTEM
───────────────────────────────────────────── */
const svcTabs   = document.querySelectorAll('.svc-tab');
const svcPanels = document.querySelectorAll('.svc-panel');

svcTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    svcTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    svcPanels.forEach(p => { p.classList.remove('active'); p.hidden = true; });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const panel = document.getElementById(`tab-${target}`);
    if (panel) { panel.classList.add('active'); panel.hidden = false; }
  });
});

/* Service CTA buttons → open contact modal pre-filled */
document.querySelectorAll('.svc-cta-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const service = btn.dataset.service;
    openModal('contactModal');
    const sel = document.getElementById('mfservice');
    if (sel && service) {
      for (const opt of sel.options) {
        if (opt.text.includes(service.replace(/&amp;/g, '&').split('(')[0].trim())) {
          opt.selected = true; break;
        }
      }
    }
  });
});

/* ─────────────────────────────────────────────
   13. REVIEWS CAROUSEL
───────────────────────────────────────────── */
(function () {
  const track   = document.getElementById('reviewsTrack');
  const prevBtn = document.getElementById('revPrev');
  const nextBtn = document.getElementById('revNext');
  const dotsWrap = document.getElementById('revDots');
  if (!track) return;

  const cards  = track.querySelectorAll('.review-card');
  let current  = 0;
  let perView  = 3;
  let autoPlay;

  function calcPerView() {
    if (window.innerWidth < 700) return 1;
    if (window.innerWidth < 1050) return 2;
    return 3;
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const count = Math.ceil(cards.length / perView);
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.className = 'rev-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goto(i));
      dotsWrap.appendChild(d);
    }
  }

  function goto(idx) {
    const count = Math.ceil(cards.length / perView);
    current = (idx + count) % count;
    const cardW = cards[0]?.offsetWidth + 20 || 0;
    track.style.transform = `translateX(-${current * perView * cardW}px)`;
    dotsWrap?.querySelectorAll('.rev-dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goto(current + 1); }
  function prev() { goto(current - 1); }

  prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn?.addEventListener('click', () => { next(); resetAuto(); });

  function startAuto() { autoPlay = setInterval(next, 5000); }
  function resetAuto()  { clearInterval(autoPlay); startAuto(); }

  // Touch/swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); resetAuto(); }
  });

  function init() {
    perView = calcPerView();
    buildDots();
    goto(0);
    startAuto();
  }

  init();
  let rDeb;
  window.addEventListener('resize', () => {
    clearTimeout(rDeb);
    rDeb = setTimeout(() => { perView = calcPerView(); buildDots(); goto(0); }, 250);
  });
})();

/* ─────────────────────────────────────────────
   14. 3D TILT EFFECT
───────────────────────────────────────────── */
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
  });
});

/* ─────────────────────────────────────────────
   15. MODAL SYSTEM
───────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  el.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal-overlay.active')) document.body.style.overflow = '';
}

// Contact modal triggers
document.getElementById('heroQuoteBtn')?.addEventListener('click', () => openModal('contactModal'));
document.getElementById('openContactModal')?.addEventListener('click', () => openModal('contactModal'));
document.getElementById('closeContactModal')?.addEventListener('click', () => closeModal('contactModal'));
document.getElementById('closeSuccessModal')?.addEventListener('click', () => closeModal('successModal'));

// Click outside to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
    if (chatWidget?.classList.contains('open')) closeChat();
  }
});

/* ─────────────────────────────────────────────
   16. SUCCESS TONE
───────────────────────────────────────────── */
function playTone() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 1.0);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 1.1);
    });
  } catch { /* silent fail */ }
}

/* ─────────────────────────────────────────────
   17. CONTACT FORMS — main + modal
───────────────────────────────────────────── */
async function handleFormSubmit(form, btn) {
  const invalids = [...form.querySelectorAll(':invalid')];
  if (invalids.length) {
    invalids.forEach(f => {
      f.style.borderColor = 'rgba(239,68,68,0.7)';
      f.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.1)';
      f.addEventListener('input', () => { f.style.borderColor = ''; f.style.boxShadow = ''; }, { once: true });
    });
    invalids[0].focus();
    Toast.error('Please fill in all required fields.');
    return;
  }

  const orig = btn.innerHTML;
  btn.innerHTML = '<span style="opacity:.7">Sending…</span>';
  btn.disabled = true;

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      form.reset();
      playTone();
      // Close contact modal if open
      closeModal('contactModal');
      setTimeout(() => openModal('successModal'), 80);
      // Browser notification
      triggerBrowserNotification('✅ Request Sent!', 'FEMIX team will contact you shortly.');
      Toast.success('Message sent! We\'ll get back to you soon.');
    } else {
      Toast.error('Send failed. Please try again or call us directly.');
    }
  } catch {
    Toast.error('Connection error. Please check your network and try again.');
  } finally {
    btn.innerHTML = orig;
    btn.disabled = false;
  }
}

document.getElementById('contactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  handleFormSubmit(e.target, document.getElementById('submitBtn'));
});

document.getElementById('modalContactForm')?.addEventListener('submit', e => {
  e.preventDefault();
  handleFormSubmit(e.target, document.getElementById('modalSubmitBtn'));
});

/* ─────────────────────────────────────────────
   18. PWA + BROWSER NOTIFICATIONS
───────────────────────────────────────────── */
async function triggerBrowserNotification(title, body) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'images/femix-logo.webp',
        badge: 'images/femix-logo.webp',
        tag: 'femix-notification'
      });
    } catch { /* Safari silent fail */ }
  }
}

// Service Worker registration (PWA-ready)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* No SW file = silent */ });
}

// Ask for notification permission after 15s
setTimeout(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Toast.info('Enable notifications to receive updates from FEMIX Plumbing.');
  }
}, 15000);

/* ─────────────────────────────────────────────
   19. BACK TO TOP
───────────────────────────────────────────── */
const bttBtn = document.getElementById('btt');
window.addEventListener('scroll', () => {
  if (!bttBtn) return;
  const show = window.scrollY > 500;
  bttBtn.style.opacity = show ? '1' : '0';
  bttBtn.style.pointerEvents = show ? 'auto' : 'none';
  bttBtn.classList.toggle('show', show);
}, { passive: true });
bttBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ─────────────────────────────────────────────
   20. FOOTER YEAR
───────────────────────────────────────────── */
const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

/* ─────────────────────────────────────────────
   21. AI CHATBOT — Claude API, streaming, fintech UI
───────────────────────────────────────────── */
(function () {

  const SYSTEM_PROMPT = `You are FEMIX AI — a sharp, professional, and friendly assistant for FEMIX Plumbing Services, based in Ile Ife, Osun State, Nigeria.

COMPANY INFO:
- Name: FEMIX Plumbing Services
- Location: Ile Ife, Osun State, Nigeria  
- Phone: +234 906 0708 332
- Email: femixplumbingservices931@gmail.com
- Hours: Mon–Sat 7am–7pm (24/7 Emergency available)
- Est. 2019 · Licensed & Certified

SERVICES:
1. Residential Plumbing — leaks, pipes, bathroom/kitchen, heaters, drains
2. Commercial & Estate — large buildings, hotels, offices, estates
3. Water Systems & Borehole — boreholes, tanks, pumps, reticulation
4. Bathroom & Kitchen — complete fit-outs, showers, fixtures
5. Leak Detection & Diagnostics — non-invasive, underground, pressure testing
6. Water Efficiency & Conservation — eco-retrofits, dual-flush, water-saving
7. 24/7 Emergency — burst pipes, severe leaks, blocked drains, floods

TONE: Professional yet warm. Concise (2–3 sentences max per point). Nigerian-friendly. Always include a follow-up or CTA. Never guess prices — always recommend a free quote. For emergencies, immediately give the phone number.`;

  let history = [];
  let isThinking = false;

  const chatWidget = document.getElementById('chatWidget');
  const chatTrigger = document.getElementById('chatTrigger');
  const chatPanel  = document.getElementById('chatPanel');
  const chatBody   = document.getElementById('chatMessages');
  const chatInput  = document.getElementById('chatInput');
  const chatSend   = document.getElementById('chatSend');
  const chatMin    = document.getElementById('chatMinimize');
  const quickWrap  = document.getElementById('chatQuick');

  if (!chatWidget) return;

  /* Open / Close */
  function openChat() {
    chatWidget.classList.add('open');
    chatTrigger.setAttribute('aria-expanded', 'true');
    chatPanel.setAttribute('aria-hidden', 'false');
    if (!chatBody.hasChildNodes()) welcome();
    setTimeout(() => chatInput?.focus(), 380);
  }

  function closeChat() {
    chatWidget.classList.remove('open');
    chatTrigger.setAttribute('aria-expanded', 'false');
    chatPanel.setAttribute('aria-hidden', 'true');
  }

  chatTrigger.addEventListener('click', () => chatWidget.classList.contains('open') ? closeChat() : openChat());
  chatMin?.addEventListener('click', closeChat);

  /* Welcome */
  function welcome() {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    addBotMsg(`${g}! 👋 I'm the **FEMIX AI** assistant.\n\nI can help with service info, pricing, bookings, or connect you with our team directly. What do you need?`);
  }

  /* Time string */
  function timeStr() {
    const n = new Date();
    return `${n.getHours() % 12 || 12}:${String(n.getMinutes()).padStart(2,'0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`;
  }

  /* Format text */
  function fmt(text) {
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\n/g,'<br>');
  }

  /* Add bot message */
  function addBotMsg(text) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';

    const av = document.createElement('div');
    av.className = 'msg-av'; av.setAttribute('aria-hidden','true'); av.textContent = '💧';

    const col = document.createElement('div');
    col.className = 'msg-col';

    const bub = document.createElement('div');
    bub.className = 'msg-bub';
    bub.innerHTML = fmt(text);

    const time = document.createElement('div');
    time.className = 'msg-time'; time.textContent = timeStr();

    col.append(bub, time);
    wrap.append(av, col);
    chatBody.appendChild(wrap);
    scrollDown();
    return bub;
  }

  /* Add user message */
  function addUserMsg(text) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg user';

    const col = document.createElement('div');
    col.className = 'msg-col';

    const bub = document.createElement('div');
    bub.className = 'msg-bub';
    bub.innerHTML = fmt(text);

    const time = document.createElement('div');
    time.className = 'msg-time'; time.textContent = timeStr();

    col.append(bub, time);
    wrap.appendChild(col);
    chatBody.appendChild(wrap);
    scrollDown();
  }

  /* Typing indicator */
  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot'; wrap.id = 'chatTyping';
    const av = document.createElement('div');
    av.className = 'msg-av'; av.textContent = '💧';
    const ind = document.createElement('div');
    ind.className = 'typing-ind';
    ind.innerHTML = '<span></span><span></span><span></span>';
    wrap.append(av, ind);
    chatBody.appendChild(wrap);
    scrollDown();
  }

  function hideTyping() { document.getElementById('chatTyping')?.remove(); }
  function scrollDown()  { requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; }); }

  /* Send message */
  async function sendMsg(text) {
    if (!text.trim() || isThinking) return;
    isThinking = true;
    chatSend.disabled = true;
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Hide quick chips on first user message
    if (quickWrap) quickWrap.style.display = 'none';

    addUserMsg(text);
    history.push({ role: 'user', content: text });

    showTyping();

    // Simulate a brief delay before API call (feels more natural)
    await new Promise(r => setTimeout(r, 400));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: history
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Please call us at +234 906 0708 332.";

      history.push({ role: 'assistant', content: reply });
      if (history.length > 22) history = history.slice(-22);

      hideTyping();

      // Streaming-style text reveal
      await streamText(reply);

    } catch (err) {
      console.error('Chat error:', err);
      hideTyping();
      const bub = addBotMsg("I'm having trouble connecting right now. Please:\n📞 **Call: +234 906 0708 332**\n✉️ Email: femixplumbingservices931@gmail.com");
      bub.classList.add('error');
    } finally {
      isThinking = false;
      chatSend.disabled = chatInput.value.trim().length === 0;
    }
  }

  /* Streaming text animation */
  async function streamText(fullText) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    const av = document.createElement('div');
    av.className = 'msg-av'; av.textContent = '💧';
    const col = document.createElement('div');
    col.className = 'msg-col';
    const bub = document.createElement('div');
    bub.className = 'msg-bub streaming';
    const time = document.createElement('div');
    time.className = 'msg-time'; time.textContent = timeStr();
    col.append(bub, time);
    wrap.append(av, col);
    chatBody.appendChild(wrap);
    scrollDown();

    // Word-by-word stream
    const words = fullText.split(' ');
    let built = '';
    for (const word of words) {
      built += (built ? ' ' : '') + word;
      bub.innerHTML = fmt(built);
      scrollDown();
      await new Promise(r => setTimeout(r, 28 + Math.random() * 25));
    }
    bub.classList.remove('streaming');
  }

  /* Input events */
  chatInput?.addEventListener('input', () => {
    chatSend.disabled = chatInput.value.trim().length === 0;
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
  });

  chatInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const t = chatInput.value.trim();
      if (t) sendMsg(t);
    }
  });

  chatSend?.addEventListener('click', () => {
    const t = chatInput?.value.trim();
    if (t) sendMsg(t);
  });

  /* Quick chips */
  document.querySelectorAll('.quick-chip').forEach(c => {
    c.addEventListener('click', () => {
      const msg = c.dataset.msg;
      if (msg) sendMsg(msg);
    });
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (chatWidget.classList.contains('open') && !chatWidget.contains(e.target)) closeChat();
  });

  /* Auto-open after 10s on first visit */
  if (!sessionStorage.getItem('femix-chat-v2')) {
    setTimeout(() => {
      if (!chatWidget.classList.contains('open')) {
        openChat();
        sessionStorage.setItem('femix-chat-v2', '1');
        Toast.info('💧 FEMIX AI is ready to help you!');
      }
    }, 10000);
  }

})();

/* ─────────────────────────────────────────────
   22. MICRO-INTERACTIONS: Button ripple
───────────────────────────────────────────── */
document.querySelectorAll('.btn-primary, .btn-ghost, .svc-cta-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const r = document.createElement('span');
    r.style.cssText = `
      position:absolute;border-radius:50%;
      width:80px;height:80px;margin-left:-40px;margin-top:-40px;
      background:rgba(255,255,255,0.12);pointer-events:none;
      animation:ripple 0.55s ease-out forwards;
      left:${e.offsetX}px;top:${e.offsetY}px;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes ripple{from{transform:scale(0);opacity:1}to{transform:scale(3.5);opacity:0}}';
    if (!document.getElementById('rippleStyle')) {
      style.id = 'rippleStyle';
      document.head.appendChild(style);
    }
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  });
});

/* ─────────────────────────────────────────────
   23. SECTION PROGRESS INDICATOR
───────────────────────────────────────────── */
(function () {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position:fixed;top:0;left:0;height:2px;z-index:9999;
    background:linear-gradient(90deg,#C8A44A,#F5D990,#3D6FFF);
    transition:width 0.1s ease;pointer-events:none;width:0%;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = h > 0 ? `${(window.scrollY / h) * 100}%` : '0%';
  }, { passive: true });
})();


document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});

document.addEventListener("keydown", function(e) {
  // Convert key to lowercase so it catches 'C' and 'c'
  const key = e.key.toLowerCase(); 
  
  if (e.ctrlKey && (key === "c" || key === "u" || key === "s" || key === "a" || key === "p")) {
    e.preventDefault();
    alert("Content is protected by FEMIX Plumbing."); // Optional: lets them know why it failed
  }
});

document.addEventListener("visibilitychange", function() {
  if (document.hidden) {
    document.body.style.filter = "blur(10px)";
  } else {
    document.body.style.filter = "none";
  }
});


