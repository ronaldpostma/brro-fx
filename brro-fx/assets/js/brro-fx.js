/**
 * Brro FX — Motion Effects Engine
 * Version: 1.1.0
 * Author:  Ronald Postma (Brro) & Claude (Anthropic)
 * License: GPL-2.0-or-later
 *
 * Add brro-fx-- classes to any element to apply effects. No config needed.
 *
 * Per-effect modifiers (v1.1.0):
 *   brro-fx--{vertical|horizontal|fade|blur|rotate}-direction-*
 *   brro-fx--{vertical|horizontal|fade|blur|rotate}-start-{0-100}
 *   brro-fx--{vertical|horizontal|fade|blur|rotate}-end-{0-100}
 *   brro-fx--{vertical|horizontal|blur|rotate}-speed-{1-10}
 * Scoped classes override the legacy global classes (brro-fx--start-*, etc.)
 * per effect; globals remain as fallbacks so existing sites keep working.
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

  // ─── Per-effect helpers ───────────────────────────────────────────────────
  // Resolution rule: per-effect scoped class wins, else legacy global, else default.

  function parseIntSuffixScoped(el, scope, key) {
    return parseIntSuffix(el, 'brro-fx--' + scope + '-' + key + '-');
  }

  function getStartPctFor(el, scope) {
    var v = parseIntSuffixScoped(el, scope, 'start');
    return v !== null ? v : getStartPct(el);
  }

  function getEndPctFor(el, scope) {
    var v = parseIntSuffixScoped(el, scope, 'end');
    return v !== null ? v : getEndPct(el);
  }

  function getSpeedFor(el, scope) {
    var v = parseIntSuffixScoped(el, scope, 'speed');
    return v !== null ? v : getSpeed(el);
  }

  function getVerticalDir(el) {
    if (el.classList.contains('brro-fx--vertical-direction-down')) return 'down';
    if (el.classList.contains('brro-fx--vertical-direction-up'))   return 'up';
    return getDirection(el) === 'down' ? 'down' : 'up';
  }

  function getHorizontalDir(el) {
    if (el.classList.contains('brro-fx--horizontal-direction-right')) return 'right';
    if (el.classList.contains('brro-fx--horizontal-direction-left'))  return 'left';
    return getDirection(el) === 'right' ? 'right' : 'left';
  }

  function getFadeDir(el) {
    if (el.classList.contains('brro-fx--fade-direction-out')) return 'out';
    if (el.classList.contains('brro-fx--fade-direction-in'))  return 'in';
    return getDirection(el) === 'down' ? 'out' : 'in';
  }

  function getRotateDir(el) {
    if (el.classList.contains('brro-fx--rotate-direction-left'))  return 'left';
    if (el.classList.contains('brro-fx--rotate-direction-right')) return 'right';
    return getDirection(el) === 'left' ? 'left' : 'right';
  }

  // ─── Per-element update ────────────────────────────────────────────────────

  function updateElement(el) {
    if (isDisabled(el)) return;

    var raw = getRawProgress(el);

    // --brro-progress keeps its legacy meaning: remapped by the GLOBAL
    // brro-fx--start-*/brro-fx--end-* so existing custom CSS using this
    // variable does not change behavior.
    var progressGlobal = clampProgress(raw, getStartPct(el), getEndPct(el));
    el.style.setProperty('--brro-progress', progressGlobal.toFixed(4));

    // Vertical parallax
    // speed 5 → ±100 px range (element offset at 0%: +100px, at 100%: -100px)
    if (el.classList.contains('brro-fx--vertical-scroll')) {
      var progressV = clampProgress(raw, getStartPctFor(el, 'vertical'), getEndPctFor(el, 'vertical'));
      var speedV    = getSpeedFor(el, 'vertical');
      var dirV      = getVerticalDir(el);
      var rangeV    = speedV * 20;
      var offsetV   = (progressV - 0.5) * rangeV * 2;
      var signV     = dirV === 'down' ? 1 : -1;
      el.style.setProperty('--brro-translate-y', (offsetV * signV).toFixed(2) + 'px');
    }

    // Horizontal parallax
    if (el.classList.contains('brro-fx--horizontal-scroll')) {
      var progressH = clampProgress(raw, getStartPctFor(el, 'horizontal'), getEndPctFor(el, 'horizontal'));
      var speedH    = getSpeedFor(el, 'horizontal');
      var dirH      = getHorizontalDir(el);
      var rangeH    = speedH * 20;
      var offsetH   = (progressH - 0.5) * rangeH * 2;
      var signH     = dirH === 'right' ? 1 : -1;
      el.style.setProperty('--brro-translate-x', (offsetH * signH).toFixed(2) + 'px');
    }

    // Opacity mapping
    // Default (in): fades in (0→1) as element traverses viewport bottom→top.
    // out: fades out (1→0).
    if (el.classList.contains('brro-fx--fade')) {
      var progressF = clampProgress(raw, getStartPctFor(el, 'fade'), getEndPctFor(el, 'fade'));
      var dirF      = getFadeDir(el);
      var opacity   = dirF === 'out' ? 1 - progressF : progressF;
      el.style.setProperty('--brro-opacity', Math.max(0, Math.min(1, opacity)).toFixed(4));
    }

    // Blur mapping — max blur at entry, clears as element rises through viewport
    // speed 5 → 10 px max blur
    if (el.classList.contains('brro-fx--blur')) {
      var progressB = clampProgress(raw, getStartPctFor(el, 'blur'), getEndPctFor(el, 'blur'));
      var speedB    = getSpeedFor(el, 'blur');
      var maxBlur   = speedB * 2;
      el.style.setProperty('--brro-blur', Math.max(0, (1 - progressB) * maxBlur).toFixed(2) + 'px');
    }

    // Rotation mapping
    // progress 0.5 (element centre in viewport) → 0 deg.
    // speed 5 → ±50 deg range total.
    // rotate-direction-left: inverts rotation direction (CCW).
    if (el.classList.contains('brro-fx--rotate')) {
      var progressR = clampProgress(raw, getStartPctFor(el, 'rotate'), getEndPctFor(el, 'rotate'));
      var speedR    = getSpeedFor(el, 'rotate');
      var dirR      = getRotateDir(el);
      var maxDeg    = speedR * 10;
      var signR     = dirR === 'left' ? -1 : 1;
      var deg       = (progressR - 0.5) * maxDeg * 2 * signR;
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

      if (el.classList.contains('brro-fx--fade-in') || el.classList.contains('brro-fx--fade-in-up')) {
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
