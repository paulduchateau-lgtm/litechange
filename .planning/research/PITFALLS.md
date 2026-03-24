# Domain Pitfalls: Enterprise Design System (Token Fork + Component Build)

**Domain:** Design system upgrade — token migration (lc- to liteops-) + 60+ component library
**Researched:** 2026-03-24
**Overall confidence:** HIGH (grounded in codebase evidence + industry patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken production apps, or abandoned design systems.

### Pitfall 1: Token Naming Already Drifted Before Migration Starts

**What goes wrong:** The codebase already has TWO incompatible naming conventions. The canonical `design-system/tokens/litechange-tokens.css` uses `--lc-color-olive-900` (with `color` segment), while `minipilot/app/src/styles/tokens.css` uses `--lc-olive-900` (without `color` segment). A rename from `lc-` to `liteops-` will need to account for both naming patterns, doubling the migration surface area and creating confusion about which is canonical.

**Why it happens:** Minipilot's tokens file was manually copied and edited rather than imported. Over time, the copy drifted from the source.

**Consequences:** A simple find-and-replace (`lc-` to `liteops-`) will miss the variant naming. Components built against the design system will reference tokens that don't exist in minipilot, or vice versa. Developers will hard-code hex values to "just make it work."

**Prevention:**
1. Before any rename, audit and reconcile both naming patterns into one canonical form
2. Decide the naming taxonomy once: `--liteops-{category}-{item}-{variant}` or `--liteops-{item}-{variant}` (drop `color` segment -- it is redundant since the palette names olive/paper/lite are already color-specific)
3. Generate both token files from a single Style Dictionary JSON source so drift becomes mechanically impossible
4. Add a CI lint rule that rejects any `--lc-` token not present in the canonical source file

**Detection:** Search for `--lc-` tokens across all sub-projects. If counts or names differ between `design-system/tokens/` and any consuming app, drift has occurred. Currently: confirmed drift between main app and minipilot.

**Phase:** Must be resolved in Phase 1 (Token Foundation) before any component work begins.

---

### Pitfall 2: 648 Raw Palette References Bypass the Semantic Layer

**What goes wrong:** The main app has 2,244 token references total, but 648 (29%) are raw palette tokens like `--lc-color-lite-300` and `--lc-color-warm-300` used directly in components. These bypass the semantic token layer (`--lc-accent-text`, `--lc-status-error`) which means theme switching, accessibility fixes, and global color changes require touching every file individually.

**Why it happens:** Semantic tokens don't cover every use case. When a developer needs "a slightly lighter green for a specific hover state," they reach for the raw palette because there is no semantic token for it. Over 70 files now reference raw palette tokens directly.

**Consequences:**
- Dark/light theme switching breaks where raw tokens are used (raw values don't change per theme)
- A future palette adjustment (e.g., warming up the olive scale) requires touching 70+ files
- WCAG contrast fixes become file-by-file instead of token-level
- The new `liteops-` system inherits the same problem if not addressed

**Prevention:**
1. Audit the 648 raw references and identify the missing semantic tokens they reveal (likely: `--liteops-accent-hover`, `--liteops-status-*-text`, `--liteops-chart-label`, etc.)
2. Expand the semantic token layer to cover the 80% case BEFORE building components
3. In the new system, raw palette tokens should only be referenced inside the token definition file itself, never in component CSS
4. Add a stylelint rule: `custom-property-pattern` that flags direct `--liteops-color-*` use in component files

**Detection:** `grep -roh '\-\-lc-color-[a-zA-Z0-9-]*' app/src/ | wc -l` -- any number above 0 in component files (vs. the token definition file) signals leakage.

**Phase:** Phase 1 (Token Foundation) -- expand semantic layer. Phase 2 (Component Build) -- enforce the rule in new components.

---

### Pitfall 3: Building 60 Components That Ship Late vs. 30 That Ship Now

**What goes wrong:** The PROJECT.md scopes 60+ components across landing pages, dashboards, forms, navigation, feedback, layout, and data visualization. Enterprise design system history is littered with "big bang" component libraries that took 6-12 months to build, launched without feedback loops, and were abandoned because teams had already solved their problems with ad-hoc CSS.

**Why it happens:** Completeness feels like quality. The desire for Cohere-level polish creates pressure to build everything to the same standard before releasing anything. Meanwhile, the 4 sub-projects (app, minipilot, simulateur, roadmap) continue building without the new system.

**Consequences:**
- Components built in isolation don't match actual app needs
- By the time 60 components ship, consuming apps have moved on and adoption is near zero
- Motivation wanes -- a half-built design system is worse than none (creates a confusing "which version?" situation)

**Prevention:**
1. Define a "Core 25" component set based on what the existing 70 token-consuming files actually use: buttons, badges, KPI cards, sidebar nav, tables, alerts, form inputs, modals -- the components that already exist in ad-hoc form
2. Ship the Core 25 first with the token migration shim. Get all 4 sub-projects consuming them
3. Build the remaining 35 (landing heroes, gradient sections, pipeline visualizations) in a second phase after adoption is proven
4. Measure adoption: count files importing from `design-system/` vs. using inline styles or ad-hoc CSS

**Detection:** If after 4 weeks of component work, no consuming app has imported a single new component, the system is failing. Track imports weekly.

**Phase:** Phase 2 should be split: Phase 2a (Core 25 components) and Phase 2b (Extended components). Phase 2a must include at least one consuming app migrated.

---

### Pitfall 4: The Backward Compatibility Shim Becomes Permanent

**What goes wrong:** The plan includes backward compatibility (`lc-` tokens still work during transition). This is correct strategy, but "during transition" has a dangerous tendency to become "forever." Every new developer who joins will see both prefixes and use whichever they find first. The shim creates a two-naming-system codebase that is harder to maintain than either system alone.

**Why it happens:** Migration deadlines slip. Consuming apps have other priorities. Nobody wants to touch 2,244 references across 70 files when the shim "just works."

**Consequences:**
- Doubled CSS output (both `lc-` and `liteops-` versions of every token)
- Confusion about which prefix to use in new code
- Token resolution bugs where the shim and the new system disagree on a value
- Style Dictionary builds become complex because they must output both formats

**Prevention:**
1. Set a hard deprecation date: shim lives for exactly 2 release cycles (or 8 weeks), then is removed
2. The shim should emit console warnings in development: `[DEPRECATED] --lc-text-primary is deprecated, use --liteops-text-primary`
3. Create a codemod script (simple sed/regex) that can bulk-rename in one pass per sub-project
4. Track shim usage: a CI job that counts `--lc-` references and fails if the count increases after Phase 1

**Detection:** After Phase 1 ships, count `--lc-` references weekly. If the count is not decreasing, the migration has stalled.

**Phase:** Phase 1 introduces the shim. Phase 2a must include codemod execution on at least the main app. Shim removal is Phase 3 hard gate.

---

### Pitfall 5: Gradient Backgrounds Fail WCAG Contrast Silently

**What goes wrong:** The project explicitly plans gradient fills on landing hero sections (the "green gradient exception"). Gradients change contrast ratios pixel by pixel. A heading that passes WCAG at the center of the gradient fails at the edge where the background lightens. The lite-300 (#C8FF3C) against white text will fail AA contrast (ratio ~1.6:1). Even lite-700 (#6B8A1A) against white only achieves ~3.4:1, which fails the 4.5:1 minimum for body text.

**Why it happens:** Designers test contrast at one point on the gradient, typically the darkest area. They don't test the lightest point where text actually becomes unreadable. The green palette is inherently mid-luminance, making it hostile territory for white text contrast.

**Consequences:**
- Landing pages fail automated accessibility audits
- Institutional clients (public operators, CPAM) often have accessibility mandates; a failing audit blocks deployment
- Retrofit fixes (adding text shadows, overlay gradients) look hacky and undermine the Cohere-level polish goal

**Prevention:**
1. Test contrast at the LIGHTEST point of every gradient, not the darkest
2. For green gradients: use dark text (olive-900, #1C1D1A) on green backgrounds, never white. The olive-on-lite-green combination passes AA easily (~8.5:1)
3. If white text is required for visual drama, use a dark overlay on the gradient (e.g., `linear-gradient(rgba(28,29,26,0.7), rgba(28,29,26,0.4)), linear-gradient(...)`)
4. Create pre-approved gradient + text pairings as tokens: `--liteops-gradient-hero-bg` paired with `--liteops-gradient-hero-text`, tested together
5. Add contrast verification to the showcase HTML pages: inline comments showing the actual ratio for each gradient/text combo

**Detection:** Run axe-core or Lighthouse accessibility audit on every showcase HTML page. Any contrast warning on gradient sections is this pitfall materializing.

**Phase:** Phase 2b (Landing components) -- must be baked into the hero/gradient component specs from day one.

---

## Moderate Pitfalls

### Pitfall 6: Tailwind Config Duplicates Token Values as Hard-Coded Hex

**What goes wrong:** The current `tailwind.config.js` hard-codes every hex value (`olive-900: '#1C1D1A'`) rather than referencing CSS custom properties. This means Tailwind classes and CSS tokens can diverge if either is updated independently. A developer using `bg-olive-900` gets a different value than one using `var(--lc-color-olive-900)` if someone updates only one source.

**Prevention:**
1. In the new system, Tailwind config should reference CSS custom properties: `olive: { 900: 'var(--liteops-color-olive-900)' }`
2. Or better: generate both the CSS tokens and Tailwind config from the same Style Dictionary JSON source
3. Never maintain two independent sources of truth for the same color value

**Detection:** Diff hex values between `tailwind.config.js` and `litechange-tokens.css`. Any mismatch means drift has occurred.

**Phase:** Phase 1 (Token Foundation) -- single source generation.

---

### Pitfall 7: Component APIs That Are Too Configurable

**What goes wrong:** Building components with maximum flexibility (e.g., a Button that accepts `size`, `variant`, `icon`, `iconPosition`, `loading`, `disabled`, `fullWidth`, `rounded`, `elevation`, `animation`, `className`, `as`, `href`) creates an API surface so large that developers don't know which props to use. They'll reach for plain HTML instead.

**Prevention:**
1. Follow the "pit of success" principle: the default usage (no props) should produce the most common variant
2. Limit variants to what the design system actually uses: `Button` needs `variant` (primary/secondary/ghost), `size` (sm/md/lg), and `disabled`. That's it.
3. No `className` override prop in the first release -- this is the escape hatch that kills adoption tracking
4. If a component needs more than 6 props, it should be split into multiple components (e.g., `Button` and `IconButton` and `LinkButton`)

**Detection:** Count props per component. Any component with >8 props needs review.

**Phase:** Phase 2a (Core Components) -- establish the API pattern with the first 5 components and use it as the template.

---

### Pitfall 8: Showcase HTML Pages That Nobody Uses as Reference

**What goes wrong:** Beautiful showcase pages are built, admired once, then never opened again. Developers copy-paste from existing app code, not from the showcase. The showcase becomes stale as components evolve in production.

**Prevention:**
1. Showcase pages must include copy-paste-ready code snippets (not just visual rendering)
2. Each component in the showcase must show: default state, all variants, dark theme, light theme, responsive behavior, and the exact CSS classes/tokens needed
3. Link the showcase from the project README and the CLAUDE.md guidelines
4. The showcase IS the documentation -- don't maintain a separate docs site
5. Add a "last verified" date to each showcase section

**Detection:** Ask developers "where do you look when building a new screen?" If the answer isn't "the showcase," it has failed.

**Phase:** Phase 2a -- every component ships with its showcase section simultaneously, not after.

---

### Pitfall 9: Motion System That Triggers Vestibular Disorders

**What goes wrong:** The token file already includes `prefers-reduced-motion` support, which is good. But the planned additions (blob drift 10s cycle, Cohere-inspired fluidity, staggered fade-ups) expand the motion surface significantly. Continuous animations (blob drift) and parallax-like effects are specifically called out as vestibular triggers in WCAG 2.1 SC 2.3.3.

**Prevention:**
1. All continuous animations (blob drift, pulse-glow) must be paused, not just slowed, under `prefers-reduced-motion: reduce`
2. The current implementation uses `animation-duration: 0.01ms` which is correct for discrete animations but insufficient for continuous loops -- they should use `animation: none`
3. Staggered fade-ups must have a maximum total duration (e.g., 0.8s for the full stagger sequence). A 20-item grid staggered at 0.1s = 2s before the last item appears, which feels broken
4. Cap stagger delays: `max(index * 0.1s, 0.8s)` so the sequence never exceeds 0.8s total
5. No auto-playing video or animated gradients on landing pages without a visible pause control

**Detection:** Test every showcase page with `prefers-reduced-motion: reduce` enabled. Any visible motion is a failure.

**Phase:** Phase 1 (motion tokens) and Phase 2b (landing components with complex motion).

---

### Pitfall 10: Hardcoded Sidebar Colors Create a Third Theming Path

**What goes wrong:** CLAUDE.md explicitly states the sidebar uses hardcoded colors (`#C8FF3C` for "lite", `#E8E6E1` for "Change") that "never use theme tokens." This creates three styling paths: light theme tokens, dark theme tokens, and hardcoded sidebar values. When the token rename happens, the sidebar appears unchanged -- but if someone accidentally "fixes" it to use the new tokens, the sidebar breaks.

**Prevention:**
1. Document the sidebar as an explicit exception in the design system, not just in CLAUDE.md
2. Create a `--liteops-sidebar-*` token set that happens to map to the hardcoded values but is semantically distinct: `--liteops-sidebar-bg: #1C1D1A`, `--liteops-sidebar-accent: #C8FF3C`, etc.
3. This gives the sidebar its own token namespace that can be managed independently without breaking theme switching
4. Add a comment block in the component: `/* INTENTIONALLY hardcoded. See design-system/docs/sidebar-exception.md */`

**Detection:** Grep for raw hex values in sidebar components. If they reference theme tokens instead of sidebar-specific tokens, someone has "fixed" the intentional exception.

**Phase:** Phase 1 (Token Foundation) -- define the sidebar token namespace.

---

## Minor Pitfalls

### Pitfall 11: Style Dictionary JSON Structure Locks You Into a Taxonomy

**What goes wrong:** Style Dictionary requires a JSON/YAML token structure that implies a hierarchy (e.g., `color.olive.900.value`). If the initial structure is wrong (too deep, wrong grouping, confusing category names), every consumer that parses the JSON directly is affected. V4 of Style Dictionary moved away from enforcing CTI (Category/Type/Item) but many tutorials still recommend it.

**Prevention:**
1. Keep the hierarchy flat-ish: 2-3 levels max (`color.olive.900`, not `color.raw.palette.olive.shade.900`)
2. Use `$type` property per the DTCG specification (future-proofing)
3. Test the JSON structure by generating output for all 3 targets (CSS, Tailwind, and a Figma-compatible JSON) before committing to it

**Phase:** Phase 1 -- get the JSON structure right before generating anything.

---

### Pitfall 12: Forgetting That 4 Sub-Projects Have 4 Different Build Systems

**What goes wrong:** The main app is Next.js 16 + Tailwind 4. Minipilot is React + Vite. Simulateur is deployed on Vercel separately. Roadmap is internal. Each may consume tokens differently (CSS import, Tailwind config, or copy-paste). A design system that only works with one build tool will be ignored by the others.

**Prevention:**
1. Tokens must be available as: (a) plain CSS file (works everywhere), (b) Tailwind config (for Next.js and Tailwind users), (c) JSON (for programmatic use)
2. The CSS file is the primary output; Tailwind config references CSS custom properties, not hard-coded values
3. Test token imports in all 4 sub-projects as part of Phase 1 acceptance criteria
4. Consider publishing tokens as an npm package or local workspace dependency to formalize the import

**Phase:** Phase 1 -- multi-format output and verified imports across all sub-projects.

---

### Pitfall 13: BEM-like CSS Naming Without a Clear Scope Boundary

**What goes wrong:** PROJECT.md specifies "BEM-like CSS (Button--primary--md)." BEM without scoping (CSS Modules, Shadow DOM, or a strict prefix) means component styles leak into each other. A `.Button--primary` in the design system clashes with a `.Button--primary` that already exists in the app's ad-hoc components.

**Prevention:**
1. All design system CSS classes must carry the prefix: `.liteops-Button--primary--md`, not `.Button--primary--md`
2. Or: use data attributes for variants (`[data-variant="primary"]`) which avoids the BEM verbosity
3. Document the class naming convention in the showcase, not just in guidelines nobody reads

**Phase:** Phase 2a -- establish the convention with the first component batch.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Token Foundation (Phase 1) | Naming drift between sub-projects (#1) | Reconcile before renaming. Single source generation. | Critical |
| Token Foundation (Phase 1) | Raw palette leakage (#2) | Expand semantic layer to cover 80% case | Critical |
| Token Foundation (Phase 1) | Tailwind/CSS value divergence (#6) | Generate both from Style Dictionary JSON | Moderate |
| Token Foundation (Phase 1) | Sidebar exception confusion (#10) | Dedicated sidebar token namespace | Moderate |
| Core Components (Phase 2a) | Scope creep to 60 components (#3) | Ship Core 25 first, measure adoption | Critical |
| Core Components (Phase 2a) | Over-configured APIs (#7) | Max 6 props, pit-of-success defaults | Moderate |
| Core Components (Phase 2a) | Showcase without code snippets (#8) | Copy-paste-ready examples in showcase | Moderate |
| Landing Components (Phase 2b) | Gradient contrast failures (#5) | Test lightest gradient point, dark text on green | Critical |
| Landing Components (Phase 2b) | Vestibular motion triggers (#9) | Pause continuous animations in reduced-motion | Moderate |
| Migration (Phase 3) | Compatibility shim becomes permanent (#4) | Hard deprecation date, codemod script, CI tracking | Critical |
| Migration (Phase 3) | Build system diversity (#12) | Multi-format output tested in all 4 sub-projects | Minor |
| All Phases | BEM class name collisions (#13) | Prefix all classes with `liteops-` | Minor |

---

## Sources

- Codebase analysis: 2,244 `--lc-` token references across 70 files in `app/src/`, 648 raw palette bypasses
- Codebase analysis: Naming drift confirmed between `design-system/tokens/` and `minipilot/app/src/styles/tokens.css`
- [Design Systems in 2026: Predictions, Pitfalls, and Power Moves](https://www.designsystemscollective.com/design-systems-in-2026-predictions-pitfalls-and-power-moves-f401317f7563)
- [Design System Pitfalls and Best Practices](https://www.neue.world/learn/design-system/design-system-pitfalls-and-best-practices)
- [Building Durable Component APIs for Design Systems](https://www.supernova.io/blog/building-durable-component-apis-for-design-systems)
- [Design System Product-Market Fit: Adoption Pitfalls](https://rangle.io/blog/design-systems-adoption-pitfalls-and-recommendations)
- [Best Practices for Naming Design Tokens, Components and Variables](https://www.smashingmagazine.com/2024/05/naming-best-practices/)
- [Naming Tokens in Design Systems (Nathan Curtis / EightShapes)](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)
- [Be Aware of Using CSS Custom Properties (Nucleus Design System)](https://blog.nucleus.design/be-aware-of-css-custom-properties/)
- [Why Your Gradients Fail WCAG](https://instantgradient.com/blog/accessible_gradient_guide)
- [Complete Accessibility Guide for Dark Mode and High Contrast](https://blog.greeden.me/en/2026/02/23/complete-accessibility-guide-for-dark-mode-and-high-contrast-color-design-contrast-validation-respecting-os-settings-icons-images-and-focus-visibility-wcag-2-1-aa/)
- [Style Dictionary V4 Migration Guidelines](https://styledictionary.com/versions/v4/migration/)
- [How Pinterest's Design Systems Team Measures Adoption](https://www.figma.com/blog/how-pinterests-design-systems-team-measures-adoption/)

---

*Pitfalls audit: 2026-03-24*
