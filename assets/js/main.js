// Utility: prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header: mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Reveal-on-scroll animations
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  if (prefersReducedMotion) {
    revealEls.forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }
}

// Gallery lightbox
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
if (gallery && lightbox && lightboxImg && lightboxCaption && lightboxClose) {
  gallery.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.tagName === 'IMG') {
      const figure = target.closest('figure');
      const captionText = figure?.querySelector('figcaption')?.textContent || '';
      lightboxImg.src = target.src;
      lightboxImg.alt = target.alt || '';
      lightboxCaption.textContent = captionText;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    }
  });
  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.hidden && e.key === 'Escape') closeLightbox();
  });
}

// Contact form validation (basic)
const form = document.getElementById('contact-form');
if (form) {
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email'); // may not exist
  const messageEl = document.getElementById('message');
  const statusEl = document.getElementById('form-status');
  const errName = document.getElementById('error-name');
  const errEmail = document.getElementById('error-email'); // may not exist
  const errMessage = document.getElementById('error-message');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    if (errName) errName.textContent = '';
    if (errEmail) errEmail.textContent = '';
    if (errMessage) errMessage.textContent = '';

    if (!nameEl || !nameEl.value.trim()) {
      if (errName) errName.textContent = 'Please enter your name.';
      valid = false;
    }
    if (messageEl && !messageEl.value.trim()) {
      if (errMessage) errMessage.textContent = 'Please include a message.';
      valid = false;
    }
    if (emailEl) {
      const emailVal = emailEl.value.trim();
      if (!emailRegex.test(emailVal)) {
        if (errEmail) errEmail.textContent = 'Enter a valid email address.';
        valid = false;
      }
    }
    if (!valid) return;

    const targetNumber = '601133321767';
    const lines = [
      'New website enquiry',
      `Name: ${nameEl ? nameEl.value.trim() : ''}`,
    ];
    if (emailEl && emailEl.value.trim()) lines.push(`Email: ${emailEl.value.trim()}`);
    if (messageEl && messageEl.value.trim()) lines.push(`Message: ${messageEl.value.trim()}`);

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${targetNumber}?text=${text}`;
    const win = window.open(url, '_blank');
    if (!win) {
      window.location.href = url;
    }
    if (statusEl) statusEl.textContent = 'Opening WhatsApp…';
    form.reset();
  });
}

// Hero: randomize background image from hero folder
(function() {
  const heroImg = document.querySelector('.hero-bg img');
  if (!heroImg) return;
  const originalSrc = heroImg.getAttribute('src');

  const loadCheck = (src) => new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = src;
    setTimeout(() => done(false), 4000);
  });

  const trySetFirstThatLoads = async (candidates) => {
    for (let i = 0; i < candidates.length; i++) {
      const src = candidates[i];
      if (src === heroImg.src || src === originalSrc) continue;
      const ok = await loadCheck(src);
      if (ok) { heroImg.src = src; return true; }
    }
    return false;
  };

  try {
    const url = new URL(originalSrc, window.location.href);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const fileName = pathParts[pathParts.length - 1] || '';
    const dirPath = url.pathname.replace(fileName, '');
    const match = fileName.match(/^(.*?)(\d+)(\.(?:jpeg|jpg|png|webp))$/i);
    if (!match) return;

    const baseName = match[1];
    const currentExt = match[3].toLowerCase();
    const allExts = [currentExt, '.jpeg', '.jpg', '.webp', '.png']
      .map(e => e.toLowerCase())
      .filter((e, i, arr) => arr.indexOf(e) === i);

    const storageKey = 'heroImageList_' + dirPath + baseName;

    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length) {
        const shuffled = list.slice().sort(() => Math.random() - 0.5);
        trySetFirstThatLoads(shuffled).then((set) => {
          if (!set) { try { localStorage.removeItem(storageKey); } catch (_) {} }
        });
      }
    }

    const maxToProbe = 50;
    const indices = Array.from({ length: maxToProbe }, (_, i) => i + 1);
    const candidates = [];
    indices.forEach(i => { allExts.forEach(ext => { candidates.push(dirPath + baseName + i + ext); }); });

    Promise.all(candidates.map(src => loadCheck(src).then(ok => ok ? src : null)))
      .then(results => {
        const found = [];
        const seen = new Set();
        results.forEach(r => { if (r && !seen.has(r)) { seen.add(r); found.push(r); } });
        if (found.length) {
          try { localStorage.setItem(storageKey, JSON.stringify(found)); } catch (_) {}
          const shuffled = found.slice().sort(() => Math.random() - 0.5);
          return trySetFirstThatLoads(shuffled);
        }
        return false;
      })
      .then(set => { if (!set) { heroImg.src = originalSrc; } });
  } catch (_) {
    heroImg.src = originalSrc;
  }
})();

// Header: mark active nav based on current URL
(function() {
  const navMenu = document.getElementById('nav-menu');
  if (!navMenu) return;
  const links = Array.from(navMenu.querySelectorAll('a[href]'));
  if (!links.length) return;

  let current = location.pathname.split('/').pop();
  if (!current || current === '' || current === '/') current = 'index.html';

  links.forEach(a => a.classList.remove('active'));

  let activeLink = links.find(a => (a.getAttribute('href') || '').replace(/^\.\//, '') === current);
  if (!activeLink && current === 'index.html') {
    activeLink = links.find(a => (a.getAttribute('href') || '') === '/' || (a.getAttribute('href') || '').endsWith('/index.html'));
  }
  if (activeLink) activeLink.classList.add('active');
})();

// Back to top button behavior
(function() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const toggle = () => {
    if (window.scrollY > 300) btn.classList.add('show');
    else btn.classList.remove('show');
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// Years in business (since 2022)
(function() {
  const el = document.getElementById('years-in-business');
  if (!el) return;
  const openedYear = 2022;
  const now = new Date();
  let years = now.getFullYear() - openedYear;
  const hasPassedAnniversary = (now.getMonth() > 0) || (now.getMonth() === 0 && now.getDate() >= 1);
  if (!hasPassedAnniversary) years -= 1;
  if (years < 1) years = 1;
  el.textContent = String(years);
})();


// Gallery images
window.loadLocalHeroGalleryFallback = async function() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  const renderFigures = (srcs) => {
    if (!Array.isArray(srcs) || srcs.length === 0) return false;
    const html = srcs.map(src => `<figure class="gallery-item"><img loading="lazy" src="${src}" alt=""></figure>`).join('');
    gallery.innerHTML = html;
    return true;
  };

  const folders = [
    { dir: 'hero/', prefix: 'hero' },
    { dir: 'images/', prefix: 'image' }
  ];
  const exts = ['.jpeg', '.jpg', '.webp', '.png'];
  const maxN = 50;
  const candidates = [];

  for (const { dir, prefix } of folders) {
    for (let i = 1; i <= maxN; i++) {
      for (const ext of exts) {
        candidates.push(`${dir}${prefix}${i}${ext}`);
      }
    }
  }

  const check = (src) => new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (val) => { if (!done) { done = true; resolve(val); } };
    img.onload = () => finish(src);
    img.onerror = () => finish(null);
    img.src = src;
    setTimeout(() => finish(null), 4000);
  });

  const results = await Promise.all(candidates.map(check));
  const found = results.filter(Boolean);
  if (found.length) renderFigures(found.slice(0, 24));
};


// Always load local gallery images
(function() {
  const onReady = () => {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    // Directly load local gallery images, no fallback
    window.loadLocalHeroGalleryFallback();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();


// Button ripple interaction
(function() {
  const addRipple = (e) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    target.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 600);
  };
  const init = () => {
    document.querySelectorAll('.button').forEach(btn => {
      btn.addEventListener('click', addRipple);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Nav moving underline
(function() {
  const menu = document.getElementById('nav-menu');
  if (!menu) return;
  const links = Array.from(menu.querySelectorAll('a[href]'));
  if (!links.length) return;

  const underline = document.createElement('div');
  underline.className = 'nav-underline';
  menu.appendChild(underline);

  const moveTo = (el) => {
    const navRect = menu.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = r.left - navRect.left + 8; // .5rem
    const width = r.width - 16; // account for left/right padding
    underline.style.left = left + 'px';
    underline.style.width = Math.max(0, width) + 'px';
  };

  const active = menu.querySelector('a.active') || links;
  if (active) moveTo(active);

  links.forEach(a => {
    a.addEventListener('click', (e) => {
      if (a.target === '' || a.target === '_self') {
        e.preventDefault();
        moveTo(a);
        const href = a.getAttribute('href');
        setTimeout(() => { if (href) window.location.href = href; }, 150);
      }
    });
  });

  window.addEventListener('resize', () => {
    const current = menu.querySelector('a.active') || document.activeElement || links;
    if (current instanceof HTMLElement) moveTo(current);
  });
})();
