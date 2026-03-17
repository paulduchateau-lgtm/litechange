# CLAUDE.md — LiteChange.org Design & Code Guidelines

> Drop this file at the root of any LiteChange project.
> Claude Code will follow these guidelines automatically.

## Identity

LiteChange.org is a **mission-driven company** (.org) building observability tools for change management in major French institutions (insurers, banks, public operators, administrations). Three founding pillars: **academic research** (Laurent Giraud), **field expertise** (200+ transformations), **solid tech architecture** (clean, scalable, zero tech debt).

## Tone & Voice

- Institutional, never startup jargon. We serve institutions that matter, we don't sell a SaaS.
- Every claim must be sourceable. Reference academic work when relevant.
- Action-oriented. Every insight leads to a decision.
- USE: "observer", "éclairer", "diagnostiquer", "mesurer", "friction", "mitigation", "adoption"
- NEVER: "disruptif", "game-changer", "next-gen", "révolutionnaire"

## Typography

| Role    | Font              | Usage                                       |
|---------|-------------------|---------------------------------------------|
| Display | Source Serif 4    | Headings, editorial, citations              |
| Body    | DM Sans           | UI text, labels, buttons, navigation        |
| Data    | IBM Plex Mono     | KPIs, metrics, data labels, code, badges    |

**Rules:**
- Data labels in IBM Plex Mono, UPPERCASE, letter-spacing 0.1em
- "lite" in logo: Source Serif 4 italic, Light (300), accent color
- All numeric data: IBM Plex Mono with tabular-nums

**Google Fonts:**
```
https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400;1,8..60,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap
```

## Colors

### Core palette
```
Olive 900 (dark bg):      #1C1D1A  ← gris neutre désaturé
Olive 800 (elevated):     #2A2B27
Paper 200 (light bg):     #ECEAE4  ← neutral cool beige
Paper 100 (light surface): #F5F4F0
Lite 400 (accent dark):   #B0D838  ← toned-down accent for dark theme
Lite 300 (signature):     #C8FF3C  ← brand color, hover state only in dark
Lite 700 (accent light):  #6B8A1A  ← use this on light backgrounds
Signal 500:               #4A90B8  ← secondary data
Warm 500:                 #C45A32  ← alerts, errors, friction
Success 500:              #3A8A4A
Warning 500:              #D4A03A
```

### Full paper scale (neutral cool beige)
```
Paper 950: #36342F    Paper 400: #D0CCC4
Paper 900: #504E48    Paper 300: #E0DDD6
Paper 800: #6E6C64    Paper 200: #ECEAE4
Paper 700: #8C8A82    Paper 100: #F5F4F0
Paper 600: #A8A69E    Paper  50: #FAFAF8
Paper 500: #BDB9B0
```

### Theme rules
- **Dark theme** (dashboards, monitoring): olive-900 bg, #E8E6E1 text, lite-400 accents (NOT lite-300)
- **Light theme** (editorial, reports): paper-100 bg, olive-900 text, lite-700 accents
- **Sidebar**: always dark (olive-900), regardless of content theme
- Lite Green is ALWAYS a signal (dots, accents, badges) — NEVER a large background fill
- Max 3 palette colors per screen
- Hover states use neutral white overlay (`rgba(255,255,255, 0.04)`) not green tint

### Dark theme text hierarchy
```
--lc-text-primary:    #E8E6E1   (high contrast, main content)
--lc-text-secondary:  #C0BEB8   (supporting text)
--lc-text-tertiary:   #8A8880   (labels, hints)
```

## Navigation

Sidebar navigation is grouped by **change lifecycle phase**:

| Group          | Items                                    | Logic                        |
|----------------|------------------------------------------|------------------------------|
| *(home)*       | Accueil / Mon espace                     | Role-based entry point       |
| **Cadrer**     | Initiatives, Diagnostic                  | Understand the change        |
| **Observer**   | Tableau de bord, Enquêtes, Signaux, Connecteurs | Measure adoption       |
| **Agir**       | Plan d'action, Suivi projet              | Execute                      |
| **Acteurs**    | Équipes                                  | Who does what                |
| **Rendre compte** | Vue COMEX                            | Communicate upward           |

Group labels are IBM Plex Mono, 9px, uppercase, 0.12em letter-spacing, olive-500.

### Role-based filtering
Each role sees only relevant nav items:
- **COMEX**: Initiatives (read), Tableau de bord, Vue COMEX
- **Sponsor**: Home, Initiatives, Diagnostic, Tableau de bord, Enquêtes, Équipes, Vue COMEX
- **Consultant Change**: everything
- **Chef de Projet**: Home, Initiatives, Diagnostic, Tableau de bord, Enquêtes, Plan d'action, Suivi, Équipes
- **Collaborateur**: Mon espace only (portal)

## Spacing

```
4px | 8px | 12px | 16px | 20px | 24px | 32px | 40px | 48px | 64px | 80px | 96px
```
- Content max-width: 1140px
- Prose max-width: 680px
- Border-radius: 6px (sm), 10px (md), 16px (lg), 9999px (pill)

## Component Patterns

### Logo
- "lite" in Source Serif 4 italic, Light (300)
- "Change" in Source Serif 4 regular (400)
- Sidebar variant: hardcoded colors (#C8FF3C for "lite", #E8E6E1 for "Change") — never uses theme tokens
- Content variant: uses `--lc-accent-text` and `--lc-text-primary`

### Buttons
- Primary: bg accent, text inverse, radius 10px, font DM Sans 500
- Secondary: transparent, border, radius 10px
- Ghost: transparent, no border
- Sizes: sm (6px 16px, 13px), md (10px 24px, 15px), lg (14px 32px, 17px)

### KPI Cards
- Label: IBM Plex Mono, 10px, UPPERCASE, muted color
- Value: DM Sans, 24-28px, Bold
- Trend: IBM Plex Mono, 11px, green ↑ / red ↓

### Badges
- Pill shape (radius-full), IBM Plex Mono 10px UPPERCASE
- Always include a colored dot before text
- Variants: success, warning, error, info, accent

### Tables
- Header: IBM Plex Mono 11px UPPERCASE, tertiary bg
- Numeric cells: font-mono, right-aligned, tabular-nums
- Row hover: accent-subtle background

### Alerts
- Left border 3px + tinted background
- Variants: success, warning, error, info

### Sidebar Nav
- Logo: Source Serif 4, "lite" in italic accent (hardcoded for dark bg)
- Items: DM Sans 13px, icon 15x15
- Active: accent-subtle bg, accent-text color
- Hover: `rgba(255,255,255, 0.04)` bg, paper-200 text
- Group labels: IBM Plex Mono 9px uppercase, olive-500

### Charts
- Color order: lite-400 → signal blue → warm orange (in dark theme)
- Color order: lite-700 → signal-500 → warm-500 (in light theme)
- Bar tops: radius 3px
- Grid: subtle, 1px
- Labels: IBM Plex Mono 10px

## Animations

- Subtle. Institutional register = sober.
- Page entries: fade-up, staggered 0.1s delay
- Hover: 200ms transitions, no scale > 1.02
- Only continuous animation: glow pulse on observability dots
- Respect `prefers-reduced-motion`

## Accessibility

- AA contrast minimum (4.5:1 text, 3:1 UI)
- Focus: `outline: 2px solid var(--lc-border-focus); outline-offset: 2px`
- Never rely on color alone — always add icon or text
- Explicit labels on all inputs
- All interactive elements must have `focus-visible` styles
- Tables: `scope="col"` on `<th>`, `overflow-x-auto` wrapper

## Files

See `/design-system/` for:
- `tokens/litechange-tokens.css` — CSS custom properties (import in every project)
- `tokens/tailwind.config.js` — Tailwind theme extension
- `docs/DESIGN-SYSTEM.md` — Full reference documentation
- `components/showcase.html` — Live component showcase (open in browser)
