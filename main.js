// ===== Theme toggle =====
(function () {
  const t = document.querySelector('[data-theme-toggle]'), r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  const sun = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function apply() { r.setAttribute('data-theme', d); if (t) { t.innerHTML = d === 'dark' ? sun : moon; t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode'); } drawAll(); }
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

// ===== Scroll reveal =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4 * 70) + 'ms'; io.observe(el); });

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

// ===== Rotating field-note =====
(function () {
  const el = document.getElementById('fieldNote');
  if (!el) return;
  const notes = [
    'Understand the journey, then remove every point of friction.',
    'Mobile-first — because travel happens in the dead zones.',
    'Ship fast, then obsess over the details that feel effortless.',
    'The compass in our mark is a promise: we help people find their way.',
    'Every commit deploys to the edge — this site included.',
  ];
  let i = 0;
  function set() { el.textContent = notes[i % notes.length]; }
  set();
  setInterval(() => {
    el.classList.add('fade');
    setTimeout(() => { i++; set(); el.classList.remove('fade'); }, 450);
  }, 5200);
})();

// ===== Destination spotlight rotator =====
(function () {
  const body = document.getElementById('spotlightBody');
  const dotsWrap = document.getElementById('spotlightDots');
  if (!body || !dotsWrap) return;
  const titleEl = document.getElementById('spTitle');
  const factEl = document.getElementById('spFact');
  const linkEl = document.getElementById('spLink');
  const spots = [
    { t: 'Maritimes Grand Loop', f: 'A 12-day loop through Newfoundland & Nova Scotia — ferries, fishing villages, and iceberg alley off the northern coast.', u: 'https://maritimesgrandloop.com' },
    { t: 'Zürich Weekend', f: 'Three days from Copenhagen to Zürich — lake, old town, and the alps, with logistics tuned to the minute.', u: 'https://zurich-weekend.com' },
    { t: 'Santa Fe June', f: 'Seven nights at 7,200 feet — adobe, galleries, cliff dwellings, and a dawn balloon ride over the high desert.', u: 'https://santafejune.com' },
  ];
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
  spots.forEach((s, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', s.t);
    b.addEventListener('click', () => { render(n, true); restart(); });
    dotsWrap.appendChild(b);
  });
  function restart() { clearInterval(timer); timer = setInterval(() => render(i + 1, true), 6000); }
  render(0, false); restart();
})();

// ===== Canvas project visuals: branded navy gradient + compass/wave motif =====
function drawCanvas(cv) {
  const seed = parseInt(cv.dataset.seed || '1', 10);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  // palette variations per seed
  const palettes = [
    ['#10203f', '#1c2840', '#2a4a55'],
    ['#142a44', '#1c2840', '#264e4a'],
    ['#1a2335', '#22324f', '#37606b'],
    ['#0f2236', '#203a52', '#2f5d52'],
    ['#15263d', '#243a55', '#3a5e66'],
  ];
  const p = palettes[(seed - 1) % palettes.length];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, p[0]); g.addColorStop(0.55, p[1]); g.addColorStop(1, p[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  // soft radial glow
  const rg = ctx.createRadialGradient(w * 0.72, h * 0.28, 10, w * 0.72, h * 0.28, w * 0.7);
  rg.addColorStop(0, 'rgba(120,180,190,0.22)'); rg.addColorStop(1, 'rgba(120,180,190,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);

  // faint compass mark
  const cx = w * 0.74, cy = h * 0.42, R = Math.min(w, h) * 0.30;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = Math.max(1.2, R * 0.045);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  const pts = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  pts.forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * R * 0.92, cy + dy * R * 0.92);
    ctx.lineTo(cx + (-dy) * R * 0.12, cy + (dx) * R * 0.12);
    ctx.lineTo(cx - (-dy) * R * 0.12, cy - (dx) * R * 0.12);
    ctx.closePath(); ctx.fill();
  });
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.11, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // waves at bottom
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = Math.max(1.5, h * 0.012);
  ctx.lineCap = 'round';
  for (let row = 0; row < 3; row++) {
    const baseY = h * (0.74 + row * 0.09);
    const amp = h * 0.035 * (1 - row * 0.2);
    ctx.globalAlpha = 0.5 - row * 0.13;
    ctx.beginPath();
    for (let x = -10; x <= w + 10; x += 6) {
      const y = baseY + Math.sin((x / w) * Math.PI * 3 + seed + row * 1.3) * amp;
      x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function drawAll() { document.querySelectorAll('.project-visual canvas').forEach(drawCanvas); }
addEventListener('load', drawAll);
addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(drawAll, 150); });
drawAll();
