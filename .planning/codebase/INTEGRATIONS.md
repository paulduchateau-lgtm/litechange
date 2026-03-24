# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

**Large Language Models (Runtime-Selectable):**
- Anthropic Claude - AI analysis and report generation
  - SDK: @anthropic-ai/sdk 0.39.0
  - Auth: `ANTHROPIC_API_KEY` env var (optional)
  - Mode: "premium" (cloud mode in Minipilot)
  - Location: `minipilot/server/index.js` lines 205-207
  - Used for: Document analysis, data extraction, text generation

- Mistral Cloud - Fallback LLM provider
  - SDK: @mistralai/mistralai 1.15.1
  - Auth: `MISTRAL_API_KEY` env var (optional)
  - Model: ministral-3b-latest (configurable via `MISTRAL_CLOUD_MODEL`)
  - Location: `minipilot/server/index.js` lines 209-211
  - Used for: Premium AI fallback when Anthropic unavailable

- Ollama (Local) - 100% offline open-source LLM
  - Not SDK-based; HTTP API calls to `localhost:11434` (configurable via `OLLAMA_BASE_URL`)
  - Model: ministral-3:3b (configurable via `OLLAMA_MODEL`)
  - Mode: "local" (dev-friendly, zero data leakage)
  - Location: `minipilot/server/index.js` lines 213-214, 246-273
  - Used for: Local analysis when offline or privacy-critical
  - Docker Compose service: `ollama` with auto-initialization of ministral:3b

**AI Mode Selection:**
- Runtime togglable via GET/POST `/api/ai/mode` endpoint
- Fallback chain: Anthropic → Mistral Cloud → Ollama (if available)
- Default: `process.env.AI_MODE` or "premium"
- Detection: Checks Ollama availability on startup (`checkOllama()` function)

## Data Storage

**Databases:**

*PostgreSQL (Primary - Production):**
- Provider: Neon serverless (Scaleway or self-hosted)
- Connection: `DATABASE_URL` env var (PostgreSQL connection string)
- Client: Prisma 7.5.0 with @prisma/adapter-pg adapter
- Adapter: @neondatabase/serverless for serverless connections
- Location: `app/src/lib/db.ts` - PrismaClient singleton with PrismaPg adapter
- Schema: `app/prisma/schema.prisma` (20+ enums, 15+ models: User, Initiative, KPI, Survey, etc.)
- Features: Foreign keys enabled, WAL journal mode for concurrent access
- Used for: All application state (initiatives, KPIs, surveys, users, workspace data)

*SQLite (Local Development/Minipilot):**
- Type: Embedded, better-sqlite3 11.0.0
- Location: `minipilot/server/minipilot.db` (or `/tmp/minipilot.db` on Vercel, `/data/minipilot.db` in Docker)
- Schema: Auto-created in `minipilot/server/index.js` (tables: uploaded_files, data_rows, clean_data, reports, workspaces, project_context, usage_logs, ai_interactions, charts, tables, tasks)
- WAL mode enabled for concurrent writes
- Used for: Minipilot workspace data, file uploads, data transformations, AI interaction logs

**File Storage:**
- Local filesystem - Uploads directory
  - Path: `minipilot/server/uploads/` (dev) or `/tmp/uploads/` (Vercel) or `/data/uploads/` (Docker)
  - Managed by: Multer 1.4.5-lts.1 middleware
  - Files: Excel, CSV, Word documents (.xlsx, .csv, .docx)
  - Cleanup: Not automatic (manual or container-based)

**Caching:**
- None detected - All data retrieved directly from PostgreSQL or SQLite
- No Redis or Memcached in stack
- No CDN configuration in Next.js config

## Authentication & Identity

**Auth Provider:**
- Custom (not detected as using Auth0, Supabase Auth, or NextAuth)
- Location: `app/src/app/(auth)/` directory structure indicates custom auth routes
- Mechanism: Likely session-based or JWT in cookies (no SDK detected)
- No OAuth provider integration found

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Bugsnag, or similar integration
- Local: Console logging in Node.js backends

**Logs:**
- Console-based logging (console.log, console.error in both backends)
- Minipilot: Logs AI provider availability on startup
- Minipilot: Logs AI interactions to SQLite table `ai_interactions`
- No centralized logging service (ELK, Datadog, CloudWatch) detected

**Database Migrations:**
- Prisma migrations: `app/prisma/migrations/` (not inspected)
- SQLite schema: Hard-coded in `minipilot/server/index.js` db.exec()

## CI/CD & Deployment

**Hosting:**
- Docker container (self-hosted or Vercel)
- Detection env vars: `process.env.VERCEL`, `process.env.DOCKER`
- Container: node:20-alpine with Python 3, make, g++, sqlite for native compilation

**CI Pipeline:**
- None detected in codebase
- No GitHub Actions, GitLab CI, or CircleCI config files
- Likely manual deployment or Vercel's built-in CI

**Vercel Integration:**
- Vercel detection: `if (process.env.VERCEL)` - Sets temp paths for DB and uploads
- Serverless-compatible: Minipilot designed to run on Vercel with /tmp persistence

## Environment Configuration

**Required env vars:**

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection (Neon/local) | None | Yes (app) |
| `ANTHROPIC_API_KEY` | Claude API key | None | No (optional premium) |
| `MISTRAL_API_KEY` | Mistral Cloud API key | None | No (optional fallback) |
| `OLLAMA_BASE_URL` | Local Ollama HTTP endpoint | `http://localhost:11434` | No |
| `OLLAMA_MODEL` | Local LLM model name | `ministral-3:3b` | No |
| `MISTRAL_CLOUD_MODEL` | Mistral Cloud model | `ministral-3b-latest` | No |
| `AI_MODE` | Runtime AI provider mode | `premium` | No |
| `PORT` | HTTP server port | 3000 | No |
| `NODE_ENV` | Runtime environment | dev | No |
| `DB_PATH` | SQLite database path (Minipilot) | `./minipilot.db` | No |
| `UPLOADS_DIR` | File uploads directory | `./uploads/` | No |
| `DOCKER` | Docker environment flag | None | No |

**Secrets location:**
- `.env` file at project root (app, minipilot)
- `.env.example` provides schema: `app/.env.example` shows `DATABASE_URL` template
- No secrets manager detected (AWS Secrets, Vault, etc.)
- Production: Environment variables passed to Docker container

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook receiver endpoints in API routes

**Outgoing:**
- None detected - No outgoing webhook calls found in codebase
- Scheduled tasks via node-cron (Minipilot), but no external callbacks

## Data Processing & ETL

**File Ingestion:**
- Excel parsing: xlsx 0.18.5 (XLSX format)
- CSV parsing: csv-parse 5.5.0 (RFC4180 compliant)
- Word documents: mammoth 1.12.0 (DOCX to plain text/HTML)
- Location: `minipilot/server/index.js` - file upload endpoints transform to clean_data table

**Data Transformation:**
- Database pipeline in SQLite: uploaded_files → parse → clean_data → reports
- AI-powered extraction in Minipilot: Document analysis via Claude/Mistral/Ollama

## Rate Limiting & Quotas

- None detected - No express-rate-limit or similar
- Minipilot AI calls: No rate limiting on API calls
- File uploads: Multer memory limits (not configured, defaults apply)

## API Endpoints (Minipilot Server)

**Health & Status:**
- `GET /api/health` - Health check (used in Docker healthcheck)

**AI Mode Management:**
- `GET /api/ai/mode` - Get current AI provider
- `POST /api/ai/mode` - Switch between "local" and "premium" modes

**File Operations:**
- `POST /api/upload` - Upload Excel/CSV/Word files
- `GET /api/files` - List uploaded files
- `DELETE /api/files/:id` - Delete file

**Data Processing:**
- `GET /api/data` - Retrieve parsed data rows
- `GET /api/data/export` - Export as CSV or JSON
- `GET /api/reports` - List generated reports

**Workspace Management:**
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace

---

*Integration audit: 2026-03-24*
