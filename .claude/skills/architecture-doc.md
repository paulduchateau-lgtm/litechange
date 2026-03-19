---
description: Generate architecture documentation as visual HTML pages following the LiteChange design system. Use when creating technical architecture plans, pipeline diagrams, system design docs, or any documentation that describes how components interact.
---

# Architecture Documentation Generator

## When to use
- User asks for an architecture plan, system design, or technical documentation
- User asks to document a pipeline, data flow, or component interaction
- User says "plan d'architecture", "schema technique", "doc pipeline", etc.
- Before implementing a complex feature, generate the architecture doc first for review

## Output format
Generate a **single-file HTML page** with inline CSS. Place it in `{project}/docs/` and copy to `{project}/app/public/` for preview.

## Required structure

### HTML skeleton
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>liteChange — {Title}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:...&family=Source+Serif+4:...&family=IBM+Plex+Mono:...&display=swap" rel="stylesheet" />
  <style>/* inline CSS tokens */</style>
</head>
<body><div class="page">
  <!-- Header with logo + date -->
  <!-- Content sections -->
  <!-- Footer with logo + Confidentiel -->
</div></body>
</html>
```

### Design tokens (always include)
```css
--bg: #F5F4F0;          /* Paper 100 */
--surface: #FFFFFF;
--text: #1C1D1A;         /* Olive 900 */
--text-sec: #504E48;
--text-muted: #8C8A82;
--accent: #6B8A1A;       /* Lite 700 */
--signal: #4A90B8;
--warm: #C45A32;
--success: #3A8A4A;
--warning: #D4A03A;
--border: #E0DDD6;
--border-sub: #ECEAE4;
--olive-900: #1C1D1A;
--font-display: 'Source Serif 4', Georgia, serif;
--font-body: 'DM Sans', sans-serif;
--font-data: 'IBM Plex Mono', monospace;
```

### Components to use

**Header**: logo "liteChange" (lite in italic accent, Change in regular) + project name + version/date
**Footer**: logo + "Documentation produit — Confidentiel"

**Pipeline diagram** (`.pipeline-v`): Vertical layout with:
- Numbered steps on left rail (colored circles: accent, signal, warm, success)
- Vertical connecting line between steps
- Content cards on right with title + badge + description
- Flow boxes inside cards showing data transformations
- Phase separators (colored pills: "Phase 1 — Schema", etc.)

**Flow boxes** (`.flow-box`):
- Light background for processing steps
- Dark background (`.dark`) for SQL/code blocks with syntax highlighting
- Green background (`.safe`) for safe/validated data
- Red background (`.danger`) for risky/blocked data
- Arrows between boxes (`→` or `↓`)

**Code blocks** (`.schema-block` or `.msg-box`): Dark bg (Olive 900) with:
- `.kw` green (#B0D838) for keywords
- `.type` / `.val` blue (#7AB4D4) for types/values
- `.comment` / `.cmt` grey (#6B7260) for comments
- `.warm` orange (#E08A68) for warnings

**Security zones** (`.zone`):
- `.zone.trusted` — green border, light green bg — for local/safe components
- `.zone.network` — red border, light red bg — for network boundary
- Items inside: `.zone-item` for allowed, `.zone-item.never` for forbidden (strikethrough)

**Comparison grids** (`.compare-grid`): Two columns side-by-side with colored headers

**Tech grids** (`.tech-grid`): Auto-fill grid of technology items with name + role

**Badges**: `.badge-safe` (green), `.badge-danger` (red), `.badge-local` (accent), `.badge-cloud` (blue)

**Cards** (`.card`): White surface with border for detailed explanations

### Typography rules
- h1: Source Serif 4, 32px, for page title
- h2: Source Serif 4, 22px, section titles with bottom border
- h3: DM Sans, 15px bold, subsection titles
- Body: DM Sans, 14px
- Data labels: IBM Plex Mono, 9px, uppercase, letter-spacing 0.12em
- Code: IBM Plex Mono, 11px

### NEVER do
- Use markdown files for architecture docs
- Use external CSS frameworks (Tailwind, Bootstrap)
- Create horizontal scrolling layouts
- Use dark theme (always light theme for docs)
- Omit the header/footer branding

## Reference files
- `minipilot/docs/data-pipeline.html` — Full pipeline doc example
- `minipilot/docs/secure-architecture.html` — Security architecture example
