# Codebase Structure

**Analysis Date:** 2026-03-24

## Directory Layout

```
litechange/
├── app/                          # Next.js application (main product)
│   ├── src/
│   │   ├── app/                  # Next.js App Router (routes + API)
│   │   │   ├── layout.tsx        # Root layout (fonts, metadata)
│   │   │   ├── globals.css       # Global styles (Tailwind + CSS vars)
│   │   │   ├── (auth)/           # Unauthenticated routes
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (app)/            # Authenticated routes (protected)
│   │   │   │   ├── layout.tsx    # AppShell wrapper (sidebar + theme)
│   │   │   │   ├── home/page.tsx
│   │   │   │   ├── portal/page.tsx
│   │   │   │   ├── initiatives/
│   │   │   │   │   ├── page.tsx  # List view
│   │   │   │   │   ├── new/page.tsx  # Wizard
│   │   │   │   │   └── [id]/page.tsx  # Detail view
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── diagnostic/page.tsx
│   │   │   │   ├── surveys/
│   │   │   │   ├── signals/page.tsx
│   │   │   │   ├── connectors/page.tsx
│   │   │   │   ├── action-plan/page.tsx
│   │   │   │   ├── tracking/page.tsx
│   │   │   │   ├── people/page.tsx
│   │   │   │   ├── comex/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   ├── (public)/          # Public routes (survey response)
│   │   │   │   └── respond/[token]/page.tsx
│   │   │   └── api/               # API routes
│   │   │       ├── initiatives/route.ts
│   │   │       ├── kpis/route.ts
│   │   │       └── kpi-templates/route.ts
│   │   ├── components/            # React components (feature-organized)
│   │   │   ├── layout/
│   │   │   │   ├── app-shell.tsx  # Main wrapper (sidebar + role context)
│   │   │   │   ├── sidebar.tsx    # Nav sidebar with role selector
│   │   │   │   ├── logo.tsx
│   │   │   │   ├── header.tsx     # Page header with search/notifications
│   │   │   │   └── theme-provider.tsx
│   │   │   ├── ui/
│   │   │   │   └── badge.tsx      # Reusable badge component
│   │   │   ├── initiatives/
│   │   │   │   ├── initiative-card.tsx
│   │   │   │   ├── initiative-detail.tsx
│   │   │   │   ├── initiative-detail-view.tsx  # Full detail page component
│   │   │   │   └── wizard/        # Multi-step creation wizard
│   │   │   ├── dashboard/         # Dashboard charts/KPI display
│   │   │   ├── kpis/              # KPI cards, status indicators
│   │   │   ├── surveys/           # Survey UI, response forms
│   │   │   ├── diagnostic/        # Diagnostic view
│   │   │   ├── comex/             # Executive digest
│   │   │   ├── portal/            # End-user portal
│   │   │   ├── people/            # Team/user management
│   │   │   ├── tracking/          # Project tracking views
│   │   │   ├── action-plan/       # Action plan boards
│   │   │   ├── home/              # Home page components
│   │   │   └── signals/           # Real-time signal monitoring
│   │   ├── lib/                   # Business logic, utilities, data
│   │   │   ├── db.ts              # Prisma client singleton
│   │   │   ├── role-context.tsx   # Role/auth context provider
│   │   │   ├── utils.ts           # Formatting (cn, formatDate, formatNumber, etc.)
│   │   │   ├── constants.ts       # Domain constants (CHANGE_TYPES, KPI_CATEGORIES, NAV_GROUPS, ROLE_NAV_CONFIG, ROLE_DOT_COLORS)
│   │   │   ├── calculations.ts    # KPI calculations (calculateKpiStatus, calculateProgress, calculatePortfolioHealth)
│   │   │   ├── kpi-templates.ts   # 315+ pre-built KPI templates by change type/magnitude
│   │   │   ├── mock-*.ts          # Mock data for MVP (initiatives, surveys, profiles, comex, etc.)
│   │   │   └── comex-pdf.ts       # PDF generation logic
│   │   ├── types/                 # TypeScript domain types
│   │   │   ├── initiative.ts      # Initiative, ChangeType, InitiativeStatus
│   │   │   ├── kpi.ts             # Kpi, KpiTemplate, KpiStatus, KpiLevel
│   │   │   ├── survey.ts          # Survey, SurveyResponse, SurveyTemplateType
│   │   │   ├── connector.ts       # DataConnector, SyncJob, ConnectorCategory
│   │   │   ├── profile.ts         # User profiles, roles
│   │   │   └── role.ts            # AppRole union type
│   │   └── styles/
│   │       └── (CSS modules/theme - if any)
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (15+ models: Organisation, User, Initiative, Kpi, KpiMeasurement, Survey, SurveyResponse, Action, ActionDeliverable, DataConnector, SyncJob, AuditLog, ComexReport)
│   │   ├── migrations/
│   │   │   └── 20260315204642_init/  # Initial schema migration
│   │   └── seed.ts                # Data seeding script
│   ├── public/                    # Static assets (favicon, images)
│   ├── next.config.ts             # Next.js config (React compiler enabled)
│   ├── tsconfig.json              # TypeScript config (paths: @/* → src/*)
│   ├── tailwind.config.ts          # Tailwind CSS 4 config
│   ├── package.json               # Dependencies (Next 16, React 19, Prisma 7, Tailwind 4)
│   └── .eslintrc.json             # ESLint rules
├── design-system/                 # Shared design tokens (imported by app/)
│   ├── tokens/
│   │   ├── litechange-tokens.css  # CSS custom properties (colors, spacing, shadows)
│   │   └── tailwind.config.js     # Tailwind theme extension
│   └── components/showcase.html   # Component reference
├── docs/                          # Architecture & reference documentation
│   ├── data-pipeline.html         # Data pipeline reference (architecture doc)
│   └── secure-architecture.html   # Security architecture (architecture doc)
├── minipilot/                     # Alternative MVP variant (data inspector, Pilot by Lite Ops)
└── CLAUDE.md                      # LiteChange branding & design guidelines
```

## Directory Purposes

**`app/src/app/`:**
- Purpose: Next.js App Router — routes and API endpoints
- Contains: Page files (`page.tsx`), layout files (`layout.tsx`), route groups `(auth)`, `(app)`, `(public)`, API route handlers
- Key files: `layout.tsx` (root), `(app)/layout.tsx` (AppShell), auth pages, feature pages

**`app/src/components/`:**
- Purpose: Reusable React components organized by feature/domain
- Contains: UI primitives (`ui/`), layout shells (`layout/`), feature components (initiatives, dashboard, surveys, etc.)
- Key files: `layout/app-shell.tsx` (main wrapper), `layout/sidebar.tsx` (nav), feature-specific component trees

**`app/src/lib/`:**
- Purpose: Business logic, data fetching, constants, utilities
- Contains: Prisma singleton, role context provider, type-safe formatters, KPI calculations, 315+ KPI templates, mock datasets
- Key files: `db.ts` (Prisma client), `role-context.tsx` (auth), `constants.ts` (domain enums/labels), `calculations.ts` (KPI algorithms), `kpi-templates.ts` (pre-built templates)

**`app/src/types/`:**
- Purpose: TypeScript domain types shared across app
- Contains: Initiative, Kpi, Survey, User, Action, Connector types matching Prisma schema + additional form/UI types
- Key files: `initiative.ts`, `kpi.ts`, `survey.ts`, `role.ts`

**`app/prisma/`:**
- Purpose: Database schema, migrations, seeders
- Contains: Prisma schema (15+ models), migration files, optional seed script
- Key files: `schema.prisma` (source of truth for data model), migrations directory

**`app/public/`:**
- Purpose: Static assets served by Next.js
- Contains: Favicon, logos, images

**`design-system/`:**
- Purpose: Centralized design tokens used across projects
- Contains: CSS custom properties (colors, spacing, shadows), Tailwind theme extension, component showcase
- Key files: `tokens/litechange-tokens.css` (imported by app/src/styles/), `tokens/tailwind.config.js`

**`docs/`:**
- Purpose: Architecture reference documentation (standalone HTML)
- Contains: Data pipeline diagram, security architecture, designed for light-theme reading
- Naming: `{topic}.html` (e.g., `data-pipeline.html`)

## Key File Locations

**Entry Points:**
- `app/src/app/layout.tsx`: Root layout, font initialization, metadata
- `app/src/app/(app)/layout.tsx`: Authenticated app shell (AppShell → Sidebar → RoleProvider)
- `app/src/app/(auth)/login/page.tsx`: Login page
- `app/src/app/(auth)/register/page.tsx`: Registration page (stub)

**Configuration:**
- `app/tsconfig.json`: TypeScript compiler options (paths: `@/*` → `src/*`)
- `app/next.config.ts`: Next.js config (React compiler enabled)
- `app/tailwind.config.ts`: Tailwind CSS configuration
- `app/prisma/schema.prisma`: Database schema definition

**Core Logic:**
- `app/src/lib/calculations.ts`: KPI status/progress calculations, portfolio health scoring
- `app/src/lib/constants.ts`: Change types, magnitudes, KPI categories, navigation config, role nav config
- `app/src/lib/kpi-templates.ts`: 315+ pre-built KPI templates matched to change type + magnitude
- `app/src/lib/role-context.tsx`: Role-based access control context provider

**API:**
- `app/src/app/api/initiatives/route.ts`: GET/POST initiatives (TODO: Prisma integration)
- `app/src/app/api/kpis/route.ts`: KPI endpoints
- `app/src/app/api/kpi-templates/route.ts`: KPI template library

**Data/Mock:**
- `app/src/lib/mock-data.ts`: Master mock initiatives, KPIs, measurements
- `app/src/lib/mock-profiles.ts`: Mock users by role
- `app/src/lib/mock-surveys.ts`: Mock survey templates
- `app/src/lib/mock-erp-initiative.ts`: Example ERP transformation initiative
- `app/src/lib/mock-*.ts`: Feature-specific mock datasets

**Components:**
- `app/src/components/layout/sidebar.tsx`: Main navigation, role selector, theme toggle
- `app/src/components/initiatives/wizard/`: Multi-step initiative creation
- `app/src/components/initiatives/initiative-detail-view.tsx`: Full initiative detail page (43KB, comprehensive)
- `app/src/components/kpis/kpi-card.tsx`: KPI status display
- `app/src/components/dashboard/`: Dashboard KPI grids and charts

**Types:**
- `app/src/types/initiative.ts`: Initiative interface, ChangeType, InitiativeStatus enums
- `app/src/types/kpi.ts`: Kpi interface, KpiTemplate interface, KpiStatus enum
- `app/src/types/role.ts`: AppRole union type (comex | sponsor | change_lead | project_manager | end_user)

## Naming Conventions

**Files:**
- Pages: `page.tsx` (routes) or `layout.tsx` (shared layouts)
- Components: PascalCase (e.g., `InitiativeCard`, `KpiCard`, `AppShell`)
- Utilities/Libs: camelCase (e.g., `calculations.ts`, `kpi-templates.ts`, `mock-initiatives.ts`)
- Types: camelCase filename, PascalCase exports (e.g., `initiative.ts` exports `Initiative`)
- API routes: `route.ts` in feature directories (e.g., `api/initiatives/route.ts`)

**Directories:**
- Features: kebab-case (e.g., `initiatives/`, `action-plan/`, `kpi-templates/`)
- Route groups: parentheses for logical grouping (e.g., `(app)`, `(auth)`, `(public)`)
- Component folders: feature-scoped, one component per file or shared component tree per folder (e.g., `initiatives/wizard/`)

**Functions:**
- Calculations: verb + descriptor (e.g., `calculateKpiStatus()`, `calculateProgress()`)
- Formatters: `format*` (e.g., `formatDate()`, `formatPercent()`, `formatNumber()`)
- Hooks: `use*` (e.g., `useRole()`, `useTheme()`)
- Providers: `*Provider` (e.g., `RoleProvider`, `ThemeProvider`)
- Components: PascalCase (React convention)

**Types/Interfaces:**
- Interfaces: PascalCase, suffix `Props` for component props, no prefix (e.g., `InitiativeDetailProps`)
- Enums: PascalCase or UPPER_SNAKE_CASE as needed
- Union types: descriptive lowercase with pipes (e.g., `"on_track" | "at_risk"`)

## Where to Add New Code

**New Feature (e.g., Reports):**
- Primary code: Create `app/src/app/(app)/reports/` directory with `page.tsx`
- Components: Add `app/src/components/reports/` with feature components
- Types: Add types to `app/src/types/report.ts` if new domain entity
- API: Add `app/src/app/api/reports/route.ts` if needed
- Mock data: Add `app/src/lib/mock-reports.ts` for MVP

**New Component/Module:**
- Implementation: Place in `app/src/components/{feature}/` directory with `{ComponentName}.tsx`
- Props interface: Define `{ComponentName}Props` interface in same file or adjacent `{ComponentName}.types.ts`
- Styles: Use Tailwind + CSS custom properties (no CSS modules currently)
- Exports: Barrel export from feature folder if used across multiple files

**Utilities/Helpers:**
- Shared helpers: Add to `app/src/lib/utils.ts` (currently: `cn()`, `formatDate()`, `formatPercent()`, `formatNumber()`)
- Domain calculations: Add to `app/src/lib/calculations.ts` (KPI logic)
- Constants: Add to `app/src/lib/constants.ts` (domain enums, nav config, role config)
- Feature-specific: Create new file in `app/src/lib/` (e.g., `app/src/lib/report-utils.ts`)

**New API Endpoint:**
- Location: `app/src/app/api/{resource}/route.ts`
- Pattern: Export named functions `GET(request)` and/or `POST(request)` that return `NextResponse`
- Validation: Use Zod schema at top of file (e.g., `CreateInitiativeSchema`)
- Error handling: Wrap in try-catch, return `NextResponse.json({ error: "..." }, { status: 4xx|500 })`
- Authentication: TODO — currently no auth guard; add `authenticateUser()` call once session implemented

**Mock Data (MVP):**
- Location: `app/src/lib/mock-{feature}.ts`
- Pattern: Export typed arrays or objects matching Prisma/types (e.g., `MOCK_INITIATIVES: Initiative[]`)
- When to keep: Until Prisma queries are integrated
- When to remove: When API endpoints call real Prisma queries instead of mocks

**Database Schema Changes:**
- File: `app/prisma/schema.prisma`
- Process:
  1. Update model definition in schema
  2. Run `npx prisma migrate dev --name {description}` (auto-generates migration)
  3. Commit migration file + schema changes
  4. Update TypeScript types in `app/src/types/` if needed
  5. Update mock data in `app/src/lib/mock-*.ts` to match schema

**New Route/Page:**
- File: Create `app/src/app/(app)/{feature}/page.tsx` or `app/src/app/(auth)/{feature}/page.tsx`
- Pattern: Export default component, set metadata (title, description)
- Layout: Import `Header` component for consistency
- Navigation: Add entry to `ROLE_NAV_CONFIG` in `constants.ts` if role-restricted
- Role filtering: Sidebar automatically hides routes not in current role's `routes` array

## Special Directories

**`prisma/migrations/`:**
- Purpose: Version control for database schema changes
- Generated: Automatically by `npx prisma migrate dev`
- Committed: Yes — migrations are checked into git
- Pattern: `YYYYMMDDHHMMSS_{description}/migration.sql`

**`public/`:**
- Purpose: Static assets (favicon, images, fonts)
- Generated: No (manually added)
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Automatically by `npm run build` or `npm run dev`
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Package dependencies
- Generated: Automatically by `npm install`
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-03-24*
