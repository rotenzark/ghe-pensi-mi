/* ===== Ghe Pensi Mi — main.js ===== */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.classList.contains('reduce-motion');

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var intro = document.getElementById('intro');
  if (intro && !reduce) {
    document.body.style.overflow = 'hidden';
    var done = function () {
      intro.classList.add('is-done'); document.body.style.overflow = '';
      setTimeout(function () { if (intro && intro.parentNode) intro.parentNode.removeChild(intro); }, 600);
      window.removeEventListener('click', done);
    };
    setTimeout(done, 1700); window.addEventListener('click', done);
  } else if (intro) { intro.parentNode && intro.parentNode.removeChild(intro); }

  var header = document.getElementById('siteHeader');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  var mq = window.matchMedia('(max-width:960px)'), lastFocus = null;
  function isMobile() { return mq.matches; }
  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    if (isMobile()) { nav.inert = !open; if (open) { lastFocus = document.activeElement; var f = nav.querySelector('a'); f && f.focus(); } else if (lastFocus) { lastFocus.focus(); } }
    else { nav.inert = false; }
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A' && isMobile()) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false); });
    var syncMq = function () { if (!isMobile()) { nav.classList.remove('open'); nav.inert = false; burger.setAttribute('aria-expanded', 'false'); } else { if (!nav.classList.contains('open')) nav.inert = true; } };
    mq.addEventListener ? mq.addEventListener('change', syncMq) : mq.addListener(syncMq); syncMq();
  }

  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-visible'); }); }
  if (reduce || !('IntersectionObserver' in window)) { showAll(); }
  else {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    var fired = false, wd = new IntersectionObserver(function () { fired = true; wd.disconnect(); });
    wd.observe(document.body); setTimeout(function () { if (!fired) showAll(); }, 1500);
  }

  /* dynamic hours — evening bar, crosses midnight. close minutes may be >1440 */
  var HOURS = { 2: [[1020, 1500]], 3: [[1020, 1500]], 4: [[1020, 1500]], 5: [[1020, 1500]], 6: [[1020, 1500]], 0: [[1020, 1470]], 1: [] };
  function romeNow() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' })); }
  function fmt(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function state(day, mins) {
    var wins = HOURS[day] || [];
    for (var i = 0; i < wins.length; i++) { if (mins >= wins[i][0] && mins < wins[i][1]) return { open: true, closeAt: wins[i][1] }; }
    var pd = (day + 6) % 7, pw = HOURS[pd] || [];
    for (var j = 0; j < pw.length; j++) { if (pw[j][1] > 1440 && mins < pw[j][1] - 1440) return { open: true, closeAt: pw[j][1] - 1440 }; }
    var nextOpen = null;
    for (var k = 0; k < wins.length; k++) { if (mins < wins[k][0]) { nextOpen = wins[k][0]; break; } }
    var nextDay = null;
    if (nextOpen === null) { for (var d = 1; d <= 7; d++) { var nd = (day + d) % 7; if ((HOURS[nd] || []).length) { nextDay = { d: nd, o: HOURS[nd][0][0] }; break; } } }
    return { open: false, nextOpen: nextOpen, nextDay: nextDay };
  }
  function updateHours(lang) {
    var el = document.getElementById('hoursStatus'); if (!el) return;
    var now = romeNow(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var s = state(day, mins);
    var t = {
      it: { open: 'Aperto ora', closes: 'chiude alle', closed: 'Chiuso ora', opens: 'apre oggi alle', opensDay: 'apre', days: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'] },
      en: { open: 'Open now', closes: 'closes at', closed: 'Closed now', opens: 'opens today at', opensDay: 'opens', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
    }[lang] || {};
    var html;
    if (s.open) html = '<span class="dot"></span>' + t.open + ' · ' + t.closes + ' ' + fmt(s.closeAt);
    else if (s.nextOpen !== null && s.nextOpen !== undefined) html = '<span class="dot"></span>' + t.closed + ' · ' + t.opens + ' ' + fmt(s.nextOpen);
    else if (s.nextDay) html = '<span class="dot"></span>' + t.closed + ' · ' + t.opensDay + ' ' + t.days[s.nextDay.d] + ' ' + fmt(s.nextDay.o);
    else html = '<span class="dot"></span>' + t.closed;
    el.className = 'hours__status ' + (s.open ? 'is-open' : 'is-closed'); el.innerHTML = html;
    document.querySelectorAll('.hours__table tr').forEach(function (r) { r.classList.toggle('today', parseInt(r.getAttribute('data-day'), 10) === day); });
  }

  var EN = {
    'skip': 'Skip to content',
    'nav.about': 'The bar', 'nav.what': "What's on", 'nav.gallery': 'Gallery', 'nav.where': 'Where & hours', 'nav.reviews': 'Reviews',
    'cta.book': 'Book',
    'hero.eyebrow': 'Craft bar · Piazza Morbegno · NoLo',
    'hero.concept': "“I've got this.” The neighbourhood bar of NoLo — craft beer, cocktails and nights that end late.",
    'hero.cta1': "What's on tap", 'hero.cta2': 'Where we are',
    'hero.stat1': 'on Google · 650 reviews', 'hero.stat2': 'every night (Mon closed)', 'hero.stat3': 'the little Paris',
    'hero.tag': 'Piazza Morbegno 2',
    'story.label': 'The bar', 'story.title': 'In dialect it means “I’ve got this”.',
    'story.p1': "On Piazza Morbegno, in the heart of NoLo — Milan's “little Paris” — Ghe Pensi Mi is where the neighbourhood meets: informal, alternative, always full. A young crowd, tables outside when it's warm, and the feeling of being among friends.",
    'story.p2': "The heart is <strong>craft beer on tap</strong> — taps that rotate constantly, from IPA to Weizen — but you'll also find well-made cocktails, a generous aperitivo and casual food. And at night it comes alive: <strong>DJ sets</strong> at the weekend and <strong>stand-up comedy</strong> nights.",
    'story.chip1': 'Craft beer', 'story.chip2': 'Cocktails & aperitivo', 'story.chip3': 'DJ sets · comedy',
    'what.label': "What's on", 'what.title': 'Everything you need for a good night.',
    'what.1t': 'Craft beer on tap', 'what.1d': 'Taps that change often: IPA, Pils, Weizen, stout and seasonal gems. Order at the till and pick up at the counter.',
    'what.2t': 'Cocktails', 'what.2d': 'Great classics and a few house signatures, well made without taking themselves too seriously.',
    'what.3t': 'Aperitivo & food', 'what.3d': 'Italian nibbles, sandwiches and casual plates to go with — tasty and honestly priced.',
    'what.4t': 'DJ sets & stand-up', 'what.4d': 'Weekends you dance, and now and then you laugh: comedy and music nights that make NoLo what it is.',
    'what.note': 'The beer menu rotates constantly: drop by and ask for the tap of the day.',
    'gallery.label': 'Gallery', 'gallery.title': 'A look inside.',
    'where.label': 'Where & hours', 'where.title': 'Piazza Morbegno 2, NoLo.',
    'day.mon': 'Monday', 'day.tue': 'Tuesday', 'day.wed': 'Wednesday', 'day.thu': 'Thursday', 'day.fri': 'Friday', 'day.sat': 'Saturday', 'day.sun': 'Sunday', 'closed': 'Closed',
    'rev.label': 'Reviews', 'rev.title': 'The neighbourhood approves.',
    'book.label': 'Come and see us', 'book.title': "Tonight, we drink well.",
    'book.lead': "Drop by Piazza Morbegno or call to book a table on busy nights. The rest — the right tap, the right night — I've got it.",
    'book.call': 'Call · 02 8348 7798', 'book.dir': 'Directions',
    'faq.title': 'Frequently asked questions',
    'faq.q1': 'What do you drink here?',
    'faq.a1': 'Craft beers on tap that rotate often (IPA, Pils, Weizen, stout and more), cocktails and a good list of aperitivi. Order at the till and pick up at the tap counter.',
    'faq.q2': 'Do you serve food?',
    'faq.a2': 'Yes: Italian nibbles, sandwiches and plates to go with the beer or aperitivo, with options for everyone. Casual food and honest prices.',
    'faq.q3': 'Are there nights and events?',
    'faq.a3': 'The place is alive: DJ sets at the weekend, stand-up comedy nights and busy aperitivi. On busy days it\'s best to book a table.',
    'faq.q4': 'Where are you and what are your hours?',
    'faq.a4': 'On Piazza Morbegno 2, in the heart of NoLo. Open Tuesday to Saturday 17:00–01:00, Sunday 17:00–00:30. Closed Monday.',
    'footer.tag': '“I’ve got this.”', 'footer.where': 'Where we are', 'footer.hours': 'Tue–Sat 17–01 · Sun 17–00:30 · Mon closed', 'footer.follow': 'Follow us', 'footer.credit': 'Demo website — Bespoke Studio',
    'ab.call': 'Call', 'ab.dir': 'Directions'
  };
  var IT = {};
  [].slice.call(document.querySelectorAll('[data-i18n]')).forEach(function (el) { IT[el.getAttribute('data-i18n')] = el.innerHTML; });
  function applyLang(lang) {
    var dict = lang === 'en' ? EN : IT;
    [].slice.call(document.querySelectorAll('[data-i18n]')).forEach(function (el) { var k = el.getAttribute('data-i18n'); if (dict[k] != null) el.innerHTML = dict[k]; });
    root.setAttribute('lang', lang);
    var it = document.querySelector('.lang__it'), en = document.querySelector('.lang__en');
    if (it && en) { it.classList.toggle('is-active', lang === 'it'); en.classList.toggle('is-active', lang === 'en'); }
    var lt = document.getElementById('langToggle');
    if (lt) lt.setAttribute('aria-label', lang === 'it' ? 'Switch language to English' : 'Passa all\'italiano');
    try { localStorage.setItem('ghe-lang', lang); } catch (e) {}
    updateHours(lang);
  }
  var langToggle = document.getElementById('langToggle'), curLang = 'it';
  try { curLang = localStorage.getItem('ghe-lang') || 'it'; } catch (e) {}
  if (langToggle) langToggle.addEventListener('click', function () { applyLang(root.getAttribute('lang') === 'it' ? 'en' : 'it'); });
  applyLang(curLang);
  setInterval(function () { updateHours(root.getAttribute('lang')); }, 60000);

  var lb = document.getElementById('lightbox'), lbImg = document.getElementById('lightboxImg'), lbClose = document.getElementById('lightboxClose'), lbLast = null;
  function openLb(src, alt) { lbImg.src = src; lbImg.alt = alt || ''; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lbLast = document.activeElement; lbClose.focus(); document.body.style.overflow = 'hidden'; }
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lbImg.src = ''; document.body.style.overflow = ''; lbLast && lbLast.focus(); }
  [].slice.call(document.querySelectorAll('.shot')).forEach(function (btn) { btn.addEventListener('click', function () { var img = btn.querySelector('img'); openLb(btn.getAttribute('data-full'), img ? img.alt : ''); }); });
  lbClose && lbClose.addEventListener('click', closeLb);
  lb && lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });
})();
