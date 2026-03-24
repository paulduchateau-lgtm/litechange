# Feature Landscape

**Domain:** Enterprise design system (60+ components, tokens, showcase)
**Researched:** 2026-03-24

## Table Stakes

Features users (developers, designers, COMEX stakeholders) expect. Missing = design system feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Design token JSON source files | Single source of truth for all visual properties | Medium | DTCG format, generates CSS + Tailwind + JSON |
| Light/dark theme switching | Already exists in production; must preserve | Low | Extend current lc- tokens to liteops- with compat shim |
| Button component (3 variants x 3 sizes) | Most basic interactive element | Low | Primary, secondary, ghost. sm/md/lg. |
| Badge/pill component (5 variants) | Status indicators used everywhere in dashboards | Low | success, warning, error, info, accent with dot |
| KPI card component | Core dashboard element, already in use | Medium | Value + trend + label + badge composition |
| Form inputs (text, select, textarea) | Any app needs forms | Medium | Focus states, error states, disabled states |
| Alert/notification (4 variants) | Feedback patterns for success/warning/error/info | Low | Left border + tinted bg pattern (already defined) |
| Data table with sort headers | Dashboard core element | Medium | Mono header, numeric alignment, row hover |
| Sidebar navigation | Already exists, needs systematic documentation | Medium | Dark-always, grouped by lifecycle phase |
| Typography scale showcase | Developers need to see all sizes/weights in context | Low | Display all 3 font families with use cases |
| Color palette documentation | Reference for every color with hex/contrast ratios | Low | Show full scales + semantic mappings |
| Spacing/sizing scale | 4px grid visualization | Low | Visual ruler with all stops |
| Accessibility compliance | WCAG AA minimum, institutional requirement | Medium | Contrast ratios verified, focus states, reduced motion |
| Backward compatibility shim (lc- to liteops-) | Existing apps must not break | Low | CSS file mapping old vars to new |

## Differentiators

Features that elevate from "functional design system" to "Cohere-level enterprise identity."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Gradient hero sections (landing) | Visual drama that communicates "serious AI company" | Medium | CSS @property animated gradients, Lite Green to deep olive. Landing pages only -- never dashboards. |
| Elevation/shadow scale (Cohere-like depth) | Layered UI with subtle depth hierarchy | Low | Extend current 4-level shadow to 6 levels with blur + spread tuning |
| Motion token system | Codified animation language, not ad-hoc | Medium | Duration, easing, stagger delay as tokens. Blob drift (10s), fade-up stagger. |
| Agent/pipeline visualization patterns | Unique to AI observability domain | High | Connected node diagrams, pipeline step cards, status flow |
| Risk heatmap component | Change management differentiator | High | Color-mapped grid for organizational friction visualization |
| Glassmorphism panels | Modern elevated panels with frosted backdrop | Low | backdrop-filter: blur() with subtle borders |
| Skeleton/loading states | Polish indicator, prevents layout shift | Low | Animated placeholder shapes matching each component |
| Chart color system | Systematic data visualization palette | Medium | 6-color ordered sequence per theme, contrast-verified |
| French institutional copy snippets | Ready-to-use text that sounds right | Low | 10+ hero/section/CTA texts in institutional register |
| Before/after mockups | Demonstrates upgrade value to stakeholders | High | Full-page HTML mockups comparing old vs new identity |

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| React component library | Out of scope per PROJECT.md. Framework integration is a separate milestone. | Build HTML/CSS showcase. React wrapping comes later. |
| Figma file generation | Claude cannot create .fig files. | Document in Figma-compatible structure (atoms/molecules/organisms) for manual transfer. |
| JavaScript interactions | Showcase pages must be zero-JS per project constraints. | Use CSS-only interactions (:hover, :focus-visible, :checked, details/summary). |
| CSS-in-JS tokens | Adds runtime overhead, couples to framework. | CSS custom properties are framework-agnostic and zero-runtime. |
| Dark mode auto-detection | Keep explicit data-theme toggle. Auto-detection causes inconsistency in institutional demos. | Document data-theme="dark" / data-theme="light" switching. |
| Icon library creation | Icon design is a separate discipline. | Document icon size/color tokens. Reference existing icon usage. |
| Responsive breakpoint system | Tailwind v4 handles this natively. Duplicating in showcase is wasted effort. | Document recommended breakpoints, let Tailwind handle implementation. |

## Feature Dependencies

```
DTCG JSON tokens --> Style Dictionary build --> CSS custom properties
                                            --> Tailwind @theme CSS
                                            --> JSON export

CSS custom properties --> All showcase components (consume tokens)
                      --> Backward compat shim (lc- mapping)

Typography tokens --> Typography showcase page
Color tokens --> Color palette showcase page
                --> All components (consume colors)

Button component --> Form components (submit buttons)
Badge component --> KPI card (contains badges)
                 --> Table rows (status badges)

Alert component --> Form validation (error alerts)
Sidebar nav --> Dashboard template layouts
Hero section --> Landing template layouts

Skeleton states --> (depends on each component it mimics)
Before/after mockups --> (depends on ALL components being built)
```

## MVP Recommendation

Prioritize in this order:

1. **Token pipeline** (DTCG JSON + Style Dictionary build + CSS output + compat shim) -- foundation for everything else
2. **Core atoms** (buttons, badges, inputs, labels, alerts) -- building blocks
3. **Typography + color + spacing showcases** -- developer reference
4. **Dashboard molecules** (KPI cards, data tables, sidebar nav) -- most-used in production
5. **Landing organisms** (hero section with gradient, CTA patterns) -- Cohere-level visual impact
6. **Motion system** (fade-up, blob drift, gradient animation tokens) -- the "memorable" layer
7. **Full template mockups** (dashboard page, landing page, before/after) -- proof of the whole system

Defer:
- **Risk heatmap**: High complexity, domain-specific. Build as a separate component sprint after core system is stable.
- **Agent/pipeline visualization**: High complexity, needs real data shape understanding. Phase 2.
- **Before/after mockups**: Depends on all other components existing. Must be last.

## Sources

- PROJECT.md requirements analysis
- CLAUDE.md component patterns and constraints
- [Cohere.com design reference](https://cohere.com/fr) -- visual benchmark
- [Component Gallery](https://component.gallery/design-systems/) -- industry component inventory comparison
