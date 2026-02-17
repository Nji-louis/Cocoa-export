(function () {
  'use strict';

  var STORAGE_KEY = 'chococam_theme';
  var mobileToggle = null;

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function getSavedTheme() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function getInitialTheme() {
    var stored = getSavedTheme();
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return 'light';
  }

  function updateToggleButtons(theme) {
    var buttons = document.querySelectorAll('.theme-toggle-btn');
    var isDark = theme === 'dark';
    var i;

    for (i = 0; i < buttons.length; i += 1) {
      var button = buttons[i];
      var icon = button.querySelector('i');
      var label = button.querySelector('.theme-toggle-label');

      button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      if (icon) {
        icon.className = isDark ? 'fa fa-sun-o' : 'fa fa-moon-o';
      }
      if (label) {
        label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      }
    }

    if (mobileToggle) {
      var mobileIcon = mobileToggle.querySelector('i');
      mobileToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      mobileToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      if (mobileIcon) {
        mobileIcon.className = isDark ? 'fa fa-sun-o' : 'fa fa-moon-o';
      }
    }
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    updateToggleButtons(theme);
  }

  function toggleTheme() {
    var isDark = document.body.classList.contains('dark-mode');
    var nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  }

  function createMobileToggle() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle-fab';
    button.setAttribute('aria-label', 'Toggle dark mode');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<i class="fa fa-moon-o"></i>';
    button.addEventListener('click', toggleTheme);
    document.body.appendChild(button);
    mobileToggle = button;
  }

  function bindHeaderToggles() {
    var buttons = document.querySelectorAll('.theme-toggle-btn');
    var i;
    for (i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener('click', toggleTheme);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindHeaderToggles();
    createMobileToggle();

    var initial = getInitialTheme();
    applyTheme(initial);
  });
})();
