// ===== Theme toggle =====
(function () {
  const t = document.querySelector('[data-theme-toggle]'), r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  const sun = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function apply() { r.setAttribute('data-theme', d); if (t) { t.innerHTML = d === 'dark' ? sun : moon; t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode'); } }
  apply();
  t && t.addEventListener('click', () => { d = d === 'dark' ? 'light' : 'dark'; apply(); });
})();

// ===== Sticky header shadow =====
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
onScroll(); addEventListener('scroll', onScroll, { passive: true });

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
  let data = [];
  Promise.all(cities.map(c =>
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`)
      .then(r => r.ok ? r.json() : null)
      .then(j => j && j.current ? { name: c.name, temp: Math.round(j.current.temperature_2m), code: j.current.weather_code } : null)
      .catch(() => null)
  )).then(results => {
    data = results.filter(Boolean);
    if (!data.length) { rotator.innerHTML = '<span class="wx skeleton">Weather unavailable</span>'; return; }
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
  nowBuilding: 'Trip Optimizer',
  spotlight: [
    { title: 'Maritimes Grand Loop', fact: 'A 12-day loop through Newfoundland & Nova Scotia — ferries, fishing villages, and iceberg alley off the northern coast.', url: 'https://maritimesgrandloop.com' },
    { title: 'Zürich Weekend', fact: 'Three days from Copenhagen to Zürich — lake, old town, and the alps, with logistics tuned to the minute.', url: 'https://zurich-weekend.com' },
    { title: 'Santa Fe June', fact: 'Seven nights at 7,200 feet — adobe, galleries, cliff dwellings, and a dawn balloon ride over the high desert.', url: 'https://santafejune.com' },
  ],
};

function initContent(c) {
  initFieldNote(Array.isArray(c.fieldNotes) && c.fieldNotes.length ? c.fieldNotes : CONTENT_FALLBACK.fieldNotes);
  initNowBuilding(c.nowBuilding || CONTENT_FALLBACK.nowBuilding);
  initSpotlight(Array.isArray(c.spotlight) && c.spotlight.length ? c.spotlight : CONTENT_FALLBACK.spotlight);
}

function initNowBuilding(label) {
  const el = document.getElementById('nowBuilding');
  if (el) el.textContent = 'Currently building: ' + label;
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

// ===== Footer: last deployed timestamp (BUILD_TIME injected at deploy) =====
(function () {
  const el = document.getElementById('lastDeployed');
  if (!el) return;
  const raw = el.getAttribute('data-build');
  if (!raw || raw.indexOf('BUILD') === 0) { el.parentElement && el.parentElement.remove(); return; }
  const d = new Date(raw);
  if (isNaN(d)) { el.parentElement && el.parentElement.remove(); return; }
  el.textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
