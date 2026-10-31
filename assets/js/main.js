/* ==========================================================================
   Pin Africa — Archive & portfolio · main.js
   No dependencies. Every feature degrades gracefully without JavaScript.

   1. Header state on scroll (teal-20 rule)
   2. Mobile menu (full-screen dialog, focus trap, Escape)
   3. Scroll spy (active anchor underlined in red)
   4. Scroll reveal (fade + 16px, staggered via --i)
   5. Photo strip (pause / play button, pause when off-screen)
   6. YouTube facade (youtube-nocookie player on click, one video at a time)
   7. Mobile storytelling reel (prev / next, counter, progress, pointer tilt)
   ========================================================================== */
(function () {
  'use strict';

  // Tells the inline <head> script that main.js loaded (keeps reveal enabled)
  window.__pinReady = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };


  /* 1. HEADER ------------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }


  /* 2. MOBILE MENU -------------------------------------------------------- */
  var menu = document.getElementById('mobile-menu');
  var toggle = document.querySelector('.menu-toggle');
  var lastFocus = null;

  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
  }

  // Everything outside the menu becomes inert while it is open
  function setBackgroundInert(on) {
    each(document.body.children, function (el) {
      if (el !== menu && el.tagName !== 'SCRIPT') el.inert = on;
    });
  }

  function onMenuKey(e) {
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    var items = focusables(menu);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    setBackgroundInert(true);
    menu.querySelector('.menu-close').focus();
    document.addEventListener('keydown', onMenuKey);
  }

  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    setBackgroundInert(false);
    document.removeEventListener('keydown', onMenuKey);
    if (returnFocus && lastFocus) lastFocus.focus();
  }

  if (menu && toggle) {
    toggle.addEventListener('click', openMenu);
    menu.querySelector('.menu-close').addEventListener('click', function () { closeMenu(true); });
    // Following an anchor closes the menu; the browser then scrolls to the target
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a[href^="#"]')) closeMenu(false);
    });
    window.matchMedia('(min-width: 1200px)').addEventListener('change', function (mq) {
      if (mq.matches) closeMenu(false);
    });
  }


  /* 3. SCROLL SPY --------------------------------------------------------- */
  // section id → nav anchor it activates
  var spyMap = {
    about: '#about',
    work: '#work',
    campaign: '#work',
    video: '#video',
    mobile: '#mobile',
    interactive: '#interactive',
    articles: '#articles',
    contact: '#contact'
  };
  var spyLinks = document.querySelectorAll('.main-nav a, .mobile-menu__nav a');
  var spySections = Object.keys(spyMap)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var currentSpy = null;

  function updateSpy() {
    var line = window.innerHeight * 0.4;
    var active = null;
    spySections.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) active = spyMap[sec.id];
    });
    // The contact block sits at the very bottom: activate it once reached
    var contact = document.getElementById('contact');
    if (contact && contact.getBoundingClientRect().top < window.innerHeight * 0.75 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = '#contact';
    }
    if (active === currentSpy) return;
    currentSpy = active;
    each(spyLinks, function (a) {
      if (a.getAttribute('href') === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHeader();
      updateSpy();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateHeader();
  updateSpy();


  /* 4. SCROLL REVEAL ------------------------------------------------------ */
  var revealEls = document.querySelectorAll('[data-reveal]');
  function showAll() { each(revealEls, function (el) { el.classList.add('is-visible'); }); }
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    showAll();
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    each(revealEls, function (el) { revealIO.observe(el); });
  }
  reduceMotion.addEventListener('change', function (mq) { if (mq.matches) showAll(); });


  /* 5. PHOTO STRIP -------------------------------------------------------- */
  var strip = document.querySelector('.strip');
  if (strip) {
    var stripBtn = strip.querySelector('.strip__toggle');
    var stripText = strip.querySelector('.strip__toggle-text');
    stripBtn.addEventListener('click', function () {
      var paused = strip.classList.toggle('is-paused');
      stripText.textContent = paused ? 'Play' : 'Pause';
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        strip.classList.toggle('is-offscreen', !entries[0].isIntersecting);
      }).observe(strip);
    }
  }


  /* 6. YOUTUBE FACADE ----------------------------------------------------- */
  // Markup: <a class="yt" data-yt="VIDEO_ID" data-yt-title="…" href="https://www.youtube.com/…">
  // Works without JS (opens YouTube). With JS the thumbnail is swapped for a
  // privacy-enhanced youtube-nocookie.com player; starting a video puts any
  // other playing video back to its thumbnail.
  var players = [];   // { player, facade }

  function stopOtherVideos() {
    players.forEach(function (p) {
      p.player.replaceWith(p.facade);
      var card = p.facade.closest('.reel-card');
      if (card) card.classList.remove('is-playing');
    });
    players = [];
  }

  function activateVideo(facade) {
    if (!facade || !facade.matches('a.yt[data-yt]')) return null;
    stopOtherVideos();

    var id = facade.getAttribute('data-yt');
    var title = facade.getAttribute('data-yt-title') || 'Pin Africa video';

    var player = document.createElement('div');
    player.className = facade.className;
    player.id = facade.id;

    var backdrop = facade.querySelector('.yt__backdrop');   // landscape video in a 9:16 card
    if (backdrop) player.appendChild(backdrop.cloneNode(true));

    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
                 '?autoplay=1&rel=0&playsinline=1';
    iframe.title = 'YouTube video player: ' + title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    player.appendChild(iframe);

    facade.replaceWith(player);
    players.push({ player: player, facade: facade });

    var card = player.closest('.reel-card');
    if (card) card.classList.add('is-playing');
    iframe.focus();
    return player;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var facade = e.target.closest('a.yt[data-yt]');
    if (facade) { e.preventDefault(); activateVideo(facade); return; }

    var trigger = e.target.closest('[data-yt-play]');
    if (trigger) {
      var target = document.getElementById(trigger.getAttribute('data-yt-play'));
      if (!target) return;
      e.preventDefault();
      if (!target.closest('.reel')) {
        target.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
      if (target.matches('a.yt')) activateVideo(target);
      else if (target.querySelector('iframe')) target.querySelector('iframe').focus();
    }
  });


  /* 7. MOBILE STORYTELLING REEL ------------------------------------------ */
  var reel = document.querySelector('[data-reel]');
  if (reel) {
    var track = reel.querySelector('[data-reel-track]');
    var cards = Array.prototype.slice.call(track.children);
    var prevBtn = reel.querySelector('[data-reel-prev]');
    var nextBtn = reel.querySelector('[data-reel-next]');
    var current = reel.querySelector('[data-reel-current]');
    var progress = reel.querySelector('.reel__progress span');

    var stepSize = function () {
      return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    };

    var updateReel = function () {
      var max = track.scrollWidth - track.clientWidth;
      var isStatic = max <= 2;
      reel.classList.toggle('is-static', isStatic);
      prevBtn.disabled = isStatic || track.scrollLeft <= 2;
      nextBtn.disabled = isStatic || track.scrollLeft >= max - 2;

      var index = Math.round(track.scrollLeft / stepSize());
      if (!isStatic && track.scrollLeft >= max - 2) index = cards.length - 1;
      index = Math.max(0, Math.min(cards.length - 1, index));
      current.textContent = String(index + 1).padStart(2, '0');

      var p = isStatic ? 100 : ((track.scrollLeft + track.clientWidth) / track.scrollWidth) * 100;
      progress.style.setProperty('--p', p.toFixed(1) + '%');
    };

    var go = function (dir) {
      track.scrollBy({ left: dir * stepSize(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };
    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });

    var reelTick = false;
    track.addEventListener('scroll', function () {
      if (reelTick) return;
      reelTick = true;
      window.requestAnimationFrame(function () { updateReel(); reelTick = false; });
    }, { passive: true });
    window.addEventListener('resize', updateReel, { passive: true });
    window.addEventListener('load', updateReel);
    updateReel();

    // Pointer tilt + light (mouse / trackpad only, never with reduced motion)
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    cards.forEach(function (card) {
      var frame = card.querySelector('.reel-card__frame');
      card.addEventListener('pointermove', function (e) {
        if (!finePointer.matches || reduceMotion.matches || card.classList.contains('is-playing')) return;
        var r = frame.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        frame.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        frame.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        frame.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        frame.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        ['--rx', '--ry', '--gx', '--gy'].forEach(function (v) { frame.style.removeProperty(v); });
      });
    });
  }
})();
