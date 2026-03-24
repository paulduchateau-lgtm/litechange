# Phase 2: Atoms and Molecules - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

All 21 foundational and composed components (11 atoms + 10 molecules), each built with liteops- tokens, working in both themes, showcased as standalone HTML pages. Includes typography and color palette documentation pages.

</domain>

<decisions>
## Implementation Decisions

### Component architecture
- Each component is a standalone HTML page with inline CSS referencing liteops- tokens
- Components use BEM-like CSS naming: `.liteops-Button--primary--md`
- Components use kebab-case file names: `button.html`, `kpi-card.html`
- No JS frameworks — pure HTML/CSS per CLAUDE.md architecture doc rules
- Each page shows all variants, states (hover, focus, disabled, error), and sizes

### Atoms (11 components)
- Button family: primary, secondary, ghost, danger in sm/md/lg with all states
- Badge/pill: success, warning, error, info, accent with colored dot prefix
- Text input: label, placeholder, focus ring, error state, disabled
- Select dropdown: custom styled matching input component
- Textarea: auto-height indication, character count pattern
- Switch/toggle: on/off states with label
- Checkbox and radio: custom styled
- Slider/range: for simulateur numeric controls
- Glass panel: frosted backdrop-filter with subtle border (Cohere-inspired)
- Skeleton loading: rectangular, circular, text-line variants
- Typography showcase: all 3 font families with sizes, weights, use cases
- Color palette documentation: full scales, semantic mappings, contrast ratios

### Molecules (9 components + chart docs)
- KPI card: numeric value (DM Sans bold), trend indicator (IBM Plex Mono), label, badge
- Alert: success/warning/error/info with left border + tinted background
- Form field group: label + input + helper text + error message
- Nav item: icon + label with active/hover states for sidebar
- Breadcrumb: separator and current-page indicator
- Tab/pill navigation: active state and content switching indication
- Progress bar: threshold markers and percentage label
- Toast: auto-dismiss indication and dismiss button
- Chart color system: 6-color ordered sequence per theme, contrast-verified

### Typography rules
- Display: Source Serif 4 for headings, editorial, citations
- Body: DM Sans for UI text, labels, buttons, navigation
- Data: IBM Plex Mono for KPIs, metrics, badges, UPPERCASE, letter-spacing 0.1em
- All numeric data: IBM Plex Mono with tabular-nums

### Theme compliance
- Every component renders correctly in both light and dark themes
- No hardcoded color values — all via `var(--liteops-*)` tokens
- Light: paper-100 bg, olive-900 text, lite-700 accents
- Dark: olive-900 bg, #E8E6E1 text, lite-400 accents

### Claude's Discretion
- Exact code snippet display format on showcase pages
- Hover/focus animation details within 200ms constraint
- Responsive behavior of showcase pages
- Glass panel blur values and border opacity
- Skeleton animation pulse timing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Token system (Phase 1 outputs)
- `design-system/tokens/liteops-tokens.css` — All CSS custom properties (use these for all styling)
- `design-system/tokens/liteops-tailwind.css` — Tailwind @theme for reference
- `design-system/pages/token-test.html` — Visual reference for token usage patterns

### Design guidelines
- `CLAUDE.md` — Full design guidelines: colors, typography, spacing, component patterns, accessibility rules

### Research
- `.planning/research/FEATURES.md` — 73-component inventory with phased recommendation
- `.planning/research/ARCHITECTURE.md` — Four-layer architecture, component boundaries

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `design-system/tokens/liteops-tokens.css`: Complete token system from Phase 1 — all components reference this
- `design-system/tokens/lc-compat.css`: Backward compat shim
- `design-system/pages/token-test.html`: Pattern for standalone HTML showcase pages with theme toggle

### Established Patterns
- Standalone HTML pages with inline CSS + Google Fonts link
- `data-theme` attribute for theme switching
- IBM Plex Mono UPPERCASE for data labels
- DM Sans for UI elements
- Source Serif 4 for display text

### Integration Points
- All component pages import `liteops-tokens.css`
- Components will be composed into organisms in Phase 3
- Showcase pages live in `design-system/pages/` or `design-system/components/`

</code_context>

<specifics>
## Specific Ideas

- Glass panel inspired by Cohere's frosted glass effect — subtle backdrop-filter, not heavy
- KPI cards should feel like Linear's issue cards — clean, data-forward
- Buttons should have the institutional confidence of the Cohere design language
- Chart colors follow strict order: lite-700 → signal-500 → warm-500 (light), lite-400 → signal-300 → warm-300 (dark)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-atoms-and-molecules*
*Context gathered: 2026-03-24*
