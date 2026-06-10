/**
 * nav-active.js
 * Sets the correct active nav link based on:
 *  - Current page (lab/, thoughts/, homepage)
 *  - Scroll position on homepage (IntersectionObserver)
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var path     = window.location.pathname;
    var navLinks = document.querySelectorAll('.nav-link');
    var connectBtn = document.querySelector('.nav-cta');

    /* ── helpers ─────────────────────────────────────────────────── */
    function clearActive() {
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      if (connectBtn) connectBtn.classList.remove('active');
    }

    function activate(el) {
      clearActive();
      if (el) el.classList.add('active');
    }

    /* ── find a nav-link whose href contains a keyword ───────────── */
    function linkFor(keyword) {
      var found = null;
      navLinks.forEach(function (l) {
        if ((l.getAttribute('href') || '').indexOf(keyword) !== -1) found = l;
      });
      return found;
    }

    /* ── page-level detection ─────────────────────────────────────── */
    var isHomepage = (
      path === '/' ||
      (path.endsWith('index.html') && path.indexOf('/lab/') === -1 && path.indexOf('/thoughts/') === -1)
    );

    if (path.indexOf('/lab/') !== -1) {
      activate(linkFor('#lab') || linkFor('lab'));

    } else if (path.indexOf('/thoughts/') !== -1) {
      activate(linkFor('#thoughts') || linkFor('thoughts'));

    } else if (isHomepage) {
      /* default to Home on page load */
      activate(linkFor('#top') || linkFor('#hero'));

      /* ── IntersectionObserver for homepage scroll ─────────────── */
      var sectionLinks = {
        hero:     linkFor('#top') || linkFor('#hero'),
        lab:      linkFor('#lab'),
        thoughts: linkFor('#thoughts'),
        about:    linkFor('#about'),
        connect:  connectBtn
      };

      /* track which section is most visible */
      var visibleSections = {};

      function pickActive() {
        /* priority order matches page layout */
        var order = ['connect', 'about', 'thoughts', 'lab', 'hero'];
        for (var i = 0; i < order.length; i++) {
          if (visibleSections[order[i]]) {
            activate(sectionLinks[order[i]]);
            return;
          }
        }
        activate(sectionLinks.hero); /* fallback: home */
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visibleSections[entry.target.id] = entry.isIntersecting;
        });
        pickActive();
      }, { threshold: 0.3 });

      ['hero', 'lab', 'thoughts', 'about', 'connect'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }
  });
})();
