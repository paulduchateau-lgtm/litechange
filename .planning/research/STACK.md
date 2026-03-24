# Technology Stack

**Project:** LiteOps Design Identity v2
**Researched:** 2026-03-24

## Recommended Stack

### Design Token Pipeline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Style Dictionary | 5.3.x | Token source-of-truth, multi-platform output | Industry standard (Amazon-backed), DTCG 2025.10 spec aligned, generates CSS custom properties + Tailwind @theme + JSON from single JSON source. v5 requires Node 22+, uses DTCG syntax natively. |
| DTCG JSON format | 2025.10 | Token file format | W3C Community Group stable spec (Oct 2025). Supported by Figma, Style Dictionary, Tokens Studio. Future-proof choice over proprietary formats. |
| sd-tailwindcss-transformer | 2.2.x | Style Dictionary -> Tailwind bridge | Generates Tailwind-compatible output from Style Dictionary tokens. Use v2.2+ for Style Dictionary v5 compatibility. |

**Confidence: HIGH** -- Style Dictionary v5 is actively maintained (last release ~2 weeks ago), DTCG spec is stable, both verified via npm and W3C sources.

### CSS Framework & Architecture

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x (current) | Utility-first CSS for React app components | Already in use in `app/`. v4's @theme directive is CSS-first and consumes CSS custom properties directly -- perfect alignment with Style Dictionary CSS output. |
| CSS Custom Properties | native | Semantic token layer, theming | Already 309 lines of production tokens. The lc- to liteops- fork continues this pattern. No preprocessor needed. |
| BEM naming (CSS classes) | convention | Showcase component class names | For the 60+ HTML/CSS showcase components. BEM provides predictable, collision-free naming with project namespace (`.liteops-Button--primary--md`). Required because showcase pages are framework-agnostic. |

**Confidence: HIGH** -- Tailwind v4 @theme is documented at tailwindcss.com/docs/theme. BEM is proven at scale (Yandex, Airbnb, GOV.UK).

### Component Showcase

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom HTML pages (inline CSS) | N/A | Component showcase & documentation | PROJECT.md explicitly requires standalone HTML pages with inline CSS, no external deps except Google Fonts. This matches CLAUDE.md architecture doc rules. No framework needed. |

**Why NOT Storybook/Fractal/Astrobook:**
- PROJECT.md constraint: "No JS frameworks in showcase pages -- pure HTML/CSS for instant load"
- CLAUDE.md constraint: "All architecture plans and technical documentation MUST be generated as standalone HTML pages"
- The showcase IS the deliverable, not a dev tool. Custom HTML pages serve as both documentation and reference implementation.
- Storybook adds 30MB+ of dependencies for what amounts to rendering HTML files in an iframe.
- Fractal is closer to what we need but still overkill -- it requires Node.js runtime and templating engine setup for something that should be zero-dependency.

**Confidence: HIGH** -- This is a project constraint, not a technology choice.

### Gradient & Animation Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS @property | native | Animatable gradient color stops | Enables true gradient color animation (not just background-position tricks). Baseline since July 2024 across Chrome, Edge, Safari. Firefox support arrived late 2025. |
| CSS @keyframes | native | Entry animations, hover states, blob drift | Already defined in tokens file. Extend with blob-drift (10s cycle), gradient-shift for landing hero. |
| backdrop-filter | native | Glassmorphism effects for elevated panels | Frosted glass overlays on dashboard modals. Baseline support since 2023. |

**Why NOT JS animation libraries (GSAP, Framer Motion, etc.):**
- Showcase pages are pure HTML/CSS -- no JS allowed per project constraints.
- CSS @property covers the Cohere-inspired gradient animations needed.
- For the React app (separate milestone), Framer Motion is already available via Next.js ecosystem -- but that is out of scope for this design system milestone.

**Confidence: MEDIUM** -- CSS @property gradient animation works in all Chromium + Safari. Firefox support for @property is confirmed baseline but gradient-specific animation behavior should be tested. Fallback: use background-position animation for Firefox.

### Supporting Tools

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Lightning CSS | (bundled in Tailwind v4) | CSS minification, nesting, vendor prefixes | Automatically used by Tailwind v4's build pipeline. No separate install needed for app/ projects. |
| postcss | 8.x | CSS processing for non-Tailwind contexts | Only if standalone CSS files need processing outside Tailwind. The showcase HTML pages use inline CSS so this may not be needed. |
| prettier | 3.x | CSS/HTML formatting | Consistent formatting across showcase HTML files. |

## Token Pipeline Architecture

```
DTCG JSON source files (design-system/tokens/src/)
    |
    v
Style Dictionary v5 (build script)
    |
    +---> CSS Custom Properties (design-system/tokens/liteops-tokens.css)
    |         - Consumed by showcase HTML pages (inline or @import)
    |         - Consumed by minipilot/app/ (copied)
    |
    +---> Tailwind @theme CSS (design-system/tokens/liteops-tailwind.css)
    |         - @import in app/ main CSS, generates utility classes
    |
    +---> JSON export (design-system/tokens/liteops-tokens.json)
    |         - For documentation, Figma handoff reference
    |
    +---> Backward compat shim (design-system/tokens/lc-compat.css)
              - Maps old lc-* vars to new liteops-* vars
              - Imported by existing apps during transition
```

## CSS Architecture for 60+ Components

```
design-system/
  tokens/
    src/                          # DTCG JSON source files
      color.json                  # Raw palette
      semantic-light.json         # Light theme semantic tokens
      semantic-dark.json          # Dark theme semantic tokens
      typography.json             # Font families, sizes, weights
      spacing.json                # 4px grid scale
      elevation.json              # Shadows, blur, layering
      motion.json                 # Duration, easing, keyframe tokens
      gradient.json               # Gradient definitions (landing only)
    liteops-tokens.css            # Generated CSS custom properties
    liteops-tailwind.css          # Generated Tailwind @theme block
    liteops-tokens.json           # Generated JSON export
    lc-compat.css                 # Backward compatibility shim
    build.mjs                     # Style Dictionary build script
  components/
    showcase.html                 # Master showcase (exists, extend it)
    atoms/                        # Buttons, badges, inputs, labels
    molecules/                    # KPI cards, form groups, nav items
    organisms/                    # Sidebar, data tables, chart panels
    templates/                    # Page layouts (landing hero, dashboard)
  docs/
    DESIGN-SYSTEM.md              # Reference documentation (exists)
```

**Naming convention:** `.liteops-{Block}--{modifier}--{size}`
- Example: `.liteops-Button--primary--md`, `.liteops-Badge--success`, `.liteops-KpiCard--compact`
- Namespace prefix `liteops-` prevents collision with Tailwind utilities and third-party CSS.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Token tooling | Style Dictionary v5 | Tokens Studio CLI | Tokens Studio is Figma-first; we need JSON-first pipeline. Style Dictionary has broader output format support. |
| Token tooling | Style Dictionary v5 | Tailwind @theme only (no pipeline) | Tailwind @theme is consumption-only. We need multi-format output (CSS vars + Tailwind + JSON) from one source. Style Dictionary provides the build step. |
| Token format | DTCG JSON | Custom JSON | DTCG is W3C standard, supported by all major tools. Custom format creates vendor lock-in. |
| CSS methodology | BEM with namespace | Tailwind-only (utility classes) | Showcase pages must be framework-agnostic HTML. BEM provides meaningful, copyable class names. Tailwind utilities are used in the React app, not the showcase. |
| CSS methodology | BEM with namespace | CSS Modules | CSS Modules require a bundler. Showcase pages are standalone HTML. |
| Showcase tool | Custom HTML pages | Storybook 8 | Project constraint: no JS frameworks in showcase. Storybook is 30MB+ overhead for rendering HTML. |
| Showcase tool | Custom HTML pages | Fractal | Closer fit but still requires Node runtime + templating. Custom HTML is zero-dep and matches CLAUDE.md format. |
| Gradient animation | CSS @property | GSAP/Three.js | No JS in showcase pages. CSS @property handles gradient animation natively. |
| Gradient animation | CSS @property | SVG animated gradients | More complex to author, less performant for full-viewport gradients. CSS is simpler and sufficient. |

## Installation

```bash
# Token build pipeline (run from project root)
npm install -D style-dictionary@^5.3 sd-tailwindcss-transformer@^2.2

# Already installed in app/ (verify versions)
# tailwindcss@^4.0 -- CSS-first config with @theme
# prettier@^3.0 -- formatting

# No additional installs needed for showcase pages (zero-dep HTML/CSS)
```

## Style Dictionary Config (design-system/tokens/build.mjs)

```javascript
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['design-system/tokens/src/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'design-system/tokens/',
      files: [{
        destination: 'liteops-tokens.css',
        format: 'css/variables',
        options: { outputReferences: true }
      }]
    },
    tailwind: {
      transformGroup: 'css',
      buildPath: 'design-system/tokens/',
      files: [{
        destination: 'liteops-tailwind.css',
        format: 'tailwind/theme'  // via sd-tailwindcss-transformer
      }]
    },
    json: {
      transformGroup: 'js',
      buildPath: 'design-system/tokens/',
      files: [{
        destination: 'liteops-tokens.json',
        format: 'json/flat'
      }]
    }
  }
});

await sd.buildAllPlatforms();
```

## Key Version Constraints

| Dependency | Min Version | Reason |
|------------|-------------|--------|
| Node.js | 22.0.0 | Style Dictionary v5 requirement (Set.prototype.union) |
| style-dictionary | 5.3.0 | DTCG native syntax, CSS @property-compatible output |
| tailwindcss | 4.0.0 | @theme directive for CSS-first token consumption |
| Browsers | Baseline 2024 | CSS @property, container queries, :has() selector |

## Sources

- [Style Dictionary v5 - npm](https://www.npmjs.com/package/style-dictionary) -- v5.3.3 confirmed current
- [Style Dictionary v5 Migration](https://styledictionary.com/versions/v5/migration/) -- DTCG native syntax
- [Style Dictionary DTCG support](https://styledictionary.com/info/dtcg/)
- [DTCG Spec 2025.10 stable release](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Tailwind CSS v4 @theme docs](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 release blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [CSS @property baseline support](https://web.dev/blog/at-property-baseline)
- [sd-tailwindcss-transformer](https://www.npmjs.com/package/sd-tailwindcss-transformer) -- v2.2.1
- [BEM methodology](https://getbem.com/introduction/)
- [Fractal pattern library](https://fractal.build/) -- evaluated but not selected
