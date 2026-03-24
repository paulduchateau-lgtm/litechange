# Coding Conventions

**Analysis Date:** 2026-03-24

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `InitiativeCard.tsx`, `RoleProvider.tsx`)
- Pages: lowercase with hyphens, `.tsx` extension (e.g., `initiatives/page.tsx`, `dashboard/page.tsx`)
- API routes: lowercase with hyphens, `route.ts` extension (e.g., `/api/initiatives/route.ts`)
- Utility files: kebab-case for modules, camelCase for exported functions (e.g., `role-context.tsx` exporting `useRole()`)
- Mock data: prefix `mock-` followed by entity name (e.g., `mock-data.ts`, `mock-erp-initiative.ts`)
- Type files: singular noun in lowercase (e.g., `role.ts`, `initiative.ts`, `kpi.ts`)

**Functions:**
- camelCase for all functions (React components use PascalCase)
- Hooks: prefix `use` followed by camelCase (e.g., `useRole()`, `useContext()`)
- Utility functions: camelCase, descriptive verbs (e.g., `formatDate()`, `statusToVariant()`, `cn()`)
- API factories: camelCase (e.g., `createWorkspaceApi()`)

**Variables:**
- camelCase for local variables and state (e.g., `role`, `setRole`, `mockInitiatives`)
- UPPERCASE_SNAKE_CASE for constants (e.g., `STORAGE_KEY`, `DEFAULT_ROLE`, `VALID_ROLES`)
- Underscore prefix for unused destructured params (e.g., `const { kpiTemplateIds: _kpiTemplateIds, ...data }`)

**Types:**
- PascalCase for type names (e.g., `AppRole`, `Initiative`, `RoleContextType`)
- Union types use lowercase with underscore separator (e.g., `"digital_transformation"`, `"on_track"`)
- Interface prefix with `I` is not used; plain PascalCase (e.g., `interface RoleContextType`)
- Record types for mapping: `Record<KeyType, ValueType>` (e.g., `Record<ChangeType, { label: string }>`)

## Code Style

**Formatting:**
- Prettier integration via ESLint (configured in `eslint.config.mjs`)
- 2-space indentation
- Max line length: ~100 characters (flexible, follows project context)
- Trailing commas in multi-line structures
- Semicolons: required (enforced)

**Linting:**
- ESLint 9 with Next.js configuration (`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`)
- TypeScript strict mode enabled (`strict: true`)
- JSX: React 19 JSX runtime (automatic, no `import React` needed)
- No explicit return types on every function; inferred where clear

**Spacing & Alignment:**
- Consistent padding/margins following design tokens (4px, 8px, 12px, 16px, 20px, 24px, 32px)
- CSS custom properties via `var(--lc-*)` for all theming
- Design token variables defined in `globals.css` under `@theme inline` block

## Import Organization

**Order:**
1. Next.js/React imports (`import type`, `import default`)
2. Third-party library imports (`react-hook-form`, `zod`, `lucide-react`, etc.)
3. Local absolute imports via `@/` path alias (types, components, lib)
4. Relative imports (rarely used; prefer absolute imports)

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- All imports use absolute `@/` paths (e.g., `@/components/ui/badge`, `@/lib/utils`, `@/types/role`)

**Typical import structure in page components:**
```typescript
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import type { Initiative, Metadata } from "@/types/initiative";
import type { Metadata } from "next";
```

**Barrel files:**
- Not systematically used; imports are explicit (e.g., import from `@/components/ui/badge` not `@/components/ui`)
- Re-exports used sparingly for type exports (e.g., `export type { AppRole }` in `role-context.tsx`)

## Error Handling

**Patterns:**
- Try-catch blocks in API routes (`route.ts` files)
- Server-side error logging via `console.error("[CONTEXT]", error)`
- Client-side errors thrown from hooks when context not available: `throw new Error("useRole must be used within a RoleProvider")`
- Validation errors via Zod: `safeParse()` + `flatten()` for detailed error reporting
- HTTP responses with explicit status codes: 200, 201, 400 (validation), 500 (server error)
- Error messages in French when user-facing (e.g., `"Erreur interne du serveur"`)

**API error response format:**
```typescript
return NextResponse.json(
  { error: "Erreur message", details: parsed.error.flatten() },
  { status: 400 }
);
```

## Logging

**Framework:** `console` (browser/Node.js native)

**Patterns:**
- Scoped logging with bracketed context: `console.log("[ComponentName]", message)`
- Error logging: `console.error("[CONTEXT] error message", error)`
- Debug logs in interactive/debug scenarios (e.g., form submissions): `console.log("[Wizard] payload:", data)`
- No structured logging library; plain console output
- Logs marked with context identifiers to trace execution flow

**Examples:**
```typescript
console.log("[ConnectorCard] clicked:", connector.id);
console.error("[POST /api/initiatives]", error);
console.log("[LiteChange] Initiative wizard payload:", JSON.stringify(payload, null, 2));
```

## Comments

**When to Comment:**
- JSDoc for exported functions and components: `/** docstring */`
- Inline comments for non-obvious business logic
- TODO/FIXME comments for work-in-progress or known issues (currently used liberally)
- Section headers using comment dividers for organizational clarity

**JSDoc/TSDoc:**
- Used on exported functions (especially API routes and utility functions)
- Format: `/** Brief description. Optional longer details. */`
- Example from codebase:
```typescript
/**
 * GET /api/initiatives
 * Retourne la liste des initiatives de l'organisation.
 * TODO: filtrer par organisation via session utilisateur.
 */
export async function GET() { ... }
```

**Section markers:**
- Used in module-level code for logical grouping
- Format: `// ── SECTION NAME ──────────────────────────────────────────────`
- Example: `// ── CHANGE TYPES ──────────────────────────────────────────────`

## Function Design

**Size:**
- Prefer small, focused functions (typically < 50 lines)
- Page components and complex UI containers may exceed this

**Parameters:**
- Use destructuring for object parameters: `{ role, setRole }`
- Named parameters via object literals for functions with multiple options
- React component props: fully typed via `interface Props` or inline type annotation

**Return Values:**
- Explicit return type annotations on exported functions
- Inferred return types acceptable for internal/private functions
- Void return for side-effect functions (context setters, event handlers)
- NextResponse for API routes (type: `Promise<NextResponse>`)

**Examples:**
```typescript
export function cn(...inputs: ClassValue[]): string { ... }

const canAccess = (route: string): boolean => { ... }

export async function GET() {
  return NextResponse.json({ data: [], total: 0 });
}
```

## Module Design

**Exports:**
- Named exports for most functionality
- Default export for page components and root layouts
- Type exports separate from value exports: `export type { AppRole }`
- Factory functions that return objects with methods: `createWorkspaceApi(slug)` returns object with methods

**Module patterns:**
- Context modules (`role-context.tsx`): export Provider + Hook + Type
- Service modules (`mock-*.ts`): export data constants and factory functions
- Type modules (`*.ts` in `types/`): export type definitions only
- Utility modules (`lib/utils.ts`): export utility functions
- Component modules: default export for component, may have named exports for sub-components

**Example context module structure:**
```typescript
"use client";

interface RoleContextType { ... }

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: Props) { ... }

export function useRole(): RoleContextType {
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}

export type { AppRole };
```

## Styling & CSS

**Approach:**
- Tailwind CSS + custom design tokens via CSS variables
- Inline `style` props for dynamic theming and design token application
- CSS custom properties (CSS variables) defined in `globals.css`

**Token usage:**
- Color variables: `--color-{palette}-{shade}` (e.g., `--color-olive-900`, `--color-lite-400`)
- Context-specific tokens: `--lc-{context}` (e.g., `--lc-text-primary`, `--lc-interactive-primary`)
- All styling references use token names, never hardcoded hex values in components

**Inline styles example:**
```typescript
style={{
  backgroundColor: "var(--lc-interactive-primary)",
  color: "var(--lc-interactive-primary-text)",
  fontFamily: "'IBM Plex Mono', Menlo, monospace",
  fontSize: "0.6875rem",
}}
```

**Tailwind usage:**
- Primarily for layout and spacing (flex, gap, p-*, mx-*, etc.)
- Rarely used for colors (prefer CSS variables)
- Utility merging via `cn()` function (`clsx` + `twMerge`)

## React & Component Patterns

**Component structure:**
- Functional components only; no class components
- Props typed via `interface` or inline type: `({prop}: {prop: string})`
- "use client" directive at top of file for client-side components
- Context Providers wrap client components

**State management:**
- `useState` for local component state
- Context + custom hooks for cross-component state (`RoleProvider` + `useRole()`)
- React Hook Form for form state (see minipilot app)
- No external state library (Redux, Zustand, etc.)

**Effects:**
- `useEffect` with dependency array for side effects
- SSR-safe initialization (hydration guard in `useEffect`)

---

*Convention analysis: 2026-03-24*
