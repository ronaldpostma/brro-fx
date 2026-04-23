/**
 * Brro FX — Motion Effects Engine
 * Version: 1.0.0
 * Author:  Ronald Postma (Brro) & Claude (Anthropic)
 * License: GPL-2.0-or-later
 *
 * Add brro-fx-- classes to any element to apply effects. No config needed.
 */
(function () {
  'use strict';

  // Effect classes that require progress tracking
  var SCROLL_EFFECTS = [
    'brro-fx--vertical-scroll',
    'brro-fx--horizontal-scroll',
    'brro-fx--fade',
    'brro-fx--blur',
    'brro-fx--rotate',
  ];

  // Elements tracked by IntersectionObserver (viewport-relative progress)
  var viewportElements = new Set();
  // Elements tracked by page scroll (page-relative progress, always active)
  var pageElements = new Set();

  var rafId = null;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function isDisabled(el) {
    var w = window.innerWidth;
    return (
      (el.classList.contains('brro-fx--mobile-off') && w < 768) ||
      (el.classList.contains('brro-fx--tablet-off') && w < 1024)
    );
  }

  function getRawProgress(el) {
    if (el.classList.contains('brro-fx--page')) {
      var scrollable = document.body.scrollHeight - window.innerHeight;
      return scrollable > 0 ? window.scrollY / scrollable : 0;
    }
    var rect = el.getBoundingClientRect();
    var total = window.innerHeight + rect.height;
    return total > 0 ? (window.innerHeight - rect.top) / total : 0;
  }

  function clampProgress(raw, startPct, endPct) {
    if (endPct <= startPct) return 0;
    var s = startPct / 100;
    var e = endPct / 100;
    return Math.max(0, Math.min(1, (raw - s) / (e - s)));
  }

  function parseIntSuffix(el, prefix) {
    var re = new RegExp('^' + prefix + '(\\d+)$');
    for (var i = 0; i < el.classList.length; i++) {
      var m = el.classList[i].match(re);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  }

  function getSpeed(el)    { var v = parseIntSuffix(el, 'brro-fx--speed-'); return v !== null ? v : 5; }
  function getStartPct(el) { var v = parseIntSuffix(el, 'brro-fx--start-'); return v !== null ? v : 0; }
  function getEndPct(el)   { var v = parseIntSuffix(el, 'brro-fx--end-');   return v !== null ? v : 100; }

  function getDirection(el) {
    if (el.classList.contains('brro-fx--direction-up'))    return 'up';
    if (el.classList.contains('brro-fx--direction-down'))  return 'down';
    if (el.classList.contains('brro-fx--direction-left'))  return 'left';
    if (el.classList.contains('brro-fx--direction-right')) return 'right';
    return null;
  }

  // ─── Per-element update ────────────────────────────────────────────────────

  function updateElement(el) {
    if (isDisabled(el)) return;

    var raw      = getRawProgress(el);
    var progress = clampProgress(raw, getStartPct(el), getEndPct(el));
    var speed    = getSpeed(el);
    var dir      = getDirection(el);

    el.style.setProperty('--brro-progress', progress.toFixed(4));

    // Vertical parallax
    // speed 5 → ±100 px range (element offset at 0%: +100px, at 100%: -100px)
    if (el.classList.contains('brro-fx--vertical-scroll')) {
      var rangeV  = speed * 20;
      var offsetV = (progress - 0.5) * rangeV * 2;
      var signV   = dir === 'down' ? 1 : -1;
      el.style.setProperty('--brro-translate-y', (offsetV * signV).toFixed(2) + 'px');
    }

    // Horizontal parallax
    if (el.classList.contains('brro-fx--horizontal-scroll')) {
      var rangeH  = speed * 20;
      var offsetH = (progress - 0.5) * rangeH * 2;
      var signH   = dir === 'right' ? 1 : -1;
      el.style.setProperty('--brro-translate-x', (offsetH * signH).toFixed(2) + 'px');
    }

    // Opacity mapping
    // Default: fades in (0→1) as element traverses viewport bottom→top.
    // direction-down: fades out (1→0).
    if (el.classList.contains('brro-fx--fade')) {
      var opacity = dir === 'down' ? 1 - progress : progress;
      el.style.setProperty('--brro-opacity', Math.max(0, Math.min(1, opacity)).toFixed(4));
    }

    // Blur mapping — max blur at entry, clears as element rises through viewport
    // speed 5 → 10 px max blur
    if (el.classList.contains('brro-fx--blur')) {
      var maxBlur = speed * 2;
      el.style.setProperty('--brro-blur', Math.max(0, (1 - progress) * maxBlur).toFixed(2) + 'px');
    }

    // Rotation mapping
    // progress 0.5 (element centre in viewport) → 0 deg.
    // speed 5 → ±50 deg range total.
    // direction-left: inverts rotation direction.
    if (el.classList.contains('brro-fx--rotate')) {
      var maxDeg = speed * 10;
      var signR  = dir === 'left' ? -1 : 1;
      var deg    = (progress - 0.5) * maxDeg * 2 * signR;
      el.style.setProperty('--brro-rotate', deg.toFixed(2) + 'deg');
    }
  }

  // ─── rAF loop (drives viewport-tracked elements) ──────────────────────────

  function tick() {
    viewportElements.forEach(updateElement);
    if (viewportElements.size > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // ─── IntersectionObserver — scroll effects ────────────────────────────────

  var scrollObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          viewportElements.add(entry.target);
          startLoop();
        } else {
          viewportElements.delete(entry.target);
          // rAF loop self-stops when set is empty
        }
      });
    },
    { threshold: 0 }
  );

  // ─── IntersectionObserver — fade-in entrance ──────────────────────────────

  var entranceObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('brro-fx--is-visible');
          entranceObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  // ─── Page-scroll elements (rAF on demand) ────────────────────────────────

  var pageRafPending = false;

  function flushPageElements() {
    pageElements.forEach(updateElement);
    pageRafPending = false;
  }

  function schedulePageUpdate() {
    if (!pageRafPending && pageElements.size > 0) {
      pageRafPending = true;
      requestAnimationFrame(flushPageElements);
    }
  }

  // ─── Smooth Scroll ────────────────────────────────────────────────────────
  //
  // Enabled by: <html brro-fx--smoothscroll="on">
  // Skipped if: prefers-reduced-motion is set.
  // Powered by Lenis 1.1.19 (loaded as a dependency via lenis.min.js).

  function initSmoothScroll() {
    if (document.documentElement.getAttribute('brro-fx--smoothscroll') !== 'on') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      wheelMultiplier: 1,
      smoothTouch: false,
    });

    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    var all = document.querySelectorAll('[class*="brro-fx--"]');

    all.forEach(function (el) {
      var hasScrollEffect = SCROLL_EFFECTS.some(function (cls) {
        return el.classList.contains(cls);
      });

      if (hasScrollEffect) {
        if (el.classList.contains('brro-fx--page')) {
          pageElements.add(el);
        } else {
          scrollObserver.observe(el);
        }
      }

      if (el.classList.contains('brro-fx--fade-in')) {
        entranceObserver.observe(el);
      }
    });

    if (pageElements.size > 0) {
      window.addEventListener('scroll', schedulePageUpdate, { passive: true });
      schedulePageUpdate();
    }

    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
