/* nav-paths.js — auto-corrects nav hrefs for any page depth
 *
 * How it works:
 *   This script is always loaded from assets/js/nav-paths.js.
 *   It reads its own <script src> attribute, counts how many '../'
 *   segments prefix the path, and uses that as the site depth.
 *   Then it rewrites every [data-nav-href] anchor to the correct
 *   root-relative path.
 *
 * Usage in HTML (depth-1 fallback is hardcoded in href; JS keeps
 * it correct for any future depth):
 *
 *   <a href="../index.html#lab" data-nav-href="index.html#lab">The Lab</a>
 *
 * Adding a new page at depth 2?  Just include this script at:
 *   ../../assets/js/nav-paths.js
 * and the hrefs fix themselves automatically.
 */
(function fixNavPaths() {
  // Find this script's own src attribute to determine site depth.
  // Works for both file:// and https:// without needing a server.
  const scripts = document.querySelectorAll('script[src]');
  let depth = 0;
  for (const s of scripts) {
    const src = s.getAttribute('src') || '';
    if (src.includes('nav-paths.js')) {
      depth = (src.match(/\.\.\//g) || []).length;
      break;
    }
  }

  if (depth === 0) return; // root page — nothing to fix

  const prefix = '../'.repeat(depth);

  document.querySelectorAll('[data-nav-href]').forEach(el => {
    el.setAttribute('href', prefix + el.getAttribute('data-nav-href'));
  });
})();
