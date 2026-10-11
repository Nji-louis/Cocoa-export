(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000/api';

  async function loadSiteSettings() {
    try {
      const response = await fetch(`${API_BASE}/settings/public`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to load site settings');
      }

      const data = await response.json();

      if (!data.success || !data.settings) {
        throw new Error('Invalid settings response');
      }

      const settings = data.settings;

      window.CocoabridgeSettings = settings;

      // Update address
document.querySelectorAll('[data-site-address]').forEach(function (element) {
  element.textContent = settings.address;
});

// Update phone
document.querySelectorAll('[data-site-phone]').forEach(function (element) {
  element.lastChild.textContent = ' ' + settings.phone;
});
// Update company name
// Update company name
document.querySelectorAll('[data-site-company]').forEach(function (element) {
  element.textContent = settings.company_name;
});
// Update email
document.querySelectorAll('[data-site-email]').forEach(function (element) {
  element.href = 'mailto:' + settings.email;

  element.lastChild.textContent = '  ' + settings.email;
});

// Update social media links
document.querySelectorAll('[data-site-facebook]').forEach(function (element) {
  if (settings.facebook_url) {
    element.href = settings.facebook_url;
  }
});

document.querySelectorAll('[data-site-linkedin]').forEach(function (element) {
  if (settings.linkedin_url) {
    element.href = settings.linkedin_url;
  }
});

document.querySelectorAll('[data-site-whatsapp]').forEach(function (element) {
  if (settings.whatsapp_url) {
    element.href = settings.whatsapp_url;
  }
});

document.querySelectorAll('[data-site-instagram]').forEach(function (element) {
  if (settings.instagram_url) {
    element.href = settings.instagram_url;
  }
});

document.querySelectorAll('[data-site-twitter]').forEach(function (element) {
  if (settings.twitter_url) {
    element.href = settings.twitter_url;
  }
});

console.log('Site settings applied:', settings);

    } catch (error) {
      console.error('Site settings error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSiteSettings, {
      once: true
    });
  } else {
    loadSiteSettings();
  }

})();