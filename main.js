// Theme toggle, nav, scroll reveal, weather, content, footer stamp, demo launch. v=sw-install
(function () {
  const t = document.querySelector('[data-theme-toggle]'), r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  const sun = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function apply() { r.setAttribute('data-theme', d); if (t) { t.innerHTML = d === 'dark' ? sun : moon; t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode'); } }
  apply();
  t && t.addEventListener('click', () => { d = d === 'dark' ? 'light' : 'dark'; apply(); });
})();

// ===== Sticky header: transparent over hero, cream once hero leaves view =====
const header = document.getElementById('header');
const hero = document.querySelector('.hero');
const headerH = () => header.offsetHeight || 72;
if (hero && 'IntersectionObserver' in window) {
  // Header turns cream only once the hero has scrolled up past the header band.
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => header.classList.toggle('scrolled', !e.isIntersecting));
    },
    { rootMargin: `-${headerH()}px 0px 0px 0px`, threshold: 0 }
  );
  heroObserver.observe(hero);
} else {
  // Fallback: use a generous threshold (a full header height) to avoid mobile-inertia flicker.
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > headerH());
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

// ===== Mobile menu =====
const mb = document.getElementById('menuBtn'), mm = document.getElementById('mobileMenu');
mb && mb.addEventListener('click', () => {
  const open = mm.classList.toggle('open');
  mb.setAttribute('aria-expanded', open);
});
mm && mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mm.classList.remove('open'); mb.setAttribute('aria-expanded', false); }));

// ===== Scroll reveal (progressive enhancement) =====
// Mark JS active so CSS hides .reveal only when JS can un-hide it.
document.documentElement.classList.add('js');
(function () {
  const items = Array.from(document.querySelectorAll('.reveal'));
  const show = el => el.classList.add('in');
  if (!('IntersectionObserver' in window)) { items.forEach(show); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach((el, i) => { el.style.transitionDelay = (i % 4 * 70) + 'ms'; io.observe(el); });
  // Safety net: anything still hidden shortly after full load gets revealed
  // (covers fast scroll, deep links, print, and headless screenshots).
  function sweep() { items.forEach(el => { if (!el.classList.contains('in')) { el.style.transitionDelay = '0ms'; show(el); io.unobserve(el); } }); }
  addEventListener('load', () => setTimeout(sweep, 1200));
  window.matchMedia('print').addEventListener('change', e => { if (e.matches) items.forEach(show); });
})();

// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Click-to-reveal cards =====
document.querySelectorAll('[data-card]').forEach(card => {
  function toggle() {
    const open = card.getAttribute('aria-expanded') === 'true';
    card.setAttribute('aria-expanded', String(!open));
  }
  card.addEventListener('click', (e) => {
    // don't toggle when clicking a real link inside the card
    if (e.target.closest('a')) return;
    toggle();
  });
  card.addEventListener('keydown', (e) => {
    if (e.target.closest('a')) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// ===== Hero capability pills -> jump to + open matching service card =====
(function () {
  const pills = document.querySelectorAll('.hero-tag[data-jump]');
  if (!pills.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const target = document.getElementById(pill.getAttribute('data-jump'));
      if (!target) return;
      // ensure the reveal animation isn't keeping it hidden
      target.classList.add('in');
      // open the card (matches click-to-reveal pattern)
      target.setAttribute('aria-expanded', 'true');
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      // brief highlight flash
      target.classList.remove('jump-flash');
      void target.offsetWidth; // restart animation
      target.classList.add('jump-flash');
      setTimeout(() => target.classList.remove('jump-flash'), 1400);
    });
  });
})();

// ===== Live weather rotator (Open-Meteo, keyless) =====
(function () {
  const rotator = document.getElementById('weatherRotator');
  if (!rotator) return;
  const cities = [
    { name: 'Zürich', lat: 47.3769, lon: 8.5417 },
    { name: 'Santa Fe', lat: 35.687, lon: -105.938 },
    { name: 'Halifax', lat: 44.6488, lon: -63.5752 },
    { name: 'Naples, FL', lat: 26.142, lon: -81.7948 },
  ];
  // WMO weather code -> [emoji, label]
  function wmo(code) {
    const m = {
      0: ['☀️', 'Clear'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
      45: ['🌫️', 'Fog'], 48: ['🌫️', 'Rime fog'],
      51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌦️', 'Heavy drizzle'],
      61: ['🌧️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'],
      71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'],
      80: ['🌦️', 'Showers'], 81: ['🌧️', 'Showers'], 82: ['⛈️', 'Violent showers'],
      95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm'], 99: ['⛈️', 'Thunderstorm'],
    };
    return m[code] || ['🌐', 'Conditions'];
  }
  // Graceful fallback shown if data is slow, blocked, or unavailable — so a visitor never sees bare loading text.
  const FALLBACK = '<span class="wx"><span class="wx-ico">🧭</span><span class="wx-city">Across our destinations</span><span class="wx-cond">Zürich · Santa Fe · the Maritimes · the Gulf coast</span></span>';
  let settled = false;
  function showFallback() { if (!settled) { settled = true; rotator.innerHTML = FALLBACK; } }
  // Per-request timeout so a hung connection never strands the widget on "Checking the skies…".
  function fetchCity(c) {
    const ctrl = ('AbortController' in window) ? new AbortController() : null;
    const t = setTimeout(() => ctrl && ctrl.abort(), 6000);
    return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`, ctrl ? { signal: ctrl.signal } : undefined)
      .then(r => r.ok ? r.json() : null)
      .then(j => j && j.current ? { name: c.name, temp: Math.round(j.current.temperature_2m), code: j.current.weather_code } : null)
      .catch(() => null)
      .finally(() => clearTimeout(t));
  }
  // Overall safety net: if nothing has rendered within 7s, show the fallback regardless.
  const safety = setTimeout(showFallback, 7000);
  let data = [];
  Promise.all(cities.map(fetchCity)).then(results => {
    clearTimeout(safety);
    data = results.filter(Boolean);
    if (settled) return;
    if (!data.length) { showFallback(); return; }
    settled = true;
    let i = 0;
    function render() {
      const d = data[i % data.length];
      const [ico, label] = wmo(d.code);
      rotator.innerHTML = `<span class="wx"><span class="wx-ico">${ico}</span><span class="wx-city">${d.name}</span><span class="wx-temp">${d.temp}°F</span><span class="wx-cond">${label}</span></span>`;
    }
    render();
    if (data.length > 1) setInterval(() => {
      const el = rotator.querySelector('.wx');
      if (el) el.classList.add('fade');
      setTimeout(() => { i++; render(); }, 450);
    }, 4200);
  });
})();

// ===== Editable content (content.json) drives field-notes, now-building, and spotlight =====
// Fallbacks below are used if content.json fails to load, so the page never breaks.
const CONTENT_FALLBACK = {
  fieldNotes: [
    'Understand the journey, then remove every point of friction.',
    'Mobile-first — because travel happens in the dead zones.',
    'Ship fast, then obsess over the details that feel effortless.',
    'The compass in our mark is a promise: we help people find their way.',
    'Every commit deploys to the edge — this site included.',
  ],
  spotlight: [
    { title: 'Maritimes Grand Loop', fact: 'A 12-day loop through Newfoundland & Nova Scotia — ferries, fishing villages, and iceberg alley off the northern coast.', url: 'https://maritimesgrandloop.com' },
    { title: 'Zürich Weekend', fact: 'Three days from Copenhagen to Zürich — lake, old town, and the alps, with logistics tuned to the minute.', url: 'https://zurich-weekend.com' },
    { title: 'Santa Fe June', fact: 'Seven nights at 7,200 feet — adobe, galleries, cliff dwellings, and a dawn balloon ride over the high desert.', url: 'https://santafejune.com' },
  ],
};

function initContent(c) {
  initFieldNote(Array.isArray(c.fieldNotes) && c.fieldNotes.length ? c.fieldNotes : CONTENT_FALLBACK.fieldNotes);
  initSpotlight(Array.isArray(c.spotlight) && c.spotlight.length ? c.spotlight : CONTENT_FALLBACK.spotlight);
}

function initFieldNote(notes) {
  const el = document.getElementById('fieldNote');
  if (!el) return;
  let i = 0;
  const set = () => { el.textContent = notes[i % notes.length]; };
  set();
  if (notes.length > 1) setInterval(() => {
    el.classList.add('fade');
    setTimeout(() => { i++; set(); el.classList.remove('fade'); }, 450);
  }, 5200);
}

function initSpotlight(items) {
  const body = document.getElementById('spotlightBody');
  const dotsWrap = document.getElementById('spotlightDots');
  if (!body || !dotsWrap) return;
  const titleEl = document.getElementById('spTitle');
  const factEl = document.getElementById('spFact');
  const linkEl = document.getElementById('spLink');
  const spots = items.map(s => ({ t: s.title, f: s.fact, u: s.url }));
  let i = 0, timer;
  function render(idx, animate) {
    i = (idx + spots.length) % spots.length;
    const s = spots[i];
    const swap = () => {
      titleEl.textContent = s.t; factEl.textContent = s.f; linkEl.href = s.u;
      dotsWrap.querySelectorAll('button').forEach((b, n) => {
        b.classList.toggle('active', n === i);
        b.setAttribute('aria-selected', String(n === i));
      });
      body.classList.remove('fade');
    };
    if (animate) { body.classList.add('fade'); setTimeout(swap, 450); } else swap();
  }
  dotsWrap.innerHTML = '';
  spots.forEach((s, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', s.t);
    b.addEventListener('click', () => { render(n, true); restart(); });
    dotsWrap.appendChild(b);
  });
  function restart() { clearInterval(timer); if (spots.length > 1) timer = setInterval(() => render(i + 1, true), 6000); }
  render(0, false); restart();
}

fetch('content.json', { cache: 'no-cache' })
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(c => initContent(c))
  .catch(() => initContent(CONTENT_FALLBACK));

// ===== Footer: last deployed timestamp (read from /version.json, stamped on every push) =====
(function () {
  const el = document.getElementById('lastDeployed');
  if (!el) return;
  function paint(raw) {
    const d = raw ? new Date(raw) : null;
    if (!d || isNaN(d)) {
      // Fallback to the hardcoded data-build so the footer never goes blank.
      const fb = el.getAttribute('data-build');
      const dfb = fb ? new Date(fb) : null;
      if (!dfb || isNaN(dfb)) { el.parentElement && el.parentElement.remove(); return; }
      el.textContent = dfb.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      return;
    }
    el.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  fetch('/version.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(v => paint(v && v.builtAt))
    .catch(() => paint(null));
})();


/* --- live studio clock (Seaside Park, NJ / America/New_York) --- */
(function () {
  var el = document.getElementById('navClock');
  if (!el) return;
  function tick() {
    try {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit'
      }) + ' ET';
    } catch (e) {
      el.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
  }
  tick();
  setInterval(tick, 30000);
})();

/* --- contact intake form: composes a prefilled email (static-site friendly) --- */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var note = document.getElementById('cfNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var dest = (document.getElementById('cfDestination').value || '').trim();
    var date = (document.getElementById('cfDate').value || '').trim();
    var advisor = (document.getElementById('cfAdvisor').value || '').trim();
    var missing = [];
    if (!dest) missing.push('destination');
    if (!date) missing.push('travel date');
    if (!advisor) missing.push('your name');
    if (missing.length && note) {
      note.innerHTML = 'Please add your ' + missing.join(', ') + ' so we can tailor the demo. Prefer to write directly? <a href="mailto:info@barrierislanddigital.com">info@barrierislanddigital.com</a>';
      return;
    }
    var subject = 'New client companion — ' + dest;
    var body =
      'Trip destination: ' + dest + '\n' +
      'Travel date: ' + date + '\n' +
      'Advisor name: ' + advisor + '\n\n' +
      'A little about the trip:\n';
    var href = 'mailto:info@barrierislanddigital.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    if (note) note.innerHTML = 'Opening your email now… If nothing happens, write us at <a href="mailto:info@barrierislanddigital.com">info@barrierislanddigital.com</a>';
  });
})();

// ===== Demo launching =====
// Default: open in the SAME tab (was opening a new window/tab, which the
// site owner decided is the wrong behavior on desktop). Modifier clicks
// (Cmd/Ctrl/Shift, middle-button) still open in a new tab so power users
// who want side-by-side comparisons can do that.
//
// Two surfaces use this:
//   1. <a data-launch-demo> proof-tray pills: real anchors, browser handles
//      everything natively now that target=_blank is removed. This handler
//      no-ops for them.
//   2. <article role="button" data-launch-demo> project cards: not anchors,
//      so we have to drive navigation in JS. New-tab on modifier, otherwise
//      same-tab.
(function () {
  function launchSameTab(url) {
    if (!url) return;
    window.location.href = url;
  }
  function launchNewTab(url) {
    if (!url) return;
    // Empty windowFeatures keeps Chrome from popping a separate window.
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) {} }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-launch-demo]');
    if (!t) return;
    // Real <a> elements: let the browser do the work. The anchor's href
    // navigates same-tab by default now (no target=_blank); modifier
    // clicks open new tab natively.
    if (t.tagName === 'A') return;
    var modifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
    e.preventDefault();
    if (modifier) launchNewTab(t.getAttribute('data-launch-demo'));
    else launchSameTab(t.getAttribute('data-launch-demo'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = document.activeElement;
    if (!t || !t.matches || !t.matches('[data-launch-demo][role="button"]')) return;
    e.preventDefault();
    // Keyboard activation: same-tab (no modifier sensing for keyboard).
    launchSameTab(t.getAttribute('data-launch-demo'));
  });
})();

// ===== In-site overlay for PDFs and same-origin demos =====
// Visitors kept getting stuck on PDF/demo pages with no way back. Full-
// screen overlay with prominent close button, Esc/backdrop dismissal.
//
// PDFs are rendered with PDF.js into a scrollable canvas stack — iframed
// PDFs do NOT scroll on iOS Safari (only page 1 shows). PDF.js gives us
// a uniform scrolling viewer on every device/browser.
//
// Cross-origin demos (zurich-weekend.com, maritimesgrandloop.com) still
// open in a new tab because they refuse to iframe (X-Frame-Options).
(function () {
  var SAME_ORIGIN_DEMO_PATHS = ['/naples/', '/budvienna/'];
  var PDFJS_LIB    = '/vendor/pdfjs/pdf.min.mjs';
  var PDFJS_WORKER = '/vendor/pdfjs/pdf.worker.min.mjs';

  var overlay, frame, pdfBox, titleEl, openLink, closeBtn, lastFocus;
  var pdfjsLib = null;
  var renderToken = 0;

  function isPdfHref(href) {
    if (!href) return false;
    var clean = href.split('?')[0].split('#')[0];
    return /\.pdf$/i.test(clean);
  }
  function isSameOriginDemo(href) {
    if (!href) return false;
    for (var i = 0; i < SAME_ORIGIN_DEMO_PATHS.length; i++) {
      if (href === SAME_ORIGIN_DEMO_PATHS[i] || href.indexOf(SAME_ORIGIN_DEMO_PATHS[i]) === 0) return true;
    }
    return false;
  }

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'bid-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Preview');
    overlay.innerHTML =
      '<div class="bid-overlay__bar">' +
        '<div class="bid-overlay__title"></div>' +
        '<a class="bid-overlay__open" target="_blank" rel="noopener">Open in new tab</a>' +
        '<button type="button" class="bid-overlay__close" aria-label="Close preview">\u00d7</button>' +
      '</div>' +
      '<iframe class="bid-overlay__frame" title="Preview" allow="fullscreen"></iframe>' +
      '<div class="bid-overlay__pdf" aria-label="PDF pages"></div>';
    document.body.appendChild(overlay);
    frame    = overlay.querySelector('.bid-overlay__frame');
    pdfBox   = overlay.querySelector('.bid-overlay__pdf');
    titleEl  = overlay.querySelector('.bid-overlay__title');
    openLink = overlay.querySelector('.bid-overlay__open');
    closeBtn = overlay.querySelector('.bid-overlay__close');
    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay();
    });
  }

  function showFrame() {
    pdfBox.classList.remove('is-active');
    pdfBox.innerHTML = '';
    frame.style.display = '';
  }
  function showPdf() {
    frame.style.display = 'none';
    frame.src = 'about:blank';
    pdfBox.classList.add('is-active');
    pdfBox.scrollTop = 0;
  }

  function loadPdfJs() {
    if (pdfjsLib) return Promise.resolve(pdfjsLib);
    // Dynamic import keeps the ~330KB lib out of the critical path;
    // only fetched the first time a visitor opens a PDF.
    return import(PDFJS_LIB).then(function (mod) {
      pdfjsLib = mod;
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return pdfjsLib;
    });
  }

  function renderPdf(url) {
    var myToken = ++renderToken;
    pdfBox.innerHTML = '<div class="bid-overlay__pdf-status">Loading PDF\u2026</div>';
    showPdf();

    loadPdfJs().then(function (lib) {
      if (myToken !== renderToken) return null;
      return lib.getDocument({ url: url }).promise;
    }).then(function (pdfDoc) {
      if (!pdfDoc || myToken !== renderToken) return;
      pdfBox.innerHTML = '';
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var renderChain = Promise.resolve();

      for (var pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        (function (n) {
          renderChain = renderChain.then(function () {
            if (myToken !== renderToken) return;
            return pdfDoc.getPage(n).then(function (page) {
              if (myToken !== renderToken) return;
              var containerWidth = Math.max(280, pdfBox.clientWidth - 24);
              var baseViewport = page.getViewport({ scale: 1 });
              var scale = containerWidth / baseViewport.width;
              var viewport = page.getViewport({ scale: scale });
              var canvas = document.createElement('canvas');
              var ctx = canvas.getContext('2d');
              canvas.width  = Math.floor(viewport.width  * dpr);
              canvas.height = Math.floor(viewport.height * dpr);
              canvas.style.width  = Math.floor(viewport.width)  + 'px';
              canvas.style.height = Math.floor(viewport.height) + 'px';
              canvas.setAttribute('aria-label', 'Page ' + n + ' of ' + pdfDoc.numPages);
              pdfBox.appendChild(canvas);
              return page.render({
                canvasContext: ctx,
                viewport: viewport,
                transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
              }).promise;
            });
          });
        })(pageNum);
      }
      return renderChain;
    }).catch(function (err) {
      if (myToken !== renderToken) return;
      console.warn('PDF render failed:', err);
      pdfBox.innerHTML = '<div class="bid-overlay__pdf-status">' +
        'Couldn\u2019t render the PDF inline. ' +
        '<a href="' + url + '" target="_blank" rel="noopener">Open it in a new tab</a> instead.' +
        '</div>';
    });
  }

  function openOverlay(href, label, isPdf) {
    build();
    lastFocus = document.activeElement;
    titleEl.textContent = label || 'Preview';
    openLink.href = href;
    overlay.classList.add('is-open');
    document.body.classList.add('bid-overlay-open');
    if (isPdf) {
      renderPdf(href);
    } else {
      showFrame();
      frame.src = href;
    }
    setTimeout(function () { try { closeBtn.focus(); } catch (e) {} }, 50);
  }

  function closeOverlay() {
    if (!overlay) return;
    renderToken++; // cancel any in-flight PDF render
    overlay.classList.remove('is-open');
    document.body.classList.remove('bid-overlay-open');
    frame.src = 'about:blank';
    pdfBox.innerHTML = '';
    pdfBox.classList.remove('is-active');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (e) {}
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;

    if (isPdfHref(href)) {
      e.preventDefault();
      var label = a.closest('.project') && a.closest('.project').querySelector('h3');
      openOverlay(href, label ? label.textContent.trim() + ' \u2014 PDF itinerary' : 'PDF itinerary', true);
      return;
    }
    if (isSameOriginDemo(href)) {
      e.preventDefault();
      var demoLabel = a.getAttribute('data-demo-name') ||
        (a.closest('.project') && a.closest('.project').querySelector('h3') ? a.closest('.project').querySelector('h3').textContent.trim() : 'Demo');
      openOverlay(href, demoLabel, false);
      return;
    }
    if (a.hasAttribute('data-launch-demo') && /^https?:/i.test(href)) {
      e.preventDefault();
      var w = window.open(href, '_blank');
      if (w) { try { w.opener = null; } catch (err) {} }
      return;
    }
  }, true);
})();
