/**
 * post-share.js
 * Injects the share section into any page that has .post-body.
 * Place the script tag in the post template — fires automatically.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var bodyEl = document.querySelector('.post-body');
    if (!bodyEl) return;

    var pageUrl   = encodeURIComponent(window.location.href);
    var pageTitle = encodeURIComponent(document.title);

    var share = document.createElement('div');
    share.className = 'post-share';
    share.innerHTML =
      '<span class="post-share-label">Share this</span>' +
      '<div class="post-share-buttons">' +
        '<a class="post-share-btn" id="shareLinkedIn"' +
           ' href="https://www.linkedin.com/sharing/share-offsite/?url=' + pageUrl + '"' +
           ' target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
        '<a class="post-share-btn" id="shareTwitter"' +
           ' href="https://twitter.com/intent/tweet?text=' + pageTitle + '&url=' + pageUrl + '"' +
           ' target="_blank" rel="noopener noreferrer">X / Twitter</a>' +
        '<button class="post-share-btn" id="shareCopyLink">Copy link</button>' +
      '</div>' +
      '<a class="post-share-convo"' +
         ' href="https://www.linkedin.com/in/cheryl-harris-uk/"' +
         ' target="_blank" rel="noopener noreferrer">' +
         'Thoughts? Continue the conversation on LinkedIn →' +
      '</a>';

    /* Insert before .post-tags if present, otherwise append */
    var tagsEl = bodyEl.querySelector('.post-tags');
    if (tagsEl) {
      bodyEl.insertBefore(share, tagsEl);
    } else {
      bodyEl.appendChild(share);
    }

    /* Copy-link button */
    document.getElementById('shareCopyLink').addEventListener('click', function () {
      var btn = this;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy link'; }, 2000);
        });
      } else {
        /* Fallback for older browsers */
        var ta = document.createElement('textarea');
        ta.value = window.location.href;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy link'; }, 2000);
      }
    });
  });
})();
