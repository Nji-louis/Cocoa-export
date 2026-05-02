(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  ready(function () {
    var articleBody = document.getElementById('blog-article-body');
    var tocRoot = document.getElementById('article-toc');
    if (articleBody == null || tocRoot == null) return;

    var headings = Array.prototype.slice.call(articleBody.querySelectorAll('h2, h3')).filter(function (heading) {
      return heading.id;
    });

    if (headings.length === 0) {
      tocRoot.innerHTML = '<p>No table of contents available.</p>';
      return;
    }

    tocRoot.innerHTML = headings.map(function (heading) {
      var isSub = heading.tagName.toLowerCase() === 'h3';
      return '<a href="#' + heading.id + '" class="' + (isSub ? 'is-sub' : '') + '">' + heading.textContent + '</a>';
    }).join('');

    var tocLinks = Array.prototype.slice.call(tocRoot.querySelectorAll('a'));

    function setActive(id) {
      tocLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
      });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      }, {
        rootMargin: '-10% 0px -65% 0px',
        threshold: 0.1
      });

      headings.forEach(function (heading) {
        observer.observe(heading);
      });
    } else {
      setActive(headings[0].id);
    }
  });
})();
