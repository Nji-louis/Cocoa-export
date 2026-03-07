(function () {
  'use strict';

  var gallery = document.querySelector('.traceability_slideshow');
  if (!gallery) {
    return;
  }

  var slides = gallery.querySelectorAll('.traceability_slide');
  var thumbs = gallery.querySelectorAll('.traceability_thumb');
  var caption = document.getElementById('traceability-caption');
  var slideIndex = 1;

  function normalizeIndex(index) {
    if (index > slides.length) {
      return 1;
    }
    if (index < 1) {
      return slides.length;
    }
    return index;
  }

  function showSlides(index) {
    if (!slides.length) {
      return;
    }

    slideIndex = normalizeIndex(index);

    for (var i = 0; i < slides.length; i += 1) {
      var isActive = i === slideIndex - 1;
      slides[i].classList.toggle('is-active', isActive);
      slides[i].setAttribute('aria-hidden', isActive ? 'false' : 'true');

      if (thumbs[i]) {
        thumbs[i].classList.toggle('is-active', isActive);
        thumbs[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }
    }

    if (caption && thumbs[slideIndex - 1]) {
      caption.textContent = thumbs[slideIndex - 1].getAttribute('data-caption') || '';
    }
  }

  window.plusSlides = function (step) {
    showSlides(slideIndex + Number(step || 0));
  };

  window.currentSlide = function (index) {
    showSlides(Number(index || 1));
  };

  gallery.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      window.plusSlides(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      window.plusSlides(1);
    }
  });

  showSlides(slideIndex);
})();
