# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- TypeScript 5 - All application code (Next.js frontend, Prisma ORM, API routes)
- JavaScript (Node.js ES modules) - Minipilot server backend (`minipilot/server/index.js`, 3677 lines)
- CSS 4 - Styling with Tailwind CSS 4 and custom tokens

**Secondary:**
- SQL - PostgreSQL schemas defined via Prisma
- HTML5 - Next.js app routing and component markup

## Runtime

**Environment:**
- Node.js v20 LTS (as of development; no .nvmrc, aligned with Docker node:20-alpine)
- Browser: React 19 (modern browser APIs required)

**Package Manager:**
- npm (package-lock.json present in all projects)
- Lockfile: Present in `/app/`, `/minipilot/server/`, `/minipilot/` subdirectories

## Frameworks

**Core Frontend:**
- Next.js 16.1.6 - Full-stack React framework with server components, API routes, file-based routing
  - Location: `app/` project
  - React Compiler enabled (babel-plugin-react-compiler 1.0.0)

**Backend:**
- Express 4.21.0 - HTTP server for Minipilot backend
  - Location: `minipilot/server/index.js`
  - Serves file uploads, CSV/XLSX parsing, AI integration, database layer

**Testing:**
- ESLint 9 - Code linting (eslint-config-next 16.1.6 for Next.js rules)
- No test runner detected (Jest/Vitest not in dependencies)

**Build/Dev:**
- Tailwind CSS 4 - Utility-first CSS with custom design tokens
- PostCSS (@tailwindcss/postcss 4) - CSS processing pipeline
- Prisma 7.5.0 - TypeScript ORM with migrations and type generation

## Key Dependencies

**Critical:**
- @prisma/client 7.5.0 - Type-safe database client for PostgreSQL
- @prisma/adapter-pg 7.5.0 - Prisma PostgreSQL adapter with Neon serverless support
- React 19.2.3 - UI library with latest hooks and features
- React 19.2.3 - DOM rendering

**AI/LLM Integration:**
- @anthropic-ai/sdk 0.39.0 - Claude API client (used in Minipilot server for premium AI mode)
- @mistralai/mistralai 1.15.1 - Mistral cloud API client (fallback in Minipilot)
- Ollama (external, not in npm) - Local LLM via HTTP API (localhost:11434), 100% offline mode

**Form & Validation:**
- react-hook-form 7.71.2 - Uncontrolled form state management
- @hookform/resolvers 5.2.2 - Schema validation resolver integration
- zod 4.3.6 - TypeScript-first schema validation library

**Data Processing:**
- better-sqlite3 11.0.0 - Embedded SQLite database (local Minipilot workspace data)
- xlsx 0.18.5 - Excel (.xlsx) file parsing and writing
- csv-parse 5.5.0 - CSV file parsing (sync mode)
- mammoth 1.12.0 - Microsoft Word (.docx) file parsing

**UI Components & Styling:**
- recharts 3.8.0 - Composable React charts for KPI dashboards
- lucide-react 0.577.0 - Icon library (15x15 px SVG icons for nav)
- class-variance-authority 0.7.1 - Type-safe component variant system
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Merge Tailwind class conflicts

**HTTP & Real-Time:**
- express 4.21.0 - Web framework
- cors 2.8.5 - CORS middleware (minipilot server)
- multer 1.4.5-lts.1 - Multipart form upload middleware
- ws 8.19.0 - WebSocket support (dependency, not actively used in main app)
- @types/ws 8.18.1 - TypeScript types for WebSocket

**Database:**
- pg 8.20.0 - PostgreSQL client (used via Prisma, supports Neon serverless)
- @neondatabase/serverless 1.0.2 - Neon serverless PostgreSQL adapter
- @types/pg 8.18.0 - TypeScript types for pg client

**Utilities:**
- uuid 10.0.0 - UUID v4 generation (used in Minipilot for file/row IDs)
- dotenv 16.4.0 - Environment variable loading from .env files
- node-cron 4.2.1 - Scheduled task runner (Minipilot cron jobs)

**Development:**
- @types/node 20 - TypeScript types for Node.js APIs
- @types/react 19 - TypeScript types for React 19
- @types/react-dom 19 - TypeScript types for React DOM
- TypeScript 5 - TypeScript compiler

## Configuration

**Environment:**
- `.env` files expected at project root
- Key variables: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `MISTRAL_API_KEY`, `OLLAMA_BASE_URL`, `AI_MODE`, `PORT`, `NODE_ENV`
- Minipilot server loads .env from `minipilot/server/.env` (relative to server index.js)
- App loads from root or via prisma.config (Prisma 7 datasourceUrl)

**Build:**
- `tsconfig.json` in `/app/` - ES2017 target, strict mode enabled, path aliases `@/*` → `./src/*`
- `next.config.ts` in `/app/` - React Compiler enabled
- `tailwind.config.js` in project root - Shared LiteChange design system tokens (imported by all projects)
- `prisma/schema.prisma` in `/app/` - PostgreSQL schema with 20+ enums and entities

**Deployment:**
- Dockerfile in `minipilot/` - Multi-stage Alpine build (node:20-alpine)
- docker-compose.yml in `minipilot/` - Orchestrates app + Ollama service with persistent volumes
- Health check: `curl http://localhost:3000/api/health`
- Vercel-aware deployment detection: `process.env.VERCEL` and `process.env.DOCKER`

## Platform Requirements

**Development:**
- Node.js 20+ (npm included)
- Optional: Docker + Docker Compose for full local stack with Ollama
- PostgreSQL 12+ (local or Neon serverless)
- Optional: Ollama running on localhost:11434 for offline AI mode

**Production:**
- Docker image based on node:20-alpine (3-layer build: frontend, production, runtime)
- Alpine Linux with Python 3 + build tools + sqlite for better-sqlite3 compilation
- Environment: Vercel or Docker container
- Volumes: `/data/` for SQLite DB, `/app/server/uploads/` for file storage
- Port: 3000 (HTTP)

---

*Stack analysis: 2026-03-24*
