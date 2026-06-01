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
