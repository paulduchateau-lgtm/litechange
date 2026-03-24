/**
 * LiteOps Design Token Build Pipeline
 *
 * Transforms DTCG JSON source files into:
 *   - liteops-tokens.css    (CSS custom properties, light + dark themes)
 *   - liteops-tailwind.css  (Tailwind v4 @theme block)
 *   - liteops-tokens.json   (flat JSON for Figma import)
 *   - lc-compat.css         (backward compat shim: --lc-* -> --liteops-*)
 *
 * Uses Style Dictionary v5 for Tier 1 (raw palette, typography, spacing, radius)
 * and a custom processor for Tier 2 (themed semantic tokens with light/dark variants).
 */

import StyleDictionary from 'style-dictionary';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, 'src');
const OUT_DIR = __dirname;

// ─── Helpers ───────────────────────────────────────────────────────────

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(SRC_DIR, filename), 'utf-8'));
}

/**
 * Flatten a DTCG JSON object into a list of { path, type, value } entries.
 * Stops descending when it finds $value (leaf token).
 */
function flattenTokens(obj, prefix = []) {
  const results = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      results.push({ path: [...prefix, key], type: val.$type, value: val.$value });
    } else if (val && typeof val === 'object') {
      results.push(...flattenTokens(val, [...prefix, key]));
    }
  }
  return results;
}

/**
 * Flatten a themed DTCG JSON object (tokens with light/dark sub-objects).
 * Returns { light: [...], dark: [...] } arrays of { path, type, value }.
 */
function flattenThemedTokens(obj, prefix = []) {
  const light = [];
  const dark = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object') {
      // Check if this is a themed token (has light/dark with $value)
      if (val.light && val.dark && '$type' in val) {
        light.push({ path: [...prefix, key], type: val.$type, value: val.light.$value });
        dark.push({ path: [...prefix, key], type: val.$type, value: val.dark.$value });
      } else {
        const sub = flattenThemedTokens(val, [...prefix, key]);
        light.push(...sub.light);
        dark.push(...sub.dark);
      }
    }
  }
  return { light, dark };
}

/**
 * Resolve a reference like {olive.900} to its CSS variable name.
 */
function resolveRef(value, rawLookup) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([^}]+)\}/g, (_, refPath) => {
    const cssName = `--liteops-${refPath.replace(/\./g, '-')}`;
    return `var(${cssName})`;
  });
}

/**
 * Format a shadow $value object (or array of shadow objects) to CSS string.
 */
function shadowToCSS(val) {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val.map(v => shadowToCSS(v)).join(', ');
  }
  return `${val.offsetX} ${val.offsetY} ${val.blur} ${val.spread} ${val.color}`;
}

/**
 * Format a cubicBezier $value array to CSS string.
 */
function cubicBezierToCSS(val) {
  if (Array.isArray(val)) return `cubic-bezier(${val.join(', ')})`;
  return val;
}

// ─── Read all source files ─────────────────────────────────────────────

const colorData = readJson('color.json');
const typographyData = readJson('typography.json');
const spacingData = readJson('spacing.json');
const radiusData = readJson('radius.json');
const elevationData = readJson('elevation.json');
const gradientData = readJson('gradient.json');
const motionData = readJson('motion.json');

const surfaceData = readJson('surface.json');
const textData = readJson('text.json');
const borderData = readJson('border.json');
const accentData = readJson('accent.json');
const statusData = readJson('status.json');
const interactiveData = readJson('interactive.json');
const chartData = readJson('chart.json');

// ─── Tier 1: Raw palette + base tokens ─────────────────────────────────

const rawTokens = [
  ...flattenTokens(colorData),
  ...flattenTokens(typographyData),
  ...flattenTokens(spacingData),
  ...flattenTokens(radiusData),
  ...flattenTokens(gradientData),
  ...flattenTokens(motionData),
];

// Build a lookup map for reference resolution
const rawLookup = new Map();
for (const t of rawTokens) {
  rawLookup.set(t.path.join('.'), t.value);
}

// ─── Tier 2: Themed semantic tokens ────────────────────────────────────

const themedSources = [surfaceData, textData, borderData, accentData, statusData, interactiveData, chartData];
const allThemed = { light: [], dark: [] };
for (const src of themedSources) {
  const { light, dark } = flattenThemedTokens(src);
  allThemed.light.push(...light);
  allThemed.dark.push(...dark);
}

// ─── Elevation (special: themed shadows) ───────────────────────────────

const lightShadows = flattenTokens(elevationData.shadow.light).map(t => ({
  path: ['shadow', ...t.path],
  type: t.type,
  value: t.value,
}));
const darkShadows = flattenTokens(elevationData.shadow.dark).map(t => ({
  path: ['shadow', ...t.path],
  type: t.type,
  value: t.value,
}));

// ─── Generate CSS ──────────────────────────────────────────────────────

function cssVarName(tokenPath) {
  return `--liteops-${tokenPath.join('-')}`;
}

function formatValue(token) {
  if (token.type === 'shadow') return shadowToCSS(token.value);
  if (token.type === 'cubicBezier') return cubicBezierToCSS(token.value);
  return token.value;
}

function formatResolvedValue(token) {
  const raw = formatValue(token);
  return resolveRef(raw, rawLookup);
}

// Raw tokens block (same for both themes)
const rawLines = rawTokens.map(t => `  ${cssVarName(t.path)}: ${formatValue(t)};`);

// Light semantic tokens
const lightSemanticLines = allThemed.light.map(t => `  ${cssVarName(t.path)}: ${formatResolvedValue(t)};`);
const lightShadowLines = lightShadows.map(t => `  ${cssVarName(t.path)}: ${formatValue(t)};`);

// Dark semantic tokens
const darkSemanticLines = allThemed.dark.map(t => `  ${cssVarName(t.path)}: ${formatResolvedValue(t)};`);
const darkShadowLines = darkShadows.map(t => `  ${cssVarName(t.path)}: ${formatValue(t)};`);

const cssOutput = `/* ═══════════════════════════════════════════════════════════════════
   LITEOPS DESIGN TOKENS — Generated by build.mjs
   Do not edit manually. Source: design-system/tokens/src/*.json
   ═══════════════════════════════════════════════════════════════════ */

:root,
[data-theme="light"] {
  /* ── Raw Palette ── */
${rawLines.join('\n')}

  /* ── Semantic Tokens (Light) ── */
${lightSemanticLines.join('\n')}

  /* ── Shadows (Light) ── */
${lightShadowLines.join('\n')}
}

[data-theme="dark"] {
  /* ── Semantic Tokens (Dark) ── */
${darkSemanticLines.join('\n')}

  /* ── Shadows (Dark) ── */
${darkShadowLines.join('\n')}
}
`;

fs.writeFileSync(path.join(OUT_DIR, 'liteops-tokens.css'), cssOutput, 'utf-8');
console.log('  Generated: liteops-tokens.css');

// ─── Generate Tailwind @theme ──────────────────────────────────────────
// Only raw palette + typography + spacing + radius (per plan spec).
// Tailwind namespace: --color-*, --font-*, --spacing-*, --radius-*

function tailwindVarName(token) {
  const p = token.path;
  // Colors: olive-900 -> --color-olive-900
  if (token.type === 'color') return `--color-${p.join('-')}`;
  // Font families: font-display -> --font-display
  if (token.type === 'fontFamily') return `--font-${p.slice(1).join('-')}`;
  // Spacing: space-1 -> --spacing-1
  if (p[0] === 'space') return `--spacing-${p.slice(1).join('-')}`;
  // Radius: radius-sm -> --radius-${name}
  if (p[0] === 'radius') return `--radius-${p.slice(1).join('-')}`;
  return `--${p.join('-')}`;
}

const tailwindLines = rawTokens.map(t => `  ${tailwindVarName(t)}: ${formatValue(t)};`);

const tailwindOutput = `/* Generated by build.mjs — Tailwind v4 @theme block */
@theme {
${tailwindLines.join('\n')}
}
`;

fs.writeFileSync(path.join(OUT_DIR, 'liteops-tailwind.css'), tailwindOutput, 'utf-8');
console.log('  Generated: liteops-tailwind.css');

// ─── Generate JSON (flat) ──────────────────────────────────────────────

const jsonEntries = {};

// Raw tokens
for (const t of rawTokens) {
  jsonEntries[cssVarName(t.path)] = formatValue(t);
}
// Light semantic tokens
for (const t of allThemed.light) {
  jsonEntries[cssVarName(t.path)] = formatResolvedValue(t);
}
// Light shadows
for (const t of lightShadows) {
  jsonEntries[cssVarName(t.path)] = formatValue(t);
}

fs.writeFileSync(path.join(OUT_DIR, 'liteops-tokens.json'), JSON.stringify(jsonEntries, null, 2), 'utf-8');
console.log('  Generated: liteops-tokens.json');

// ─── Generate backward compatibility shim ──────────────────────────────
// Maps every --lc-* variable to --liteops-* equivalent.
// The mapping: --lc-color-{palette}-{shade} -> --liteops-{palette}-{shade} (drops "color")
// All other categories keep the same structure.

function lcToLiteops(lcVar) {
  // Strip the --lc- prefix
  let rest = lcVar.replace(/^--lc-/, '');
  // Drop the "color" segment for palette tokens
  rest = rest.replace(/^color-/, '');
  return `--liteops-${rest}`;
}

// Read the old token file to extract all --lc-* variables per theme block
const oldCSS = fs.readFileSync(path.join(__dirname, 'litechange-tokens.css'), 'utf-8');

// Parse the old CSS into theme blocks
function extractVarsFromBlock(css, selectorPattern) {
  const regex = new RegExp(selectorPattern + '\\s*\\{([^}]+)\\}', 'gs');
  const vars = [];
  let match;
  while ((match = regex.exec(css)) !== null) {
    const block = match[1];
    const varRegex = /(--lc-[a-zA-Z0-9-]+)\s*:/g;
    let vm;
    while ((vm = varRegex.exec(block)) !== null) {
      vars.push(vm[1]);
    }
  }
  return vars;
}

// Extract light-theme vars (the :root block includes both palette + semantic)
const lightVarsRaw = extractVarsFromBlock(oldCSS, ':root,\\s*\\[data-theme="light"\\]');
// Extract dark-theme vars
const darkVarsRaw = extractVarsFromBlock(oldCSS, '\\[data-theme="dark"\\]');

const lightCompatLines = lightVarsRaw.map(v => `  ${v}: var(${lcToLiteops(v)});`);
const darkCompatLines = darkVarsRaw.map(v => `  ${v}: var(${lcToLiteops(v)});`);

const compatOutput = `/* ═══════════════════════════════════════════════════════════════════
   BACKWARD COMPATIBILITY SHIM — Generated by build.mjs
   Maps --lc-* variables to --liteops-* equivalents via var() references.
   Import this file in apps still using the old lc- token system.
   ═══════════════════════════════════════════════════════════════════ */

:root,
[data-theme="light"] {
${lightCompatLines.join('\n')}
}

[data-theme="dark"] {
${darkCompatLines.join('\n')}
}
`;

fs.writeFileSync(path.join(OUT_DIR, 'lc-compat.css'), compatOutput, 'utf-8');
console.log('  Generated: lc-compat.css');

console.log('\nToken build complete.');

export { };
