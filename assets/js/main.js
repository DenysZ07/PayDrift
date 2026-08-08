/* PayDrift — site behaviour
   Everything here is progressive: each block bails out if its markup is absent,
   so the same file serves the landing page, the privacy page and support. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------- theme --- */

  var THEME_KEY = 'paydrift-theme';

  function applyTheme(theme) {
    var meta = document.getElementById('themeColorOverride');

    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
      if (!meta) {
        meta = document.createElement('meta');
        meta.id = 'themeColorOverride';
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = theme === 'dark' ? '#08090c' : '#ffffff';
    } else {
      root.removeAttribute('data-theme');
      if (meta) meta.remove();
    }
  }

  try {
    applyTheme(localStorage.getItem(THEME_KEY));
  } catch (e) { /* private mode — stay on the system theme */ }

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = root.getAttribute('data-theme') || (systemDark ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';

      applyTheme(next);
      try {
        // Falling back to the system setting is the same as no stored choice.
        if (next === (systemDark ? 'dark' : 'light')) localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, next);
      } catch (e) { /* ignore */ }
    });
  }

  /* ------------------------------------------------------------ header --- */

  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var navToggle = document.getElementById('navToggle');
  if (navToggle && header) {
    var setNav = function (open) {
      header.setAttribute('data-open', open ? 'true' : 'false');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    navToggle.addEventListener('click', function () {
      setNav(header.getAttribute('data-open') !== 'true');
    });

    document.addEventListener('click', function (event) {
      if (header.getAttribute('data-open') !== 'true') return;
      if (event.target.closest('#siteNav a')) { setNav(false); return; }
      if (!event.target.closest('#siteNav') && !event.target.closest('#navToggle')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.getAttribute('data-open') === 'true') {
        setNav(false);
        navToggle.focus();
      }
    });
  }

  /* ------------------------------------------------- reveal on scroll --- */

  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

      revealables.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
        observer.observe(el);
      });
    }
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------- the live app screen --- */

  var amountEl = document.getElementById('jobAmount');
  var hoursEl = document.getElementById('jobHours');

  if (!amountEl) return;

  // The first card's figures are one clock: £90.63 is exactly 7h 15m at £12.50/hr,
  // and both keep climbing from there so the screen is never frozen.
  var RATE = 12.5;
  var baseHours = 7 + 15 / 60;
  var startedAt = Date.now();
  var lastText = null;

  function render() {
    var hours = baseHours + (Date.now() - startedAt) / 3600000;
    var amount = hours * RATE;

    var text = amount.toFixed(2);
    if (text !== lastText) {
      amountEl.textContent = text;
      if (!reduceMotion && lastText !== null) {
        amountEl.classList.remove('is-tick');
        void amountEl.offsetWidth;            // restart the flash
        amountEl.classList.add('is-tick');
      }
      lastText = text;
    }

    if (hoursEl) {
      var h = Math.floor(hours);
      var m = Math.floor((hours - h) * 60);
      hoursEl.textContent = h + 'h ' + (m < 10 ? '0' + m : m) + 'm';
    }
  }

  render();
  setInterval(render, 700);
})();
