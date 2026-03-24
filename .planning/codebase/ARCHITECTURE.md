# Architecture

**Analysis Date:** 2026-03-24

## Pattern Overview

**Overall:** Next.js 16 full-stack monolith with role-based access control (RBAC), change management domain model, and multi-user organization architecture.

**Key Characteristics:**
- Server-side rendering (SSR) with App Router
- Client-side role context for navigation/authorization
- Prisma ORM with PostgreSQL (Neon serverless adapter)
- React 19 with RSC (React Server Components) and Babel compiler optimization
- Domain-driven design: change initiatives as primary aggregate
- Mock data layer for MVP development (pre-Prisma integration)
- Institutional tone with change lifecycle navigation (Cadrer → Observer → Agir → Reporting)

## Layers

**Presentation Layer:**
- Purpose: UI components, pages, routing
- Location: `src/app/` (Next.js App Router) and `src/components/`
- Contains: Page routes, layout wrappers, UI components, form components
- Depends on: Types layer, utils, context providers (role, theme)
- Used by: Client browsers via HTTP

**Business Logic Layer:**
- Purpose: KPI calculations, health scoring, data transformations
- Location: `src/lib/calculations.ts`, `src/lib/kpi-templates.ts`
- Contains: Status calculation algorithms, portfolio health scoring, trend analysis
- Depends on: Types layer
- Used by: Presentation layer components, API routes

**Data Access Layer:**
- Purpose: Prisma client singleton, mock data fallbacks
- Location: `src/lib/db.ts`, `src/lib/mock-*.ts`
- Contains: Database client initialization, mock datasets (initiatives, KPIs, surveys, profiles)
- Depends on: Prisma schema, types
- Used by: API routes, server components

**API Layer:**
- Purpose: HTTP endpoints for client-side operations
- Location: `src/app/api/`
- Contains: GET/POST handlers for initiatives, KPIs, templates
- Depends on: Data access layer, validation schemas
- Used by: Client-side fetch calls, external integrations

**Type/Domain Layer:**
- Purpose: Shared type definitions, domain enums
- Location: `src/types/`, Prisma schema
- Contains: Initiative, KPI, Survey, User, Action types; ChangeType, KpiCategory enums
- Depends on: Nothing (foundational)
- Used by: All other layers

## Data Flow

**Initiative Creation Flow:**

1. User submits wizard form (`src/components/initiatives/wizard/`)
2. Form validation with Zod schema (`CreateInitiativeSchema`)
3. POST `/api/initiatives` with validated payload
4. API route calls Prisma `initiative.create()` (when integrated) or returns mock
5. Response includes generated ID, timestamps, default status (draft)
6. UI redirects to initiative detail page with loaded KPIs

**KPI Status Calculation Flow:**

1. KPI values fetched from Prisma `measurements` table (or mock data)
2. `calculateKpiStatus()` compares current vs. target vs. deadline
3. Algorithm: if before deadline, compute progress gap (< 20% = on_track, 20-50% = at_risk, > 50% = off_track)
4. If at/past deadline: current >= target = success, else failed
5. Status badge rendered with semantic color (success green, warning orange, error red)
6. Portfolio health aggregated via `calculatePortfolioHealth()` (weighted status average)

**Role-Based Navigation Flow:**

1. Client loads app → `RoleProvider` hydrates from localStorage or defaults to `change_lead`
2. User toggles role via sidebar dropdown (persists to localStorage)
3. Sidebar renders only routes accessible to current role (via `canAccess()`)
4. Role change triggers redirect to role's `homeRoute` (e.g., COMEX → `/comex`)
5. `ROLE_NAV_CONFIG` drives visibility; five roles: comex, sponsor, change_lead, project_manager, end_user

**State Management:**
- Client-side: React Context (RoleContext for auth/nav, ThemeProvider for dark/light)
- Server-side: Prisma client singleton (pooled connection via Neon adapter)
- Form state: React Hook Form with Zod validation
- No global state manager; component-local `useState` for UI interactions

## Key Abstractions

**Initiative:**
- Purpose: Primary domain entity representing a change program
- Examples: `src/types/initiative.ts`, Prisma `Initiative` model
- Pattern: Value object with metadata (name, description, changeType, changeMagnitude, status, domainTags, scope, population size)
- Lifecycle: DRAFT → ACTIVE → ON_TRACK/AT_RISK/OFF_TRACK → COMPLETED/CANCELLED
- Relationships: owns KPIs, Surveys, Actions, linked to Organization and User (owner)

**KPI (Key Performance Indicator):**
- Purpose: Measurable indicator of adoption, engagement, or friction in a change initiative
- Examples: `src/types/kpi.ts`, `src/lib/kpi-templates.ts` (315+ pre-built templates by change type/magnitude)
- Pattern: Templatable domain object with baseline, current, target, status, level (strategic/operational/individual), category (adoption/engagement/performance/resistance/communication/training/process/governance)
- Relationships: belongs to Initiative, measures via KpiMeasurement history, linked to Actions
- Logic: Status calculated by `calculateKpiStatus()` based on progress ratio vs. time elapsed

**Role:**
- Purpose: Determines UI visibility, navigation scope, and future authorization
- Examples: `src/types/role.ts`, `src/lib/role-context.tsx`, `src/lib/constants.ts` (ROLE_NAV_CONFIG)
- Pattern: Union type (comex | sponsor | change_lead | project_manager | end_user) with route whitelist per role
- Not yet integrated with database; currently client-side localStorage + React Context

**Survey:**
- Purpose: Collect feedback from change population via templates (ADKAR, ICAP, PULSE, custom)
- Examples: `src/types/survey.ts`, Prisma `Survey` model
- Pattern: Template-based form with anonymous or identified responses
- Relationships: belongs to Initiative, optional recurrence, multiple channels (email, web, etc.)

**Action (Action Plan):**
- Purpose: Track mitigation tasks/deliverables tied to initiatives or KPIs
- Examples: Prisma `Action` model with `ActionDeliverable` sub-items
- Pattern: Kanban-style board (TODO, IN_PROGRESS, DONE, BLOCKED) with priority, phase (PREPARATION, DEPLOYMENT, ANCHORING), category
- Relationships: belongs to Initiative, optional link to KPI, assigned to User (owner)

## Entry Points

**Web UI:**
- Location: `src/app/layout.tsx` (root), `src/app/(app)/layout.tsx` (authenticated shell), `src/app/(auth)/` (login/register)
- Triggers: HTTPS request to app domain
- Responsibilities: Initialize fonts (DM Sans, Source Serif 4, IBM Plex Mono), theme provider, wrap authenticated routes with AppShell (sidebar + main content)

**API Endpoints:**
- Location: `src/app/api/**/route.ts`
- Triggers: Client-side fetch, internal requests
- Responsibilities: Validate input with Zod, call Prisma queries, return JSON responses

**Role-Based Navigation Guard:**
- Location: `src/lib/role-context.tsx` (RoleProvider)
- Triggers: Client-side route change
- Responsibilities: Check `canAccess(route)` before rendering; role persisted to localStorage

## Error Handling

**Strategy:** Zod validation at API boundary, try-catch with NextResponse error returns, client-side form validation with React Hook Form.

**Patterns:**

- **API errors:** `NextResponse.json({ error: "...", details: ... }, { status: 4xx|500 })`
  - Validation failures → 400 with Zod flatten() details
  - Server errors → 500 with generic message (logging TODO)

- **Form errors:** React Hook Form captures Zod errors, displays inline per field

- **Type errors:** TypeScript strict mode (`strict: true` in tsconfig) catches at compile time

- **Database errors:** Prisma errors will bubble up (TODO: add error boundary or try-catch wrapper)

Example: `src/app/api/initiatives/route.ts` validates via `CreateInitiativeSchema.safeParse()`, returns 400 if invalid, 201 if created.

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.error()` in API routes (e.g., `[GET /api/initiatives]` prefix in error messages)
- No centralized logger yet; TODO: integrate observability when moving to production

**Validation:**
- Approach: Zod schemas at API boundary (`CreateInitiativeSchema`), form-level React Hook Form
- Pattern: Decode → Validate → Normalize flow per API endpoint
- Types: No runtime validation in components; trust Next.js type safety

**Authentication:**
- Approach: Not yet implemented; currently role-based via client-side context with localStorage
- Planned: Session/JWT integration with PostgreSQL User model
- Security: Authentication guard middleware TODO (currently all routes accessible)

**Internationalization:**
- Approach: French-only UI; French labels/descriptions in constants (`CHANGE_TYPES`, `DOMAIN_TAGS`, `KPI_CATEGORIES`)
- Locale: All dates formatted as `fr-FR`, text hard-coded in French
- No i18n library; all strings live in `src/lib/constants.ts` or component JSX

**Styling & Theme:**
- Approach: Tailwind CSS 4 + CSS custom properties (LiteChange design tokens from `design-system/tokens/litechange-tokens.css`)
- Theme provider: Dark theme (olive-900 bg) and light theme (paper-100 bg)
- Colors: Lite green (#C8FF3C) for accents, semantic reds/greens for status, IBM Plex Mono for data labels

---

*Architecture analysis: 2026-03-24*
