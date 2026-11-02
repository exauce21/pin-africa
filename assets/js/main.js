/* ==========================================================================
   Pin Africa — Archive & portfolio · main.js
   No dependencies. Every feature degrades gracefully without JavaScript.

   1. Header state on scroll (the top frame folds away)
   2. Drop-downs (desktop) & mobile menu card (focus trap, Escape)
   3. Scroll spy (current group marked with a red dot)
   4. Scroll reveal (fade + 16px, staggered via --i)
   4b. Titles (words drop in, scrubbed to the scroll)
   5. Hero map (photos & value pills pop up on random dots, pause / play)
   5b. Featured campaign (sticky photos follow the two parts of the story)
   6. YouTube facade (youtube-nocookie player on click, one video at a time)
   7. Mobile storytelling reel (prev / next, counter, progress, pointer tilt)
   8. About — falling value pills (Matter.js physics, loaded on demand)
   ========================================================================== */
(function () {
  'use strict';

  // Tells the inline <head> script that main.js loaded (keeps reveal enabled)
  window.__pinReady = true;

  // URL of this file, used to find assets/vendor/matter.min.js
  var SCRIPT_URL = (document.currentScript && document.currentScript.src) || '';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };


  /* 1. HEADER ------------------------------------------------------------- */
  // The white frame at the top folds away once the page scrolls.
  var header = document.querySelector('.site-header');
  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }


  /* 2. DROP-DOWNS (desktop) & MOBILE MENU --------------------------------- */
  function focusables(root) {
    return Array.prototype.filter.call(
      root.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
  }

  // Drop-downs: open on hover (mouse), on click / Enter / Space, close with
  // Escape, on focus leaving, on outside click or after following a link.
  var dropdownItems = document.querySelectorAll('[data-dropdown]');

  function setDropdown(item, open) {
    var btn = item.querySelector('.nav__trigger');
    var panel = item.querySelector('.dropdown');
    if (open === (btn.getAttribute('aria-expanded') === 'true')) return;
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    panel.classList.toggle('is-open', open);
  }
  function closeDropdowns(except) {
    each(dropdownItems, function (it) { if (it !== except) setDropdown(it, false); });
  }

  each(dropdownItems, function (item) {
    var btn = item.querySelector('.nav__trigger');
    var timer;
    item._hover = false;
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen && item._hover) return;            // opened by hover: a click keeps it open
      closeDropdowns(item);
      setDropdown(item, !isOpen);
    });
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      item._hover = true;
      clearTimeout(timer);
      closeDropdowns(item);
      setDropdown(item, true);
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      item._hover = false;
      timer = setTimeout(function () { setDropdown(item, false); }, 200);
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) setDropdown(item, false);
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setDropdown(item, false);
        btn.focus();
      }
    });
    item.querySelector('.dropdown').addEventListener('click', function (e) {
      if (e.target.closest('a')) { item._hover = false; setDropdown(item, false); }
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-dropdown]')) closeDropdowns();
  });

  // Mobile menu: card under the tab, dimmed page behind, focus kept inside
  var menu = document.getElementById('mobile-menu');
  var burger = document.querySelector('.burger');
  var backdrop = document.querySelector('.menu-backdrop');
  var notch = document.querySelector('.notch');
  var lastFocus = null;

  function setBackgroundInert(on) {
    each(document.body.children, function (el) {
      if (el !== menu && el !== header && el !== backdrop && el.tagName !== 'SCRIPT') el.inert = on;
    });
    if (notch) each(notch.children, function (el) { if (el !== burger) el.inert = on; });
  }

  function onMenuKey(e) {
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    var items = [burger].concat(focusables(menu));
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openMenu() {
    lastFocus = document.activeElement;
    menu.style.setProperty('--menu-top', Math.round(notch.getBoundingClientRect().bottom + 10) + 'px');
    menu.hidden = false;
    backdrop.hidden = false;
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    setBackgroundInert(true);
    var first = focusables(menu)[0];
    if (first) first.focus();
    document.addEventListener('keydown', onMenuKey);
  }

  function closeMenu(returnFocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    backdrop.hidden = true;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    setBackgroundInert(false);
    document.removeEventListener('keydown', onMenuKey);
    if (returnFocus) burger.focus();
  }

  if (menu && burger) {
    burger.addEventListener('click', function () {
      if (menu.hidden) openMenu(); else closeMenu(true);
    });
    backdrop.addEventListener('click', function () { closeMenu(false); });
    // Following an anchor closes the menu; the browser then scrolls to the target
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a[href^="#"]')) closeMenu(false);
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) {
      if (mq.matches) closeMenu(false);
    });
  }


  /* 3. SCROLL SPY --------------------------------------------------------- */
  // section id → menu group (About / Selected Work / Contact)
  var spyMap = {
    about: 'about', 'who-we-were': 'about', mission: 'about', values: 'about',
    work: 'work', campaign: 'work', video: 'work', mobile: 'work', interactive: 'work', articles: 'work',
    contact: 'contact'
  };
  var groupEls = document.querySelectorAll('.site-header [data-group], .menu-card [data-group]');
  var sectionLinks = document.querySelectorAll('.dd-link, .dd-tile, .mm-sub a');
  var spySections = Object.keys(spyMap)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var currentSpy;

  function updateSpy() {
    var line = window.innerHeight * 0.4;
    var active = null;
    spySections.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) active = sec.id;
    });
    // The contact block sits at the very bottom: activate it once reached
    var contact = document.getElementById('contact');
    if (contact && contact.getBoundingClientRect().top < window.innerHeight * 0.75 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = 'contact';
    }
    if (active === currentSpy) return;
    currentSpy = active;
    var group = active ? spyMap[active] : null;
    each(groupEls, function (el) { el.classList.toggle('is-active', el.getAttribute('data-group') === group); });
    each(sectionLinks, function (a) {
      if (active && a.getAttribute('href') === '#' + active) a.setAttribute('aria-current', 'true');
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


  /* 4b. TITLES — WORDS DROP IN WITH THE SCROLL --------------------------- */
  // Applies to the h1, every section h2 (not the small .label ones) and the
  // mission statement. Each word comes down from -100% and fades in,
  // staggered, scrubbed to the scroll: starts when the title is half into the
  // viewport, ends when its bottom reaches the middle. The h1 plays on load.
  // Progress eases towards the scroll (≈0.8s lag). Inner markup is kept.
  // Without JS or with reduced motion the titles simply show in full.
  var SPLIT_SELECTOR = 'h1, h2:not(.label), .mission__text';
  var DUR = 0.5, STAGGER = 0.4, TOTAL = DUR + STAGGER;

  function splitWords(node, words) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 1) { splitWords(child, words); return; }
      if (child.nodeType !== 3 || !child.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      child.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var word = document.createElement('span');
        word.className = 'split-word';
        word.textContent = part;
        frag.appendChild(word);
        words.push(word);
      });
      child.replaceWith(frag);
    });
    return words;
  }

  var splits = Array.prototype.map.call(document.querySelectorAll(SPLIT_SELECTOR), function (el) {
    return { el: el, words: splitWords(el, []), onLoad: el.tagName === 'H1', shown: 0, target: 0 };
  });

  if (splits.length) {
    var splitRunning = false, splitLast = 0;

    var splitTarget = function (s) {
      if (s.onLoad) return 1;
      var r = s.el.getBoundingClientRect();
      var vh = window.innerHeight;
      // Page bottom reached: titles that can't get to mid-screen finish anyway
      if (r.top < vh && vh + window.scrollY >= document.documentElement.scrollHeight - 4) return 1;
      var startTop = vh - r.height / 2;    // title half into view
      var endTop = vh / 2 - r.height;      // title bottom at mid-screen
      return Math.max(0, Math.min(1, (startTop - r.top) / (startTop - endTop)));
    };

    var paintSplit = function (s) {
      var t = s.shown * TOTAL;
      var n = s.words.length;
      s.words.forEach(function (word, i) {
        var start = n > 1 ? (i / (n - 1)) * STAGGER : 0;
        var k = Math.max(0, Math.min(1, (t - start) / DUR));
        word.style.setProperty('--w', (1 - Math.pow(1 - k, 3)).toFixed(3));
      });
    };

    var stepSplits = function (now) {
      var dt = Math.min(0.1, (now - (splitLast || now)) / 1000);
      var moving = false;
      splitLast = now;
      splits.forEach(function (s) {
        if (s.shown === s.target) return;
        s.shown += (s.target - s.shown) * (1 - Math.exp(-dt / 0.2));
        if (Math.abs(s.target - s.shown) < 0.001) s.shown = s.target;
        paintSplit(s);
        if (s.shown !== s.target) moving = true;
      });
      if (moving) window.requestAnimationFrame(stepSplits);
      else { splitRunning = false; splitLast = 0; }
    };

    var onSplitScroll = function () {
      if (reduceMotion.matches) return;
      var changed = false;
      splits.forEach(function (s) {
        s.target = splitTarget(s);
        if (s.target !== s.shown) changed = true;
      });
      if (changed && !splitRunning) {
        splitRunning = true;
        window.requestAnimationFrame(stepSplits);
      }
    };

    var setSplitMode = function () {
      var on = !reduceMotion.matches;
      splits.forEach(function (s) {
        s.el.classList.toggle('is-scrubbed', on);
        s.shown = 0;
        paintSplit(s);
      });
      onSplitScroll();
    };

    window.addEventListener('scroll', onSplitScroll, { passive: true });
    window.addEventListener('resize', onSplitScroll, { passive: true });
    reduceMotion.addEventListener('change', setSplitMode);
    setSplitMode();
  }


  /* 5. HERO MAP — PHOTOS & VALUES POP UP ON RANDOM DOTS ------------------ */
  // Every ~1.2s a hidden item (photo or value pill) appears on a random dot
  // of the map, stays ~5s, then goes. Items never overlap and stay inside
  // the map. Optional pause / play button; also pauses off-screen or in a
  // hidden tab.
  // Without JS or with reduced motion the items marked .is-on stay still.
  var map = document.querySelector('[data-map]');
  if (map && !reduceMotion.matches) {
    var mapLayer = map.querySelector('.hero-map__layer');
    var mapBtn = map.querySelector('.hero-map__toggle');
    var mapBtnText = map.querySelector('.hero-map__toggle-text');
    var box = map.querySelector('.hero-map__dots').viewBox.baseVal;
    var anchors = Array.prototype.map.call(
      map.querySelectorAll('.hero-map__dots circle:not(.is-isle)'),
      function (dot) {
        return { x: (dot.cx.baseVal.value / box.width) * 100, y: (dot.cy.baseVal.value / box.height) * 100 };
      }
    );
    var mapItems = Array.prototype.map.call(mapLayer.children, function (el) {
      return { el: el, body: el.querySelector('.map-item__body'), photo: !!el.querySelector('.map-photo'), life: 0, rect: null };
    });

    var TICK = 250, STEM = 16, GAP = 10;
    var active = [];                     // items shown (or fading out)
    var nextSpawn = 1200;

    // The still items from the markup stay a moment, then leave one by one
    var layerBox = mapLayer.getBoundingClientRect();
    mapItems.forEach(function (item) {
      if (!item.el.classList.contains('is-on')) return;
      var b = item.body.getBoundingClientRect();
      var pin = item.el.getBoundingClientRect();
      item.rect = {
        l: Math.min(b.left, pin.left - 7) - layerBox.left, r: Math.max(b.right, pin.left + 7) - layerBox.left,
        t: Math.min(b.top, pin.top - 7) - layerBox.top, b: Math.max(b.bottom, pin.top + 7) - layerBox.top
      };
      item.life = 1800 + active.length * 900;
      active.push(item);
    });
    var userPaused = false, offscreen = false;

    var overlaps = function (r) {
      return active.some(function (it) {
        var o = it.rect;
        return r.l < o.r + GAP && r.r > o.l - GAP && r.t < o.b + GAP && r.b > o.t - GAP;
      });
    };

    // Try random dots until the item fits inside the map without overlapping
    var placeItem = function (item) {
      var W = mapLayer.clientWidth, H = mapLayer.clientHeight;
      var w = item.body.offsetWidth, h = item.body.offsetHeight;
      for (var tries = 0; tries < 40; tries++) {
        var a = anchors[Math.floor(Math.random() * anchors.length)];
        var px = (a.x / 100) * W, py = (a.y / 100) * H;
        var fitsAbove = py - STEM - h >= 0, fitsBelow = py + STEM + h <= H;
        if (!fitsAbove && !fitsBelow) continue;
        var below = fitsAbove && fitsBelow ? Math.random() < 0.3 : !fitsAbove;
        var dx = Math.max(0, w / 2 - px) - Math.max(0, px + w / 2 - W);
        var rect = {
          l: Math.min(px - 7, px - w / 2 + dx), r: Math.max(px + 7, px + w / 2 + dx),
          t: below ? py - 7 : py - STEM - h, b: below ? py + STEM + h : py + 7
        };
        if (overlaps(rect)) continue;
        item.el.style.setProperty('--x', a.x.toFixed(2));
        item.el.style.setProperty('--y', a.y.toFixed(2));
        item.el.style.setProperty('--dx', dx.toFixed(1) + 'px');
        item.el.classList.toggle('is-below', below);
        item.rect = rect;
        return true;
      }
      return false;
    };

    var spawn = function () {
      var max = mapLayer.clientWidth < 480 ? 3 : 5;
      if (active.length >= max) return;
      var photosOn = active.filter(function (it) { return it.photo; }).length;
      var pool = mapItems.filter(function (it) {
        return active.indexOf(it) < 0 && (!it.photo || photosOn < 2);
      });
      if (!pool.length) return;
      var item = pool[Math.floor(Math.random() * pool.length)];
      if (!placeItem(item)) return;
      item.life = 4200 + Math.random() * 1800;
      active.push(item);
      item.el.classList.add('is-on');
    };

    var mapTick = function () {
      if (userPaused || offscreen || document.hidden) return;
      active.slice().forEach(function (item) {
        item.life -= TICK;
        if (item.life <= 0 && item.el.classList.contains('is-on')) item.el.classList.remove('is-on');
        if (item.life <= -700) active.splice(active.indexOf(item), 1);   // space freed once faded
      });
      nextSpawn -= TICK;
      if (nextSpawn <= 0) { spawn(); nextSpawn = 900 + Math.random() * 700; }
    };
    window.setInterval(mapTick, TICK);

    if (mapBtn) {
      mapBtn.addEventListener('click', function () {
        userPaused = map.classList.toggle('is-paused');
        mapBtnText.textContent = userPaused ? 'Play' : 'Pause';
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting;
      }).observe(map);
    }
    // A new width can push shown items off the map: start afresh
    // (height-only resizes, e.g. the mobile URL bar, are ignored)
    var mapWidth = mapLayer.clientWidth;
    window.addEventListener('resize', function () {
      if (mapLayer.clientWidth === mapWidth) return;
      mapWidth = mapLayer.clientWidth;
      active.forEach(function (item) { item.el.classList.remove('is-on'); });
      active = [];
      nextSpawn = 400;
    }, { passive: true });
  }


  /* 5b. FEATURED CAMPAIGN — PHOTOS FOLLOW THE STORY --------------------- */
  // Desktop only (the sticky photo column is hidden below 960px). As part 2
  // rises from 85% to 40% of the viewport, --t goes 0 → 1: the second photo
  // wipes up and both zoom. Counter, caption and step buttons follow; the
  // buttons scroll to their part. Pointer parallax with a fine pointer.
  // With reduced motion the photos simply switch halfway.
  var campaign = document.querySelector('[data-campaign]');
  if (campaign) {
    var cMedia = campaign.querySelector('.campaign__media');
    var cFrame = campaign.querySelector('.campaign__frame');
    var cParts = campaign.querySelectorAll('[data-campaign-part]');
    var cSteps = campaign.querySelectorAll('[data-campaign-go]');
    var cCurrent = campaign.querySelector('[data-campaign-current]');
    var cCaption = campaign.querySelector('[data-campaign-caption]');
    var cIndex = -1, cTick = false;

    var updateCampaign = function () {
      cTick = false;
      if (!cMedia.offsetParent || cParts.length < 2) return;
      var vh = window.innerHeight;
      var top = cParts[1].getBoundingClientRect().top;
      var t = Math.max(0, Math.min(1, (vh * 0.85 - top) / (vh * 0.45)));
      if (reduceMotion.matches) t = t >= 0.5 ? 1 : 0;
      cFrame.style.setProperty('--t', t.toFixed(3));

      var index = t >= 0.5 ? 1 : 0;
      if (index === cIndex) return;
      cIndex = index;
      cCurrent.textContent = String(index + 1).padStart(2, '0');
      cCaption.textContent = cParts[index].getAttribute('data-caption');
      each(cSteps, function (btn, i) { btn.classList.toggle('is-active', i === index); });
    };

    each(cSteps, function (btn) {
      btn.addEventListener('click', function () {
        var part = cParts[+btn.getAttribute('data-campaign-go')];
        if (part) part.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    });

    window.addEventListener('scroll', function () {
      if (cTick) return;
      cTick = true;
      window.requestAnimationFrame(updateCampaign);
    }, { passive: true });
    window.addEventListener('resize', updateCampaign, { passive: true });
    updateCampaign();

    var cFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    cFrame.addEventListener('pointermove', function (e) {
      if (!cFine.matches || reduceMotion.matches) return;
      var r = cFrame.getBoundingClientRect();
      cFrame.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      cFrame.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    cFrame.addEventListener('pointerleave', function () {
      cFrame.style.removeProperty('--px');
      cFrame.style.removeProperty('--py');
    });
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


  /* 8. ABOUT — FALLING VALUE PILLS --------------------------------------- */
  // The five <li> pills are the real list. On screens that allow motion,
  // coloured copies are added (aria-hidden) and every pill becomes a physics
  // body: they fall and pile up when the section comes into view.
  //   mouse: hover pushes pills, drag to throw, double-click duplicates a pill
  //   touch: tap a pill to make it jump (page scrolling stays normal)
  var pile = document.querySelector('[data-pile]');
  if (pile && !reduceMotion.matches && 'IntersectionObserver' in window) {
    var PILL_COLOURS = ['pill--teal', 'pill--red', 'pill--ink', 'pill--mist', 'pill--blush', 'pill--line'];
    var MAX_PILLS = 40;

    var loadMatter = function (done) {
      if (window.Matter) { done(); return; }
      var s = document.createElement('script');
      s.src = SCRIPT_URL ? new URL('../vendor/matter.min.js', SCRIPT_URL).href : 'assets/vendor/matter.min.js';
      s.onload = done;
      s.onerror = function () { pile.classList.add('is-static'); };   // keep the still pile
      document.head.appendChild(s);
    };

    var startPile = function () {
      var M = window.Matter;
      if (!M) return;
      var originals = Array.prototype.slice.call(pile.children);
      var copies = window.innerWidth < 600 ? 1 : 2;
      for (var c = 0; c < copies; c++) {
        originals.forEach(function (li, i) {
          var clone = li.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.className = 'pile__pill ' + PILL_COLOURS[(i + c * 2 + 1) % PILL_COLOURS.length];
          pile.appendChild(clone);
        });
      }
      pile.classList.add('is-live');

      var engine = M.Engine.create();
      engine.gravity.y = 1.1;
      var world = engine.world;
      var items = [];            // { el, w, h, body }
      var walls = [];
      var W = 0, H = 0;

      var buildWalls = function () {
        if (walls.length) M.Composite.remove(world, walls);
        W = pile.clientWidth; H = pile.clientHeight;
        var t = 200;
        walls = [
          M.Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),          // floor
          M.Bodies.rectangle(-t / 2, 0, t, H * 4, { isStatic: true }),                 // left
          M.Bodies.rectangle(W + t / 2, 0, t, H * 4, { isStatic: true })               // right
        ];
        M.Composite.add(world, walls);
      };

      var addBody = function (item, x, y) {
        var w = item.el.offsetWidth, h = item.el.offsetHeight;
        item.w = w; item.h = h;
        item.body = M.Bodies.rectangle(
          x != null ? x : w / 2 + Math.random() * Math.max(1, W - w),
          y != null ? y : -h - Math.random() * 160,
          w, h,
          { chamfer: { radius: h / 2 - 1 }, restitution: 0.35, friction: 0.45, frictionAir: 0.012, density: 0.002,
            angle: (Math.random() - 0.5) * 0.8 }
        );
        item.body.plugin.el = item.el;
        M.Composite.add(world, item.body);
        item.el.classList.add('is-on');
      };

      // Drop pills one after another, in random order
      var dropAll = function () {
        var order = items.slice().sort(function () { return Math.random() - 0.5; });
        order.forEach(function (item, i) { setTimeout(function () { addBody(item); }, i * 110); });
      };

      var render = function () {
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          if (!it.body) continue;
          var p = it.body.position;
          it.el.style.transform = 'translate3d(' + (p.x - it.w / 2).toFixed(1) + 'px,' + (p.y - it.h / 2).toFixed(1) +
            'px,0) rotate(' + it.body.angle.toFixed(4) + 'rad)';
        }
      };
      M.Events.on(engine, 'afterUpdate', render);

      Array.prototype.forEach.call(pile.children, function (el) { items.push({ el: el, w: 0, h: 0, body: null }); });
      buildWalls();

      var runner = M.Runner.create();
      var running = false;
      var run = function (on) {
        if (on && !running) { M.Runner.run(runner, engine); running = true; }
        if (!on && running) { M.Runner.stop(runner); running = false; }
      };

      // Pointer position relative to the pile
      var local = function (e) {
        var r = pile.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      var bodiesAt = function (pt) {
        return M.Query.point(items.filter(function (it) { return it.body; }).map(function (it) { return it.body; }), pt);
      };
      var clamp = function (v, m) { return Math.max(-m, Math.min(m, v)); };

      // Mouse: drag & throw (touch listeners removed so the page still scrolls)
      var mc = null;
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var mouse = M.Mouse.create(pile);
        pile.removeEventListener('wheel', mouse.mousewheel);
        pile.removeEventListener('touchmove', mouse.mousemove);
        pile.removeEventListener('touchstart', mouse.mousedown);
        pile.removeEventListener('touchend', mouse.mouseup);
        mc = M.MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.18, render: { visible: false } } });
        M.Composite.add(world, mc);
        M.Events.on(mc, 'startdrag', function () { pile.classList.add('is-dragging'); });
        M.Events.on(mc, 'enddrag', function () { pile.classList.remove('is-dragging'); });
      }

      // Hover: pills you sweep over get pushed in the pointer's direction
      var last = null;
      pile.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var pt = local(e);
        if (last && !(mc && mc.body)) {
          var dx = pt.x - last.x, dy = pt.y - last.y;
          bodiesAt(pt).forEach(function (b) {
            M.Body.setVelocity(b, { x: clamp(b.velocity.x + dx * 0.3, 16), y: clamp(b.velocity.y + dy * 0.3 - 1.2, 16) });
            M.Body.setAngularVelocity(b, clamp(b.angularVelocity + dx * 0.003, 0.25));
          });
        }
        last = pt;
      });
      pile.addEventListener('pointerleave', function () { last = null; });

      // Tap / click: the pill jumps
      var down = null;
      pile.addEventListener('pointerdown', function (e) { down = { pt: local(e), t: Date.now() }; });
      pile.addEventListener('pointerup', function (e) {
        if (!down) return;
        var pt = local(e);
        var still = Math.abs(pt.x - down.pt.x) < 6 && Math.abs(pt.y - down.pt.y) < 6 && Date.now() - down.t < 350;
        down = null;
        if (!still) return;
        bodiesAt(pt).forEach(function (b) {
          M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 8, y: -15 });
          M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3);
        });
      });

      // Double-click: duplicate a pill in another colour
      pile.addEventListener('dblclick', function (e) {
        var hit = bodiesAt(local(e))[0];
        if (!hit || items.length >= MAX_PILLS) return;
        var clone = hit.plugin.el.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.classList.remove('is-on');
        clone.className = 'pile__pill ' + PILL_COLOURS[items.length % PILL_COLOURS.length];
        pile.appendChild(clone);
        var item = { el: clone, w: 0, h: 0, body: null };
        items.push(item);
        addBody(item, hit.position.x, -80);
      });

      // Run only while visible
      new IntersectionObserver(function (entries) { run(entries[0].isIntersecting); }).observe(pile);
      dropAll();

      // Rebuild when the width changes a lot (rotation, window resize)
      var lastW = W, resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (Math.abs(pile.clientWidth - lastW) < 60) return;
          lastW = pile.clientWidth;
          items.forEach(function (it) { if (it.body) M.Composite.remove(world, it.body); it.body = null; it.el.classList.remove('is-on'); });
          buildWalls();
          dropAll();
        }, 250);
      }, { passive: true });
    };

    // Load the physics engine shortly before the section is reached,
    // start the fall once a quarter of it is visible.
    var started = false;
    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      loadMatter(function () {
        new IntersectionObserver(function (en, o2) {
          if (!en[0].isIntersecting || started) return;
          started = true;
          o2.disconnect();
          (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(startPile);
        }, { threshold: 0.25 }).observe(pile);
      });
    }, { rootMargin: '400px 0px' }).observe(pile);
  }
})();
