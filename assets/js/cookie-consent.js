/**
 * Cookie consent + Google Analytics loader
 *
 * Flow:
 * 1. Always inject the banner (hidden) on DOMContentLoaded.
 * 2. Read localStorage.cookie_consent.
 *    - "accepted"  → load analytics, banner stays hidden.
 *    - "declined"  → banner stays hidden.
 *    - not set     → show banner, wait for click.
 */
(function () {

  /* ── Analytics loader (safe to call multiple times) ──────────── */
  window.loadAnalytics = function () {
    if (window.analyticsLoaded) return;
    window.analyticsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-3JF1HLXYKN';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-3JF1HLXYKN');
  };

  /* ── Inject banner + check consent after DOM is ready ────────── */
  document.addEventListener('DOMContentLoaded', function () {

    /* Styles — banner hidden by default */
    var style = document.createElement('style');
    style.textContent = [
      '#cookie-banner{',
        'display:none;',                          /* hidden until JS shows it */
        'position:fixed;bottom:0;left:0;right:0;',
        'background:#1a1410;',
        'padding:16px 32px;',
        'align-items:center;justify-content:space-between;',
        'gap:16px;z-index:9999;',
      '}',
      '#cookie-banner p{',
        'margin:0;',
        'font-family:"DM Sans",sans-serif;',
        'font-size:13px;',
        'color:rgba(245,240,232,.7);',
        'line-height:1.55;',
        'max-width:600px;',
      '}',
      '.cookie-btns{display:flex;gap:10px;flex-shrink:0;}',
      '#cookie-accept{',
        'background:#E85D26;color:#fff;',
        'font-family:"DM Sans",sans-serif;',
        'font-size:12px;font-weight:600;',
        'padding:8px 20px;border-radius:20px;',
        'border:none;cursor:pointer;white-space:nowrap;',
        'transition:opacity .15s;',
      '}',
      '#cookie-accept:hover{opacity:.85;}',
      '#cookie-decline{',
        'background:transparent;',
        'color:rgba(245,240,232,.5);',
        'font-family:"DM Sans",sans-serif;',
        'font-size:12px;',
        'padding:8px 16px;',
        'border:1px solid rgba(245,240,232,.2);',
        'border-radius:20px;cursor:pointer;white-space:nowrap;',
        'transition:border-color .15s,color .15s;',
      '}',
      '#cookie-decline:hover{',
        'border-color:rgba(245,240,232,.4);',
        'color:rgba(245,240,232,.75);',
      '}',
      '@media(max-width:768px){',
        '#cookie-banner{flex-direction:column;align-items:flex-start;padding:16px 20px;gap:12px;}',
        '.cookie-btns{width:100%;}',
      '}'
    ].join('');
    document.head.appendChild(style);

    /* Banner element — always injected, starts hidden */
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML =
      '<p>This site uses analytics to understand how people find and use it. ' +
      'No personal data is sold or shared.</p>' +
      '<div class="cookie-btns">' +
        '<button id="cookie-accept">That\'s fine</button>' +
        '<button id="cookie-decline">No thanks</button>' +
      '</div>';
    document.body.appendChild(banner);

    /* Read stored consent */
    var consent = localStorage.getItem('cookie_consent');

    if (consent === 'accepted') {
      window.loadAnalytics();
      return; /* banner stays hidden */
    }

    if (consent === 'declined') {
      return; /* banner stays hidden, no analytics */
    }

    /* No stored choice — show the banner */
    banner.style.display = 'flex';

    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem('cookie_consent', 'accepted');
      banner.style.display = 'none';
      window.loadAnalytics();
    });

    document.getElementById('cookie-decline').addEventListener('click', function () {
      localStorage.setItem('cookie_consent', 'declined');
      banner.style.display = 'none';
    });
  });

})();
