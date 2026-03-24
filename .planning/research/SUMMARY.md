# Research Summary: Lite Ops Design System Architecture

**Domain:** Enterprise design system (60+ components, dual-theme, HTML/CSS showcase)
**Researched:** 2026-03-24
**Overall confidence:** HIGH

## Executive Summary

Enterprise design systems in 2026 converge on a three-tier token architecture: raw primitives (palette values), semantic tokens (intent-based aliases), and component tokens (per-element overrides). The existing Lite Ops token file already implements tiers 1 and 2 well -- the key architectural upgrade is adding tier 3 (component tokens) and migrating to a Style Dictionary JSON source that generates CSS, Tailwind config, and future Figma exports from a single source of truth.

For 60+ components, the Atomic Design hierarchy (atoms, molecules, organisms) remains the industry standard for file organization. Each component gets its own folder with CSS, HTML snippet, and documentation. The critical insight is that components must never contain theme logic -- all theme switching happens at the token layer via `[data-theme]` selectors. Components consume semantic tokens and automatically adapt.

CSS architecture should be hybrid: BEM-named classes for component definitions (`.liteops-Button--primary--md`), CSS custom properties for all values, and Tailwind utilities available in consuming apps for layout composition. Showcase pages use BEM classes exclusively since they must be standalone HTML per CLAUDE.md conventions.

The existing `litechange-tokens.css` (309 lines) is a strong foundation. The semantic token layer (surface, text, border, accent, status, interactive, chart) is already well-structured with proper light/dark switching. The fork to `liteops-*` prefix and addition of component-level tokens is additive, not a rewrite.

## Key Findings

**Stack:** Style Dictionary 4 for token build pipeline, generating CSS custom properties + Tailwind config from JSON source files. BEM naming for components, HTML/CSS showcase pages.

**Architecture:** Four-layer dependency chain: Tokens -> Components (atoms/molecules) -> Patterns (organisms/layouts) -> Pages (showcase). Theme switching via `data-theme` attribute at token layer only, with DOM-scoped inheritance for hybrid layouts (dark sidebar in light page).

**Critical pitfall:** Hardcoded colors in component CSS. If even one component uses a hex value instead of a token reference, it will break in the opposite theme. This must be enforced from day one.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Token Foundation** - Build three-tier JSON source with Style Dictionary, generate CSS + Tailwind
   - Addresses: Token fork (lc- to liteops-), gradient tokens, motion tokens, elevation scale
   - Avoids: Downstream components building on unstable token layer

2. **Atoms** - 15 foundational components (button, badge, input, select, switch, icon, etc.)
   - Addresses: Core building blocks needed by every higher layer
   - Avoids: Duplicated styles across molecules/organisms

3. **Molecules** - 13 composed elements (KPI card, form field, nav item, alert, etc.)
   - Addresses: Most common UI patterns
   - Avoids: Organisms that skip the composition layer

4. **Organisms** - 14 complex regions (sidebar, data table, hero section, modal, etc.)
   - Addresses: Full interface regions for both landing and dashboard
   - Avoids: Page-level code before component stability

5. **Pages + Patterns** - Showcase pages, layout patterns, full mockups
   - Addresses: Complete documentation and visual proof
   - Avoids: Premature page building before component layer stabilizes

6. **Migration + Polish** - Backward compat shim, accessibility audit, documentation update
   - Addresses: Smooth transition for existing apps
   - Avoids: Breaking existing minipilot/app during transition

**Phase ordering rationale:**
- Tokens must be first because every component depends on them
- Atoms before molecules because molecules compose atoms
- Organisms after molecules for the same compositional dependency
- Pages last because they consume all layers
- Migration can overlap with phases 3-5

**Research flags for phases:**
- Phase 1 (Tokens): Needs validation of Style Dictionary 4 DTCG format compatibility with Tailwind 4
- Phase 4 (Organisms): Chart containers and heatmaps may need phase-specific research on CSS-only data visualization
- Phases 2-3: Standard patterns, unlikely to need additional research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Token architecture | HIGH | Three-tier model is industry standard, well-documented by multiple authoritative sources |
| File organization | HIGH | Atomic Design is the established pattern for 60+ component systems |
| CSS architecture | HIGH | BEM + tokens hybrid is widely validated for framework-agnostic design systems |
| Theme switching | HIGH | data-theme with CSS custom properties is the standard approach, already working in existing tokens |
| Style Dictionary | MEDIUM | Version 4 is current but DTCG format integration with Tailwind 4 needs validation |
| Showcase structure | MEDIUM | Pattern Lab-style approach is proven, but standalone HTML pages (per CLAUDE.md) is a less common path |

## Gaps to Address

- Style Dictionary 4 configuration specifics for Tailwind 4 output format (needs phase-specific research)
- CSS-only data visualization patterns for heatmaps and pipeline diagrams (organism-level research)
- Exact component token count -- how many of the 60+ components actually need tier 3 tokens vs semantic tokens alone
- DTCG standard compliance details for future Figma export compatibility
