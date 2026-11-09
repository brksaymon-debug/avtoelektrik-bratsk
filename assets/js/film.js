/* Film: 5 HD chapter videos crossfading under a sticky stage. Native scroll, no scrub.
   Scroll → chapter index (cached geometry, rAF-throttled). Only the active video plays,
   the next one is preloaded, the rest are paused and stay preload="none". */
(() => {
  const film = document.querySelector('.film');
  if (!film) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) { film.classList.add('is-static'); return; }

  const MOB = matchMedia('(max-width: 760px), (orientation: portrait)').matches;
  const vids = [...film.querySelectorAll('.film__v')];
  vids.forEach((v, i) => {
    const s = MOB ? v.dataset.m : v.dataset.d;
    if (i === 0) v.poster = MOB ? v.dataset.pm : v.dataset.pd;
    v.muted = true; v.playsInline = true;
    v.preload = i === 0 ? 'auto' : 'none';
    v.src = s;
    if (i === 0) v.preload = 'auto';
    v.addEventListener('playing', () => v.classList.add('is-live'), { once: true });
  });

  const chs = [...film.querySelectorAll('.ch')].map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out, on: false }));
  const marks = [...film.querySelectorAll('.hud__ch li')];
  const prog = film.querySelector('#prog'), tc = film.querySelector('#tc');
  const phone = film.querySelector('.phone');
  let phoneT = [], cur = -1, visible = true;

  const warm = (i) => { const v = vids[i]; if (v && v.preload !== 'auto') { v.poster = MOB ? v.dataset.pm : v.dataset.pd; v.preload = 'auto'; v.load(); } };
  const playOnly = (i) => {
    vids.forEach((v, k) => {
      if (k === i && visible) { const p = v.play(); p && p.catch(() => {}); }
      else if (!v.paused) v.pause();
    });
  };
  const setVideo = (i) => {
    if (i === cur) return;
    cur = i;
    vids.forEach((v, k) => v.classList.toggle('is-on', k === i));
    warm(i);
    /* preload the next chapter only once the current one can play through (keeps first load light) */
    const v = vids[i], nx = () => warm(i + 1);
    if (v && v.readyState >= 4) setTimeout(nx, 600); else if (v) { v.addEventListener('canplaythrough', () => setTimeout(nx, 600), { once: true }); setTimeout(nx, 4000); }
    if (vids[i] && vids[i].readyState < 2) vids[i].currentTime = 0;
    playOnly(i);
    marks.forEach((m, k) => m.classList.toggle('is-on', k === i));
    if (tc) tc.textContent = `CH ${String(i + 1).padStart(2, '0')} / 05`;
  };

  const setChapter = (p) => {
    let idx = 0;
    chs.forEach((c, k) => {
      const on = p >= c.a && p < c.b;
      if (p >= c.a) idx = k;
      if (on === c.on) return;
      c.on = on;
      if (on) { c.el.classList.remove('is-out'); c.el.classList.add('is-on'); }
      else { c.el.classList.add('is-out'); setTimeout(() => { if (!c.on) c.el.classList.remove('is-on', 'is-out'); }, 600); }
      if (c.el.classList.contains('ch--alarm') && phone) {
        phoneT.forEach(clearTimeout); phoneT = [];
        const stt = phone.querySelector('.phone__stt'), eng = phone.querySelector('.phone__eng');
        if (on) {
          phoneT.push(setTimeout(() => { phone.classList.add('is-armed'); stt.textContent = 'Под охраной'; }, 650));
          phoneT.push(setTimeout(() => { phone.classList.add('is-run'); eng.textContent = 'запущен'; }, 1700));
        } else { phone.classList.remove('is-armed', 'is-run'); stt.textContent = 'Снято с\u00a0охраны'; eng.textContent = 'выкл'; }
      }
    });
    setVideo(idx);
  };

  /* geometry cached; scroll handler only reads scrollY */
  let top = 0, span = 1, ticking = false, lastP = -1;
  const measure = () => {
    const r = film.getBoundingClientRect();
    top = r.top + scrollY; span = Math.max(1, film.offsetHeight - innerHeight);
  };
  const frame = () => {
    ticking = false;
    const p = Math.min(1, Math.max(0, (scrollY - top) / span));
    if (Math.abs(p - lastP) < 0.0005) return;
    lastP = p;
    prog.style.transform = `scaleX(${p.toFixed(4)})`;
    setChapter(p);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { measure(); lastP = -1; frame(); }, 150); });
  addEventListener('load', () => { measure(); lastP = -1; frame(); });

  /* pause everything when the film is off-screen or the tab is hidden */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; playOnly(cur); }, { threshold: 0 }).observe(film);
  }
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; playOnly(cur); });

  film.classList.add('is-ready');
  measure();
  /* hero: render chapter 0 but start its text reveal after first paint */
  setVideo(0);
  chs[0].on = true;
  requestAnimationFrame(() => setTimeout(() => chs[0].el.classList.add('is-on'), 200));
  lastP = 0; frame();

  /* 12.6 V counter, plain rAF */
  const v = document.getElementById('volt'), bar = film.querySelector('.volt__s i');
  if (v) {
    const t0 = performance.now() + 500, D = 2200;
    const step = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / D)), e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      v.textContent = (12.6 * e).toFixed(1); if (bar) bar.style.transform = `scaleX(${e})`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
})();
