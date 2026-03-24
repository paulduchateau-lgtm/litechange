# Phase 3: Organisms - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

All 10 complex interface regions (organisms) built from Phase 2 atoms/molecules, proving the token and component layers compose into real app surfaces for both landing pages and dashboards. Each as standalone HTML showcase page.

</domain>

<decisions>
## Implementation Decisions

### Organisms (10 components)
- **Sidebar navigation**: dark background (always olive-900), lifecycle-phase groups, IBM Plex Mono 9px group labels, role-based filtering documented visually
- **Data table**: sortable column headers (IBM Plex Mono UPPERCASE), right-aligned numeric columns (tabular-nums), zebra rows, row hover, horizontal overflow wrapper
- **Modal/dialog**: overlay backdrop, centered content, close button, action bar with button atoms
- **Topbar**: logo, breadcrumb area, user menu, theme toggle
- **Hero section**: gradient background (green-to-olive using gradient tokens from Phase 1), bold Source Serif 4 heading, CTA buttons — gradient rule applies ONLY here
- **Agent card**: agent name, status indicator (badge atom), log preview, action buttons
- **Pipeline visualization**: connected node diagram showing workflow steps with status colors
- **Card grid**: responsive 1-4 columns with proper gap scaling
- **Content section**: heading, body text, optional CTA, optional illustration area (for landing pages)
- **Multi-select dropdown**: search filtering and tag display using badge atoms

### Theme context
- Sidebar: ALWAYS dark theme regardless of page theme
- Hero section: uses gradient tokens (landing-only exception to green-fill rule)
- Data table, modal, topbar, agent card, pipeline viz: follow page theme (both light and dark)
- Card grid, content section: primarily light theme (landing pages)

### Composition rules
- Organisms compose atoms and molecules — never reference raw tokens directly when a component exists
- Each organism page imports liteops-tokens.css and references atom/molecule CSS patterns
- BEM naming: `.liteops-Sidebar`, `.liteops-DataTable`, `.liteops-Hero`, etc.

### Claude's Discretion
- Pipeline visualization node layout and connection line styling
- Agent card log preview truncation approach
- Multi-select dropdown animation and filter behavior
- Exact responsive breakpoints for card grid columns
- Modal overlay backdrop-filter vs solid overlay

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system layers
- `design-system/tokens/liteops-tokens.css` — All CSS custom properties
- `design-system/components/atoms/` — All atom HTML files (patterns to compose)
- `design-system/components/molecules/` — All molecule HTML files (patterns to compose)
- `design-system/pages/token-test.html` — Token usage patterns including gradients and motion

### Design guidelines
- `CLAUDE.md` — Navigation structure, sidebar nav rules, role-based filtering, component patterns, accessibility rules

### Research
- `.planning/research/FEATURES.md` — Component inventory with complexity ratings
- `.planning/research/ARCHITECTURE.md` — Four-layer architecture, organism boundaries

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 10 atom components from Phase 2 (button, badge, input, select, etc.)
- All 9 molecule components from Phase 2 (kpi-card, alert, nav-item, tab-pill, etc.)
- Gradient tokens: `--liteops-gradient-hero-green-olive`, `--liteops-gradient-hero-green-black`
- Motion tokens: `--liteops-duration-*`, `--liteops-easing-*`, `--liteops-stagger-*`

### Established Patterns
- Standalone HTML showcase pages with theme toggle
- BEM-like CSS naming with liteops- prefix
- IBM Plex Mono UPPERCASE for data labels and group headers
- data-theme attribute for theme switching

### Integration Points
- Sidebar nav item uses `nav-item.html` molecule pattern
- Data table uses badge atoms for status cells
- Hero section uses button atoms for CTAs
- Agent card uses badge atom for status, button for actions

</code_context>

<specifics>
## Specific Ideas

- Sidebar follows exact CLAUDE.md navigation structure: Cadrer, Observer, Agir, Acteurs, Rendre compte
- Hero section inspired by Cohere.com — bold, gradient, institutional confidence
- Data table should feel like a serious enterprise tool (think Bloomberg terminal minus the complexity)
- Pipeline viz uses connected nodes with status colors (lite-green active, paper-500 pending, warm-500 error)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-organisms*
*Context gathered: 2026-03-24*
