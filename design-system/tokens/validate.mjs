/**
 * Token Parity Validation Script
 *
 * Compares generated liteops-tokens.css against the existing litechange-tokens.css
 * to verify every token has been migrated. Also validates the backward compat shim.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OLD_FILE = path.join(__dirname, 'litechange-tokens.css');
const NEW_FILE = path.join(__dirname, 'liteops-tokens.css');
const COMPAT_FILE = path.join(__dirname, 'lc-compat.css');

// ─── Extract CSS variable declarations from a file ─────────────────────

function extractVars(css, prefix) {
  const regex = new RegExp(`(${prefix}[a-zA-Z0-9-]+)\\s*:`, 'g');
  const vars = new Set();
  let match;
  while ((match = regex.exec(css)) !== null) {
    vars.add(match[1]);
  }
  return vars;
}

/**
 * Extract variable declarations per selector block.
 * Returns { light: Set, dark: Set }
 */
function extractVarsByTheme(css, prefix) {
  const light = new Set();
  const dark = new Set();

  // Split on [data-theme="dark"] to separate blocks
  const darkIdx = css.indexOf('[data-theme="dark"]');
  const lightBlock = darkIdx > -1 ? css.substring(0, darkIdx) : css;
  const darkBlock = darkIdx > -1 ? css.substring(darkIdx) : '';

  const regex = new RegExp(`(${prefix}[a-zA-Z0-9-]+)\\s*:`, 'g');
  let m;
  while ((m = regex.exec(lightBlock)) !== null) light.add(m[1]);
  while ((m = regex.exec(darkBlock)) !== null) dark.add(m[1]);

  return { light, dark };
}

/**
 * Map old --lc-X name to expected --liteops-X name.
 * Rule: --lc-color-{palette}-{shade} -> --liteops-{palette}-{shade}
 * All other: --lc-{category}-{name} -> --liteops-{category}-{name}
 */
function lcToLiteops(lcVar) {
  let rest = lcVar.replace(/^--lc-/, '');
  rest = rest.replace(/^color-/, '');
  return `--liteops-${rest}`;
}

// ─── Run validation ────────────────────────────────────────────────────

const oldCSS = fs.readFileSync(OLD_FILE, 'utf-8');
const newCSS = fs.readFileSync(NEW_FILE, 'utf-8');
const compatCSS = fs.readFileSync(COMPAT_FILE, 'utf-8');

const oldVars = extractVars(oldCSS, '--lc-');
const newVars = extractVars(newCSS, '--liteops-');
const compatVars = extractVars(compatCSS, '--lc-');

let errors = 0;

// ─── Step 1: Token parity check ────────────────────────────────────────

console.log('=== TOKEN PARITY CHECK ===\n');

const missing = [];
const mapped = [];
for (const lcVar of oldVars) {
  const expected = lcToLiteops(lcVar);
  if (newVars.has(expected)) {
    mapped.push(`  ${lcVar} -> ${expected}`);
  } else {
    missing.push(`  MISSING: ${lcVar} -> ${expected}`);
  }
}

const newOnly = [];
for (const nv of newVars) {
  // Check if this var has no corresponding old var
  const oldEquiv = `--lc-${nv.replace(/^--liteops-/, '')}`;
  const oldEquivColor = `--lc-color-${nv.replace(/^--liteops-/, '')}`;
  if (!oldVars.has(oldEquiv) && !oldVars.has(oldEquivColor)) {
    newOnly.push(`  NEW: ${nv}`);
  }
}

console.log(`Mapped: ${mapped.length} tokens`);
console.log(`Missing: ${missing.length} tokens`);
console.log(`New (expected additions): ${newOnly.length} tokens`);

if (missing.length > 0) {
  console.log('\nMISSING TOKENS:');
  for (const m of missing) console.log(m);
  errors += missing.length;
}

if (newOnly.length > 0) {
  console.log('\nNEW TOKENS (spacing, radius, etc.):');
  for (const n of newOnly) console.log(n);
}

// ─── Step 2: Backward compat shim validation ───────────────────────────

console.log('\n=== BACKWARD COMPAT SHIM CHECK ===\n');

const shimMissing = [];
for (const lcVar of oldVars) {
  if (!compatVars.has(lcVar)) {
    shimMissing.push(`  SHIM MISSING: ${lcVar}`);
  }
}

console.log(`Old vars covered by shim: ${oldVars.size - shimMissing.length}/${oldVars.size}`);
if (shimMissing.length > 0) {
  console.log('\nMISSING FROM SHIM:');
  for (const m of shimMissing) console.log(m);
  errors += shimMissing.length;
}

// Check that shim uses var() references, not hardcoded values
const shimLines = compatCSS.split('\n').filter(l => l.includes('--lc-') && l.includes(':'));
const hardcoded = shimLines.filter(l => !l.includes('var(--liteops-'));
if (hardcoded.length > 0) {
  console.log(`\nHARDCODED (should use var()): ${hardcoded.length}`);
  for (const h of hardcoded) console.log(`  ${h.trim()}`);
  errors += hardcoded.length;
}

// ─── Step 3: Value fidelity check ──────────────────────────────────────

console.log('\n=== VALUE FIDELITY CHECK ===\n');

const spotChecks = [
  ['--liteops-olive-900', '#1C1D1A'],
  ['--liteops-paper-100', '#F5F4F0'],
  ['--liteops-lite-300', '#C8FF3C'],
  ['--liteops-lite-700', '#6B8A1A'],
  ['--liteops-signal-500', '#4A90B8'],
  ['--liteops-warm-500', '#C45A32'],
];

for (const [varName, expected] of spotChecks) {
  const regex = new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([^;]+);`);
  const match = newCSS.match(regex);
  if (!match) {
    console.log(`  FAIL: ${varName} not found in generated CSS`);
    errors++;
  } else {
    const actual = match[1].trim();
    if (actual === expected) {
      console.log(`  PASS: ${varName} = ${actual}`);
    } else {
      console.log(`  FAIL: ${varName} = ${actual} (expected ${expected})`);
      errors++;
    }
  }
}

// ─── Step 4: No color segment check ───────────────────────────────────

console.log('\n=== COLOR SEGMENT CHECK ===\n');

const colorSegment = newCSS.match(/--liteops-color-/g);
if (colorSegment) {
  console.log(`  FAIL: Found ${colorSegment.length} instances of --liteops-color- (should be 0)`);
  errors += colorSegment.length;
} else {
  console.log('  PASS: No --liteops-color- pattern found (color segment correctly dropped)');
}

// ─── Result ────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
if (errors === 0) {
  console.log('VALIDATION PASSED: All tokens migrated, shim complete, values correct.');
  process.exit(0);
} else {
  console.log(`VALIDATION FAILED: ${errors} error(s) found.`);
  process.exit(1);
}
