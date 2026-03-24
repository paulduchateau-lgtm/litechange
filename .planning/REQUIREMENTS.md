# Requirements: LiteOps Design Identity v2

**Defined:** 2026-03-24
**Core Value:** Every screen must communicate institutional confidence and sovereign AI credibility

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Token Foundation

- [x] **TOKN-01**: DTCG-format JSON token source files with three tiers (raw palette, semantic, component)
- [x] **TOKN-02**: Style Dictionary 4 build pipeline generating CSS custom properties from JSON source
- [x] **TOKN-03**: Style Dictionary generates Tailwind CSS theme configuration from same JSON source
- [x] **TOKN-04**: Light/dark theme token switching preserved and extended with liteops- prefix
- [x] **TOKN-05**: Backward compatibility shim mapping lc- variables to liteops- equivalents
- [x] **TOKN-06**: Six-level elevation/shadow scale (Cohere-like depth from subtle to dramatic)
- [x] **TOKN-07**: Gradient token definitions for landing hero sections (green-to-olive, green-to-black)
- [x] **TOKN-08**: Motion token system (duration, easing curves, stagger delays as named tokens)
- [x] **TOKN-09**: JSON export format suitable for future Figma token import

### Atoms

- [x] **ATOM-01**: Button component family — primary, secondary, ghost, danger variants in sm/md/lg sizes with hover/focus/disabled states
- [x] **ATOM-02**: Badge/pill component — success, warning, error, info, accent variants with colored dot prefix
- [x] **ATOM-03**: Text input with label, placeholder, focus ring, error state, disabled state
- [x] **ATOM-04**: Select dropdown with custom styling matching input component
- [ ] **ATOM-05**: Textarea with auto-height behavior indication and character count pattern
- [ ] **ATOM-06**: Switch/toggle component with on/off states and label
- [ ] **ATOM-07**: Checkbox and radio button components with custom styling
- [ ] **ATOM-08**: Slider/range input for simulateur-style numeric controls
- [ ] **ATOM-09**: Glassmorphism panel component (frosted backdrop-filter with subtle border)
- [ ] **ATOM-10**: Skeleton loading states — rectangular, circular, and text-line variants
- [ ] **ATOM-11**: Typography showcase page displaying all 3 font families with sizes, weights, and use cases
- [ ] **ATOM-12**: Color palette documentation page with full scales, semantic mappings, and verified contrast ratios

### Molecules

- [ ] **MOLC-01**: KPI card component — numeric value (DM Sans bold), trend indicator (IBM Plex Mono), label, optional badge
- [ ] **MOLC-02**: Alert/notification component — success, warning, error, info with left border + tinted background
- [ ] **MOLC-03**: Form field group — label + input + helper text + error message as composed unit
- [ ] **MOLC-04**: Navigation item — icon + label with active/hover states for sidebar context
- [ ] **MOLC-05**: Breadcrumb navigation with separator and current-page indicator
- [ ] **MOLC-06**: Tab/pill navigation component with active state and content switching indication
- [ ] **MOLC-07**: Progress bar with threshold markers and percentage label
- [ ] **MOLC-08**: Toast notification with auto-dismiss indication and dismiss button
- [ ] **MOLC-09**: Chart color system documentation — 6-color ordered sequence per theme, contrast-verified

### Organisms

- [ ] **ORGN-01**: Sidebar navigation — dark background, lifecycle-phase groups, IBM Plex Mono group labels, role-based filtering documentation
- [ ] **ORGN-02**: Data table — sortable column headers (IBM Plex Mono uppercase), numeric right-alignment, zebra rows, row hover, overflow wrapper
- [ ] **ORGN-03**: Modal/dialog — overlay backdrop, centered content, close button, action bar
- [ ] **ORGN-04**: Topbar navigation — logo, breadcrumb area, user menu, theme toggle
- [ ] **ORGN-05**: Hero section with gradient background (green-to-olive), bold Source Serif 4 heading, CTA buttons, enterprise imagery area
- [ ] **ORGN-06**: Agent card component — agent name, status indicator, log preview, action buttons
- [ ] **ORGN-07**: Pipeline visualization — connected node diagram showing workflow steps with status colors
- [ ] **ORGN-08**: Responsive card grid layout — 1 to 4 columns with proper gap scaling
- [ ] **ORGN-09**: Content section pattern — heading, body text, optional CTA, optional illustration area (for landing pages)
- [ ] **ORGN-10**: Dropdown/multi-select component with search filtering and tag display

### Pages & Documentation

- [ ] **PAGE-01**: Component showcase — master page with all atoms, molecules, organisms displayed with code snippets
- [ ] **PAGE-02**: Spacing and sizing scale visualization with 4px grid stops
- [ ] **PAGE-03**: WCAG AA/AAA accessibility checklist with verified contrast ratios for all color combinations
- [ ] **PAGE-04**: Landing page mockup — full Cohere-style page with hero, security section, product showcase, testimonials, CTA
- [ ] **PAGE-05**: Dashboard page mockup — KPI cards, data table, sidebar, topbar, charts area
- [ ] **PAGE-06**: Before/after comparison page — simulateur-lite-ops current vs upgraded design side by side

### Content & Voice

- [ ] **COPY-01**: Naming convention documentation — BEM-like CSS classes, kebab-case components, semantic token names, Figma-ready atom/molecule/organism structure
- [ ] **COPY-02**: 10+ French institutional copy snippets for hero, sections, CTAs in Cohere-inspired register

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### React Component Library

- **REACT-01**: React/TypeScript wrapper components consuming CSS design system
- **REACT-02**: Storybook or Ladle documentation for React components
- **REACT-03**: npm package for cross-project consumption

### Advanced Data Visualization

- **DATAVIZ-01**: Risk heatmap component (color-mapped organizational friction grid)
- **DATAVIZ-02**: Chart components (bar/line/pie) with consistent token-based styling
- **DATAVIZ-03**: Sparkline inline charts for KPI trends

### Migration

- **MIGR-01**: Automated migration script (lc- to liteops- in existing app files)
- **MIGR-02**: Minipilot tokens.css replacement with new system
- **MIGR-03**: App globals.css migration to new token imports

## Out of Scope

| Feature | Reason |
|---------|--------|
| Figma .fig file generation | Claude cannot create native Figma files; documentation follows Figma-ready naming |
| JavaScript interactions in showcase | Constraint: standalone HTML/CSS only per CLAUDE.md architecture doc rules |
| Icon library design | Separate discipline; document icon tokens (size/color) only |
| CSS-in-JS / runtime tokens | Framework-coupled, adds overhead; CSS custom properties are zero-runtime |
| Dark mode auto-detection | Explicit data-theme toggle preferred for institutional demo consistency |
| Responsive breakpoint system | Tailwind v4 handles natively; document recommendations only |
| Logo redesign | Working with existing "lite" + "Change" wordmark; token-based variants only |
| Mobile app design | Web-first; native patterns are a separate project |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKN-01 | Phase 1 | Complete |
| TOKN-02 | Phase 1 | Complete |
| TOKN-03 | Phase 1 | Complete |
| TOKN-04 | Phase 1 | Complete |
| TOKN-05 | Phase 1 | Complete |
| TOKN-06 | Phase 1 | Complete |
| TOKN-07 | Phase 1 | Complete |
| TOKN-08 | Phase 1 | Complete |
| TOKN-09 | Phase 1 | Complete |
| ATOM-01 | Phase 2 | Complete |
| ATOM-02 | Phase 2 | Complete |
| ATOM-03 | Phase 2 | Complete |
| ATOM-04 | Phase 2 | Complete |
| ATOM-05 | Phase 2 | Pending |
| ATOM-06 | Phase 2 | Pending |
| ATOM-07 | Phase 2 | Pending |
| ATOM-08 | Phase 2 | Pending |
| ATOM-09 | Phase 2 | Pending |
| ATOM-10 | Phase 2 | Pending |
| ATOM-11 | Phase 2 | Pending |
| ATOM-12 | Phase 2 | Pending |
| MOLC-01 | Phase 2 | Pending |
| MOLC-02 | Phase 2 | Pending |
| MOLC-03 | Phase 2 | Pending |
| MOLC-04 | Phase 2 | Pending |
| MOLC-05 | Phase 2 | Pending |
| MOLC-06 | Phase 2 | Pending |
| MOLC-07 | Phase 2 | Pending |
| MOLC-08 | Phase 2 | Pending |
| MOLC-09 | Phase 2 | Pending |
| ORGN-01 | Phase 3 | Pending |
| ORGN-02 | Phase 3 | Pending |
| ORGN-03 | Phase 3 | Pending |
| ORGN-04 | Phase 3 | Pending |
| ORGN-05 | Phase 3 | Pending |
| ORGN-06 | Phase 3 | Pending |
| ORGN-07 | Phase 3 | Pending |
| ORGN-08 | Phase 3 | Pending |
| ORGN-09 | Phase 3 | Pending |
| ORGN-10 | Phase 3 | Pending |
| PAGE-01 | Phase 4 | Pending |
| PAGE-02 | Phase 4 | Pending |
| PAGE-03 | Phase 4 | Pending |
| PAGE-04 | Phase 4 | Pending |
| PAGE-05 | Phase 4 | Pending |
| PAGE-06 | Phase 4 | Pending |
| COPY-01 | Phase 4 | Pending |
| COPY-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
