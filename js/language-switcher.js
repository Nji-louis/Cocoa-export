(function () {
  'use strict';

  var SUPPORTED_LANGUAGES = [
    'en',
    'fr',
    'es',
    'pt',
    'de',
    'ar',
    'zh-CN',
    'ru',
    'tr',
    'hi',
    'ja',
    'it'
  ];
  var DEFAULT_LANGUAGE = 'en';
  var STORAGE_KEY = 'chococam_selected_language';

  function setCookie(name, value, days, domain) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    var cookie = name + '=' + encodeURIComponent(value) + ';expires=' + date.toUTCString() + ';path=/';
    if (domain) {
      cookie += ';domain=' + domain;
    }
    document.cookie = cookie;
  }

  function getStoredLanguage() {
    var stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      stored = null;
    }

    if (SUPPORTED_LANGUAGES.indexOf(stored) === -1) {
      return DEFAULT_LANGUAGE;
    }

    return stored;
  }

  function storeLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Ignore storage restrictions in private browsing modes.
    }
  }

  function normalizeLanguage(language) {
    if (!language) {
      return DEFAULT_LANGUAGE;
    }
    if (SUPPORTED_LANGUAGES.indexOf(language) !== -1) {
      return language;
    }
    return DEFAULT_LANGUAGE;
  }

  function setGoogleTranslateCookies(language) {
    var value = '/en/' + language;
    setCookie('googtrans', value, 365);
    if (window.location.hostname) {
      setCookie('googtrans', value, 365, window.location.hostname);
    }
  }

  function syncLanguageSelectors(language) {
    var selectors = document.querySelectorAll('.language-switcher');
    var i;
    for (i = 0; i < selectors.length; i += 1) {
      var selector = selectors[i];
      if (selector.value !== language) {
        selector.value = language;
      }
    }
  }

  function triggerChange(element) {
    if (typeof Event === 'function') {
      element.dispatchEvent(new Event('change'));
      return;
    }
    var event = document.createEvent('Event');
    event.initEvent('change', true, true);
    element.dispatchEvent(event);
  }

  function waitForTranslateCombo(callback) {
    var attempts = 0;
    var maxAttempts = 80;
    var timer = window.setInterval(function () {
      var combo = document.querySelector('.goog-te-combo');
      attempts += 1;
      if (combo) {
        window.clearInterval(timer);
        callback(combo);
        return;
      }
      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  function applyGoogleTranslation(language) {
    waitForTranslateCombo(function (combo) {
      if (combo.value === language) {
        return;
      }
      combo.value = language;
      triggerChange(combo);
    });
  }

  function setLanguage(language) {
    var normalized = normalizeLanguage(language);
    storeLanguage(normalized);
    syncLanguageSelectors(normalized);
    setGoogleTranslateCookies(normalized);
    applyGoogleTranslation(normalized);
  }

  function bindSelectorEvents() {
    var selectors = document.querySelectorAll('.language-switcher');
    var i;
    for (i = 0; i < selectors.length; i += 1) {
      selectors[i].addEventListener('change', function () {
        setLanguage(this.value);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var selectedLanguage = getStoredLanguage();
    syncLanguageSelectors(selectedLanguage);
    bindSelectorEvents();
  });

  window.googleTranslateElementInit = function () {
    if (!window.google || !google.translate || !google.translate.TranslateElement) {
      return;
    }

    new google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: SUPPORTED_LANGUAGES.join(','),
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      },
      'google_translate_element'
    );

    var selectedLanguage = getStoredLanguage();
    syncLanguageSelectors(selectedLanguage);

    if (selectedLanguage !== DEFAULT_LANGUAGE) {
      window.setTimeout(function () {
        setLanguage(selectedLanguage);
      }, 250);
    }
  };
})();
