/* FlashAfro — main.js
   Homepage-only logic.
   Cursor handled by assets/js/cursor.js (loaded before this). */

/* --- NAV SCROLL SHADOW --- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
});

/* --- MOBILE MENU --- */
const burger     = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ============================================
   TEXT SCRAMBLE — used by hero reveal + headline
   ============================================ */
class TextScramble {
  constructor(el) {
    this.el    = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const promise = new Promise(resolve => { this.resolve = resolve; });
    this.queue = [...newText].map(to => ({
      to,
      start : Math.floor(Math.random() * 14),
      end   : Math.floor(Math.random() * 14) + Math.floor(Math.random() * 14),
    }));
    cancelAnimationFrame(this.frameReq);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let out = '', done = 0;
    for (const { to, start, end } of this.queue) {
      if (this.frame >= end)        { done++; out += to; }
      else if (this.frame >= start) { out += `<span style="opacity:.35">${this.chars[Math.floor(Math.random()*this.chars.length)]}</span>`; }
      else                          { out += to; }
    }
    this.el.innerHTML = out;
    if (done === this.queue.length) { this.resolve(); }
    else { this.frameReq = requestAnimationFrame(this.update); this.frame++; }
  }
}

/* ============================================
   HERO SPLIT REVEAL + VIDEO LIFECYCLE
   ============================================ */
(function heroReveal() {
  const hero       = document.querySelector('.hero');
  const heroLeft   = document.querySelector('.hero-left');
  const heroRight  = document.querySelector('.hero-right');
  const hint       = document.getElementById('videoHint');
  const replayWrap = document.getElementById('videoReplay');
  const replayBtn  = document.getElementById('replayBtn');
  const video      = document.getElementById('heroVideo');
  if (!hero || !heroLeft || !heroRight || !video) return;

  const isMobile  = window.matchMedia('(max-width: 900px)').matches;
  const isPreview = new URLSearchParams(window.location.search).has('preview');

  /* ---- helpers ---- */
  const wait = ms => new Promise(res => setTimeout(res, ms));

  function showHint()  {
    if (!hint) return;
    hint.classList.remove('hint-out', 'hint-hidden');
  }
  function hideHint()  {
    if (!hint) return;
    hint.classList.add('hint-out');
  }
  function showReplay() {
    if (!replayWrap || isMobile) return;
    if (hint) hint.classList.add('hint-hidden'); // never both at once
    replayWrap.setAttribute('aria-hidden', 'false');
    replayWrap.classList.add('replay-visible');
  }
  function hideReplay() {
    if (!replayWrap) return;
    replayWrap.classList.remove('replay-visible');
    replayWrap.setAttribute('aria-hidden', 'true');
  }

  /* ---- settle: final split state ---- */
  function settle() {
    hero.classList.add('hero-settled');
    heroLeft.classList.remove('is-splitting');
    heroRight.classList.remove('is-splitting');
    heroLeft.classList.add('text-in');
    hideHint();
  }

  /* ---- reverse: collapse text panel back to full-video state ---- */
  function reverse() {
    return new Promise(res => {
      // Fade text content out fast
      heroLeft.style.transition = 'opacity 300ms ease';
      heroLeft.style.opacity    = '0';

      // After a beat, collapse panels
      setTimeout(() => {
        hero.classList.remove('hero-settled');
        heroLeft.classList.remove('text-in');
        heroLeft.classList.remove('is-splitting');
        heroRight.classList.remove('is-splitting');

        // Force reflow so transition fires
        heroLeft.offsetHeight;

        heroLeft.style.transition  = 'width 600ms cubic-bezier(0.77,0,0.175,1), opacity 300ms ease';
        heroRight.style.transition = 'width 600ms cubic-bezier(0.77,0,0.175,1)';
        heroLeft.style.width       = '0';
        heroRight.style.width      = '100%';
        heroRight.style.flex       = '0 0 auto';

        setTimeout(() => {
          // Clean up inline styles — CSS classes take over again
          heroLeft.style.cssText  = '';
          heroRight.style.cssText = '';
          res();
        }, 650);
      }, 100);
    });
  }

  /* ---- split sequence (shared by first play + replay) ---- */
  async function runSplitSequence() {
    hideHint();
    await wait(200);
    heroLeft.classList.add('is-splitting');
    heroRight.classList.add('is-splitting');
    await wait(400);
    heroLeft.classList.add('text-in');
    await wait(160);
    const aiEl = document.querySelector('.hero-headline .hl-ai');
    if (aiEl) new TextScramble(aiEl).setText('AI.');
    await wait(840);
    settle();
    sessionStorage.setItem('heroPlayed', 'true');
  }

  /* ---- video-end handler (registered each play) ---- */
  function onVideoEnded() {
    video.pause(); // freeze on last frame
    if (hero.classList.contains('hero-settled')) {
      showReplay();
    }
  }

  /* ---- replay click ---- */
  if (replayBtn) {
    replayBtn.addEventListener('click', async () => {
      hideReplay();
      sessionStorage.removeItem('heroPlayed');

      // Reverse split back to full-video
      await reverse();

      // Restart video
      video.currentTime = 0;
      video.play().catch(() => {});

      // Show hint again
      showHint();

      // Wait for user click or 2.5s auto-trigger
      await new Promise(res => {
        const autoTimer = setTimeout(res, 2500);
        heroRight.addEventListener('click', () => { clearTimeout(autoTimer); res(); }, { once: true });
      });

      await runSplitSequence();
    });
  }

  /* ---- Register ended handler ---- */
  video.addEventListener('ended', onVideoEnded);

  /* ---- INITIAL LOAD ---- */
  const alreadySeen = sessionStorage.getItem('heroPlayed') === 'true';

  if (isMobile || (alreadySeen && !isPreview)) {
    // Skip straight to settled split — video plays once then freezes
    settle();
    return;
  }

  // Fresh play — wait for user click or 2.5s auto-trigger
  let triggered = false;
  function trigger() {
    if (triggered) return;
    triggered = true;
    runSplitSequence();
  }

  const autoTimer = setTimeout(trigger, 2500);
  heroRight.addEventListener('click', () => { clearTimeout(autoTimer); trigger(); }, { once: true });
})();

/* ============================================
   HEADLINE CYCLING ERASER ANIMATION
   ============================================ */
(function headlineCycle() {
  if (window.matchMedia('(max-width: 768px)').matches) return;

  /* --- Variation data --- */
  const V = [
    { verb: 'Making',        things: '‘things’' },
    { verb: 'Breaking',      things: '‘things’' },
    { verb: 'Testing',       things: '‘things’' },
    { verb: 'Designing',     things: '‘things’' },
    { verb: 'Storyboarding', things: '‘things’' },
    { verb: 'Figuring out',  things: '‘things’' },
    { verb: 'Arguing',       things: '‘things’' },
    { verb: 'Simplifying',   things: '‘things’' },
  ];

  const HOLD_MS         = 3500;
  const FIRST_HOLD_MS   = 4000;

  /* --- Element refs --- */
  const verb1    = document.getElementById('hlVerb');
  const strike1  = document.getElementById('hlStrike1');
  const mask1    = document.getElementById('hlMask1');
  const eraser1  = document.getElementById('hlEraser1');
  const row1     = document.getElementById('hlRow1');

  const verb2    = document.getElementById('hlThings');
  const strike2  = document.getElementById('hlStrike2');
  const mask2    = document.getElementById('hlMask2');
  const eraser2  = document.getElementById('hlEraser2');
  const row2     = document.getElementById('hlRow2');

  if (!verb1 || !verb2) return;

  /* --- Helpers --- */
  const wait = ms => new Promise(res => setTimeout(res, ms));

  function getBounds(textEl, rowEl) {
    const tr = textEl.getBoundingClientRect();
    const rr = rowEl.getBoundingClientRect();
    return {
      left  : tr.left - rr.left,
      top   : tr.top  - rr.top,
      width : tr.width,
      height: tr.height,
    };
  }

  function spawnCrumbs(rowEl, b) {
    const n = 4 + Math.floor(Math.random() * 3); // 4-6
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'hl-crumb';
      const sz = 2 + Math.random() * 3;
      c.style.cssText = [
        `left:${b.left + Math.random() * b.width}px`,
        `top:${b.top + b.height * (0.3 + Math.random() * 0.5)}px`,
        `width:${sz}px`, `height:${sz}px`,
        'opacity:1', 'transition:none',
      ].join(';');
      rowEl.appendChild(c);
      // next frame: start drift + fade
      requestAnimationFrame(() => {
        c.style.transition = 'transform 800ms ease, opacity 800ms ease';
        c.style.transform  = `translateY(${7 + Math.random() * 12}px) translateX(${(Math.random()-0.5)*10}px)`;
        c.style.opacity    = '0';
      });
      setTimeout(() => c.remove(), 900);
    }
  }

  /* ---- Typewriter reveal ----------------------------------------
     Types newText into textEl one character at a time.
     Caller must have already cleared textEl.textContent and
     removed any covering mask BEFORE calling this.
     cursorColor: colour of the blinking | cursor.
     Returns a promise that resolves when the cursor blinks out. */
  function typewriterReveal(textEl, newText, cursorColor) {
    return new Promise(resolve => {
      // textContent already cleared by animateLine before mask was removed
      // — do NOT clear it here or we risk a flash on the next cycle

      const chars    = [...newText];          // unicode-safe split
      const BASE_MS  = chars.length > 12 ? 45 : 60;
      let   i        = 0;
      let   cursorOn = true;
      let   blinkTimer, charTimer;

      // Blinking cursor rendered via a <span> appended after the text node
      const cursorSpan = document.createElement('span');
      cursorSpan.textContent = '|';
      cursorSpan.style.cssText = `color:${cursorColor}; opacity:1;`;
      textEl.appendChild(cursorSpan);

      function blinkCursor() {
        cursorOn = !cursorOn;
        cursorSpan.style.opacity = cursorOn ? '1' : '0';
      }
      blinkTimer = setInterval(blinkCursor, 500);

      function typeNext() {
        if (i < chars.length) {
          // Insert next char before the cursor span
          textEl.insertBefore(document.createTextNode(chars[i]), cursorSpan);
          i++;
          const jitter = Math.random() * 20;   // 0–20ms organic randomness
          charTimer = setTimeout(typeNext, BASE_MS + jitter);
        } else {
          // Word fully typed — blink 2 more times then remove cursor
          let blinksLeft = 4; // 2 full on/off cycles = 4 toggles
          clearInterval(blinkTimer);
          blinkTimer = setInterval(() => {
            blinkCursor();
            blinksLeft--;
            if (blinksLeft <= 0) {
              clearInterval(blinkTimer);
              cursorSpan.remove();
              resolve();
            }
          }, 500);
        }
      }

      charTimer = setTimeout(typeNext, BASE_MS);
    });
  }

  /* Core line animation — returns a promise that resolves when typing ends */
  async function animateLine(textEl, strikeEl, maskEl, eraserEl, rowEl, newText, cursorColor) {
    const b = getBounds(textEl, rowEl);
    const wL = b.left;
    const wR = b.left + b.width;
    const strikeY = b.top + b.height * 0.54;

    // ── Step 1: strikethrough draws in ────────────────────────────
    strikeEl.style.cssText = `left:${wL}px; top:${strikeY}px; width:${b.width}px; transform:scaleX(0); transition:none;`;
    strikeEl.offsetHeight; // force reflow
    strikeEl.style.transition = 'transform 280ms ease-out';
    strikeEl.style.transform  = 'scaleX(1)';

    await wait(380);

    // ── Step 2: eraser fades in ────────────────────────────────────
    const eraserTop = b.top + b.height * 0.5 - 22;
    eraserEl.style.cssText = `top:${eraserTop}px; left:${wL - 20}px; transform:rotate(-15deg); opacity:0; transition:opacity 120ms ease;`;
    eraserEl.offsetHeight;
    eraserEl.style.opacity = '1';

    await wait(120);

    // ── Step 3: Pass 1 L → R ──────────────────────────────────────
    eraserEl.style.transition = 'left 300ms cubic-bezier(0.4,0,0.6,1), transform 300ms ease';
    eraserEl.style.left      = (wR + 20) + 'px';
    eraserEl.style.transform = 'rotate(-18deg)';
    spawnCrumbs(rowEl, b);

    await wait(300);

    // ── Step 4: Pass 2 R → L  +  mask covers old word ─────────────
    maskEl.style.cssText = `top:${b.top}px; left:${wL}px; width:0; height:${b.height + 4}px; transition:none;`;
    maskEl.offsetHeight;
    maskEl.style.transition = 'width 300ms ease';
    maskEl.style.width      = (b.width * 1.08) + 'px';

    eraserEl.style.transition = 'left 300ms cubic-bezier(0.4,0,0.6,1), transform 300ms ease';
    eraserEl.style.left      = (wL - 20) + 'px';
    eraserEl.style.transform = 'rotate(-15deg)';
    spawnCrumbs(rowEl, b);

    await wait(300);

    // ── Step 5: Pass 3 L → R ──────────────────────────────────────
    eraserEl.style.transition = 'left 300ms cubic-bezier(0.4,0,0.6,1), transform 300ms ease';
    eraserEl.style.left      = (wR + 20) + 'px';
    eraserEl.style.transform = 'rotate(-18deg)';
    spawnCrumbs(rowEl, b);

    await wait(300);

    // ── Step 6: clear text WHILE mask still covers it ─────────────
    // This is the critical ordering: textContent = "" happens first,
    // while the mask (still at full width) hides the element.
    // The browser never gets a chance to paint the old word uncovered.
    textEl.textContent = '';

    // Strike snaps off
    strikeEl.style.transition = 'none';
    strikeEl.style.transform  = 'scaleX(0)';

    // Eraser slides off right + fades (still in motion during the gap)
    eraserEl.style.transition = 'left 300ms ease, opacity 300ms ease, transform 300ms ease';
    eraserEl.style.left       = (wR + 120) + 'px';
    eraserEl.style.opacity    = '0';
    eraserEl.style.transform  = 'rotate(-12deg)';

    // Wait one rAF so the empty textContent is committed to the render tree,
    // then remove the mask — revealing only empty space, never the old word.
    await new Promise(res => requestAnimationFrame(res));
    maskEl.style.cssText = `top:0; left:0; width:0; height:0; transition:none;`;

    // Brief pause while eraser finishes exiting
    await wait(180);

    // ── Step 7: typewriter reveal ─────────────────────────────────
    await typewriterReveal(textEl, newText, cursorColor);

    // Reset eraser position for next cycle
    eraserEl.style.cssText = `top:${eraserTop}px; left:${wL - 20}px; opacity:0; transform:rotate(-15deg); transition:none;`;
  }

  async function transitionTo(fromIdx, toIdx) {
    const needLine2 = V[fromIdx].things !== V[toIdx].things;

    // Line 1 colour: purple (#5B3FC8). Line 2 colour: ink (#1a1410).
    const LINE1_COLOR = '#5B3FC8';
    const LINE2_COLOR = '#1a1410';

    if (needLine2) {
      // Variation 7: lines are sequential — line 2 starts only after line 1
      // finishes typing (not on a fixed delay, so long words feel natural)
      await animateLine(verb1, strike1, mask1, eraser1, row1, V[toIdx].verb,   LINE1_COLOR);
      await wait(200); // brief breath between the two lines
      await animateLine(verb2, strike2, mask2, eraser2, row2, V[toIdx].things, LINE2_COLOR);
    } else {
      // Lines animate in parallel (line 2 unchanged, so it's a no-op Promise)
      await animateLine(verb1, strike1, mask1, eraser1, row1, V[toIdx].verb, LINE1_COLOR);
    }
  }

  /* --- Session-restored starting index --- */
  let idx = parseInt(sessionStorage.getItem('fa_headline_idx') || '0', 10);
  if (isNaN(idx) || idx < 0 || idx >= V.length) idx = 0;

  // Apply current variation text immediately (hero reveal handles visibility)
  verb1.textContent = V[idx].verb;
  verb2.textContent = V[idx].things;

  async function run() {
    // First hold — longer on very first load
    await wait(idx === 0 ? FIRST_HOLD_MS : HOLD_MS);

    // Cycle forever
    while (true) {
      const next = (idx + 1) % V.length;
      await transitionTo(idx, next);
      idx = next;
      sessionStorage.setItem('fa_headline_idx', idx.toString());
      await wait(HOLD_MS);
    }
  }

  // Start after hero reveal has settled so text is visible
  // (hero settle fires at ~1600ms from trigger, trigger at 2500ms = ~4.1s max)
  // We simply wait for the .hero-settled class before starting
  function waitForSettled(cb) {
    const hero = document.querySelector('.hero');
    if (hero && hero.classList.contains('hero-settled')) { cb(); return; }
    const mo = new MutationObserver(() => {
      if (hero && hero.classList.contains('hero-settled')) { mo.disconnect(); cb(); }
    });
    mo.observe(hero, { attributes: true, attributeFilter: ['class'] });
    // Fallback in case hero is already settled or observer misses
    setTimeout(cb, 5000);
  }

  waitForSettled(run);
})();

/* ============================================
   CHIBI DOODLE SCROLL REVEAL
   ============================================ */
const doodleEls = document.querySelectorAll('.doodle-element');
const doodleObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('doodle-visible'); doodleObserver.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
doodleEls.forEach(el => doodleObserver.observe(el));

/* --- SCROLL REVEAL (drift-in cards) --- */
const driftEls = document.querySelectorAll('.drift-in');
const driftObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); driftObserver.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
driftEls.forEach(el => driftObserver.observe(el));

/* --- MAGNETIC BUTTONS --- */
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.3;
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.3;
    el.style.transform = `translate(${dx}px,${dy}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

/* --- TICKER PAUSE ON HOVER --- */
const tickerTrack = document.querySelector('.ticker-track');
if (tickerTrack) {
  tickerTrack.addEventListener('mouseenter', () => { tickerTrack.style.animationPlayState = 'paused'; });
  tickerTrack.addEventListener('mouseleave', () => { tickerTrack.style.animationPlayState = 'running'; });
}

/* Video autoplay is handled by heroReveal() above — no separate call needed. */

/* --- VIDEO FLIP CARDS (lazy-load on hover) --- */
(function vidFlip() {
  // Only wire up on non-touch devices — mobile flip is disabled via CSS
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.portrait-item--vidflip').forEach(item => {
    const vid = item.querySelector('.portrait-vid');
    if (!vid) return;

    item.addEventListener('mouseenter', () => {
      // Lazy-load: set src the first time we hover
      if (!vid.src && vid.dataset.src) {
        vid.src = vid.dataset.src;
      }
      vid.play().catch(() => {});
    });

    item.addEventListener('mouseleave', () => {
      vid.pause();
    });
  });
})();

/* --- CAST CAROUSEL --- */
(function castCarousel() {
  const wrap    = document.querySelector('.portrait-scroll-wrap');
  const strip   = document.getElementById('portraitStrip');
  const prevBtn = document.getElementById('portraitPrev');
  const nextBtn = document.getElementById('portraitNext');
  if (!strip || !prevBtn || !nextBtn) return;

  const ADVANCE = 2;
  const THRESHOLD = 3; // sub-pixel fuzz for end detection
  let offset = 0; // scroll position in pixels

  function stepWidth() {
    // Width of one card-step: first card's rendered width + gap
    const first = strip.querySelector('.portrait-item');
    if (!first) return 248;
    const gap = parseFloat(getComputedStyle(strip).gap) || 28;
    return first.offsetWidth + gap;
  }

  function maxScroll() {
    // True maximum scroll: total natural strip width minus visible container.
    // strip.scrollWidth is measured at translateX(0) — correct basis.
    return Math.max(0, strip.scrollWidth - wrap.offsetWidth);
  }

  function update() {
    strip.style.transform = `translateX(-${offset}px)`;
    prevBtn.classList.toggle('nav-faded', offset <= 0);
    // Right arrow disappears only when the last card is FULLY in view.
    // THRESHOLD absorbs sub-pixel rendering differences.
    nextBtn.classList.toggle('nav-faded', offset >= maxScroll() - THRESHOLD);
  }

  prevBtn.addEventListener('click', () => {
    offset = Math.max(0, offset - ADVANCE * stepWidth());
    update();
  });
  nextBtn.addEventListener('click', () => {
    offset = Math.min(maxScroll(), offset + ADVANCE * stepWidth());
    update();
  });

  // Touch swipe
  let touchStartX = 0;
  strip.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  strip.addEventListener('touchend', e => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      offset = delta > 0
        ? Math.min(maxScroll(), offset + ADVANCE * stepWidth())
        : Math.max(0, offset - ADVANCE * stepWidth());
      update();
    }
  }, { passive: true });

  // Re-check arrow state on resize
  window.addEventListener('resize', () => {
    // Clamp offset in case viewport grew and we over-scrolled
    offset = Math.min(offset, maxScroll());
    update();
  }, { passive: true });

  update(); // initial state
})();

/* --- REEL STRIP --- */
(function reelStrip() {
  const reel = document.querySelector('.reel');
  if (!reel) return;

  // Desync clip loops so they feel alive, not mechanical
  const offsets = [0, 2, 4, 1, 3];
  reel.querySelectorAll('.reel-clip video').forEach((v, i) => {
    v.addEventListener('loadedmetadata', () => {
      v.currentTime = offsets[i] % (v.duration || 99);
    }, { once: true });
    // Fallback: set offset even if metadata already loaded
    if (v.readyState >= 1) v.currentTime = offsets[i];
    v.play().catch(() => {});
  });

  // Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        reel.classList.add('reel-visible');
        observer.unobserve(reel);
      }
    });
  }, { threshold: 0.15 });
  observer.observe(reel);
})();
