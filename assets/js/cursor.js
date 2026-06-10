/* FlashAfro — cursor.js
   Custom cursor: dot + ring, CSS-transition following, data-cursor states.
   Works on all pages. Hides on touch/mobile. */

(function () {
  'use strict';

  /* --- bail out on touch devices --- */
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  /* --- Position tracking via CSS left/top (transition handles lag) --- */
  let mx = -200, my = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = mx + 'px';
    ring.style.top  = my + 'px';
  });

  /* --- Hide when leaving window --- */
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '';
    ring.style.opacity = '';
  });

  /* --- State management --- */
  function setState(state) {
    dot.setAttribute('data-cursor',  state || '');
    ring.setAttribute('data-cursor', state || '');
  }

  /* --- Click pulse --- */
  document.addEventListener('mousedown', () => dot.classList.add('cursor-click'));
  document.addEventListener('mouseup',   () => dot.classList.remove('cursor-click'));

  /* --- Hover targets --- */
  function addHovers(selector, state) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => setState(state));
      el.addEventListener('mouseleave', () => setState(''));
    });
  }

  // Buttons / CTAs
  addHovers('.btn-primary, .btn-secondary, .nav-cta, .magnetic[href], button.nav-burger', 'button');
  // Cards
  addHovers('.lab-card, .thought-card', 'card');
  // Video panel
  addHovers('.hero-right, .video-panel', 'video');
  // Links and nav
  addHovers('a, .nav-link', 'link');

  /* Cards and buttons override the generic link state — re-register card/button
     after link so their mouseenter fires last. The above order is correct because
     event order on the same element is insertion order; but nested elements mean a
     card's link children could flip back to 'link'. Fix: track nested depth. */

  /* Refinement: for elements that are links inside cards, keep card state */
  document.querySelectorAll('.lab-card a, .thought-card a').forEach(el => {
    el.addEventListener('mouseenter', () => setState('card'));
  });

  /* Hero-right video links */
  document.querySelectorAll('.hero-right a').forEach(el => {
    el.addEventListener('mouseenter', () => setState('video'));
  });

})();
