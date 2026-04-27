# Brro FX — Reference (Cursor / @Docs)

> **Purpose:** This file is the canonical machine- and human-readable reference for the **Brro FX** WordPress plugin (`brro-fx`). Add it to **Cursor → Docs** so the assistant can choose correct `brro-fx--*` classes when you ask for scroll, entrance, or loop effects.  
> **Stack:** Vanishing JS, `IntersectionObserver`, CSS custom properties, optional **Lenis** smooth scroll. **jQuery is not used.**

---

## Document metadata

| Key | Value |
|-----|-------|
| `plugin_slug` | `brro-fx` |
| `text_domain` | `brro-fx` |
| `version_header` | 1.1.0 (from plugin header) |
| `version_constant` | `BRRO_FX_VERSION` in `brro-fx.php` |
| `engine_version` | 1.1.0 (from `assets/js/brro-fx.js`) |
| `class_prefix` | `brro-fx--` (double hyphen) |
| `engine_injected_state_class` | `brro-fx--is-visible` (entrance only; do not add manually in HTML) |

---

## WordPress integration

- **Active plugin** auto-enqueues on `wp_enqueue_scripts`:
  - Style: `assets/css/brro-fx.css` handle `brro-fx`
  - Script: `assets/js/lenis.min.js` handle `lenis` (in footer)
  - Script: `assets/js/brro-fx.js` handle `brro-fx` (depends on `lenis`, footer)
- **Theme requirement:** No PHP API. Add HTML classes in templates, **Elementor** HTML / widget classes, **ACF** output, or blocks.
- **Selector:** The engine does `document.querySelectorAll('[class*="brro-fx--"]')` on DOM ready, then wires observers. Any element with a substring `brro-fx--` in `class` is considered.

---

## Architecture (how it works)

1. **Scroll-mapped effects** (JS-driven): `brro-fx--vertical-scroll`, `brro-fx--horizontal-scroll`, `brro-fx--fade`, `brro-fx--blur`, `brro-fx--rotate`  
   - JS computes progress (viewport-based or full-page) and sets inline **CSS custom properties** on the element.  
   - A shared CSS rule uses one `transform`, `filter`, and `opacity` combining all variables so **multiple scroll effects on one element stack without fighting**.

2. **Per-effect modifiers (v1.1.0+):** each effect can have its own `direction`, `start`, `end`, and `speed` via scoped classes `brro-fx--{effect}-{param}-*`. Scoped classes **override** the legacy global classes per effect; globals remain as **fallbacks** so existing sites keep working unchanged. Precedence: **scoped > global > default**.

3. **Entrance (one-shot):** `brro-fx--fade-in`, `brro-fx--fade-in-up`  
   - `IntersectionObserver` (threshold 0.1) adds `brro-fx--is-visible` once, then unobserves. **Does not re-run** when scrolling back.

4. **Loop (CSS-only):** `brro-fx--heartbeat` + optional `brro-fx--duration-*` (numeric only, e.g. `brro-fx--duration-800` = 800 ms), `brro-fx--scale-*` — no scroll JS.

5. **Smooth scroll:** attribute on **`<html>`** — not a class: `brro-fx--smoothscroll="on"`. Initializes **Lenis**; skipped if `prefers-reduced-motion: reduce`.

6. **Responsive off:** `brro-fx--mobile-off` / `brro-fx--tablet-off` — JS **skips updates** (no custom props applied) below breakpoint.

---

## JSON registry (machine-readable class list)

Use this block for quick lookup, code generation, or validation.

```json
{
  "brro_fx_reference_version": 3,
  "categories": {
    "scroll_effects": {
      "description": "Require brro-fx.js; map scroll progress to CSS variables.",
      "classes": [
        { "class": "brro-fx--vertical-scroll", "sets": ["--brro-translate-y"] },
        { "class": "brro-fx--horizontal-scroll", "sets": ["--brro-translate-x"] },
        { "class": "brro-fx--fade", "sets": ["--brro-opacity"] },
        { "class": "brro-fx--blur", "sets": ["--brro-blur"] },
        { "class": "brro-fx--rotate", "sets": ["--brro-rotate"] }
      ]
    },
    "progress_mode": {
      "classes": [
        { "class": "brro-fx--page", "effect": "Progress from full page scroll 0-100% instead of element viewport position. Combine with any scroll effect." }
      ]
    },
    "direction_global_legacy": {
      "note": "Single shared direction for all effects on the element. Used only when no scoped per-effect direction class is present. Precedence: per-effect > global > default.",
      "classes": [
        { "class": "brro-fx--direction-up", "for": ["brro-fx--vertical-scroll"], "effect": "Default vertical parallax sign (up drift)." },
        { "class": "brro-fx--direction-down", "for": ["brro-fx--vertical-scroll", "brro-fx--fade"], "effect": "Invert vertical parallax; for fade, fade out 1 to 0." },
        { "class": "brro-fx--direction-left", "for": ["brro-fx--horizontal-scroll", "brro-fx--rotate"], "effect": "Default horizontal; rotate CCW when used with rotate." },
        { "class": "brro-fx--direction-right", "for": ["brro-fx--horizontal-scroll"], "effect": "Horizontal parallax to the right." }
      ]
    },
    "numeric_modifiers_global_legacy": {
      "note": "Used only when no scoped per-effect class is present. Precedence: per-effect > global > default.",
      "pattern_speed": { "class_pattern": "brro-fx--speed-N", "n_range": "1-10", "default": 5, "applies_to": "scroll_effects" },
      "pattern_start": { "class_pattern": "brro-fx--start-N", "n_range": "0-100", "default": 0 },
      "pattern_end": { "class_pattern": "brro-fx--end-N", "n_range": "0-100", "default": 100 }
    },
    "per_effect_modifiers": {
      "precedence": "per-effect > global > default",
      "scopes": {
        "vertical": {
          "base_class": "brro-fx--vertical-scroll",
          "direction": { "classes": ["brro-fx--vertical-direction-up", "brro-fx--vertical-direction-down"], "default": "up" },
          "start": { "class_pattern": "brro-fx--vertical-start-N", "n_range": "0-100", "default": 0 },
          "end": { "class_pattern": "brro-fx--vertical-end-N", "n_range": "0-100", "default": 100 },
          "speed": { "class_pattern": "brro-fx--vertical-speed-N", "n_range": "1-10", "default": 5 }
        },
        "horizontal": {
          "base_class": "brro-fx--horizontal-scroll",
          "direction": { "classes": ["brro-fx--horizontal-direction-left", "brro-fx--horizontal-direction-right"], "default": "left" },
          "start": { "class_pattern": "brro-fx--horizontal-start-N", "n_range": "0-100", "default": 0 },
          "end": { "class_pattern": "brro-fx--horizontal-end-N", "n_range": "0-100", "default": 100 },
          "speed": { "class_pattern": "brro-fx--horizontal-speed-N", "n_range": "1-10", "default": 5 }
        },
        "fade": {
          "base_class": "brro-fx--fade",
          "direction": { "classes": ["brro-fx--fade-direction-in", "brro-fx--fade-direction-out"], "default": "in", "note": "Replaces up/down naming for fade. Global brro-fx--direction-down still maps to fade-out as fallback." },
          "start": { "class_pattern": "brro-fx--fade-start-N", "n_range": "0-100", "default": 0 },
          "end": { "class_pattern": "brro-fx--fade-end-N", "n_range": "0-100", "default": 100 },
          "speed": null
        },
        "blur": {
          "base_class": "brro-fx--blur",
          "direction": null,
          "start": { "class_pattern": "brro-fx--blur-start-N", "n_range": "0-100", "default": 0 },
          "end": { "class_pattern": "brro-fx--blur-end-N", "n_range": "0-100", "default": 100 },
          "speed": { "class_pattern": "brro-fx--blur-speed-N", "n_range": "1-10", "default": 5 }
        },
        "rotate": {
          "base_class": "brro-fx--rotate",
          "direction": { "classes": ["brro-fx--rotate-direction-right", "brro-fx--rotate-direction-left"], "default": "right", "note": "right = CW, left = CCW." },
          "start": { "class_pattern": "brro-fx--rotate-start-N", "n_range": "0-100", "default": 0 },
          "end": { "class_pattern": "brro-fx--rotate-end-N", "n_range": "0-100", "default": 100 },
          "speed": { "class_pattern": "brro-fx--rotate-speed-N", "n_range": "1-10", "default": 5 }
        }
      }
    },
    "responsive": {
      "classes": [
        { "class": "brro-fx--mobile-off", "disable_below_px": 768 },
        { "class": "brro-fx--tablet-off", "disable_below_px": 1024 }
      ]
    },
    "entrance": {
      "classes": [
        { "class": "brro-fx--fade-in", "css_final_state": "brro-fx--is-visible" },
        { "class": "brro-fx--fade-in-up", "css_final_state": "brro-fx--is-visible" }
      ]
    },
    "loop_heartbeat": {
      "classes": [
        { "class": "brro-fx--heartbeat", "type": "css_keyframes" }
      ],
      "scale_midpoint": {
        "var": "--brro-fx--scale",
        "classes": [
          "brro-fx--scale-0-5", "brro-fx--scale-0-6", "brro-fx--scale-0-7", "brro-fx--scale-0-8", "brro-fx--scale-0-9",
          "brro-fx--scale-1-1", "brro-fx--scale-1-2", "brro-fx--scale-1-3", "brro-fx--scale-1-4", "brro-fx--scale-1-5"
        ]
      }
    },
    "timing_utilities": {
      "duration_ms_values": [400, 600, 800, 1000, 1200, 1400, 1600, 2000, 2400, 2800, 3200, 3600, 4000],
      "duration_class_pattern": "brro-fx--duration-{ms}",
      "note": "Class name uses the number only (no ms suffix). Sets animation-duration and transition-duration. Not the same as brro-fx--speed-N."
    },
    "delay_ms": {
      "classes": [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500],
      "prefix": "brro-fx--delay-"
    },
    "html_attribute": {
      "name": "brro-fx--smoothscroll",
      "value_on": "on",
      "element": "html"
    }
  },
  "css_custom_properties": {
    "set_by_js_on_scroll_elements": {
      "--brro-progress": "0-1 remapped by the GLOBAL brro-fx--start-*/brro-fx--end-* window (unchanged since v1.0; per-effect windows are internal only)",
      "--brro-translate-x": "px, horizontal parallax",
      "--brro-translate-y": "px, vertical parallax",
      "--brro-rotate": "deg",
      "--brro-blur": "px",
      "--brro-opacity": "0-1"
    }
  }
}
```

---

## Progress calculation (for custom CSS with `--brro-progress`)

- **Default (viewport):** `raw = (innerHeight - rect.top) / (innerHeight + rect.height)` (clamped per start/end).  
- **`brro-fx--page`:** `raw = scrollY / (document.body.scrollHeight - innerHeight)`.

**Tuning window:** `brro-fx--start-{0-100}` and `brro-fx--end-{0-100}` remap raw progress to 0-1 between those percentages. If `end <= start`, progress stays 0.

**`--brro-progress` semantics (v1.1.0):** `--brro-progress` still reflects the **global** `brro-fx--start-*` / `brro-fx--end-*` window, so theme CSS using this variable keeps working unchanged. Each effect internally computes its own clamped progress from the same raw position when scoped `brro-fx--{effect}-start/end-*` classes are present; those per-effect windows are **not** exposed as CSS variables in this release.

**Speed (scroll effects only, integer 1-10, default 5):**

- Vertical / horizontal: total travel scale `speed * 20` px (from mapped curve; centre at progress 0.5).  
- Blur: max blur = `speed * 2` px at progress 0, easing to 0.  
- Rotate: max angle = `speed * 10` degrees (centre 0.5 = 0°).  
- Fade: speed does not change opacity math (only direction matters).

**Direction details (from engine):**

- **Fade:** default opacity follows `progress`; `brro-fx--direction-down` uses `1 - progress`.  
- **Vertical:** default sign opposes `direction-down` (up vs down drift).  
- **Horizontal:** default left; `brro-fx--direction-right` flips.  
- **Rotate:** default clockwise; `brro-fx--direction-left` inverts (CCW).

---

## Full class list (alphabetical by type)

### Scroll-mapped (combine freely on one node)

| Class | Role |
|-------|------|
| `brro-fx--vertical-scroll` | Vertical parallax |
| `brro-fx--horizontal-scroll` | Horizontal parallax |
| `brro-fx--fade` | Opacity vs scroll |
| `brro-fx--blur` | Blur vs scroll (strong at entry, clears) |
| `brro-fx--rotate` | Rotation vs scroll (0° at element centre) |

### Modifiers — global (legacy, shared by all effects on the element)

Used only when no scoped per-effect class is present. Precedence: **per-effect > global > default.**

| Class | Role |
|-------|------|
| `brro-fx--page` | Use page scroll 0-100% as progress source |
| `brro-fx--direction-up` | Vertical default (explicit) |
| `brro-fx--direction-down` | Vertical invert; fade out mode |
| `brro-fx--direction-left` | Horizontal default / rotate CCW |
| `brro-fx--direction-right` | Horizontal right |
| `brro-fx--speed-1` … `brro-fx--speed-10` | Magnitude (default `brro-fx--speed-5`) |
| `brro-fx--start-0` … `brro-fx--start-100` | When mapped effect begins (percent) |
| `brro-fx--end-0` … `brro-fx--end-100` | When mapped effect completes (percent) |
| `brro-fx--mobile-off` | No JS effect below 768px width |
| `brro-fx--tablet-off` | No JS effect below 1024px width |

### Modifiers — per-effect (v1.1.0+)

Scoped equivalents of the globals above. Use `brro-fx--{effect}-{param}-N` to target a single effect.

| Effect | Direction | Start / End | Speed |
|--------|-----------|-------------|-------|
| `brro-fx--vertical-scroll` | `brro-fx--vertical-direction-up` *(default)* / `-down` | `brro-fx--vertical-start-{0-100}` / `-end-{0-100}` | `brro-fx--vertical-speed-{1-10}` |
| `brro-fx--horizontal-scroll` | `brro-fx--horizontal-direction-left` *(default)* / `-right` | `brro-fx--horizontal-start-{0-100}` / `-end-{0-100}` | `brro-fx--horizontal-speed-{1-10}` |
| `brro-fx--fade` | `brro-fx--fade-direction-in` *(default)* / `-out` | `brro-fx--fade-start-{0-100}` / `-end-{0-100}` | — |
| `brro-fx--blur` | — | `brro-fx--blur-start-{0-100}` / `-end-{0-100}` | `brro-fx--blur-speed-{1-10}` |
| `brro-fx--rotate` | `brro-fx--rotate-direction-right` *(default, CW)* / `-left` *(CCW)* | `brro-fx--rotate-start-{0-100}` / `-end-{0-100}` | `brro-fx--rotate-speed-{1-10}` |

Global fallbacks: if a scoped class is absent, the engine maps the existing global classes (`brro-fx--direction-*`, `brro-fx--start-*`, `brro-fx--end-*`, `brro-fx--speed-*`) to each effect exactly as before v1.1.0.

### Entrance (one-shot)

| Class | Role |
|-------|------|
| `brro-fx--fade-in` | Opacity 0→1 on first intersect |
| `brro-fx--fade-in-up` | Opacity 0→1 + translateY 24px→0 |
| *engine* | `brro-fx--is-visible` added by JS (targets `.brro-fx--fade-in` / `brro-fx--fade-in-up`) |

### Loop

| Class | Role |
|-------|------|
| `brro-fx--heartbeat` | Infinite scale pulse (default 4000ms cycle) |
| `brro-fx--scale-0-5` … `brro-fx--scale-1-5` | Midpoint `transform` in keyframes (with heartbeat) |

### Timing helpers (entrance, heartbeat, any CSS using transition/animation)

| Pattern | Role |
|---------|------|
| `brro-fx--duration-400` … `brro-fx--duration-4000` | `animation-duration` + `transition-duration` (see exact list below; the **number in the class name** is the duration in ms — **no** literal `ms` suffix in the class) |
| `brro-fx--delay-100` … `brro-fx--delay-1500` | `animation-delay` + `transition-delay` — **not** for scroll-mapped (JS drives those) |

**Duration classes (must match `assets/css/brro-fx.css` exactly):**  
`brro-fx--duration-400` · `brro-fx--duration-600` · `brro-fx--duration-800` · `brro-fx--duration-1000` · `brro-fx--duration-1200` · `brro-fx--duration-1400` · `brro-fx--duration-1600` · `brro-fx--duration-2000` · `brro-fx--duration-2400` · `brro-fx--duration-2800` · `brro-fx--duration-3200` · `brro-fx--duration-3600` · `brro-fx--duration-4000`

### Document attribute (not a class)

| Markup | Role |
|--------|------|
| `<html brro-fx--smoothscroll="on">` | Enable Lenis smooth scroll (respects reduced motion) |

---

## Stacking example (multiple scroll effects)

**Global classes** (all effects share one direction / window / speed):

```html
<div class="brro-fx--vertical-scroll brro-fx--fade brro-fx--blur brro-fx--speed-4 brro-fx--start-10 brro-fx--end-80">
  Parallax + fade + blur within the 10%–80% progress window.
</div>
```

**Per-effect classes (v1.1.0+)** — different direction and window per effect on one element:

```html
<div class="brro-fx--vertical-scroll
            brro-fx--vertical-direction-up
            brro-fx--vertical-start-20
            brro-fx--vertical-end-60
            brro-fx--fade
            brro-fx--fade-direction-out">
  Vertical drifts up only from 20%–60% of the journey;
  fade uses its default 0%–100% window and fades out.
</div>
```

You can freely mix per-effect and global classes; per-effect always wins for that effect:

```html
<div class="brro-fx--vertical-scroll brro-fx--horizontal-scroll
            brro-fx--speed-6
            brro-fx--horizontal-speed-3">
  Vertical uses speed-6 (global); horizontal overrides to speed-3.
</div>
```

---

## Theme / Elementor usage notes

- Prefer adding these classes in **Additional CSS classes** (Elementor), **HTML widget** markup, or theme templates.  
- **Heartbeat** needs `display: inline-block` (or another transform-friendly formatting context) — plugin sets `display: inline-block` on `.brro-fx--heartbeat`.  
- Scroll effects use `will-change` and inline styles for variables; avoid redundant transforms in theme CSS on the same node unless you know the cascade.  
- For **reduced motion**, only smooth scroll is skipped by the engine; add theme-level `@media (prefers-reduced-motion: reduce)` overrides if you need to disable parallax site-wide.

---

## Related files in the plugin

| File | Content |
|------|---------|
| `brro-fx.php` | Enqueue, version constant, update checker |
| `assets/css/brro-fx.css` | All `brro-fx--*` rules and keyframes |
| `assets/js/brro-fx.js` | Observers, rAF, progress math, Lenis init |
| `assets/js/lenis.min.js` | Lenis (enqueued before `brro-fx.js`) |
| `ref/demo.html` | Visual demo and narrative copy |
| `ref/doc.md` | Brro FX reference for Cursor @Docs or other AI tools. |

---

## Changelog reference

Plugin row meta may link to: `https://github.com/ronaldpostma/brro-fx/releases`

---

*End of Brro FX reference for Cursor @Docs.*