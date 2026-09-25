/* HeartSafe — stepped video hero.
   Four short clips, each exactly one chest compression. Every scroll gesture
   crossfades to the next clip and PLAYS it once (no frame-seeking, so it is
   always smooth), while the headline advances. Scrolling back replays the
   previous beat's compression. Clips end paused on their resting frame. */
(function () {
  var section = document.getElementById('hero-scroll');
  if (!section) return;

  var clips = [].slice.call(section.querySelectorAll('.hero-clip'));
  var words = section.querySelectorAll('.hero-word');
  var bars = section.querySelectorAll('.hero-beat i');
  var BEATS = Math.min(clips.length, words.length);
  if (!BEATS) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 860px)').matches;

  /* Pick desktop or portrait-cropped footage, then start loading everything */
  clips.forEach(function (v) {
    v.src = v.dataset[isMobile ? 'srcMobile' : 'srcDesktop'] || v.dataset.srcDesktop;
    v.load();
  });

  var beat = 0;
  var pending = -1;

  function playClip(i) {
    var v = clips[i];
    if (reduced) { try { v.currentTime = Math.max(0, (v.duration || 1) - 0.05); } catch (e) {} return; }
    var go = function () {
      try { v.currentTime = 0; } catch (e) {}
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: poster/rest frame stays */ });
    };
    if (v.readyState >= 2) go();
    else {
      pending = i;
      v.addEventListener('loadeddata', function once() {
        v.removeEventListener('loadeddata', once);
        if (pending === i) go();
      });
    }
  }

  function render(replay) {
    clips.forEach(function (v, i) {
      var on = i === beat;
      v.classList.toggle('active', on);
      if (!on && !v.paused) v.pause();
    });
    words.forEach(function (w, i) { w.classList.toggle('active', i === beat); });
    bars.forEach(function (b, i) { b.style.transform = 'scaleX(' + (i <= beat ? 1 : 0) + ')'; });
    if (replay) playClip(beat);
  }

  function requestBeat(i) {
    i = Math.max(0, Math.min(BEATS - 1, i));
    if (i === beat) return;
    beat = i;
    pending = -1;
    render(true);
  }

  /* Touch / keyboard / programmatic scrolling: derive the beat from position.
     While one of our own smooth scrolls is in flight (after a wheel step) the
     intermediate positions are ignored, otherwise the beat would snap back and
     forth and the clip would replay mid-glide. */
  var lockTarget = -1, lockUntil = 0;
  function onScroll() {
    var vh = window.innerHeight;
    var rel = window.scrollY - section.offsetTop;
    if (lockTarget >= 0) {
      if (Math.abs(rel - lockTarget * vh) < 6 || performance.now() > lockUntil) lockTarget = -1;
      else return;
    }
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
    lockTarget = t;
    lockUntil = performance.now() + 1200;
    window.scrollTo({ top: top + t * vh, behavior: reduced ? 'auto' : 'smooth' });
    requestBeat(t);
  }, { passive: false });

  /* First compression plays on load, then the hero waits for the first scroll */
  render(false);
  onScroll();
  if (beat === 0) playClip(0);
})();
