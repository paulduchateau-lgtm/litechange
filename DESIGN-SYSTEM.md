# LITECHANGE.ORG — Design System & Brand Guidelines

> **Version:** 1.0 · **Date:** Mars 2026  
> **Purpose:** Ce fichier est la référence unique pour tout projet frontend LiteChange. Il doit être inclus dans le contexte de Claude Code pour garantir la cohérence visuelle et tonale.

---

## 1. Identité & Mission

LiteChange est une **entreprise à mission** (.org) qui rend le change management **observable** au sein des grandes institutions françaises (assureurs, mutuelles, banques, opérateurs publics, administrations).

**Trois piliers fondateurs :**
1. **Recherche académique** — Modèles validés empiriquement (réf. travaux de Laurent Giraud)
2. **Expertise terrain** — Conseil, product, data — 200+ transformations observées
3. **Architecture tech** — Stabilité, clean architecture, scalabilité, zero dette technique

**Tone & voice :**
- Institutionnel, jamais corporate creux
- Sourcé et référencé, jamais dogmatique
- Actionnable, jamais théorique
- On éclaire, on ne vend pas

**Registre lexical — UTILISER :**
- "Observer", "éclairer", "rendre visible", "mesurer", "diagnostiquer"
- "Institution", "transformation", "adoption", "friction", "mitigation"
- Références académiques quand pertinent (Giraud, 2019)

**Registre lexical — ÉVITER :**
- "Disruptif", "game-changer", "next-gen", "révolutionnaire"
- Jargon startup, anglicismes gratuits
- Claims non sourcées

---

## 2. Typographie

Trois familles, chacune avec un rôle précis.

### Display — Source Serif 4
- **Usage :** Titres, headings, citations, éléments éditoriaux
- **Poids :** Light (300) pour les grands titres, Regular (400) pour H2-H3, Medium (500) pour emphasis
- **Pourquoi :** Porte le poids intellectuel de la recherche académique. Registre éditorial sérieux.
- **Italic :** Utilisé pour le mot "lite" dans le logo et pour les accents stylistiques

```css
font-family: 'Source Serif 4', Georgia, serif;
```

### Body — DM Sans
- **Usage :** Corps de texte, labels UI, navigation, boutons
- **Poids :** Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)
- **Pourquoi :** Clarté et efficacité en interface. Neutre mais chaleureux.

```css
font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
```

### Data — IBM Plex Mono
- **Usage :** KPIs, métriques, labels de données, code, références de modèle, badges techniques
- **Poids :** Regular (400), Medium (500), Semibold (600)
- **Pourquoi :** Rigueur de l'ingénierie. Tout ce qui est chiffre ou donnée passe par cette typo.
- **Style :** Toujours en UPPERCASE pour les labels, avec letter-spacing: 0.1em

```css
font-family: 'IBM Plex Mono', Menlo, monospace;
```

### Échelle typographique

| Token    | Taille  | Usage                              |
|----------|---------|-------------------------------------|
| text-xs  | 11px    | Micro-labels, captions mono         |
| text-sm  | 13px    | Labels secondaires, metadata        |
| text-base| 15px    | Corps de texte standard             |
| text-md  | 17px    | Corps de texte mis en avant         |
| text-lg  | 20px    | H4, sous-titres                     |
| text-xl  | 24px    | H3                                  |
| text-2xl | 30px    | H2                                  |
| text-3xl | 38px    | H1 pages internes                   |
| text-4xl | 48px    | H1 landing                          |
| text-5xl | 60px    | Hero displays                       |
| text-6xl | 72px    | Hero principal                      |

### Google Fonts import

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400;1,8..60,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 3. Palette de couleurs

### Couleurs primitives

**Olive (Dark backgrounds)**
| Token     | Hex       | Usage                                  |
|-----------|-----------|----------------------------------------|
| olive-950 | #0E1009   | Background le plus sombre              |
| olive-900 | #1B1F15   | Background principal dark              |
| olive-800 | #2A2F22   | Surfaces élevées dark (cards, sidebar) |
| olive-700 | #3A3F32   | Borders actives dark                   |
| olive-600 | #4E5444   | Texte tertiaire dark                   |
| olive-500 | #6B7260   | Texte disabled dark                    |

**Paper (Light backgrounds)**
| Token      | Hex       | Usage                                  |
|------------|-----------|----------------------------------------|
| paper-300  | #E4D9C8   | Borders, dividers light                |
| paper-200  | #F0E6D8   | Surface secondaire light               |
| paper-100  | #F7F1E8   | Surface principale light               |
| paper-50   | #FDFAF6   | Background le plus clair               |

**Lite Green (Accent / Signal)**
| Token     | Hex       | Usage                                  |
|-----------|-----------|----------------------------------------|
| lite-800  | #527A10   | Accent hover sur fond clair            |
| lite-700  | #6B8A1A   | Accent principal sur fond clair        |
| lite-500  | #9ABF30   | Accent intermédiaire                   |
| lite-300  | #C8FF3C   | **Couleur signature.** Accent principal sur dark |

**Couleurs fonctionnelles**
| Couleur    | Hex       | Usage                                  |
|------------|-----------|----------------------------------------|
| signal-500 | #4A90B8   | Données secondaires, info, tendances   |
| warm-500   | #C45A32   | Alertes, erreurs, zones de friction    |
| success-500| #3A8A4A   | Succès, adoption positive              |
| warning-500| #D4A03A   | Attention, risque modéré               |

### Règles chromatiques
- **Le Lite Green (#C8FF3C) est un SIGNAL, pas un fond.** Ne jamais l'utiliser en aplat large.
- **Sur dark :** utiliser lite-300 (#C8FF3C) pour les accents
- **Sur light :** utiliser lite-700 (#6B8A1A) pour les accents — le vert vif est trop agressif sur fond clair
- **Maximum 3 couleurs** de la palette dans un même écran
- **Les status colors** (success, warning, error, info) ont des variantes background pour les badges/alerts

---

## 4. Système de composants

### 4.1 Boutons

**Primary** — Action principale
```
Background: var(--lc-interactive-primary)
Text: var(--lc-interactive-primary-text)
Border-radius: var(--lc-radius-md) = 10px
Padding: 10px 24px
Font: DM Sans, 500 (medium), 15px
Hover: background darken 1 step
Transition: 200ms ease
```

**Secondary** — Action secondaire
```
Background: transparent
Border: 1px solid var(--lc-border-primary)
Text: var(--lc-interactive-secondary-text)
Hover: background var(--lc-interactive-secondary-hover)
```

**Ghost** — Action tertiaire / navigation
```
Background: transparent
Border: none
Text: var(--lc-text-secondary)
Hover: background var(--lc-interactive-ghost-hover)
```

**Sizes:**
- `sm`: padding 6px 16px, font 13px
- `md`: padding 10px 24px, font 15px (default)
- `lg`: padding 14px 32px, font 17px

### 4.2 Cards

```
Background: var(--lc-surface-elevated)
Border: 1px solid var(--lc-border-secondary)
Border-radius: var(--lc-radius-md) = 10px
Padding: 24px
Shadow: var(--lc-shadow-sm)
Hover (si cliquable): shadow -> var(--lc-shadow-md), border -> var(--lc-border-primary)
Transition: 200ms ease
```

### 4.3 KPI Cards (Dashboard)

```
Background: var(--lc-surface-elevated)
Border: 1px solid var(--lc-border-secondary)
Border-radius: var(--lc-radius-md)
Padding: 20px

Label:    IBM Plex Mono, 10px, UPPERCASE, letter-spacing 0.05em, color text-tertiary
Value:    DM Sans, 24-28px, Bold (700), color text-primary
Trend:    IBM Plex Mono, 11px
  - Positive: color success-500, prefix "↑"
  - Negative: color warm-500, prefix "↓"
  - Neutral:  color text-tertiary
```

### 4.4 Inputs

```
Background: var(--lc-surface-elevated)
Border: 1px solid var(--lc-border-primary)
Border-radius: var(--lc-radius-md)
Padding: 10px 16px
Font: DM Sans, 15px, regular
Color: var(--lc-text-primary)
Placeholder: var(--lc-text-disabled)

Focus: border-color var(--lc-border-focus), box-shadow 0 0 0 3px var(--lc-accent-subtle)
Error: border-color var(--lc-border-error)
```

### 4.5 Badges / Tags

**Status badges:**
```
Padding: 4px 12px
Border-radius: var(--lc-radius-full)
Font: IBM Plex Mono, 10px, UPPERCASE, letter-spacing 0.05em

Variants:
  - success: bg success-bg, color success-700 (light) / success-300 (dark)
  - warning: bg warning-bg, color warning-700 / warning-300
  - error:   bg status-error-bg, color warm-700 / warm-300
  - info:    bg status-info-bg, color signal-700 / signal-300
  - accent:  bg accent-subtle, color accent-text
```

**Live indicator:**
```
Content: "● OBSERVING" or "● LIVE"
Font: IBM Plex Mono, 10px
Prefix dot: inline circle 6px, same color as text
```

### 4.6 Tables

```
Header:
  Background: var(--lc-surface-tertiary)
  Font: IBM Plex Mono, 11px, UPPERCASE, letter-spacing 0.05em
  Color: var(--lc-text-secondary)
  Padding: 12px 16px

Row:
  Border-bottom: 1px solid var(--lc-border-secondary)
  Padding: 14px 16px
  Font: DM Sans, 14px
  Hover: background var(--lc-accent-subtle)

Numeric cells: font-mono, text-right, tabular-nums
```

### 4.7 Sidebar Navigation

```
Container:
  Background: var(--lc-surface-tertiary) (dark: olive-900)
  Width: 200-240px
  Padding: 24px 16px

Logo:
  Source Serif 4, 18px, regular
  "lite" in italic, color accent-text
  Margin-bottom: 28px

Nav item:
  Padding: 9px 12px
  Border-radius: var(--lc-radius-sm)
  Font: DM Sans, 13px
  Color: var(--lc-text-secondary)
  Icon: 16x16, border-radius 3px

Nav item active:
  Background: var(--lc-accent-subtle)
  Color: var(--lc-accent-text)
  Icon background: slightly more opaque accent
```

### 4.8 Alerts / Banners

```
Border-left: 3px solid [status color]
Background: [status background]
Border-radius: 0 var(--lc-radius-sm) var(--lc-radius-sm) 0
Padding: 14px 18px
Font: DM Sans, 14px
```

### 4.9 Modals

```
Overlay: var(--lc-surface-overlay)
Container:
  Background: var(--lc-surface-elevated)
  Border-radius: var(--lc-radius-lg)
  Shadow: var(--lc-shadow-xl)
  Max-width: 560px
  Padding: 32px
  
Title: Source Serif 4, 24px, Medium (500)
Body: DM Sans, 15px, line-height 1.65
Actions: flex, gap 12px, justify-end, margin-top 32px
```

### 4.10 Charts & Data Visualization

```
Colors (in order of usage):
  1. var(--lc-chart-primary)    — Lite Green
  2. var(--lc-chart-secondary)  — Signal Blue
  3. var(--lc-chart-tertiary)   — Alert Warm
  4. var(--lc-chart-quaternary) — Olive / Deep Lite

Grid lines: var(--lc-chart-grid), 1px
Axis labels: IBM Plex Mono, 10px, color var(--lc-chart-axis)
Tooltips: 
  Background: var(--lc-surface-elevated)
  Shadow: var(--lc-shadow-md)
  Border-radius: var(--lc-radius-sm)
  Padding: 8px 12px

Bar charts: border-radius 3px 3px 0 0 (top only)
Line charts: stroke-width 2, dot radius 4
```

### 4.11 Risk / Friction Indicators

```
Risk dot: 6-8px circle, border-radius full
  - High:   var(--lc-status-error)   / warm-500
  - Medium: var(--lc-status-warning) / warning-500
  - Low:    var(--lc-status-success) / success-500

Risk bar: 
  Track: var(--lc-border-secondary), height 3-4px, border-radius full
  Fill:  same color as dot, border-radius full
```

### 4.12 Section Labels (Pattern récurrent)

```
Font: IBM Plex Mono, 10px, UPPERCASE
Letter-spacing: 0.1em (tracking-caps)
Color: var(--lc-accent-text)
Display: flex, align-items center, gap 16px
After pseudo-element: flex 1, height 1px, background accent-subtle
```

### 4.13 Blockquotes / Research References

```
Border-left: 3px solid var(--lc-accent-primary)
Padding-left: 24px
Font: Source Serif 4, italic for emphasis
Color: var(--lc-text-primary)

Citation attribution:
  Font: DM Sans, 14px
  Color: var(--lc-text-secondary)
  Prefix: "—"
```

---

## 5. Logo

### Construction
- **Font :** Source Serif 4, Regular (400)
- **"lite" :** italic, Light (300), color accent (lite-300 on dark, lite-700 on light)
- **"change" :** roman, Regular (400), color text-primary
- **Dot :** cercle 7-12px (selon la taille), color accent, box-shadow glow on dark
- **Pas d'espace** entre "lite" et "change" — un seul mot

### Déclinaisons
| Contexte    | lite        | change     | dot          |
|-------------|-------------|------------|--------------|
| Fond sombre | lite-300    | paper-200  | lite-300 + glow |
| Fond clair  | lite-700    | olive-900  | lite-700     |
| Fond accent | olive-900   | olive-900  | olive-900    |

### Favicon / Icône
Ampoule stylisée SVG. Éléments :
- Globe (path arrondi) = périmètre d'observation
- Filament zigzag = énergie du diagnostic
- Culot (2 rectangles empilés) = ancrage méthodologique
- Rayons (5 lignes) = diffusion observabilité
- Point central = signal

---

## 6. Spacing & Layout

### Grille
- Max-width contenu : 1140px (var --lc-max-content)
- Max-width prose : 680px
- Padding page horizontal : 40px (desktop), 20px (mobile)
- Gutters grille : 16-24px (components), 40-60px (sections)

### Espacement vertical entre sections
- Sections majeures : 96-128px (space-24 à space-32)
- Sous-sections : 48-64px (space-12 à space-16)
- Éléments dans un groupe : 16-24px (space-4 à space-6)
- Éléments dans un card : 8-16px (space-2 à space-4)

---

## 7. Animations & Transitions

### Principes
- **Subtilité > spectacle.** Registre institutionnel = animations sobres.
- **Entrées en page :** fade-up, staggeré avec delay progressif (0.1s par élément)
- **Hover :** transitions 200ms, pas de scale > 1.02
- **Pas d'animations continues** sauf le glow du point d'observabilité (pulse-glow)

### Tokens de mouvement
```css
--lc-duration-fast:    120ms;   /* micro-interactions (toggle, check) */
--lc-duration-normal:  200ms;   /* hover, focus, boutons */
--lc-duration-slow:    350ms;   /* ouverture modale, slide */
--lc-duration-slower:  500ms;   /* entrées en page, transitions de vue */
--lc-ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
--lc-ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);  /* feedback positif */
```

---

## 8. Accessibilité

- Contraste minimum AA (4.5:1 pour texte, 3:1 pour éléments UI)
- Focus visible obligatoire : `outline: 2px solid var(--lc-border-focus); outline-offset: 2px;`
- Pas de dépendance à la couleur seule pour communiquer un état (toujours ajouter icône ou texte)
- Labels explicites sur tous les inputs
- `prefers-reduced-motion` : désactiver pulse-glow et fade-up, garder les transitions instantanées

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Règles pour Claude Code

Quand tu génères du code pour un projet LiteChange :

1. **Importe toujours** les tokens CSS ou utilise le Tailwind config fourni
2. **Source Serif 4** pour les titres, **DM Sans** pour l'UI, **IBM Plex Mono** pour les données
3. **Préfère le dark theme** pour les dashboards et interfaces de monitoring
4. **Préfère le light theme** pour les contenus éditoriaux, la documentation, les rapports
5. **Utilise les semantic tokens** (--lc-surface-*, --lc-text-*) et jamais les primitives directement
6. **Tout KPI et donnée chiffrée** est en IBM Plex Mono, UPPERCASE pour les labels
7. **Le vert (#C8FF3C)** est un signal — petits éléments, accents, dots, pas des fonds
8. **Sur fond clair,** utilise lite-700 (#6B8A1A) au lieu de lite-300
9. **Chaque affirmation dans l'UI** qui cite un fait doit pouvoir être sourcée
10. **Pas de vocabulaire startup.** Le registre est institutionnel et mission-driven.

---

## 10. Fichiers fournis

| Fichier                       | Description                                      |
|-------------------------------|--------------------------------------------------|
| `tokens/litechange-tokens.css`| CSS custom properties — source unique de vérité   |
| `tokens/tailwind.config.js`   | Config Tailwind — extend theme pour tout projet    |
| `docs/DESIGN-SYSTEM.md`       | Ce fichier — référence complète                    |
| `components/showcase.html`    | Composants visuels interactifs — référence live    |

---

*LiteChange.org — Entreprise à mission — Mars 2026*
