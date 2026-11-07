/**
* Template Name: Mentor (Angular SPA-safe version)
*/

(function() {
  "use strict";

  // Re-run init on Angular route changes
  function mentorInit() {

    // Scroll header style
    const selectHeader = document.querySelector('#header');
    if (selectHeader) {
      function toggleScrolled() {
        const selectBody = document.querySelector('body');
        if (!selectHeader.classList.contains('scroll-up-sticky') &&
            !selectHeader.classList.contains('sticky-top') &&
            !selectHeader.classList.contains('fixed-top')) return;
        window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
      }
      document.addEventListener('scroll', toggleScrolled);
      toggleScrolled();
    }

    // Mobile nav toggle
    const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
    if (mobileNavToggleBtn) {
      function mobileNavToogle() {
        document.querySelector('body').classList.toggle('mobile-nav-active');
        mobileNavToggleBtn.classList.toggle('bi-list');
        mobileNavToggleBtn.classList.toggle('bi-x');
      }
      mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

      document.querySelectorAll('#navmenu a').forEach(function(navmenu) {
        navmenu.addEventListener('click', function() {
          if (document.querySelector('.mobile-nav-active')) mobileNavToogle();
        });
      });

      document.querySelectorAll('.navmenu .toggle-dropdown').forEach(function(navmenu) {
        navmenu.addEventListener('click', function(e) {
          e.preventDefault();
          this.parentNode.classList.toggle('active');
          this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
          e.stopImmediatePropagation();
        });
      });
    }

    // AOS animation
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false });
    }

    // GLightbox
    if (typeof GLightbox !== 'undefined') {
      GLightbox({ selector: '.glightbox' });
    }

    // PureCounter
    if (typeof PureCounter !== 'undefined') {
      new PureCounter();
    }

    // Swiper
    if (typeof Swiper !== 'undefined') {
      document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
        var configEl = swiperElement.querySelector(".swiper-config");
        if (!configEl) return;
        try {
          var config = JSON.parse(configEl.innerHTML.trim());
          new Swiper(swiperElement, config);
        } catch(e) {}
      });
    }
  }

  // Run on first load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mentorInit);
  } else {
    mentorInit();
  }

  // Re-run on Angular route changes
  document.addEventListener('angularRouteChanged', function() {
    setTimeout(mentorInit, 200);
  });

})();
