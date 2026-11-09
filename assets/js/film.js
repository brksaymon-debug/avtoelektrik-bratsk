/* Scroll-scrubbed film: WebP image sequence drawn on a DPR-capped canvas. */
(() => {
  const film = document.querySelector('.film');
  if (!film) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM || !window.gsap || !window.ScrollTrigger || !window.HTMLCanvasElement) { film.classList.add('is-static'); return; }

  const N = 398, FPS = 24;
  const MOB = matchMedia('(max-width: 760px), (orientation: portrait)').matches;
  const dir = MOB ? 'assets/seq/m/' : 'assets/seq/d/';
  const src = (i) => dir + String(i).padStart(3, '0') + '.webp';
  const cv = film.querySelector('.film__cv'), ctx = cv.getContext('2d', { alpha: false });
  const imgs = new Array(N), ok = new Uint8Array(N);
  let cur = -1, want = 0, W = 0, H = 0;

  /* --- loading: first 30 frames eagerly, then a coarse pass (every 6th), then fill gaps --- */
  const order = [];
  for (let i = 0; i < 30; i++) order.push(i);
  for (let i = 30; i < N; i += 6) order.push(i);
  for (let i = 30; i < N; i++) if ((i % 6) !== 0) order.push(i);
  let qi = 0, active = 0;
  const CONC = MOB ? 4 : 6;
  const pump = () => {
    while (active < CONC && qi < order.length) {
      const i = order[qi++]; const im = new Image(); im.decoding = 'async'; active++;
      im.onload = () => { ok[i] = 1; active--; if (i === 0 && cur < 0) { film.classList.add('is-ready'); draw(true); } else if (Math.abs(i - want) < 8) draw(true); pump(); };
      im.onerror = () => { active--; pump(); };
      im.src = src(i); imgs[i] = im;
    }
  };
  pump();

  const nearest = (i) => { if (ok[i]) return i; for (let d = 1; d < N; d++) { if (i - d >= 0 && ok[i - d]) return i - d; if (i + d < N && ok[i + d]) return i + d; } return -1; };

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MOB ? 2 : 1.5);
    const r = cv.getBoundingClientRect();
    W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; ctx.imageSmoothingQuality = 'high'; draw(true); }
  };
  function draw(force) {
    const i = nearest(want);
    if (i < 0 || (!force && i === cur)) return;
    const im = imgs[i], iw = im.naturalWidth, ih = im.naturalHeight;
    const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
    ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    cur = i;
  }
  size();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });

  /* --- chapters & HUD --- */
  const chs = [...film.querySelectorAll('.ch')].map((el) => ({ el, a: +el.dataset.in, b: +el.dataset.out, on: false }));
  const marks = [...film.querySelectorAll('.hud__ch li')];
  const prog = film.querySelector('#prog'), tc = film.querySelector('#tc');
  const phone = film.querySelector('.phone');
  let phoneT = [];
  const p2 = (n) => String(n).padStart(2, '0');
  let lastTc = -1;

  const setChapter = (p) => {
    let idx = 0;
    chs.forEach((c, k) => {
      const on = p >= c.a && p < c.b;
      if (on) idx = k;
      if (on !== c.on) {
        c.on = on;
        if (on) { c.el.classList.remove('is-out'); c.el.classList.add('is-on'); }
        else { c.el.classList.add('is-out'); setTimeout(() => { if (!c.on) c.el.classList.remove('is-on', 'is-out'); }, 600); }
        if (c.el.classList.contains('ch--alarm')) {
          phoneT.forEach(clearTimeout); phoneT = [];
          if (on) { phoneT.push(setTimeout(() => { phone.classList.add('is-armed'); phone.querySelector('.phone__stt').textContent = 'Под охраной'; }, 650));
                    phoneT.push(setTimeout(() => { phone.classList.add('is-run'); phone.querySelector('.phone__eng').textContent = 'запущен'; }, 1700)); }
          else { phone.classList.remove('is-armed', 'is-run'); phone.querySelector('.phone__stt').textContent = 'Снято с\u00a0охраны'; phone.querySelector('.phone__eng').textContent = 'выкл'; }
        }
      }
    });
    if (p >= chs[0].b && !chs.some((c) => c.on)) { // between chapters: keep the nearest previous mark
      chs.forEach((c, k) => { if (p >= c.a) idx = k; });
    }
    marks.forEach((m, k) => m.classList.toggle('is-on', k === idx));
  };

  const state = { f: 0 };
  const update = (p) => {
    want = Math.min(N - 1, Math.max(0, Math.round(state.f)));
    draw(false);
    prog.style.transform = `scaleX(${p.toFixed(4)})`;
    if (want !== lastTc) { lastTc = want; const s = Math.floor(want / FPS); tc.textContent = `00:${p2(s)}:${p2(want % FPS)}`; }
    setChapter(p);
  };

  gsap.registerPlugin(ScrollTrigger);
  gsap.to(state, {
    f: N - 1, ease: 'none',
    scrollTrigger: { trigger: film, start: 'top top', end: 'bottom bottom', scrub: 1 },
    onUpdate() { update(this.progress()); },
  });
  setChapter(0);

  /* hero intro + 12.6 V counter */
  const hero = chs[0].el;
  hero.classList.remove('is-on');
  requestAnimationFrame(() => setTimeout(() => { hero.classList.add('is-on'); chs[0].on = true; }, 250));
  const v = document.getElementById('volt');
  if (v) { const o = { v: 0 }; gsap.to(o, { v: 12.6, duration: 2.2, delay: .5, ease: 'expo.out', onUpdate: () => { v.textContent = o.v.toFixed(1); } });
    gsap.from('.volt__s i', { scaleX: 0, duration: 2.2, delay: .5, ease: 'expo.out' }); }
})();
