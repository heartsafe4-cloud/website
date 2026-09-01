/* HeartSafe — stepped photo hero.
   One scroll gesture = the hero smoothly crossfades to the next
   AED rescue step photo and the headline advances. Scrolling back
   reverses it. */
(function () {
  var section = document.getElementById('hero-scroll');
  if (!section) return;

  var steps = section.querySelectorAll('.hero-step');
  var words = section.querySelectorAll('.hero-word');
  var bars = section.querySelectorAll('.hero-beat i');
  var BEATS = Math.min(steps.length, words.length);
  if (!BEATS) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var beat = 0;

  function render() {
    steps.forEach(function (img, i) { img.classList.toggle('active', i === beat); });
    words.forEach(function (w, i) { w.classList.toggle('active', i === beat); });
    bars.forEach(function (b, i) { b.style.transform = 'scaleX(' + (i <= beat ? 1 : 0) + ')'; });
  }

  function requestBeat(i) {
    i = Math.max(0, Math.min(BEATS - 1, i));
    if (i === beat) return;
    beat = i;
    render();
  }

  /* Touch / keyboard / programmatic scrolling: derive the beat from position */
  function onScroll() {
    var vh = window.innerHeight;
    var rel = window.scrollY - section.offsetTop;
    if (rel > -vh * 0.5 && rel < section.offsetHeight) {
      requestBeat(Math.round(rel / vh));
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mouse / trackpad: one gesture = one beat, with snap */
  var lastStep = 0;
  window.addEventListener('wheel', function (e) {
    var vh = window.innerHeight;
    var top = section.offsetTop;
    var rel = window.scrollY - top;
    var maxRel = section.offsetHeight - vh;
    if (rel < -2 || rel > maxRel + 2) return;          /* hero not pinned */
    var down = e.deltaY > 0;
    if (down && beat >= BEATS - 1) return;             /* release into page */
    if (!down && beat <= 0 && rel <= 2) return;        /* release at top */
    e.preventDefault();
    var now = performance.now();
    if (Math.abs(e.deltaY) < 6 || now - lastStep < 700) return;
    lastStep = now;
    var t = Math.max(0, Math.min(BEATS - 1, beat + (down ? 1 : -1)));
    window.scrollTo({ top: top + t * vh, behavior: reduced ? 'auto' : 'smooth' });
    requestBeat(t);
  }, { passive: false });

  render();
  onScroll();
})();
