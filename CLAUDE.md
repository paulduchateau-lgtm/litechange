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
Olive 900 (dark bg):     #1C1D1A  ← gris neutre désaturé
Olive 800 (elevated):    #2A2B27
Paper 200 (light bg):    #F0E6D8
Paper 100 (light surface):#F7F1E8
Lite 300 (accent dark):  #C8FF3C  ← signature color, SIGNAL not background
Lite 700 (accent light): #6B8A1A  ← use this on light backgrounds
Signal 500:              #4A90B8  ← secondary data
Warm 500:                #C45A32  ← alerts, errors, friction
Success 500:             #3A8A4A
Warning 500:             #D4A03A
```

### Theme rules
- **Dark theme** (dashboards, monitoring): olive-900 bg, paper-200 text, lite-300 accents
- **Light theme** (editorial, reports): paper-100 bg, olive-900 text, lite-700 accents
- Lite Green is ALWAYS a signal (dots, accents, badges) — NEVER a large background fill
- Max 3 palette colors per screen

## Spacing

```
4px | 8px | 12px | 16px | 20px | 24px | 32px | 40px | 48px | 64px | 80px | 96px
```
- Content max-width: 1140px
- Prose max-width: 680px
- Border-radius: 6px (sm), 10px (md), 16px (lg), 9999px (pill)

## Component Patterns

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
- Logo: Source Serif 4, "lite" in italic accent
- Items: DM Sans 13px, icon 16x16
- Active: accent-subtle bg, accent-text color

### Charts
- Color order: lite green → signal blue → warm orange
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

## Files

See `/design-system/` for:
- `tokens/litechange-tokens.css` — CSS custom properties (import in every project)
- `tokens/tailwind.config.js` — Tailwind theme extension
- `docs/DESIGN-SYSTEM.md` — Full reference documentation
- `components/showcase.html` — Live component showcase (open in browser)
