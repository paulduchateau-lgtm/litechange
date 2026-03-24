# Codebase Concerns

**Analysis Date:** 2026-03-24

## Tech Debt

### Incomplete Database Integration
- **Issue:** Multiple API endpoints stubbed with mock data; production Prisma implementation not connected
- **Files:**
  - `app/src/app/api/kpis/route.ts` (lines 27, 62)
  - `app/src/app/api/initiatives/route.ts` (lines 28, 32, 66)
- **Impact:** All KPI measurements and initiative CRUD operations return empty data or generate UUIDs without persistence. Cannot measure change adoption at scale.
- **Fix approach:** Replace mock responses with actual Prisma queries. Implement KPI status calculation logic. Add transaction support for multi-entity creates.

### Oversized Mock Data Libraries
- **Issue:** 5.9KB total mock data hardcoded in TypeScript files; single mock-profiles.ts is 1.6KB
- **Files:**
  - `app/src/lib/mock-profiles.ts` (1611 lines)
  - `app/src/lib/mock-data.ts` (616 lines)
  - `app/src/lib/mock-action-plan.ts` (740 lines)
  - `app/src/lib/mock-erp-initiative.ts` (362 lines)
  - `app/src/lib/mock-surveys.ts` (595 lines)
- **Impact:** Bloats production bundle. Makes testing against real data difficult. Creates inconsistency with actual schema evolution.
- **Fix approach:** Move to test fixtures in dedicated directory. Use factory functions for consistent data generation. Consider seeding strategy for QA.

### Frontend API Integration Layer Missing
- **Issue:** Majority of page components (51 "use client" components) fetch data via HTTP with no request deduplication or caching layer
- **Files:** All pages under `app/src/app/(app)/*/page.tsx`
- **Impact:** N+1 request patterns. Waterfall loading. No SWR/React Query integration. Difficult to implement real-time updates or optimistic UI.
- **Fix approach:** Implement React Query or SWR for data fetching, caching, and synchronization. Add request deduplication at HTTP layer.

### Missing Session/Authentication Context
- **Issue:** API routes do not validate user session or organisation context; endpoints return placeholder organisationId/ownerId
- **Files:**
  - `app/src/app/api/initiatives/route.ts` (line 28 TODO)
  - `app/src/app/api/kpis/route.ts` (line 27 TODO)
- **Impact:** Any authenticated user can access/modify any organization's data. No audit trail. Row-level security not enforced.
- **Fix approach:** Add session middleware to all API routes. Implement org-level filtering in Prisma queries. Add RLS at database level.

## Known Bugs

### Dangerously Rendered HTML Without Sanitization
- **Symptom:** Content from user input or external data could be injected
- **Files:** `app/src/app/(app)/comex/page.tsx` - uses `dangerouslySetInnerHTML`
- **Trigger:** Any user-generated content in COMEX digest could execute JavaScript
- **Workaround:** None currently. Relies on hope that source is safe.
- **Fix:** Replace with React component or use DOMPurify-sanitized content.

### Empty Endpoint Responses
- **Symptom:** GET endpoints return `{ data: [], total: 0 }` regardless of actual data
- **Files:** `app/src/app/api/initiatives/route.ts:38`, `app/src/app/api/kpis/route.ts:33`
- **Trigger:** Any initiative or KPI read operation
- **Impact:** Dashboard and detail pages display zero data even if database contains records
- **Workaround:** Mock data is hardcoded in frontend; users see UI but backend is non-functional

## Security Considerations

### Environment Variable Exposure
- **Risk:** API keys (ANTHROPIC_API_KEY, MISTRAL_API_KEY) logged in comments and docker-compose example
- **Files:**
  - `minipilot/docker-compose.yml` (lines 23-24)
  - `minipilot/server/index.js` (lines 205-210)
- **Current mitigation:** Commented out examples. Docker Compose not checked in with values.
- **Recommendations:**
  - Move all secrets to .env (already done, good)
  - Remove comments showing secret names
  - Add secret scanning to pre-commit hooks
  - Document .env.example without revealing pattern names

### Uploaded File Handling (minipilot)
- **Risk:** No file type validation on uploads; stored in `/tmp` on Vercel with potential race conditions
- **Files:** `minipilot/server/index.js` (lines 27-30, multer configuration)
- **Current mitigation:** Vercel auto-cleans /tmp, but no explicit validation
- **Recommendations:**
  - Whitelist acceptable MIME types (xlsx, csv, docx only)
  - Validate file headers (magic bytes) not just extension
  - Implement file size limits
  - Scan uploaded files for malware signatures

### SQL Injection via JSON Serialization (minipilot)
- **Risk:** User-provided data stored as JSON strings in SQLite without parameterized queries
- **Files:** `minipilot/server/index.js` (lines 49-97 table definitions use `TEXT` for JSON)
- **Current mitigation:** Zod validation on input, but JSON parsing happens in JavaScript
- **Recommendations:**
  - Use native JSON type if migrating to PostgreSQL
  - Validate JSON schema at database layer
  - Consider immutable event log pattern for audit trail

### AI API Credentials at Runtime
- **Risk:** Anthropic and Mistral SDK clients initialized with process.env at startup; credentials in memory
- **Files:** `minipilot/server/index.js` (lines 205-210)
- **Current mitigation:** Credentials rotated outside code
- **Recommendations:**
  - Use ephemeral credentials / temporary tokens
  - Log all AI requests for audit (PII risk: what data goes to external APIs?)
  - Implement request signing for Mistral Cloud calls

## Performance Bottlenecks

### N+1 Queries on Dashboard Load
- **Problem:** Dashboard (home page) renders 6+ components, each fetching data independently with no query batching
- **Files:** `app/src/app/(app)/home/page.tsx` imports 6 separate data-fetching components
- **Cause:** Each component has `useEffect` → fetch pattern with no shared loader or context
- **Cause (scale):** Will exponentially slow with org size. 1000 users = 6000 individual queries on page load
- **Improvement path:**
  - Use Next.js server components to batch queries
  - Implement GraphQL layer for field-level query optimization
  - Add Redis caching for frequently-accessed KPIs

### Oversized Initiative Detail Page
- **Problem:** initiative-detail-view.tsx is 1319 lines; renders full KPI history + chart + actions + survey results in single component
- **Files:** `app/src/components/initiatives/initiative-detail-view.tsx`
- **Cause:** All logic in one component; no code splitting
- **Limit:** Will timeout browser on >500 historical measurements
- **Improvement path:**
  - Split into lazy-loaded tabs (Overview / KPIs / Actions / Surveys)
  - Paginate KPI measurements (50 at a time)
  - Move chart rendering to dedicated SSR endpoint

### Missing Database Indexes for Common Queries
- **Problem:** Queries on `Initiative.status`, `Kpi.category`, `Survey.status` likely table scan
- **Files:** `app/prisma/schema.prisma` has @@index on status/category, but queries also filter by initiativeId + date range
- **Cause:** Composite index strategy not defined; only single-column indexes
- **Limit:** Will degrade >10K initiatives per org
- **Improvement path:**
  - Add composite indexes: (status, updatedAt), (organisationId, status, createdAt)
  - Add covering indexes for frequent SELECT queries
  - Analyze query plans post-migration to PostgreSQL

### Large JSON Columns Without Constraints (minipilot)
- **Problem:** Survey responses, chat messages, and report sections stored as unbounded JSON TEXT
- **Files:** `minipilot/server/index.js` table definitions (lines 75-96)
- **Cause:** SQLite schema allows any JSON structure
- **Limit:** No validation on size; could store GB of data per row
- **Improvement path:**
  - Define JSON schema with Zod; validate before insert
  - Implement column limits (max 1MB per response)
  - Migrate to PostgreSQL JSONB with native validation

## Fragile Areas

### Survey Response Serialization (minipilot)
- **Files:** `minipilot/server/index.js` - survey answer storage as `TEXT` (JSON stringified)
- **Why fragile:** Manual JSON.parse/stringify with no schema validation; breaking change if survey structure changes mid-collection
- **Safe modification:**
  - Add version field to survey template
  - Build backward-compatible answer parsing
  - Write migration for existing responses
- **Test coverage:** No tests for survey response mutations

### Workspace Product Type Inheritance (minipilot)
- **Files:** `minipilot/server/index.js` - workspaces can have product_type 'pilot' or custom (line 175)
- **Why fragile:** Logic elsewhere assumes specific product_type values; no enum enforcement
- **Safe modification:**
  - Add enum table mapping product types to valid features
  - Audit all product_type references
  - Add runtime validation on workspace creation
- **Test coverage:** No tests for product type switching

### Mock Data → Database Migration Path
- **Files:** All mock-*.ts files; real data relies on seed.ts
- **Why fragile:** Inconsistency between mock structure and Prisma schema. If schema changes, mocks become stale and tests fail silently.
- **Safe modification:**
  - Generate mock data from schema via factory (e.g., factory-boy equivalent)
  - Add schema change tests that verify mock compatibility
  - Document seed.ts as source of truth
- **Test coverage:** No tests validating mock data matches schema

## Scaling Limits

### Database Connection Pool (PostgreSQL via Neon)
- **Current capacity:** Default Neon pooler = 25 connections
- **Limit:** Vercel serverless scales to ~400 concurrent Lambda invocations; will exhaust pool
- **Scaling path:**
  - Use Neon's connection pooling (PgBouncer in transaction mode)
  - Implement connection reuse in PrismaClient
  - Consider Neon's serverless driver for connection-less operation

### Local SQLite Deployment (minipilot)
- **Current capacity:** Single-file SQLite, WAL mode; ~100 concurrent writers before contention
- **Limit:** Will deadlock under 50+ simultaneous uploads/syncs
- **Scaling path:**
  - Migrate to PostgreSQL for multi-connection safety
  - Implement async job queue (Bull, Temporal) for syncs
  - Use SQS/Pub-Sub for async file processing

### Vercel Serverless Cold Starts
- **Problem:** /tmp on Vercel cleared between deploys; database state lost
- **Files:** `minipilot/server/index.js` (lines 27-28)
- **Limit:** First request after deploy rebuilds entire database schema; ~5 second latency
- **Scaling path:**
  - Migrate database to managed PostgreSQL (Amazon RDS, Neon)
  - Use Vercel KV for session cache
  - Pre-warm connections on deployment

### Memory Usage on Large Initiative Detail Pages
- **Problem:** initiative-detail-view.tsx loads full KPI history into memory; single initiative could have 1000+ measurements
- **Limit:** Browser will stall on >2000 measurements
- **Scaling path:**
  - Paginate measurements: 50 per page
  - Use virtual scrolling for history tables
  - Implement server-side aggregation (monthly rollups for charts)

## Dependencies at Risk

### Prisma + Neon Adapter Stability
- **Risk:** @prisma/adapter-pg is relatively new (v7.5); edge cases may exist with connection pooling
- **Impact:** Data corruption or connection exhaustion under load
- **Migration plan:**
  - Test failover scenarios before production
  - Keep native pg driver as fallback
  - Monitor connection pool metrics

### better-sqlite3 Native Module (minipilot)
- **Risk:** Native Node.js module; may fail to compile on deployment platform
- **Impact:** Cannot deploy minipilot to Vercel Functions (ARM64 incompatibility)
- **Migration plan:**
  - Migrate to sql.js (WASM, platform-agnostic) for read-heavy ops
  - Or move to PostgreSQL + serverless driver

### unmaintained @anthropic-ai/sdk v0.39.0
- **Risk:** Version is 2+ minor versions behind latest; may have security issues
- **Impact:** Potential API incompatibilities as Anthropic releases breaking changes
- **Migration plan:** Update to latest Anthropic SDK; test API compatibility before prod push

## Missing Critical Features

### No Role-Based Access Control (RBAC) Implementation
- **Problem:** User roles defined in schema (Sponsor, Change Lead, Manager Relay, Contributor, Target Population) but not enforced in queries
- **Blocks:**
  - Collaborators seeing other orgs' data
  - Target population accessing restricted sections
  - Sponsor/COMEX role-specific dashboards
- **Fix approach:** Implement Postgres RLS policies or ORM-level middleware filtering by role

### No Audit Trail / Change Log
- **Problem:** AuditLog table exists but is never written to
- **Blocks:**
  - Compliance requirements (regulatory change tracking)
  - Fraud detection (who deleted this initiative?)
  - Change history (who set this KPI target?)
- **Fix approach:** Implement trigger-based audit logging or Prisma middleware

### No Real-Time Updates via WebSocket
- **Problem:** Deployed as traditional REST API; changes require page refresh
- **Blocks:**
  - Real-time dashboard updates for COMEX monitoring
  - Collaborative editing of initiatives
  - Live survey response aggregation
- **Fix approach:** Implement tRPC subscriptions or raw WebSocket handlers for KPI updates

### No Data Export / Reporting
- **Problem:** ComexReport model exists but no export logic implemented
- **Blocks:**
  - PDF/Excel report generation
  - Data warehouse integration
  - Stakeholder communications
- **Fix approach:** Implement Puppeteer for PDF, XLSX writer for Excel exports

### No Survey Distribution / Response Tracking
- **Problem:** Survey templates defined, response model created, but no send/reminders/response rate tracking
- **Blocks:**
  - Survey campaign execution
  - Engagement metrics
  - Response deadline enforcement
- **Fix approach:** Implement email task queue (SendGrid), response tracking, auto-reminders

## Test Coverage Gaps

### Untested API Contract Layer
- **What's not tested:** Zod schema validation; error responses; pagination boundaries
- **Files:** `app/src/app/api/*/route.ts`
- **Risk:** Breaking changes slip into production undetected
- **Priority:** **High** — these are public contracts

### Untested KPI Calculation Logic
- **What's not tested:** calculateKpiStatus() function; status transitions; trend calculations
- **Files:** `app/src/lib/calculations.ts` (functions called but never validated)
- **Risk:** Dashboard health scores will be incorrect; misleading executives
- **Priority:** **Critical** — core domain logic

### Untested Prisma Migrations
- **What's not tested:** Schema migrations; data migrations; rollback safety
- **Files:** `app/prisma/migrations/` (no tests)
- **Risk:** Deployment failures; data loss on failed rollback
- **Priority:** **High** — affects all environments

### Untested Survey Answer Parsing (minipilot)
- **What's not tested:** JSON deserialization of survey answers; schema version handling
- **Files:** `minipilot/server/index.js` - survey responses stored/retrieved as JSON
- **Risk:** Silent data corruption if schema changes
- **Priority:** **Medium** — affects data integrity

### Integration Tests Missing
- **What's not tested:** End-to-end flows (create initiative → add KPI → measure → dashboard update)
- **Risk:** API stubs hide integration failures
- **Priority:** **High** — blocks migration from mock to real data

---

*Concerns audit: 2026-03-24*
