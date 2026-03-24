# Architecture Patterns

**Domain:** Enterprise design system (60+ components, dual-theme, HTML/CSS showcase)
**Researched:** 2026-03-24

## Recommended Architecture

### The Four-Layer Stack

The Lite Ops design system should follow a strict four-layer dependency chain. Each layer depends only on the layer directly below it. No layer may skip levels.

```
Layer 4: PAGES (showcase HTML files)
  |  consumes patterns + components + tokens
Layer 3: PATTERNS (composed UI regions)
  |  consumes components + tokens
Layer 2: COMPONENTS (individual UI elements)
  |  consumes tokens only
Layer 1: TOKENS (design decisions as CSS custom properties)
  |  raw values, no visual output
```

This maps to the Atomic Design hierarchy but uses pragmatic names: tokens = design decisions, components = atoms + molecules, patterns = organisms, pages = templates + pages.

### Component Boundaries

| Layer | Directory | Responsibility | Depends On |
|-------|-----------|---------------|------------|
| **Tokens** | `design-system/tokens/` | Raw palette, semantic mappings, component-level token overrides. JSON source (Style Dictionary) generating CSS + Tailwind config. | Nothing |
| **Components** | `design-system/components/` | Individual UI elements: button, badge, input, card, alert, table row. Each is a self-contained CSS class + HTML snippet. | Tokens only |
| **Patterns** | `design-system/patterns/` | Composed regions: sidebar nav, KPI dashboard row, form section, hero section, COMEX summary card. Combines multiple components. | Tokens + Components |
| **Pages** | `design-system/pages/` | Full standalone HTML showcase pages: landing hero, dashboard, simulateur, form gallery. Each page is a complete HTML document. | All layers |

### Data Flow: How Tokens Flow to Components to Pages

```
tokens/raw/color.json          -- Raw: { "olive-900": "#1C1D1A" }
  |
  v  (Style Dictionary build)
tokens/semantic/surface.json   -- Semantic: { "surface-primary": "{color.paper-100}" }
  |
  v  (Style Dictionary build)
tokens/component/button.json   -- Component: { "button-bg": "{interactive-primary}" }
  |
  v  (CSS output)
tokens/liteops-tokens.css      -- All three tiers as CSS custom properties
  |
  +---> components/button.css  -- .liteops-Button--primary { background: var(--liteops-button-bg); }
  |         |
  |         v
  +---> patterns/sidebar.css   -- .liteops-Sidebar { ... uses Button + NavItem components }
  |         |
  |         v
  +---> pages/dashboard.html   -- Full page, imports tokens.css, references component classes
```

**Theme switching** happens at a single point: the `[data-theme]` attribute on `<html>`. Semantic tokens remap to different raw values. Components and patterns never contain theme logic -- they consume semantic tokens that automatically adapt.

```html
<!-- Light theme (landing, editorial) -->
<html data-theme="light">

<!-- Dark theme (dashboards, monitoring) -->
<html data-theme="dark">

<!-- Hybrid: dark sidebar + light content (app shell) -->
<html data-theme="light">
  <aside data-theme="dark" class="liteops-Sidebar">...</aside>
  <main>...</main>
</html>
```

The hybrid approach (dark sidebar within light page) works because CSS custom properties are inherited through the DOM. Setting `data-theme="dark"` on the sidebar element causes all descendant tokens to resolve to dark values while the rest of the page stays light. This is already established in the existing token system.

## Token Architecture: Three-Tier Detail

### Tier 1: Raw/Primitive Tokens

Context-agnostic values. The full palette, type scale, spacing scale, shadow scale.

```
Naming: --liteops-color-olive-900, --liteops-space-16, --liteops-radius-md
Source: tokens/raw/*.json
```

These never appear in component CSS directly. They exist as the single source of truth for all design values.

**Current state:** The existing `litechange-tokens.css` already has a solid Tier 1 (raw palette section with `--lc-color-*` variables). The fork to `--liteops-*` prefix preserves this structure.

### Tier 2: Semantic Tokens

Intent-based aliases. Surface, text, border, accent, status, interactive, chart categories.

```
Naming: --liteops-surface-primary, --liteops-text-secondary, --liteops-status-error
Source: tokens/semantic/*.json
Maps to: Tier 1 values, swapped per theme
```

These are what components consume. A component says "I need the primary surface color" without knowing whether that resolves to paper-100 (light) or olive-900 (dark).

**Current state:** Already well-implemented in the existing tokens file (surface, text, border, accent, status, interactive, chart, shadow groups). This is the strongest part of the current architecture.

### Tier 3: Component Tokens

Per-component overrides for fine-grained control. Optional -- only needed when a component's token mapping diverges from the semantic defaults.

```
Naming: --liteops-button-bg, --liteops-badge-dot-size, --liteops-sidebar-width
Source: tokens/component/*.json
Maps to: Tier 2 values (with occasional Tier 1 for exceptions)
```

**Current state:** Not yet implemented. The existing system jumps from semantic tokens directly to hardcoded values in component CSS. Adding component tokens is the key architectural upgrade.

**When to create a component token:**
- When a component needs a value that does not map cleanly to an existing semantic token
- When a component has multiple variants that share structure but differ in specific values
- When a component's value needs to be overridden per-context (e.g., sidebar button vs content button)

**When NOT to create a component token:**
- When `var(--liteops-surface-secondary)` already expresses the intent perfectly
- For one-off values that will never be reused (use semantic tokens directly)

## File Organization

### Recommended Directory Structure

```
design-system/
  tokens/
    raw/
      color.json              # Full palette (olive, paper, lite, signal, warm, success, warning)
      typography.json          # Font families, sizes, weights, line heights, letter spacing
      spacing.json             # 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
      elevation.json           # Shadows (sm, md, lg, xl) + dark variants
      radius.json              # Border radii (sm, md, lg, xl, full)
      motion.json              # Durations, easings, keyframe definitions
    semantic/
      surface.json             # Surface tokens (primary, secondary, tertiary, elevated, sunken, overlay)
      text.json                # Text hierarchy (primary, secondary, tertiary, disabled, inverse, on-accent)
      border.json              # Border tokens (primary, secondary, focus, error)
      accent.json              # Accent tokens (primary, hover, secondary, subtle, text)
      status.json              # Status colors (success, warning, error, info) + bg variants
      interactive.json         # Button/control colors (primary, secondary, ghost)
      chart.json               # Chart palette (primary through quaternary, grid, axis)
    component/
      button.json              # Button-specific overrides
      badge.json               # Badge-specific overrides
      sidebar.json             # Sidebar-specific overrides
      kpi-card.json            # KPI card-specific overrides
    liteops-tokens.css         # GENERATED -- full CSS output (do not edit manually)
    litechange-tokens.css      # LEGACY -- backward compat shim mapping lc-* to liteops-*
    tailwind.config.js         # Tailwind theme extension (generated or manually maintained)
    style-dictionary.config.js # Build configuration

  components/
    atoms/
      button/
        button.css             # CSS classes: .liteops-Button, .liteops-Button--primary, etc.
        button.html            # HTML snippet for showcase embedding
        button.md              # Usage notes, variants, accessibility
      badge/
        badge.css
        badge.html
        badge.md
      input/
      select/
      switch/
      slider/
      icon/
      avatar/
      tag/
      tooltip/
      divider/
      spinner/
      skeleton/
      progress-bar/
      logo/

    molecules/
      kpi-card/
        kpi-card.css
        kpi-card.html
        kpi-card.md
      form-field/               # Label + input + error message
      search-bar/               # Input + icon + clear button
      nav-item/                 # Icon + label + active indicator
      alert/                    # Icon + text + optional action
      toast/                    # Alert variant with auto-dismiss
      breadcrumb/
      tab-group/
      dropdown-menu/
      stat-card/                # Simpler than KPI (just value + label)
      table-row/                # Styled row with hover, selection states
      modal-header/             # Title + close button
      chart-legend/

    organisms/
      sidebar/
        sidebar.css
        sidebar.html
        sidebar.md
      data-table/               # Full table with header, rows, sorting, pagination
      form-section/             # Multiple form fields grouped with heading
      hero-section/             # Landing page hero (gradient fills allowed)
      card-grid/                # Responsive 1-4 column grid of cards
      kpi-dashboard-row/        # Row of KPI cards with consistent spacing
      modal/                    # Full modal with header, body, footer
      topbar/
      footer/
      chart-container/          # Chart wrapper with title, legend, axis labels
      agent-panel/              # AI agent interaction panel
      pipeline-visualization/   # Step-by-step process flow
      risk-heatmap/             # Matrix visualization for risk assessment
      comex-summary/            # Executive summary card

  patterns/
    layout/
      app-shell.css             # Sidebar + topbar + content area
      landing-shell.css         # Full-width + nav + footer
      content-section.css       # Max-width prose container
      split-panel.css           # Two-column layout
    composition/
      dashboard-page.css        # KPI row + charts + table composition
      form-page.css             # Form sections + submit actions
      detail-page.css           # Header + tabs + content

  pages/
    showcase/
      index.html                # Master index linking to all showcase pages
      tokens.html               # Color swatches, type scale, spacing, shadows
      buttons.html              # All button variants, sizes, states
      forms.html                # Input, select, switch, slider, form fields
      cards.html                # KPI cards, stat cards, content cards
      tables.html               # Data tables with sorting, pagination
      navigation.html           # Sidebar, topbar, breadcrumbs, tabs
      feedback.html             # Alerts, toasts, modals, skeletons
      charts.html               # Chart containers, legends, heatmaps
      data-viz.html             # KPI rows, progress bars, badges
    mockups/
      landing-hero.html         # Full landing page mockup
      dashboard-erm.html        # ERM dashboard mockup
      simulateur.html           # Simulateur comparison mockup

  docs/
    DESIGN-SYSTEM.md            # Full reference (existing, to be updated)
    CHANGELOG.md                # Version history of token/component changes
    MIGRATION.md                # lc-* to liteops-* migration guide
```

### Why This Structure

**atoms/molecules/organisms** -- Brad Frost's Atomic Design provides a shared vocabulary that maps well to complexity tiers. Each atom is usable alone; molecules combine 2-3 atoms; organisms are full interface regions.

**Each component gets a folder** with `.css`, `.html`, `.md` -- because the showcase pages need to embed HTML snippets, and each component needs its own usage documentation. The CSS file is importable independently for tree-shaking by consuming apps.

**Patterns are separate from organisms** -- patterns describe layout composition (how organisms arrange on a page), not individual UI elements. An organism like "data-table" is reusable anywhere; a pattern like "dashboard-page" describes how data-table + KPI-row + chart compose into a specific page type.

**Pages are the showcase** -- each page is a standalone HTML file per CLAUDE.md conventions (inline CSS except for token imports, no JS frameworks, Google Fonts only).

## CSS Architecture: Hybrid BEM + Utility Tokens

### Recommendation: BEM for Components, Utility Tokens for Composition

Use BEM naming for component CSS classes. Use CSS custom properties (tokens) for all values. Use Tailwind utilities sparingly in showcase pages for layout convenience, but component CSS must be framework-agnostic.

```css
/* Component CSS (BEM naming, token values) */
.liteops-Button {
  font-family: var(--liteops-font-body);
  font-weight: 500;
  border-radius: var(--liteops-radius-md);
  transition: all var(--liteops-duration-normal) ease;
  cursor: pointer;
}

.liteops-Button--primary {
  background: var(--liteops-interactive-primary);
  color: var(--liteops-interactive-primary-text);
  border: none;
}

.liteops-Button--primary:hover {
  background: var(--liteops-interactive-primary-hover);
}

.liteops-Button--sm {
  padding: 6px 16px;
  font-size: 13px;
}

.liteops-Button--md {
  padding: 10px 24px;
  font-size: 15px;
}
```

### Naming Convention

```
Block:    .liteops-ComponentName        (PascalCase, prefixed)
Element:  .liteops-ComponentName__part  (double underscore)
Modifier: .liteops-ComponentName--mod   (double dash)
Size:     .liteops-ComponentName--sm/md/lg
State:    .liteops-ComponentName.is-active, .is-disabled
```

**Why `liteops-` prefix:** Prevents collisions when components are imported into apps that have their own CSS. The prefix also makes it immediately clear which classes belong to the design system.

**Why BEM over pure utility-first:** The showcase pages are standalone HTML -- they need readable, self-documenting class names. BEM classes like `.liteops-Button--primary--md` are immediately understandable. Pure utility strings like `bg-lite-700 text-white px-6 py-2.5 rounded-md font-medium` are not.

**Why not pure BEM:** Tailwind utilities remain available in consuming apps (Next.js, Vite) for rapid layout composition. The design system tokens feed both the BEM component CSS and the Tailwind config. Both paths draw from the same source of truth.

### CSS File Concatenation for Showcase Pages

Showcase pages are standalone HTML and cannot use CSS `@import` chains (per CLAUDE.md: "inline CSS, no external dependencies except Google Fonts"). Two approaches:

**Approach A (recommended): Inline component CSS in each showcase page.**
Each page includes the token CSS + only the component CSS it needs, inlined in a `<style>` block. This keeps pages self-contained and fast.

**Approach B: Build step concatenation.**
A simple build script (`cat tokens.css components/button/button.css components/badge/badge.css > bundle.css`) produces a single CSS file. But this adds build tooling to what should be a zero-dependency showcase.

Recommendation: Approach A for showcase pages. Consuming apps (Next.js, Vite) use normal CSS imports.

## Patterns to Follow

### Pattern 1: Semantic Token Indirection

**What:** Components never reference raw palette values. Always go through semantic tokens.

**When:** Every component, always.

**Example:**
```css
/* CORRECT */
.liteops-Card {
  background: var(--liteops-surface-secondary);
  border: 1px solid var(--liteops-border-primary);
  color: var(--liteops-text-primary);
}

/* WRONG -- breaks theming */
.liteops-Card {
  background: #FFFFFF;
  border: 1px solid #E0DDD6;
  color: #1C1D1A;
}
```

### Pattern 2: Data-Theme Scoping for Hybrid Layouts

**What:** Use `data-theme` attribute on any DOM element to create a theme boundary. CSS custom properties cascade naturally through the DOM.

**When:** App shell with dark sidebar + light content. Or dark modal overlays on light pages.

**Example:**
```html
<html data-theme="light">
  <body>
    <aside data-theme="dark" class="liteops-Sidebar">
      <!-- All tokens resolve to dark values inside here -->
      <button class="liteops-Button--primary">Action</button>
    </aside>
    <main>
      <!-- All tokens resolve to light values here -->
      <button class="liteops-Button--primary">Action</button>
    </main>
  </body>
</html>
```

Both buttons use the same CSS class but render with different colors because their ancestor `data-theme` differs.

### Pattern 3: Component HTML Snippets as Embeddable Fragments

**What:** Each component's `.html` file contains a standalone fragment (no `<html>`, `<head>`, `<body>`). Showcase pages include these fragments.

**When:** Building showcase pages.

**Example:**
```html
<!-- components/atoms/button/button.html -->
<div class="liteops-Showcase__section">
  <h3 class="liteops-Showcase__heading">Primary Buttons</h3>
  <div class="liteops-Showcase__row">
    <button class="liteops-Button liteops-Button--primary liteops-Button--sm">Small</button>
    <button class="liteops-Button liteops-Button--primary liteops-Button--md">Medium</button>
    <button class="liteops-Button liteops-Button--primary liteops-Button--lg">Large</button>
  </div>
</div>
```

### Pattern 4: IBM Plex Mono for All Data Labels

**What:** Every numeric value, badge text, group heading, and chart label uses IBM Plex Mono with uppercase and letter-spacing 0.1em.

**When:** Any text that represents data, categories, or metadata.

**Example:**
```css
.liteops-DataLabel {
  font-family: var(--liteops-font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--liteops-text-tertiary);
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Colors in Component CSS

**What:** Using hex values or rgb() directly in component stylesheets.

**Why bad:** Breaks theming. Components look correct in one theme but wrong in the other. Every hardcoded value is a theming bug waiting to happen.

**Instead:** Always reference `var(--liteops-*)` tokens. If no semantic token fits, create one -- do not hardcode.

### Anti-Pattern 2: Deep Component Nesting

**What:** Building organisms that directly contain atoms, skipping the molecule layer.

**Why bad:** Creates tightly coupled organisms that are hard to recompose. If the sidebar directly defines its own button styles instead of using `.liteops-Button`, you end up maintaining two button implementations.

**Instead:** Organisms compose molecules and atoms. The sidebar uses `.liteops-NavItem` molecules which use `.liteops-Button` atoms. Each layer is independently testable in the showcase.

### Anti-Pattern 3: Theme Logic in Components

**What:** Using `[data-theme="dark"]` selectors inside component CSS files.

**Why bad:** Duplicates theme logic that belongs in the token layer. If 60 components each have their own `[data-theme="dark"]` overrides, changing the dark palette requires editing 60 files.

**Instead:** All theme switching happens in the token CSS file via `[data-theme]` selectors on semantic tokens. Components consume semantic tokens and never know which theme is active.

### Anti-Pattern 4: JavaScript-Dependent Showcase Pages

**What:** Requiring JS to render component examples in showcase pages.

**Why bad:** Violates CLAUDE.md constraint ("no JS frameworks in showcase pages -- pure HTML/CSS for instant load"). Also makes pages harder to audit, print, and share.

**Instead:** Static HTML with inline CSS. Theme toggle can use a minimal `<script>` (under 10 lines) that flips the `data-theme` attribute, but all content must render without JS.

### Anti-Pattern 5: Tailwind-Only Component Definitions

**What:** Defining components exclusively through Tailwind utility classes with no BEM class names.

**Why bad:** Components become unportable. If a consuming app does not use Tailwind (or uses a different version), the components break. The long utility strings are also unreadable in static HTML showcase pages.

**Instead:** BEM classes as the primary interface. Tailwind as a convenience layer in apps that support it. Both derive values from the same tokens.

## Scalability Considerations

| Concern | At 20 components | At 60 components | At 150+ components |
|---------|-------------------|-------------------|---------------------|
| **File discovery** | Flat list works | Atom/molecule/organism grouping required | Category sub-grouping (forms/, data/, nav/) within each tier |
| **CSS bundle size** | Single file fine | Per-component CSS files, concatenated per page | Tree-shakeable imports, CSS layers for specificity control |
| **Token count** | ~80 tokens | ~150 tokens (add component tier) | ~300+ tokens, need namespacing and documentation |
| **Showcase pages** | One big page | Category pages (forms, nav, data, feedback) | Category pages + search/filter + cross-linking |
| **Theme testing** | Manual toggle | Side-by-side light/dark in showcase | Automated visual regression testing |
| **Build time** | None (manual CSS) | Style Dictionary builds in <1s | Watch mode + incremental builds |

## Suggested Build Order (Dependencies)

This ordering reflects strict dependencies -- each phase requires the previous phase to be complete.

### Phase 1: Token Foundation
Build the three-tier token architecture (raw, semantic, component) with Style Dictionary. Output: `liteops-tokens.css` + updated `tailwind.config.js`. This unblocks everything else.

**Must complete before:** Any component work.

### Phase 2: Atoms (Core Primitives)
Button, badge, input, select, switch, icon, avatar, tag, divider, spinner, skeleton, progress bar, logo. These are the building blocks.

**Must complete before:** Molecules. Atoms are consumed by every higher layer.

### Phase 3: Molecules (Simple Compositions)
KPI card, form field, search bar, nav item, alert, toast, breadcrumb, tab group, dropdown menu, stat card, table row, modal header, chart legend.

**Must complete before:** Organisms that compose them.

### Phase 4: Organisms (Complex Regions)
Sidebar, data table, form section, hero section, card grid, KPI dashboard row, modal, topbar, footer, chart container, agent panel, pipeline visualization, risk heatmap, COMEX summary.

**Must complete before:** Full page mockups.

### Phase 5: Patterns + Showcase Pages
Layout patterns (app shell, landing shell, content section). Showcase pages for every component category. Full mockup pages (landing, dashboard, simulateur).

**Depends on:** All component layers.

### Phase 6: Migration + Documentation
Migration guide (lc-* to liteops-*), backward compatibility shim, updated DESIGN-SYSTEM.md, accessibility audit, contrast verification.

**Can partially overlap with:** Phases 3-5.

## Sources

- [Atomic Design Methodology - Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/) -- canonical reference for atoms/molecules/organisms hierarchy
- [CSS Architecture: From BEM to Tailwind to Tokens](https://www.superflex.ai/blog/css-architecture) -- hybrid BEM + tokens approach
- [Design Token Architecture - Oboe](https://oboe.com/learn/advanced-design-engineering-and-systems-architecture-2hulw5/design-token-architecture-0) -- three-tier token architecture (raw, semantic, component)
- [Style Dictionary Documentation](https://styledictionary.com/info/tokens/) -- JSON token structure and CSS output
- [The Many Faces of Themeable Design Systems - Brad Frost](https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/) -- theme switching patterns
- [CSS Cascade Layers vs BEM vs Utility Classes - Smashing Magazine](https://www.smashingmagazine.com/2025/06/css-cascade-layers-bem-utility-classes-specificity-control/) -- specificity management
- [Beyond Light/Dark Mode: Dynamic Themes with CSS Custom Properties](https://dev.to/code_2/beyond-lightdark-mode-implementing-dynamic-themes-with-css-custom-properties-ik2) -- data-theme switching
- [Pattern Lab](https://patternlab.io/) -- static site pattern library reference (framework-agnostic showcase)
- [The Future of Enterprise Design Systems 2026 - Supernova.io](https://www.supernova.io/blog/the-future-of-enterprise-design-systems-2026-trends-and-tools-for-success) -- DTCG standards, multi-brand orchestration
- [Design Tokens: The Complete Technical Guide - Product Rocket](https://productrocket.ro/articles/design-tokens-guide/) -- three-tier implementation details
