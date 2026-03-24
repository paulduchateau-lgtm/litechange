# Testing Patterns

**Analysis Date:** 2026-03-24

## Test Framework

**Status:** No test framework currently configured

**Current approach:**
- No Jest, Vitest, or other test runner is installed
- No unit tests, integration tests, or E2E tests found in codebase
- Testing infrastructure has not yet been implemented

**Package.json observations:**
- `app/package.json`: No testing dependencies (no jest, vitest, testing-library, etc.)
- `minipilot/package.json`: No testing dependencies

## Test File Organization

**Current structure:**
- No test files present in either project (`app/src` or `minipilot/app/src`)
- No test directories (e.g., `__tests__`, `tests/`, `.test`, `.spec`)
- All files under `src/` are source code only

**Future test location (recommended):**
- Co-located tests: `src/components/initiatives/__tests__/initiative-card.test.tsx`
- OR centralized tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`

## Validation & Type Safety

While traditional unit tests are absent, the codebase relies heavily on:

**TypeScript strict mode:**
- `strict: true` in `tsconfig.json`
- Full type checking enabled
- Catches many potential runtime errors at compile time

**Zod schema validation:**
- Runtime validation for API inputs
- Used in `src/app/api/` route handlers
- Example from `route.ts` files:

```typescript
const CreateInitiativeSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  changeType: z.enum([
    "digital_transformation",
    "organisational_restructuring",
    // ...
  ]),
  changeMagnitude: z.enum(["minor", "moderate", "major"]),
  domainTags: z.array(z.string()).min(1),
  startDate: z.string(),
  targetDate: z.string(),
  populationSize: z.number().int().positive(),
  geographicScope: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CreateInitiativeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    // ... process parsed.data
  } catch (error) {
    console.error("[POST /api/initiatives]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
```

**React Hook Form validation:**
- Used in minipilot app (`@hookform/resolvers`)
- Client-side form validation integrated with Zod schemas

## Error Handling & Assertions

**API error flow:**
```typescript
// 1. Input validation
const parsed = Schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: "...", details: parsed.error.flatten() }, { status: 400 });
}

// 2. Processing with try-catch
try {
  // Business logic
} catch (error) {
  console.error("[CONTEXT]", error);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
```

**Context/Hook assertions:**
- Thrown errors validate hook usage:
```typescript
export function useRole(): RoleContextType {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
```

**Type guards:**
- Runtime validation of role enum:
```typescript
const VALID_ROLES: AppRole[] = [
  "comex",
  "sponsor",
  "change_lead",
  "project_manager",
  "end_user",
];

if (stored && VALID_ROLES.includes(stored)) {
  setRoleState(stored);
}
```

## Mock Data & Test Fixtures

**Mock data organization:**

All mock data is in `app/src/lib/` directory following pattern `mock-*.ts`:

- `mock-data.ts` - General mock data structure
- `mock-erp-initiative.ts` - ERP initiative example (used in page components)
- `mock-surveys.ts` - Survey question/response mock data
- `mock-comex.ts` - COMEX dashboard mock data
- `mock-diagnostic.ts` - Diagnostic page data
- `mock-home.ts` - Home page data
- `mock-portal.ts` - Portal/employee page data
- `mock-profiles.ts` - User profile mock data
- `mock-connectors.ts` - External connector configurations
- `mock-action-plan.ts` - Action plan and project tracking data

**Mock data usage in components:**

```typescript
import { MOCK_ERP_INITIATIVE } from "@/lib/mock-erp-initiative";
import type { Initiative } from "@/types/initiative";

// In page components, mock data is imported and displayed
const MOCK_INITIATIVES: Initiative[] = [
  MOCK_ERP_INITIATIVE,
  {
    id: "2",
    name: "Deploiement CRM national",
    // ... fields
  },
];

export default function InitiativesPage() {
  return (
    // render MOCK_INITIATIVES
  );
}
```

**Mock data structure example from `mock-diagnostic.ts`:**
```javascript
export const MOCK_DIAGNOSTIC = {
  readinessScore: 72,
  riskLevel: "moderate",
  sections: [
    {
      id: "stakeholders",
      name: "Stakeholder Readiness",
      score: 68,
      // ...
    },
  ],
  // ...
};
```

## Minipilot Server Testing

**Database validation:**
- SQLite database (`minipilot.db`) with WAL mode
- Schema migrations via `db.exec()` in `server/index.js`
- Foreign key constraints enabled: `pragma('foreign_keys = ON')`

**API response validation:**
- Express endpoints return `res.json()` with structured responses
- No automated tests; manual testing via API calls

## Database Constraints (as validation proxy)

**Better-sqlite3 in minipilot server:**
- Foreign key constraints enforce referential integrity
- Table schema defined with types and constraints:

```javascript
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  size INTEGER,
  columns TEXT,
  row_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT,
  sheet_name TEXT,
  row_data TEXT,
  FOREIGN KEY (file_id) REFERENCES uploaded_files(id)
);
```

## Code Coverage

**Current coverage:** Not measured (no test framework)

**Areas without automated tests:**
- All React components
- All page components
- All API routes
- All utility functions
- Form validation (partially covered by Zod + TypeScript)

## Recommended Testing Strategy (Future Implementation)

**Phase 1: Validation layer (already in place)**
- ✓ TypeScript strict mode
- ✓ Zod schema validation on API inputs
- ✓ React Hook Form validation on client

**Phase 2: Unit tests (recommended next)**
- Utility functions: `cn()`, `formatDate()`, `formatPercent()`, etc.
- Type guards and mapping functions: `statusToVariant()`
- Zod schema validation edge cases
- Tool: Vitest (ESM-friendly, Next.js compatible)

**Phase 3: Component tests**
- Isolated component rendering
- Props validation
- Event handler testing
- Tool: Vitest + @testing-library/react

**Phase 4: Integration tests**
- API route behavior
- Context provider + hook usage
- Form submission flows
- Tool: Vitest + supertest (for API) or MSW (for mocking)

**Phase 5: E2E tests**
- User workflows across pages
- Navigation and role-based access
- Tool: Playwright or Cypress

## Testing Best Practices (Current code patterns)

**Defensive programming:**
- Null/undefined checks before rendering
- Safe optional chaining: `const stored = localStorage.getItem(key) as AppRole | null`
- Type narrowing via runtime checks

**Data validation:**
- All external data (API responses, form inputs) validated via Zod
- Never trust client-provided data directly

**Error boundaries (implied):**
- Try-catch blocks in API routes
- Error logging with context for debugging
- User-friendly error messages returned to client

---

*Testing analysis: 2026-03-24*
