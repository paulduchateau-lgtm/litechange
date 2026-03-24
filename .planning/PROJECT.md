# LiteOps Design Identity v2

## What This Is

A comprehensive design system upgrade for LiteOps.org — from the current functional-but-unremarkable visual identity to a Cohere-level enterprise design language. The project produces 60+ built components, forked design tokens (lc- to liteops-), HTML showcase pages, and complete documentation covering both the public landing site and internal app dashboards (simulateur, minipilot ERM). All output lives in `design-system/`.

## Core Value

Every screen must communicate **institutional confidence and sovereign AI credibility** — sober, data-forward, memorable. If a COMEX member sees a dashboard or a landing page, they must immediately feel "this is built for us, not adapted from a startup template."

## Requirements

### Validated

<!-- Inferred from existing codebase -->

- ✓ CSS custom properties token system with light/dark theme support — existing (`design-system/tokens/litechange-tokens.css`, 309 lines)
- ✓ Typography triad: Source Serif 4 (display), DM Sans (body), IBM Plex Mono (data) — existing in all apps
- ✓ Color palette: Olive, Paper, Lite Green, Signal Blue, Warm Orange with full scales — existing
- ✓ Tailwind integration via custom config — existing (`design-system/tokens/tailwind.config.js`)
- ✓ Basic component patterns: buttons, KPI cards, badges, sidebar nav, tables — existing across app/ and minipilot/
- ✓ Accessibility foundations: focus-visible, reduced-motion, AA contrast — existing in tokens CSS
- ✓ Dark theme for dashboards, light theme for editorial — existing semantic token switching

### Active

<!-- Building toward these -->

- [ ] Fork tokens from lc- prefix to liteops- prefix with backward compatibility shim
- [ ] Extend token system: gradient tokens, motion tokens, elevation scale (Cohere-like shadows)
- [ ] Style Dictionary source format (JSON) generating CSS, Tailwind, and Figma-ready exports
- [ ] 60+ component vocabulary built as HTML/CSS showcase pages
- [ ] Landing-specific components: hero sections with gradient fills, section layouts, CTA patterns
- [ ] Dashboard-specific components: risk heatmaps, agent panels, pipeline visualizations, chart patterns
- [ ] Form components: inputs, selects, switches, sliders (simulateur), multi-select dropdowns
- [ ] Navigation components: sidebar (dark), topbar, breadcrumbs, tabs/pills
- [ ] Feedback components: modals, toasts, alerts (4 variants), skeletons, loaders
- [ ] Layout components: responsive card grids (1-4 cols), hero sections, content sections
- [ ] Data visualization patterns: KPI cards (value/trend/badge), progress bars, sortable tables
- [ ] Green gradient rule: gradient fills allowed on landing hero/sections, signal-only rule preserved in app dashboards
- [ ] Naming convention: BEM-like CSS (Button--primary--md), kebab-case components, semantic tokens
- [ ] Figma-ready structure: Atoms/Molecules/Organisms naming in documentation
- [ ] WCAG AA/AAA checklist with real hex contrast verification
- [ ] Motion system: fade-up entries (staggered), hover 200ms, blob drift (10s cycle), Cohere-inspired fluidity
- [ ] Content/copy strategy: 10+ French text snippets (hero, sections, CTAs) in institutional register
- [ ] Built HTML mockups: landing hero page + dashboard ERM + simulateur comparison (before/after)

### Out of Scope

- Figma file generation — Claude cannot create .fig files; documentation follows Figma structure for manual transfer
- React/Vue component library — HTML/CSS showcase only; framework integration is a separate milestone
- Backend changes — purely design/frontend deliverables
- Minipilot or app refactoring — new design system is additive, not a rewrite of existing apps
- Brand logo redesign — working with existing "lite" + "Change" wordmark system
- User research or A/B testing — design decisions based on Cohere reference and institutional expertise

## Context

**Existing state:** The LiteChange repo contains 4 sub-projects (app/, minipilot/, simulateur-lite-ops/, roadmap/) sharing a common design token file. The current design is functional but described as "sympa mais pas mémorable" — it needs the confidence upgrade to match the institutional client base (Vyv, Air Liquide, CPAM, mutuelles).

**Design reference:** Cohere.com/fr — specifically: bold hero sections with gradient backgrounds, dark enterprise confidence, clean bold/serif typography mix, fluid animations. The goal is not to copy Cohere but to achieve the same level of "this company is serious and capable."

**Existing token investment:** 309-line CSS token file with comprehensive light/dark theming, already used in production. The fork-and-evolve strategy preserves this investment while upgrading.

**Sub-projects using tokens:**
- `app/` — Next.js 16 main platform (Tailwind 4 + custom tokens)
- `minipilot/app/` — React + Vite dashboard (own tokens.css copied from design-system)
- `simulateur-lite-ops/` — Simple simulator (Vercel-deployed)
- `roadmap/` — Internal planning tool

**Branding rule:** All projects branded "Lite Ops" (not "liteChange"). The "lite" in italic Source Serif 4 Light (300) with accent color is the wordmark signature.

## Constraints

- **Output format**: All deliverables as standalone HTML pages with inline CSS (no external deps except Google Fonts) — per CLAUDE.md architecture doc rules
- **Token backward compat**: Existing lc- tokens must still work during transition period
- **Accessibility**: WCAG AA minimum (4.5:1 text, 3:1 UI), AAA preferred for key elements
- **Performance**: No JS frameworks in showcase pages — pure HTML/CSS for instant load
- **Fonts**: Must use the existing Google Fonts URL from CLAUDE.md (DM Sans, Source Serif 4, IBM Plex Mono)
- **Green gradient exception**: Gradient fills with Lite Green allowed ONLY on landing hero/marketing sections. Dashboard/app surfaces maintain signal-only rule.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork tokens (lc- → liteops-) | Clean break for v2 identity while preserving structure | — Pending |
| Relax green-fill rule for landing | Hero sections need visual drama; Cohere uses bold gradients | — Pending |
| Full 60+ component scope | Complete vocabulary needed for both landing and app surfaces | — Pending |
| HTML/CSS showcase (no React) | Framework-agnostic, instant preview, follows CLAUDE.md arch doc format | — Pending |
| design-system/ as output dir | Extends existing location, single source of truth | — Pending |
| Style Dictionary JSON source | Industry standard, generates CSS/Tailwind/Figma tokens from one source | — Pending |

---
*Last updated: 2026-03-24 after initialization*
