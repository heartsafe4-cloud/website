/* HeartSafe — stepped CPR hero.
   One scroll gesture = the video auto-plays exactly one chest compression
   and the headline advances to the next message. Scrolling back reverses it.
   The video is loaded as a blob so every frame is instantly seekable. */
(function () {
  var section = document.getElementById('hero-scroll');
  var video = document.getElementById('hero-video');
  if (!section || !video) return;

  /* One [start, end] time range per compression in the footage */
  var SEGMENTS = [
    [1.083, 1.625],
    [1.625, 2.083],
    [3.833, 4.417],
    [4.417, 4.875]
  ];
  var BEATS = SEGMENTS.length;

  var words = section.querySelectorAll('.hero-word');
  var bars = section.querySelectorAll('.hero-beat i');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Pick the right footage for the viewport (mobile crop keeps hands centred) */
  var isMobile = window.matchMedia('(max-width: 860px)').matches;
  var poster = video.dataset[isMobile ? 'posterMobile' : 'posterDesktop'];
  if (poster) video.poster = poster;

  var ready = false;
  fetch(video.dataset[isMobile ? 'srcMobile' : 'srcDesktop'])
    .then(function (r) { return r.blob(); })
    .then(function (blob) {
      video.src = URL.createObjectURL(blob);
      video.addEventListener('loadedmetadata', function () {
        ready = true;
        if (reduced) {
          video.currentTime = SEGMENTS[0][1];
        } else {
          video.currentTime = SEGMENTS[0][0];
          /* Intro: perform one compression on load so the mechanic reads instantly */
          setTimeout(function () { tween(SEGMENTS[0][0], SEGMENTS[0][1]); }, 700);
        }
      }, { once: true });
    })
    .catch(function () { /* video stays on poster; words still work */ });

  /* Animate currentTime at the footage's real speed */
  var tweenRAF = null;
  function tween(from, to, done) {
    if (tweenRAF) cancelAnimationFrame(tweenRAF);
    var dur = Math.abs(to - from) * 1000;
    var t0 = performance.now();
    video.currentTime = from;
    function frame(now) {
      var k = Math.min(1, (now - t0) / dur);
      video.currentTime = from + (to - from) * k;
      if (k < 1) {
        tweenRAF = requestAnimationFrame(frame);
      } else {
        tweenRAF = null;
        if (done) done();
      }
    }
    tweenRAF = requestAnimationFrame(frame);
  }

  var beat = 0;        /* settled beat */
  var targetBeat = 0;  /* where we're heading */
  var animating = false;

  function setWords(i) {
    words.forEach(function (w, idx) { w.classList.toggle('active', idx === i); });
  }
  function setBars(i) {
    bars.forEach(function (b, idx) { b.style.transform = 'scaleX(' + (idx <= i ? 1 : 0) + ')'; });
  }
  setBars(0);

  function step() {
    if (animating || beat === targetBeat) return;
    var dir = targetBeat > beat ? 1 : -1;
    var next = beat + dir;
    animating = true;
    setWords(next);
    setBars(next);
    /* Forward plays the next compression; backward un-plays the current one */
    var seg = SEGMENTS[dir > 0 ? next : beat];
    if (!seg) { animating = false; targetBeat = beat; return; }
    var from = dir > 0 ? seg[0] : seg[1];
    var to = dir > 0 ? seg[1] : seg[0];
    var finish = function () {
      beat = next;
      animating = false;
      if (beat !== targetBeat) step();
    };
    if (!ready || reduced) {
      if (ready) video.currentTime = to;
      finish();
    } else {
      tween(from, to, finish);
    }
  }

  function requestBeat(i) {
    i = Math.max(0, Math.min(BEATS - 1, i));
    if (i === targetBeat) return;
    targetBeat = i;
    step();
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
    if (down && targetBeat >= BEATS - 1 && beat >= BEATS - 1) return;  /* release into page */
    if (!down && targetBeat <= 0 && rel <= 2) return;                  /* release at top */
    e.preventDefault();
    var now = performance.now();
    if (Math.abs(e.deltaY) < 6 || now - lastStep < 650) return;
    lastStep = now;
    var t = Math.max(0, Math.min(BEATS - 1, targetBeat + (down ? 1 : -1)));
    window.scrollTo({ top: top + t * vh, behavior: reduced ? 'auto' : 'smooth' });
    requestBeat(t);
  }, { passive: false });

  onScroll();
})();
