(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* form: no backend — compose a WhatsApp message */
  const form = $('#form');
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = form.name.value.trim(), p = form.phone.value.trim(), m = form.msg.value.trim();
    const err = $('.form__err', form);
    if (!n || p.replace(/\D/g, '').length < 6) { err.hidden = false; (n ? form.phone : form.name).focus(); return; }
    err.hidden = true;
    const text = `Здравствуйте! Заявка с сайта.\nИмя: ${n}\nТелефон: ${p}` + (m ? `\nЗадача: ${m}` : '');
    window.open('https://wa.me/79246168833?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  /* mobile dock appears after hero */
  const dock = $('.dock'), hero = $('.hero'), contacts = $('#contacts');
  if (dock && 'IntersectionObserver' in window) {
    let pastHero = false, inContacts = false;
    const upd = () => dock.classList.toggle('is-on', pastHero && !inContacts);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting || e.boundingClientRect.bottom < innerHeight; upd(); }, { threshold: 0 }).observe($('.film'));
    new IntersectionObserver(([e]) => { inContacts = e.isIntersecting; upd(); }, { threshold: .15 }).observe(contacts);
  }

  const settle = () => {};

  if (!window.gsap || !window.ScrollTrigger) { settle(); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* header hides on scroll down (class flips only when state changes) */
  let lastY = 0, hid = false; const hdr = $('.hdr');
  addEventListener('scroll', () => { const y = scrollY, h = y > 300 && y > lastY; if (h !== hid) { hid = h; hdr.classList.toggle('is-hidden', h); } lastY = y; }, { passive: true });

  if (RM) { settle(); return; }

  /* split headings into words */
  $$('[data-split]').forEach((el) => {
    // keep &nbsp; groups together
    const words = el.textContent.trim().split(/ +/);
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>`).join(' ');
    gsap.from($$('.wi', el), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });

  /* image clip reveals (non-hero) */
  $$('.svc [data-clip]').forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    gsap.from($('img', el), { scale: 1.08, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* outline numbers drift */
  $$('.svc__num').forEach((n) => gsap.to(n, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: n.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* camera dial segments light up in sequence */
  gsap.from('.dial__seg', { opacity: .12, duration: .5, stagger: .25, ease: 'power2.out', scrollTrigger: { trigger: '.dial', start: 'top 80%', once: true } });

  /* process: wire draws with scroll */
  const wp = $('#wirePath');
  if (wp) { gsap.fromTo(wp, { strokeDasharray: 1000, strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } });
    gsap.from('.steps li', { autoAlpha: 0, x: -16, duration: .9, stagger: .15, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } }); }

  /* service rows: image peek follows the pointer */
  const peek = $('.peek');
  if (FINE && peek) {
    const img = $('img', peek);
    const xTo = gsap.quickTo(peek, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(peek, 'y', { duration: .5, ease: 'power3' });
    $$('.row').forEach((r) => {
      r.addEventListener('pointerenter', () => { img.src = r.dataset.img; gsap.to(peek, { opacity: 1, scale: 1, duration: .4 }); });
      r.addEventListener('pointerleave', () => gsap.to(peek, { opacity: 0, scale: .9, duration: .3 }));
      r.addEventListener('pointermove', (e) => { xTo(e.clientX - 300); yTo(e.clientY - 90); });
    });
    gsap.set(peek, { scale: .9 });
  }

  /* magnetic CTAs */
  if (FINE) $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .2); yTo((e.clientY - r.top - r.height / 2) * .3); });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
