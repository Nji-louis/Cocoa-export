(function () {
  'use strict';

  var RESULTS_PAGE = 'search_results.html';

  var SITE_PAGES = [
    {
      url: 'index.html',
      title: 'Home',
      summary: 'CHOCOCAM homepage with cocoa sourcing highlights, supplier information, and market updates.',
      keywords: [
        'home',
        'chococam',
        'cameroon cocoa exporter',
        'cocoa beans',
        'traceable supply',
        'global buyers',
        'export partner',
        'douala',
        'kribi',
        'quality control',
        'moq',
        '20ft container'
      ]
    },
    {
      url: 'about.html',
      title: 'About Us',
      summary: 'Company profile, mission, and operating approach for CHOCOCAM S.A.R.L.',
      keywords: [
        'about',
        'company profile',
        'mission',
        'vision',
        'goal',
        'cameroon cocoa exporter',
        'douala',
        'ethical sourcing',
        'farmer cooperatives',
        'traceability',
        'quality assurance'
      ]
    },
    {
      url: 'services.html',
      title: 'Services',
      summary: 'Export support, documentation, logistics coordination, and customer services.',
      keywords: [
        'services',
        'cocoa export services',
        'export logistics',
        'documentation',
        'freight coordination',
        'customs clearance',
        'supply chain',
        'quality control',
        'shipping support',
        'international buyers'
      ]
    },
    {
      url: 'export.html',
      title: 'Export',
      summary: 'Export capabilities, packaging flow, and shipment process for international buyers.',
      keywords: [
        'export',
        'cocoa export operations',
        'bulk shipment',
        'container program',
        'international trade',
        'packing list',
        'commercial invoice',
        'delivery',
        'douala port',
        'kribi deep seaport',
        'cocoa butter',
        'cocoa powder'
      ]
    },
    {
      url: 'product.html',
      title: 'Products',
      summary: 'Overview of cocoa varieties and product lineup.',
      keywords: [
        'product',
        'products',
        'cocoa varieties',
        'catalog',
        'amelonado',
        'forastero',
        'trinitario',
        'criollo',
        'cundeamor',
        'bresilien',
        'brazilian cacao',
        'premium cocoa',
        'bulk manufacturing'
      ]
    },
    {
      url: 'product_detail.html',
      title: 'Product Detail',
      summary: 'Detailed product specifications for cocoa beans and quality metrics.',
      keywords: [
        'product detail',
        'export specification',
        'moisture level',
        'bean count',
        'fermentation index',
        'foreign matter',
        'certificate of origin',
        'phytosanitary certificate',
        'packing list',
        'commercial invoice',
        'traceability',
        'monthly programs'
      ]
    },
    {
      url: 'product_forastero.html',
      title: 'Forastero Cocoa',
      summary: 'Forastero cocoa profile, flavor notes, and supply information.',
      keywords: [
        'forastero',
        'export-grade forastero',
        'bulk cocoa',
        'industrial processing',
        'strong cocoa body',
        'bean count',
        'moisture control',
        'spot container orders',
        'annual contracts'
      ]
    },
    {
      url: 'product_trinitario.html',
      title: 'Trinitario Cocoa',
      summary: 'Trinitario cocoa characteristics and availability.',
      keywords: [
        'trinitario',
        'premium trinitario',
        'fine flavor cocoa',
        'aromatic depth',
        'cut test',
        'bean count',
        'contract orders',
        'spot orders',
        'traceable lots'
      ]
    },
    {
      url: 'product_criollo.html',
      title: 'Criollo Cocoa',
      summary: 'Criollo cocoa details including profile and premium quality notes.',
      keywords: [
        'criollo',
        'premium criollo',
        'gourmet chocolate',
        'rare cocoa',
        'smooth flavor',
        'specialty cocoa',
        'fine aroma'
      ]
    },
    {
      url: 'product_amelonado.html',
      title: 'Amelonado Cocoa',
      summary: 'Amelonado cocoa variety information and sourcing details.',
      keywords: [
        'amelonado',
        'classic west african profile',
        'balanced flavor',
        'export specifications',
        'cocoa variety',
        'traceable sourcing'
      ]
    },
    {
      url: 'product_cundeamor.html',
      title: 'Cundeamor Cocoa',
      summary: 'Cundeamor cocoa data with product highlights and trade details.',
      keywords: [
        'cundeamor',
        'specialty cocoa',
        'nuanced flavor',
        'premium programs',
        'origin cocoa',
        'cocoa variety'
      ]
    },
    {
      url: 'product_bresilien.html',
      title: 'Bresilien Cocoa',
      summary: 'Bresilien cocoa profile and market relevance.',
      keywords: [
        'bresilien',
        'brazilian cacao',
        'brazilian cocoa',
        'cacao bresilien',
        'international buyers',
        'cocoa variety'
      ]
    },
    {
      url: 'blog.html',
      title: 'Blog',
      summary: 'Cocoa industry articles, farming insights, and export news.',
      keywords: [
        'blog',
        'cocoa news',
        'harvest',
        'fermentation',
        'drying',
        'market updates',
        'export insights',
        'articles'
      ]
    },
    {
      url: 'blog_detail.html',
      title: 'Blog Detail',
      summary: 'Detailed cocoa article page with practical cultivation and market content.',
      keywords: [
        'blog detail',
        'cocoa harvesting tips',
        'cameroon cocoa farming',
        'fermentation and drying',
        'export standards',
        'market view',
        'article'
      ]
    },
    {
      url: 'contact.html',
      title: 'Contact',
      summary: 'Inquiry forms and contact details for buyers and partners.',
      keywords: [
        'contact',
        'export inquiry form',
        'quote',
        'whatsapp',
        'phone',
        'email',
        'destination port',
        'incoterm',
        'incoterms',
        'required volume',
        'buyer support'
      ]
    },
    {
      url: 'terms_and_conditions.html',
      title: 'Terms & Conditions',
      summary: 'Website usage terms, order conditions, liability limits, and governing law.',
      keywords: [
        'terms',
        'terms and conditions',
        'website terms',
        'order terms',
        'governing law',
        'liability',
        'contract terms',
        'buyer responsibilities'
      ]
    },
    {
      url: 'privacy_policy.html',
      title: 'Privacy Policy',
      summary: 'How CHOCOCAM S.A.R.L collects, uses, stores, and protects personal data.',
      keywords: [
        'privacy',
        'privacy policy',
        'personal data',
        'data collection',
        'cookies',
        'data retention',
        'data rights',
        'information security'
      ]
    }
  ];

  var INTENT_RULES = [
    {
      phrases: ['forastero', 'bulk'],
      boosts: {
        'product_forastero.html': 18,
        'product.html': 10,
        'export.html': 6
      }
    },
    {
      phrases: ['trinitario', 'premium'],
      boosts: {
        'product_trinitario.html': 18,
        'product.html': 10
      }
    },
    {
      phrases: ['phytosanitary'],
      boosts: {
        'product_detail.html': 18,
        'export.html': 12,
        'services.html': 6
      }
    },
    {
      phrases: ['certificate of origin'],
      boosts: {
        'product_detail.html': 16,
        'export.html': 12
      }
    },
    {
      phrases: ['douala', 'shipment'],
      boosts: {
        'export.html': 18,
        'services.html': 8,
        'product_detail.html': 6
      }
    },
    {
      phrases: ['kribi', 'shipment'],
      boosts: {
        'export.html': 18,
        'services.html': 8,
        'product_detail.html': 6
      }
    },
    {
      phrases: ['incoterm'],
      boosts: {
        'contact.html': 18,
        'export.html': 10
      }
    },
    {
      phrases: ['quote'],
      boosts: {
        'contact.html': 16,
        'product_detail.html': 6
      }
    },
    {
      phrases: ['market', 'updates'],
      boosts: {
        'blog.html': 14,
        'index.html': 8
      }
    }
  ];

  function normalize(text) {
    return (text || '').toLowerCase().trim();
  }

  function normalizeForSearch(text) {
    return normalize(text)
      .replace(/\bcacao\b/g, 'cocoa')
      .replace(/\bbrazilian\b/g, 'bresilien')
      .replace(/\bbresilian\b/g, 'bresilien')
      .replace(/\bmetric tonnes?\b/g, 'mt')
      .replace(/\bmetric tons?\b/g, 'mt')
      .replace(/\btonnes?\b/g, 'mt')
      .replace(/\bincoterms\b/g, 'incoterm');
  }

  function ruleMatchesQuery(rule, query) {
    var i;

    for (i = 0; i < rule.phrases.length; i += 1) {
      if (query.indexOf(rule.phrases[i]) === -1) {
        return false;
      }
    }

    return true;
  }

  function getIntentBoost(pageUrl, query) {
    var boost = 0;
    var i;

    for (i = 0; i < INTENT_RULES.length; i += 1) {
      var rule = INTENT_RULES[i];
      if (ruleMatchesQuery(rule, query) && rule.boosts[pageUrl]) {
        boost += rule.boosts[pageUrl];
      }
    }

    return boost;
  }

  function tokenize(text) {
    var normalized = normalizeForSearch(text);
    if (!normalized) {
      return [];
    }

    var rawTokens = normalized.split(/[^a-z0-9]+/);
    var uniqueTokens = [];
    var tokenMap = {};
    var i;

    for (i = 0; i < rawTokens.length; i += 1) {
      var token = rawTokens[i];
      if (token && !tokenMap[token]) {
        tokenMap[token] = true;
        uniqueTokens.push(token);
      }
    }

    return uniqueTokens;
  }

  function scorePage(page, query, tokens) {
    var title = normalizeForSearch(page.title);
    var summary = normalizeForSearch(page.summary);
    var keywords = normalizeForSearch(page.keywords.join(' '));
    var combined = title + ' ' + summary + ' ' + keywords;
    var score = 0;
    var i;

    if (title === query) {
      score += 18;
    }

    if (combined.indexOf(query) !== -1) {
      score += 12;
    }

    for (i = 0; i < page.keywords.length; i += 1) {
      var keywordPhrase = normalizeForSearch(page.keywords[i]);
      if (keywordPhrase && (query.indexOf(keywordPhrase) !== -1 || keywordPhrase.indexOf(query) !== -1)) {
        score += 4;
      }
    }

    score += getIntentBoost(page.url, query);

    for (i = 0; i < tokens.length; i += 1) {
      if (title.indexOf(tokens[i]) !== -1) {
        score += 5;
      }
      if (keywords.indexOf(tokens[i]) !== -1) {
        score += 3;
      }
      if (summary.indexOf(tokens[i]) !== -1) {
        score += 1;
      }
    }

    return score;
  }

  function searchPages(query) {
    var normalizedQuery = normalizeForSearch(query);
    var tokens = tokenize(normalizedQuery);
    var scored = [];
    var i;

    if (!normalizedQuery) {
      return [];
    }

    for (i = 0; i < SITE_PAGES.length; i += 1) {
      var page = SITE_PAGES[i];
      var score = scorePage(page, normalizedQuery, tokens);

      if (score > 0) {
        scored.push({
          page: page,
          score: score
        });
      }
    }

    scored.sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.page.title.localeCompare(b.page.title);
    });

    return scored.map(function (item) {
      return item.page;
    });
  }

  function goToResults(query) {
    var trimmed = (query || '').trim();
    if (!trimmed) {
      return false;
    }

    window.location.href = RESULTS_PAGE + '?q=' + encodeURIComponent(trimmed);
    return true;
  }

  function getQueryParam(name) {
    var query = window.location.search.substring(1);
    var parts = query ? query.split('&') : [];
    var i;

    for (i = 0; i < parts.length; i += 1) {
      var pair = parts[i].split('=');
      var key = decodeURIComponent((pair[0] || '').replace(/\+/g, ' '));
      if (key === name) {
        return decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
      }
    }

    return '';
  }

  function getKeywordInputs() {
    var allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    var matched = [];
    var i;

    for (i = 0; i < allInputs.length; i += 1) {
      var placeholder = normalize(allInputs[i].getAttribute('placeholder'));
      if (placeholder === 'keywords') {
        matched.push(allInputs[i]);
      }
    }

    return matched;
  }

  function bindKeywordInput(input) {
    if (!input || input.dataset.siteSearchBound === 'true') {
      return;
    }

    var group = input.closest('.input-group');
    var button = group ? group.querySelector('button') : null;

    function submitFromInput() {
      var ok = goToResults(input.value);
      if (!ok) {
        input.focus();
      }
    }

    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        submitFromInput();
      });
    }

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitFromInput();
      }
    });

    input.dataset.siteSearchBound = 'true';
  }

  function renderSearchResultsPage() {
    var queryInput = document.getElementById('site-search-query');
    var searchButton = document.getElementById('site-search-button');
    var summary = document.getElementById('search-results-summary');
    var list = document.getElementById('search-results-list');

    if (!queryInput || !searchButton || !summary || !list) {
      return;
    }

    function render(query) {
      var trimmed = (query || '').trim();
      var results = searchPages(trimmed);

      list.innerHTML = '';

      if (!trimmed) {
        summary.textContent = 'Enter keywords above to search this site.';
        return;
      }

      if (!results.length) {
        summary.textContent = 'No matches found for "' + trimmed + '".';

        var noResult = document.createElement('p');
        noResult.className = 'lead';
        noResult.textContent = 'Try broader terms like "product", "export", or a cocoa variety name.';
        list.appendChild(noResult);
        return;
      }

      summary.textContent = results.length + ' result' + (results.length === 1 ? '' : 's') + ' for "' + trimmed + '".';

      results.forEach(function (item) {
        var card = document.createElement('article');
        card.className = 'panel panel-default';

        var cardBody = document.createElement('div');
        cardBody.className = 'panel-body';

        var title = document.createElement('h4');
        var titleLink = document.createElement('a');
        titleLink.href = item.url;
        titleLink.textContent = item.title;
        title.appendChild(titleLink);

        var description = document.createElement('p');
        description.className = 'mgt';
        description.textContent = item.summary;

        var openLink = document.createElement('a');
        openLink.href = item.url;
        openLink.className = 'btn btn-primary';
        openLink.textContent = 'Open Page';

        cardBody.appendChild(title);
        cardBody.appendChild(description);
        cardBody.appendChild(openLink);
        card.appendChild(cardBody);
        list.appendChild(card);
      });
    }

    searchButton.addEventListener('click', function (event) {
      event.preventDefault();
      var query = queryInput.value;
      window.history.replaceState({}, '', RESULTS_PAGE + '?q=' + encodeURIComponent(query.trim()));
      render(query);
    });

    queryInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        searchButton.click();
      }
    });

    var initialQuery = getQueryParam('q');
    queryInput.value = initialQuery;
    render(initialQuery);
  }

  function init() {
    var inputs = getKeywordInputs();
    var i;

    for (i = 0; i < inputs.length; i += 1) {
      bindKeywordInput(inputs[i]);
    }

    renderSearchResultsPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CHOCOCAM_SITE_SEARCH = {
    searchPages: searchPages
  };
}());
