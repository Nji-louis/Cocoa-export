(function () {
  var galleries = document.querySelectorAll("[data-trace-gallery]");
  var AUTOPLAY_DELAY = 6500;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!galleries.length) {
    return;
  }

  function bindGallery(gallery) {
    var slides = Array.prototype.slice.call(gallery.querySelectorAll("[data-trace-slide]"));
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll("[data-trace-thumb]"));
    var prevButton = gallery.querySelector("[data-trace-prev]");
    var nextButton = gallery.querySelector("[data-trace-next]");
    var progressFill = gallery.querySelector("[data-trace-progress]");
    var progressLabel = gallery.querySelector("[data-trace-progress-label]");
    var activeIndex = 0;
    var intervalId = null;

    if (!slides.length) {
      return;
    }

    function normalizeIndex(index) {
      return (index + slides.length) % slides.length;
    }

    function render(index) {
      activeIndex = normalizeIndex(index);

      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      thumbs.forEach(function (thumb, thumbIndex) {
        var isSelected = thumbIndex === activeIndex;
        thumb.classList.toggle("is-active", isSelected);
        thumb.setAttribute("aria-selected", isSelected ? "true" : "false");
        thumb.setAttribute("tabindex", isSelected ? "0" : "-1");
      });

      if (progressFill) {
        progressFill.style.width = (((activeIndex + 1) / slides.length) * 100).toFixed(2) + "%";
      }

      if (progressLabel) {
        progressLabel.textContent = "Step " + (activeIndex + 1) + " of " + slides.length;
      }
    }

    function stopAutoplay() {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    function startAutoplay() {
      if (reduceMotion || slides.length < 2) {
        return;
      }

      stopAutoplay();
      intervalId = window.setInterval(function () {
        render(activeIndex + 1);
      }, AUTOPLAY_DELAY);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        render(activeIndex - 1);
        restartAutoplay();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        render(activeIndex + 1);
        restartAutoplay();
      });
    }

    thumbs.forEach(function (thumb, thumbIndex) {
      thumb.addEventListener("click", function () {
        render(thumbIndex);
        restartAutoplay();
      });
    });

    gallery.addEventListener("mouseenter", stopAutoplay);
    gallery.addEventListener("mouseleave", startAutoplay);
    gallery.addEventListener("focusin", stopAutoplay);
    gallery.addEventListener("focusout", function (event) {
      if (!gallery.contains(event.relatedTarget)) {
        startAutoplay();
      }
    });

    gallery.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        render(activeIndex + 1);
        restartAutoplay();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        render(activeIndex - 1);
        restartAutoplay();
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    render(0);
    startAutoplay();
  }

  galleries.forEach(bindGallery);
})();
