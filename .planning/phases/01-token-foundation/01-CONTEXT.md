# Phase 1: Token Foundation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

A complete DTCG JSON token source that generates CSS custom properties (liteops- prefix) and Tailwind v4 config from a single source, with both light/dark themes working, elevation/gradient/motion tokens added, and backward compatibility shim preserving existing lc- apps.

</domain>

<decisions>
## Implementation Decisions

### Token naming
- Fork from `lc-` to `liteops-` prefix across the entire token system
- Drop the `color` category segment: `--liteops-olive-900` not `--liteops-color-olive-900` (the palette name is already color-specific, per pitfalls research)
- Three-tier structure: raw palette → semantic → component-level tokens
- Reconcile naming drift between design-system canonical and minipilot's diverged copy before any rename

### Theme system
- Preserve existing `data-theme="light"` / `data-theme="dark"` attribute switching
- Light theme: paper-100 bg, olive-900 text, lite-700 accents
- Dark theme: olive-900 bg, #E8E6E1 text, lite-400 accents (not lite-300)
- Sidebar always dark regardless of content theme

### Elevation scale
- Extend from current 4-level (sm/md/lg/xl) to 6-level scale
- Cohere-inspired: subtle to dramatic depth (from `0 1px 3px` to `0 20px 25px -5px`)
- Dark theme shadows deeper (already established in existing tokens)

### Gradient tokens
- Gradient fills allowed ONLY on landing hero/marketing sections
- Dashboard/app surfaces maintain signal-only rule for lite green
- Define named gradient tokens: green-to-olive, green-to-black (per user prompt)
- Gradients are token-defined, not component-defined

### Motion tokens
- Named tokens for: duration (fast/normal/slow), easing curves, stagger delays
- Fade-up entries with staggered 0.1s delay (existing)
- Hover transitions: 200ms (existing)
- Blob drift: 10s cycle (new, for landing)
- Cohere-inspired fluidity but sober institutional register -- no bouncy/playful
- Respect prefers-reduced-motion (already in existing tokens)

### Build pipeline
- Style Dictionary v5 (current release, requires Node 22+) with DTCG 2025.10 spec
- JSON source files structured for future Figma token import (TOKN-09)
- Output: CSS custom properties file + Tailwind v4 @theme directive (replaces JS config)
- Custom SD format for Tailwind (not sd-tailwindcss-transformer -- unconfirmed v5 compat)

### Backward compatibility
- Generate shim file mapping all `--lc-*` variables to `--liteops-*` equivalents
- Existing apps (app/, minipilot/, simulateur/) continue rendering via shim
- Shim is transitional -- needs a hard kill date (per pitfalls research)

### Claude's Discretion
- Exact JSON file organization within tokens/ directory
- Style Dictionary config file structure and custom transforms
- Tailwind @theme format implementation details
- Build script tooling (npm scripts, package.json setup)
- Test page HTML structure for visual verification

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system source
- `design-system/tokens/litechange-tokens.css` -- Current 309-line token file, the baseline to fork from
- `design-system/tokens/tailwind.config.js` -- Current Tailwind theme extension to be replaced by generated output
- `CLAUDE.md` -- Full design guidelines including colors, typography, spacing, theme rules, component patterns

### Research
- `.planning/research/ARCHITECTURE.md` -- Four-layer token architecture, three-tier token model, build order
- `.planning/research/STACK.md` -- Style Dictionary v5, Tailwind v4 @theme, DTCG spec details
- `.planning/research/PITFALLS.md` -- Token naming drift, 648 raw palette refs, shim kill date requirement
- `.planning/research/FEATURES.md` -- 73-component inventory, phased MVP recommendation

### Existing token consumers
- `app/src/app/globals.css` -- Main app's Tailwind + token imports
- `minipilot/app/src/styles/tokens.css` -- Minipilot's diverged token copy (naming drift documented)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `design-system/tokens/litechange-tokens.css`: Complete 2-tier token system (raw + semantic) with both themes -- fork baseline
- 4 keyframe animations already defined: fade-up, fade-in, pulse-glow, slide-in-right
- Base styles: box-sizing, body defaults, focus-visible, tabular-nums, scrollbar, reduced-motion

### Established Patterns
- `data-theme` attribute on DOM elements for theme switching (CSS inheritance)
- Semantic tokens reference raw palette via `var()` chains
- Dark theme uses rgba() borders for translucent layering
- Chart tokens follow ordered sequence per theme

### Integration Points
- `app/src/app/globals.css` imports tokens and defines Tailwind @theme
- `minipilot/app/src/styles/tokens.css` is a manually-maintained copy (will be replaced by generated output)
- `design-system/tokens/tailwind.config.js` currently hand-maintained (will be generated)
- `design-system/components/showcase.html` consumes tokens for visual verification

</code_context>

<specifics>
## Specific Ideas

- User references Cohere.com/fr as the visual confidence benchmark -- "sobre, confiant, enterprise"
- Shadows should progress from Cohere-like subtle (0 1px 3px) to dramatic (0 20px 25px -5px)
- "Dégradés verts/noirs subtils" -- gradients are subtle, not flashy
- User prompt specifies exact spacing scale: 4,8,12,16,20,24,32,40,48,64,80,96
- User prompt specifies exact radii: 6px (sm), 10px (md), 20px (lg), 9999px (pill)
- Output should be "téléchargeable" and structured for eventual Figma import

</specifics>

<deferred>
## Deferred Ideas

- Stylelint rule to flag direct raw palette usage in components -- Phase 2+ enforcement
- CI enforcement tracking `--lc-` reference counts -- migration phase (v2 MIGR-01)
- Automated migration script (lc- to liteops- in existing app files) -- v2 requirement MIGR-01
- CSS @property for gradient color animation -- needs Firefox test gate, Phase 3 hero section

</deferred>

---

*Phase: 01-token-foundation*
*Context gathered: 2026-03-24*
