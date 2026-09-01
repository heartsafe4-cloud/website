/* HeartSafe Singapore — shared behaviours */
(function () {
  var nav = document.querySelector('.nav');

  function onScroll() {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('.nav__burger');
  if (burger) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* Scroll reveal.
     IntersectionObserver handles the normal case; a scroll-driven sweep catches
     anything skipped over by a fast scroll or an in-page jump, so no section is
     ever left invisible. */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { io.observe(el); });

  var sweepQueued = false;
  function sweepReveals() {
    sweepQueued = false;
    var vh = window.innerHeight;
    revealEls = revealEls.filter(function (el) {
      if (el.classList.contains('in')) return false;
      if (el.getBoundingClientRect().top < vh - 40) {
        el.classList.add('in');
        io.unobserve(el);
        return false;
      }
      return true;
    });
  }
  function queueSweep() {
    if (sweepQueued) return;
    sweepQueued = true;
    requestAnimationFrame(sweepReveals);
  }
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep);
  queueSweep();

  /* Count-up stats */
  var counters = document.querySelectorAll('[data-countup]');
  if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.dataset.target, 10);
        var t0 = performance.now();
        var dur = 1400;
        (function tick(now) {
          var k = Math.min(1, (now - t0) / dur);
          k = 1 - Math.pow(1 - k, 3); /* ease-out */
          el.textContent = Math.round(target * k).toLocaleString('en-US');
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Newsletter signup */
  var nl = document.getElementById('newsletter-form');
  if (nl) {
    nl.addEventListener('submit', function (ev) {
      ev.preventDefault();
      nl.hidden = true;
      var done = document.querySelector('.nl-done');
      if (done) done.hidden = false;
    });
  }

  /* Contact form -> WhatsApp */
  var form = document.getElementById('quote-form');
  if (form) {
    /* Pre-select product from ?product= query */
    var params = new URLSearchParams(window.location.search);
    var product = params.get('product');
    var select = form.querySelector('select[name="interest"]');
    if (product && select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === product) { select.selectedIndex = i; break; }
      }
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = new FormData(form);
      var lines = [
        'Hello HeartSafe! I would like a quote.',
        'Name: ' + (data.get('name') || '-'),
        'Company: ' + (data.get('company') || '-'),
        'Interested in: ' + (data.get('interest') || '-'),
        'Message: ' + (data.get('message') || '-')
      ];
      window.open('https://wa.me/6588453764?text=' + encodeURIComponent(lines.join('\n')), '_blank');
    });
  }
})();
