(function () {
  'use strict';

  function textFromMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? (el.getAttribute('content') || '') : '';
  }

  function ensureSchema(type, payload) {
    var marker = 'data-schema-' + type.toLowerCase();
    if (document.querySelector('script[' + marker + ']')) return;

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(marker, 'true');
    script.text = JSON.stringify(payload);
    document.head.appendChild(script);
  }

  function canonicalUrl() {
    var el = document.querySelector('link[rel="canonical"]');
    if (el && el.href) return el.href;
    return window.location.href;
  }

  function init() {
    var pageTitle = document.title || 'CHOCOCAM S.A.R.L';
    var pageDescription = textFromMeta('description') || 'Cameroon cocoa exporter for international buyers.';
    var pageUrl = canonicalUrl();

    ensureSchema('organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CHOCOCAM S.A.R.L',
      url: 'https://nji-louis.github.io/Cocoa-export/',
      logo: 'https://nji-louis.github.io/Cocoa-export/img/cacao.jpg',
      email: 'export@chococam-sarl.com',
      telephone: '+237671742824',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bonaberi Industrial Zone',
        addressLocality: 'Douala',
        addressRegion: 'Littoral Region',
        addressCountry: 'CM'
      },
      sameAs: [
        'https://www.facebook.com/profile.php?id=61582469037982',
        'https://www.linkedin.com/in/eudriverslicence'
      ]
    });

    ensureSchema('webpage', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: pageUrl,
      inLanguage: 'en'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
