(function () {
  // ---------- Interactive demo ----------
  var METHODS = [
    ['lq', 'LQ input'], ['rfpp', 'RestoreFormer++'], ['diffbir', 'DiffBIR'], ['keep', 'KEEP'],
    ['pgtformer', 'PGTFormer'], ['svfr', 'SVFR'], ['ours', 'FADRA (Ours)'], ['hq', 'HQ (GT)']
  ];
  var NAME = {};
  METHODS.forEach(function (m) { NAME[m[0]] = m[1]; });

  var demo = document.querySelector('.demo');
  if (demo) initDemo(demo);

  function initDemo(root) {
    var compare = root.querySelector('.compare');
    var under = compare.querySelector('.under');
    var top = compare.querySelector('.top');
    var tagL = compare.querySelector('.tag.l');
    var sliderView = root.querySelector('.slider-view');
    var gridView = root.querySelector('.grid-view');
    var loading = root.querySelector('.loading');
    var now = root.querySelector('.now');
    var playBtn = root.querySelector('.play');
    var scrub = root.querySelector('.scrub');
    var timeEl = root.querySelector('.time');
    var thumbs = root.querySelectorAll('.thumb');
    var methodBtns = root.querySelectorAll('.methods button');
    var modeBtns = root.querySelectorAll('.seg button');
    var rateBtns = root.querySelectorAll('.speed button');

    var state = { dir: null, hasHQ: true, left: 'lq', mode: 'slider', rate: 1, playing: true, label: '' };
    var pool = {};       // method -> <video>
    var master = null;   // the FADRA video drives the clock
    var scrubbing = false;

    function makeVideo(src) {
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.loop = false; v.preload = 'auto';
      v.setAttribute('playsinline', '');
      v.src = src;
      return v;
    }

    function available() {
      return METHODS.map(function (m) { return m[0]; }).filter(function (k) { return k !== 'hq' || state.hasHQ; });
    }

    function loadExample(btn) {
      Object.keys(pool).forEach(function (k) { pool[k].pause(); pool[k].removeAttribute('src'); pool[k].load(); pool[k].remove(); });
      pool = {};
      state.dir = btn.dataset.dir;
      state.hasHQ = btn.dataset.hq === '1';
      state.label = btn.getAttribute('aria-label');
      if (state.left === 'hq' && !state.hasHQ) state.left = 'lq';
      thumbs.forEach(function (t) { t.setAttribute('aria-pressed', t === btn ? 'true' : 'false'); });
      methodBtns.forEach(function (b) { b.disabled = b.dataset.m === 'hq' && !state.hasHQ; });

      available().forEach(function (k) { pool[k] = makeVideo(state.dir + '/' + k + '.mp4'); });
      master = pool.ours;
      master.poster = state.dir + '/poster.jpg';
      pool.lq.poster = state.dir + '/poster_lq.jpg';
      master.addEventListener('ended', function () { seek(0); if (state.playing) playAll(); });
      master.addEventListener('timeupdate', updateTime);

      loading.hidden = false;
      var pending = available().length;
      available().forEach(function (k) {
        pool[k].playbackRate = state.rate;
        pool[k].addEventListener('canplay', function once() {
          pool[k].removeEventListener('canplay', once);
          if (--pending === 0) { loading.hidden = true; if (state.playing) playAll(); }
        });
      });
      render();
    }

    function render() {
      if (state.mode === 'slider') {
        gridView.hidden = true; sliderView.hidden = false;
        under.appendChild(master);
        top.appendChild(pool[state.left]);
        // Park the others off-screen but keep them in sync for instant switching.
        available().forEach(function (k) {
          if (k !== 'ours' && k !== state.left) park(pool[k]);
        });
        tagL.textContent = NAME[state.left];
      } else {
        sliderView.hidden = true; gridView.hidden = false;
        gridView.innerHTML = '';
        available().forEach(function (k) {
          var tile = document.createElement('figure');
          tile.className = 'tile' + (k === 'ours' ? ' ours' : '');
          tile.appendChild(pool[k]);
          var cap = document.createElement('figcaption');
          cap.textContent = NAME[k];
          tile.appendChild(cap);
          gridView.appendChild(tile);
        });
        if (!state.hasHQ) {
          var note = document.createElement('div');
          note.className = 'tile note';
          note.textContent = 'No ground truth for real-world footage';
          gridView.appendChild(note);
        }
      }
      methodBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === state.left ? 'true' : 'false'); });
      modeBtns.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === state.mode ? 'true' : 'false'); });
      root.querySelector('.methods').classList.toggle('muted', state.mode === 'grid');
      now.textContent = state.label + (state.mode === 'slider' ? ' · ' + NAME[state.left] + ' vs. FADRA' : ' · all methods');
    }

    var parking = document.createElement('div');
    parking.className = 'parking';
    root.appendChild(parking);
    function park(v) { if (v.parentNode !== parking) parking.appendChild(v); }

    function each(fn) { Object.keys(pool).forEach(function (k) { fn(pool[k], k); }); }
    function playAll() { each(function (v) { v.play().catch(function () {}); }); setPlayIcon(); }
    function pauseAll() { each(function (v) { v.pause(); }); setPlayIcon(); }
    function seek(t) { each(function (v) { v.currentTime = t; }); }

    function setPlayIcon() {
      playBtn.classList.toggle('paused', !state.playing);
      playBtn.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
    }

    function updateTime() {
      if (!master || !master.duration) return;
      if (!scrubbing) scrub.value = Math.round(master.currentTime / master.duration * 1000);
      timeEl.textContent = master.currentTime.toFixed(1) + ' s';
    }

    // Keep every video locked to the FADRA clock.
    (function tick() {
      if (master && !master.seeking) {
        var t = master.currentTime;
        each(function (v, k) {
          if (k === 'ours') return;
          if (Math.abs(v.currentTime - t) > 0.07) v.currentTime = t;
          if (state.playing && v.paused && !master.paused) v.play().catch(function () {});
        });
      }
      requestAnimationFrame(tick);
    })();

    thumbs.forEach(function (t) { t.addEventListener('click', function () { if (t.dataset.dir !== state.dir) loadExample(t); }); });
    methodBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.left = b.dataset.m;
        state.mode = 'slider';
        render();
        pool[state.left].currentTime = master.currentTime;
        if (state.playing) pool[state.left].play().catch(function () {});
      });
    });
    modeBtns.forEach(function (b) { b.addEventListener('click', function () { state.mode = b.dataset.mode; render(); if (state.playing) playAll(); }); });
    rateBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.rate = parseFloat(b.dataset.rate);
        each(function (v) { v.playbackRate = state.rate; });
        rateBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      });
    });
    playBtn.addEventListener('click', function () {
      state.playing = !state.playing;
      if (state.playing) playAll(); else pauseAll();
    });
    scrub.addEventListener('input', function () {
      scrubbing = true;
      if (master && master.duration) seek(scrub.value / 1000 * master.duration);
    });
    scrub.addEventListener('change', function () { scrubbing = false; });

    // Slider dragging.
    function setPos(x) {
      var r = compare.getBoundingClientRect();
      var p = Math.min(Math.max((x - r.left) / r.width, 0), 1);
      compare.style.setProperty('--pos', (p * 100).toFixed(2) + '%');
    }
    var dragging = false;
    compare.addEventListener('pointerdown', function (e) { dragging = true; compare.setPointerCapture(e.pointerId); setPos(e.clientX); });
    compare.addEventListener('pointermove', function (e) { if (dragging) setPos(e.clientX); });
    compare.addEventListener('pointerup', function () { dragging = false; });
    compare.addEventListener('pointercancel', function () { dragging = false; });

    // Pause while the demo is off screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) each(function (v) { v.pause(); });
          else if (state.playing) playAll();
        });
      }, { threshold: 0.1 }).observe(root);
    }

    setPlayIcon();
    loadExample(thumbs[0]);
  }

  // ---------- Tabs ----------
  document.querySelectorAll('.tabs').forEach(function (bar) {
    var buttons = bar.querySelectorAll('button');
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (o) {
          var on = o === b;
          o.setAttribute('aria-selected', on ? 'true' : 'false');
          document.getElementById(o.dataset.target).hidden = !on;
        });
      });
    });
  });

  // ---------- Lightbox ----------
  var lb = document.querySelector('.lightbox');
  var lbImg = lb.querySelector('img');
  document.querySelectorAll('.zoomable img').forEach(function (img) {
    img.addEventListener('click', function () {
      lbImg.src = img.src; lbImg.alt = img.alt; lb.hidden = false;
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'BUTTON') closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  // ---------- Copy BibTeX ----------
  var copyBtn = document.querySelector('.copy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = document.querySelector('.bib code').textContent;
    navigator.clipboard.writeText(text).then(function () {
      copyBtn.textContent = 'Copied';
      setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });
})();
