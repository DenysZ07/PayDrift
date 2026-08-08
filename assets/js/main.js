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

  var earningsWhole = document.getElementById('earningsWhole');
  if (!earningsWhole) return;

  var HOURLY = 24.5;          // demo pay rate shown on the screen
  var PERIOD_DAYS = 14;       // fortnightly pay period
  var PERIOD_HOURS = 76;      // a full period's scheduled hours
  var PAYDAY_WEEKDAY = 5;     // Friday
  var PAYDAY_HOUR = 17;

  var MS_DAY = 86400000;
  var money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function shortDate(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }

  // The next payday: Friday at 5pm, this week if it hasn't passed yet.
  function nextPayday(now) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), PAYDAY_HOUR, 0, 0, 0);
    var ahead = (PAYDAY_WEEKDAY - d.getDay() + 7) % 7;
    if (ahead === 0 && now.getTime() >= d.getTime()) ahead = 7;
    d.setDate(d.getDate() + ahead);
    return d;
  }

  var now = new Date();
  var payday = nextPayday(now);
  var periodStart = new Date(payday.getTime() - PERIOD_DAYS * MS_DAY);
  var progress = Math.min(1, Math.max(0, (now - periodStart) / (payday - periodStart)));

  // Everything on the screen hangs off the same clock, so the hours, the money,
  // the progress bar and the countdown always tell one consistent story.
  var baseHours = progress * PERIOD_HOURS;
  var startedAt = Date.now();

  var el = {
    whole: earningsWhole,
    cents: document.getElementById('earningsCents'),
    sub: document.querySelector('.earnings__sub'),
    range: document.querySelector('.app__range'),
    pct: document.getElementById('periodPct'),
    fill: document.getElementById('periodFill'),
    d: document.getElementById('cdD'),
    h: document.getElementById('cdH'),
    m: document.getElementById('cdM'),
    s: document.getElementById('cdS'),
    rows: document.querySelectorAll('.shifts__row')
  };

  if (el.range) el.range.textContent = shortDate(periodStart) + ' – ' + shortDate(payday);

  var floatPayday = document.getElementById('floatPayday');
  if (floatPayday) floatPayday.textContent = DAYS_LONG[payday.getDay()] + ', ' + shortDate(payday);

  if (el.pct) el.pct.textContent = Math.round(progress * 100) + '%';
  if (el.fill) {
    var pctWidth = (progress * 100).toFixed(1) + '%';
    if (reduceMotion) el.fill.style.width = pctWidth;
    else { el.fill.style.width = '0%'; setTimeout(function () { el.fill.style.width = pctWidth; }, 120); }
  }

  // Recent shifts: the last few weekdays, so the screen never looks stale.
  if (el.rows.length) {
    var cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    el.rows.forEach(function (row) {
      do { cursor.setDate(cursor.getDate() - 1); } while (cursor.getDay() === 0 || cursor.getDay() === 6);
      var day = row.querySelector('.shifts__day');
      if (day) day.innerHTML = '<b>' + DAYS[cursor.getDay()] + '</b>' + shortDate(cursor);
    });
  }

  var lastCents = null;

  function render() {
    var elapsedHours = (Date.now() - startedAt) / 3600000;
    var hours = baseHours + elapsedHours;
    var amount = hours * HOURLY;

    var whole = Math.floor(amount);
    var cents = pad(Math.floor((amount - whole) * 100));

    el.whole.textContent = whole.toLocaleString('en-US');
    if (el.cents && el.cents.textContent !== cents) {
      el.cents.textContent = cents;
      if (!reduceMotion && lastCents !== null) {
        el.cents.classList.remove('is-tick');
        void el.cents.offsetWidth;          // restart the flash
        el.cents.classList.add('is-tick');
      }
      lastCents = cents;
    }

    if (el.sub) {
      var h = Math.floor(hours);
      var m = Math.floor((hours - h) * 60);
      el.sub.textContent = '$' + money.format(HOURLY) + ' / hr · ' + h + 'h ' + pad(m) + 'm logged';
    }

    var left = Math.max(0, payday - Date.now());
    var days = Math.floor(left / MS_DAY);
    var hrs = Math.floor(left / 3600000) % 24;
    var mins = Math.floor(left / 60000) % 60;
    var secs = Math.floor(left / 1000) % 60;
    if (el.d) el.d.textContent = pad(days);
    if (el.h) el.h.textContent = pad(hrs);
    if (el.m) el.m.textContent = pad(mins);
    if (el.s) el.s.textContent = pad(secs);
  }

  render();
  setInterval(render, 700);
})();
