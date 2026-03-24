# Phase 4: Pages and Documentation - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Full-page mockups and documentation proving the design system works end-to-end. Component showcase master page, landing page mockup (Cohere-style), dashboard mockup, before/after comparison, naming conventions, spacing docs, accessibility checklist, and French institutional copy.

</domain>

<decisions>
## Implementation Decisions

### Pages (6 deliverables)
- **Component showcase**: master page displaying every atom, molecule, organism with code snippets, navigable by category
- **Landing page mockup**: complete Cohere-style page — hero with gradient, security section, product showcase, testimonials (Cyril Vegni), CTA — using ONLY design system components
- **Dashboard mockup**: complete working surface — sidebar, topbar, KPI cards, data table, chart area — using ONLY design system components
- **Before/after comparison**: simulateur-lite-ops current vs upgraded design side by side
- **Spacing/sizing visualization**: 4px grid stops with visual demonstration
- **WCAG accessibility checklist**: verified contrast ratios for all color combinations

### Documentation (2 deliverables)
- **Naming conventions**: BEM-like CSS classes, kebab-case components, semantic token names, Figma-ready atom/molecule/organism structure
- **French copy snippets**: 10+ hero, section, CTA texts in institutional register

### French copy tone
- Institutional, never startup jargon
- Words: souverain, observable, simple, ROI immédiat, adapté métier
- Short, impactful, benefits-first (Cohere style)
- Structure: hero CTA → security/infra → products → sectors → testimonials → resources

### Landing page structure (Cohere-adapted)
- Hero: IA souveraine → CTA démo
- Sécurité/Infra: française, locale, Scaleway
- Produits: Pilots/Custom agents
- Secteurs: banque, assurance, pharma, public
- Testimonials: Cyril Vegni quote
- Ressources: API/playground links

### Claude's Discretion
- Exact code snippet formatting on showcase page
- Before/after comparison layout (side-by-side vs stacked)
- Spacing visualization design (rulers vs boxes vs both)
- Accessibility checklist format (table vs cards)
- Chart area placeholder in dashboard mockup

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### All design system outputs
- `design-system/tokens/liteops-tokens.css` — Token system
- `design-system/components/atoms/` — All atom HTML files
- `design-system/components/molecules/` — All molecule HTML files
- `design-system/components/organisms/` — All organism HTML files
- `design-system/pages/` — Existing documentation pages (typography, color-palette, chart-colors, token-test)

### Design guidelines
- `CLAUDE.md` — Full design guidelines, navigation structure, component patterns, accessibility rules, architecture doc format

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All atoms, molecules, organisms from Phases 2-3
- Token test page, typography page, color palette page, chart colors page from Phase 2
- Gradient tokens, motion tokens, elevation tokens from Phase 1

### Established Patterns
- Standalone HTML pages with inline CSS + Google Fonts
- Architecture doc format from CLAUDE.md (light theme, Source Serif headings, DM Sans body)

### Integration Points
- Showcase page composes ALL components
- Landing mockup composes: hero-section, content-section, card-grid organisms
- Dashboard mockup composes: sidebar, topbar, kpi-card, data-table, tab-pill organisms/molecules

</code_context>

<specifics>
## Specific Ideas

- Landing page: Cohere.com/fr confidence level — "sobre, confiant, enterprise"
- Dashboard: serious institutional tool — sidebar + topbar chrome, KPI cards, data table
- Before/after: show the "sympa mais pas mémorable" → "Cohere punchy" transformation
- Testimonial: Cyril Vegni as named reference
- Sectors: banque, assurance, pharma, administration publique

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-pages-and-documentation*
*Context gathered: 2026-03-24*
