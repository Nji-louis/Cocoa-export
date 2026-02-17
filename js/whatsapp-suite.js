(function () {
  'use strict';

  var suite = document.querySelector('.wa-suite');
  if (!suite) {
    return;
  }

  var button = document.getElementById('waSuiteBtn');
  var panel = document.getElementById('waSuiteWindow');
  var bubble = document.getElementById('waWelcomeBubble');
  var darkToggle = document.getElementById('waDarkToggle');
  var agents = suite.querySelectorAll('.wa-agent');
  var storageKey = 'wa_suite_dark_mode';

  if (!button || !panel || !bubble || !darkToggle) {
    return;
  }

  function setOpen(isOpen) {
    if (isOpen) {
      panel.classList.add('is-open');
      bubble.classList.add('is-hidden');
      return;
    }
    panel.classList.remove('is-open');
  }

  function setDarkMode(isDark) {
    panel.classList.toggle('wa-dark', isDark);
    darkToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }

  function sanitizeNumber(value) {
    return String(value || '').replace(/\D/g, '');
  }

  var savedDarkMode = window.localStorage ? window.localStorage.getItem(storageKey) : null;
  setDarkMode(savedDarkMode === '1');

  button.addEventListener('click', function (event) {
    event.stopPropagation();
    var open = panel.classList.contains('is-open');
    setOpen(!open);
  });

  bubble.addEventListener('click', function () {
    setOpen(true);
  });

  darkToggle.addEventListener('click', function () {
    var makeDark = !panel.classList.contains('wa-dark');
    setDarkMode(makeDark);
    if (window.localStorage) {
      window.localStorage.setItem(storageKey, makeDark ? '1' : '0');
    }
  });

  agents.forEach(function (agent) {
    agent.addEventListener('click', function () {
      var number = sanitizeNumber(agent.getAttribute('data-number'));
      var message = agent.getAttribute('data-msg') || 'Hello!';
      if (!number) {
        return;
      }
      var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
      window.open(url, '_blank', 'noopener');
    });
  });

  document.addEventListener('click', function (event) {
    if (!suite.contains(event.target)) {
      setOpen(false);
    }
  });

  window.setTimeout(function () {
    bubble.classList.add('is-hidden');
  }, 10000);
})();
