# Roadmap: LiteOps Design Identity v2

## Overview

Transform the existing functional-but-unremarkable LiteOps design system into a Cohere-level enterprise design language. The build follows the natural dependency chain of design systems: token foundation first (everything depends on it), then atomic components, then composed organisms, then full pages and documentation that prove the system works end-to-end. All output is standalone HTML/CSS in `design-system/`.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Token Foundation** - DTCG JSON source, Style Dictionary pipeline, CSS/Tailwind output, elevation/gradient/motion tokens, backward compat shim
- [ ] **Phase 2: Atoms and Molecules** - All foundational components (buttons, inputs, badges, switches) and their compositions (KPI cards, alerts, form groups, nav items, tabs)
- [x] **Phase 3: Organisms** - Complex interface regions: sidebar, data table, modal, topbar, hero section, agent card, pipeline viz, card grid, content section, multi-select (completed 2026-03-24)
- [ ] **Phase 4: Pages and Documentation** - Showcase master page, mockups (landing, dashboard, simulateur before/after), accessibility checklist, spacing docs, naming conventions, French copy

## Phase Details

### Phase 1: Token Foundation
**Goal**: A complete design token system that generates CSS custom properties and Tailwind config from a single JSON source, with both themes working and backward compatibility preserved
**Depends on**: Nothing (first phase)
**Requirements**: TOKN-01, TOKN-02, TOKN-03, TOKN-04, TOKN-05, TOKN-06, TOKN-07, TOKN-08, TOKN-09
**Success Criteria** (what must be TRUE):
  1. Running the Style Dictionary build produces a CSS file with liteops- prefixed custom properties and a Tailwind config file, both from the same JSON source
  2. Switching `data-theme="light"` to `data-theme="dark"` on a test page changes all surface, text, and accent colors without touching any component CSS
  3. Existing apps using lc- prefixed tokens continue to render correctly via the backward compatibility shim
  4. Elevation, gradient, and motion tokens are available as named custom properties and visually demonstrable on a test page
  5. JSON source files follow DTCG format and are structured for future Figma token import
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — DTCG JSON source, Style Dictionary v5 pipeline, CSS/Tailwind/JSON output, backward compat shim
- [ ] 01-02-PLAN.md — 6-level elevation, gradient tokens, motion tokens, visual test page

### Phase 2: Atoms and Molecules
**Goal**: A complete library of 21 foundational and composed components, each built with liteops- tokens, working in both themes, showcased as standalone HTML
**Depends on**: Phase 1
**Requirements**: ATOM-01, ATOM-02, ATOM-03, ATOM-04, ATOM-05, ATOM-06, ATOM-07, ATOM-08, ATOM-09, ATOM-10, ATOM-11, ATOM-12, MOLC-01, MOLC-02, MOLC-03, MOLC-04, MOLC-05, MOLC-06, MOLC-07, MOLC-08, MOLC-09
**Success Criteria** (what must be TRUE):
  1. Every atom (button, badge, input, select, textarea, switch, checkbox/radio, slider, glass panel, skeleton) renders correctly in both light and dark themes without any hardcoded color values
  2. Typography and color palette documentation pages display all font families, weights, sizes, full color scales, and verified contrast ratios
  3. Every molecule (KPI card, alert, form group, nav item, breadcrumb, tab/pill, progress bar, toast, chart colors) composes atoms using only token references
  4. Each component has a standalone HTML page showing all variants, states (hover, focus, disabled, error), and sizes with visible code snippets
  5. Chart color system documentation shows the 6-color ordered sequence per theme with contrast verification
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Core interactive atoms: Button, Badge, Input, Select
- [ ] 02-02-PLAN.md — Form control atoms: Textarea, Switch, Checkbox/Radio, Slider
- [ ] 02-03-PLAN.md — Visual atoms + documentation: Glass Panel, Skeleton, Typography page, Color Palette page
- [ ] 02-04-PLAN.md — Core molecules: KPI Card, Alert, Form Group, Nav Item, Breadcrumb
- [ ] 02-05-PLAN.md — Remaining molecules: Tab/Pill, Progress Bar, Toast, Chart Colors documentation

### Phase 3: Organisms
**Goal**: All complex interface regions are built, proving the token and component layers compose into real app surfaces for both landing pages and dashboards
**Depends on**: Phase 2
**Requirements**: ORGN-01, ORGN-02, ORGN-03, ORGN-04, ORGN-05, ORGN-06, ORGN-07, ORGN-08, ORGN-09, ORGN-10
**Success Criteria** (what must be TRUE):
  1. Sidebar navigation renders with dark background, lifecycle-phase groups, IBM Plex Mono group labels, and visually documents role-based filtering
  2. Data table displays with sortable headers (IBM Plex Mono uppercase), right-aligned numeric columns (tabular-nums), zebra rows, and horizontal overflow handling
  3. Hero section renders with gradient background (green-to-olive), bold Source Serif 4 heading, and CTA buttons -- gradient rule applies only here, not in dashboard organisms
  4. Modal, topbar, agent card, pipeline visualization, card grid, content section, and multi-select dropdown all render correctly in their intended theme context
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — App chrome organisms: Sidebar navigation, Topbar
- [ ] 03-02-PLAN.md — Data interaction organisms: Data Table, Modal dialog
- [ ] 03-03-PLAN.md — Landing page organisms: Hero section, Content section, Card grid
- [ ] 03-04-PLAN.md — Domain and utility organisms: Agent card, Pipeline visualization, Multi-select dropdown

### Phase 4: Pages and Documentation
**Goal**: Full-page mockups and documentation that prove the design system works end-to-end and provide everything needed to adopt it
**Depends on**: Phase 3
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, COPY-01, COPY-02
**Success Criteria** (what must be TRUE):
  1. Component showcase master page displays every atom, molecule, and organism with code snippets, navigable by category
  2. Landing page mockup is a complete Cohere-style page (hero with gradient, security section, product showcase, testimonials, CTA) using only design system components and French institutional copy
  3. Dashboard page mockup shows a complete working surface (sidebar, topbar, KPI cards, data table, chart area) using only design system components
  4. Before/after comparison page shows simulateur-lite-ops current vs upgraded design side by side
  5. Naming convention documentation, spacing/sizing visualization, and WCAG accessibility checklist are complete and published
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — Documentation: spacing/sizing visualization, accessibility checklist, naming conventions
- [ ] 04-02-PLAN.md — Landing page mockup with French institutional copy
- [ ] 04-03-PLAN.md — Dashboard mockup and before/after comparison page
- [ ] 04-04-PLAN.md — Component showcase master page (all atoms, molecules, organisms)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Token Foundation | 0/2 | Not started | - |
| 2. Atoms and Molecules | 0/5 | Not started | - |
| 3. Organisms | 4/4 | Complete   | 2026-03-24 |
| 4. Pages and Documentation | 0/4 | Not started | - |
