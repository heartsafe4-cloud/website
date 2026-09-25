/* Home preloader: red screen, ECG line draws across, then the screen cuts
   open along the line. Time-based (never waits on slow assets), capped at ~2.2s. */
(function () {
  var pl = document.getElementById('preloader');
  if (!pl) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finish = function () {
    if (!pl.parentNode) return;
    pl.parentNode.removeChild(pl);
    document.body.classList.remove('pl-lock');
  };
  if (reduced) { finish(); return; }
  var start = performance.now();
  var loaded = document.readyState === 'complete';
  window.addEventListener('load', function () { loaded = true; });
  setTimeout(function () { pl.classList.add('pl-drawn'); }, 1250);   /* line complete: brief glow */
  var tryOpen = function () {
    var elapsed = performance.now() - start;
    if (elapsed >= 1500 && (loaded || elapsed >= 2600)) {
      pl.classList.add('pl-open');                                   /* panels part along the line */
      setTimeout(finish, 850);
    } else {
      setTimeout(tryOpen, 60);
    }
  };
  tryOpen();
})();

/* HeartSafe — stepped video hero.
   The clip on screen is always the one that will pump: it is parked on its
   own first frame, so when a scroll arrives it simply plays from the exact
   pixels already showing (no jump, no blink). Only after the compression
   finishes does the hero dissolve to the next beat's clip. Works in both
   directions. No pump on initial load. */
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

  clips.forEach(function (v) {
    v.src = v.dataset[isMobile ? 'srcMobile' : 'srcDesktop'] || v.dataset.srcDesktop;
    v.load();
    v.defaultPlaybackRate = 0.8;                   /* a touch slower reads smoother */
    v.playbackRate = 0.8;                          /* (set after load(), which resets it) */
    v.addEventListener('loadeddata', function () {
      /* Swap the JPEG poster for the real first frame so play starts from
         exactly what is on screen. */
      try { v.currentTime = 0.001; } catch (e) {}
    });
    v.addEventListener('ended', settle);
  });

  var beat = 0;        /* current beat (headline) */
  var shown = 0;       /* clip currently on screen: parked at its first frame, or mid-pump */
  var pumping = false;

  function show(i) {
    shown = i;
    clips.forEach(function (v, k) { v.classList.toggle('active', k === i); });
    /* once the dissolve is over, park every hidden clip on its first frame */
    setTimeout(function () {
      clips.forEach(function (v, k) {
        if (k !== shown) { try { v.pause(); v.currentTime = 0.001; } catch (e) {} }
      });
    }, 760);
  }

  function setWords(b) {
    words.forEach(function (w, i) { w.classList.toggle('active', i === b); });
    bars.forEach(function (bar, i) { bar.style.transform = 'scaleX(' + (i <= b ? 1 : 0) + ')'; });
  }

  /* After a pump: dissolve to the clip that belongs to the current beat */
  function settle() {
    pumping = false;
    if (shown !== beat) show(beat);
    else setTimeout(function () {                 /* same clip again: re-park it quietly */
      if (!pumping && shown === beat) { try { clips[beat].currentTime = 0.001; } catch (e) {} }
    }, 760);
  }

  /* The clip on screen pumps in place */
  function pump() {
    var v = clips[shown];
    if (reduced) { settle(); return; }
    pumping = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () { settle(); });
  }

  function requestBeat(i) {
    i = Math.max(0, Math.min(BEATS - 1, i));
    if (i === beat) return;
    beat = i;
    setWords(beat);
    if (pumping) return;                          /* let the current pump finish; settle() moves on */
    var v = clips[shown];
    if (v.readyState >= 2 && v.currentTime < 0.05) pump();
    else show(beat);                              /* not ready: just move to the beat's clip */
  }

  /* Touch / keyboard / programmatic scrolling: derive the beat from position.
     Intermediate positions during our own smooth scroll are ignored. */
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

  setWords(0);
  show(0);
  onScroll();
})();
