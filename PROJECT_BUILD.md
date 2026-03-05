# Project build — end-to-end

**Ascend by Coheron** is a modular monorepo: React + Vite frontend (`apps/web`), Hono API (`apps/api`), shared packages (`packages/*`), and infrastructure.

---

## 1. Repository structure

```
apps/
  web/          # React + Vite frontend (pages, components, hooks, services, state, utils, styles)
  api/          # Hono backend (server, app, routes, services, jobs, middleware, utils, db)

packages/
  database/     # Prisma schema and client
  auth/         # NextAuth configuration (createAuthOptions)
  ai/           # Anthropic integration, prompts, structured JSON
  scraping/     # Firecrawl service (cache, rate limit, retry)
  queue/        # BullMQ queues and workers (AIJob + Redis or DB poller)
  validation/   # Zod schemas (API input and AI output)
  shared/       # Shared types and helpers (ProfileSchema, etc.)

infrastructure/
  docker/       # Dockerfile (builds frontend + backend, serves both)
  scripts/      # build-all.sh, etc.
```

- **Frontend** does not access the database; all server communication goes through `apps/web/src/services/api.ts` (and `lib/api-client.ts`).
- **Branding** is a single reusable wordmark: `apps/web/src/components/ui/AscendLogo.tsx` (wordmark “ASCEND” with green “D”, line, and “A Coheron Product”). All UI branding uses this component; no legacy logo imagery.
- **API** delegates to services and packages; routes validate input with Zod and return `{ success, data?, error? }`.
- **Env** is validated at API startup (Zod); server fails fast if required variables are missing.
- **Logging** is centralized with Pino (API requests, AI usage, job processing, errors). Request IDs are attached to all requests and logs.
- **Health** endpoints: `GET /api/health`, `/api/health/db`, `/api/health/queue`. Rate limiting applies to AI, resume, and job-fit routes.

---

## 2. Prerequisites

- **Node.js** 20+ (LTS)
- **npm** (v7+ for workspaces)
- **PostgreSQL** (for `DATABASE_URL`)
- **Optional:** Redis (for BullMQ; if unset, API uses a DB poller for async jobs)

---

## 3. Environment variables

A **template** with all supported variables (placeholder values only) is in the repo root:

**`.env.example`** — Copy to `.env`, fill in real values, and do not commit `.env`.

Set in repo root `.env` or in the environment. The API validates at startup.

**Required:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | NextAuth JWT signing secret |

**Optional:**

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Full app URL (e.g. `http://localhost:5173` in dev) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `ANTHROPIC_API_KEY` | Anthropic AI |
| `FIRECRAWL_API_KEY` | Firecrawl scraping |
| `REDIS_URL` | Redis URL for BullMQ (e.g. `redis://localhost:6379`) |
| `CORS_ORIGIN` | CORS origin (default `*`) |
| `PORT` | API port (default `3000`) |
| `STORAGE_PATH` | Local uploads path (default `data/uploads`) |

No secrets are exposed to the frontend.

---

## 4. One-time setup

From the **repo root**:

1. **Environment** — Copy the template and set required variables:
   ```bash
   cp .env.example .env
   # Edit .env: set DATABASE_URL and NEXTAUTH_SECRET (or AUTH_SECRET)
   ```
2. **Dependencies and Prisma**:
   ```bash
   npm install
   cd packages/database && npx prisma generate && cd ../..
   ```
3. **Database schema** (one of):
   ```bash
   npx prisma db push --schema=packages/database/prisma/schema.prisma
   # OR
   npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
   ```

---

## 5. Development (two processes)

**Terminal 1 — API:**

```bash
npm run dev:api
```

- Runs from `apps/api` with `tsx watch`; listens on **3000**
- Validates env, starts job worker, serves `/api/*` and (if present) static from `apps/api/dist`

**Terminal 2 — Frontend:**

```bash
npm run dev
```

- Runs from `apps/web` (Vite); default port **5173**
- Proxies `/api` to `http://localhost:3000`

Use **http://localhost:5173**; API calls go through the proxy.

---

## 6. Full production build

From the **repo root**:

```bash
npm run build
```

This runs, in order:

1. **build:packages** — `prisma generate` in `packages/database`
2. **build:api** — compile `apps/api` → `apps/api/dist`
3. **build:web** — Vite build `apps/web` → `apps/web/dist`
4. **build:merge** — copy `apps/web/dist/*` into `apps/api/dist/` so the API can serve the SPA

Result: **`apps/api/dist/`** contains the compiled server and the built frontend (index.html, assets/).

---

## 7. Running production

From the **repo root**:

```bash
npm run start
```

- Runs `npm run start -w @ascend/api` → **`tsx dist/server.js`** with **cwd** = `apps/api`
- **tsx** is used so the compiled server can load workspace packages (`@ascend/auth`, etc.) from TypeScript source
- Requires `apps/api/dist/server.js` and (after full build) `apps/api/dist/index.html` and `apps/api/dist/assets/`
- Server listens on `PORT` (default 3000), serves `/api/*` and static from `dist/`

Open **http://localhost:3000** (or your `PORT`).

---

## 8. NPM scripts (root)

| Script | Purpose |
|--------|---------|
| `build` | build:packages → build:api → build:web → build:merge |
| `build:packages` | Prisma generate (database package) |
| `build:api` | Compile API to `apps/api/dist` |
| `build:web` | Vite build to `apps/web/dist` |
| `build:merge` | Copy web dist into api dist |
| `dev` | Vite dev server (web) |
| `dev:api` | API dev with watch |
| `start` | Run API (production) |
| `check` | build:packages + build:api + build:web |
| `lint` | ESLint |
| `knip` | Dead code checks |

---

## 9. Docker

Build and run (from repo root):

```bash
docker build -f infrastructure/docker/Dockerfile -t ascend .
docker run -p 3000:3000 --env-file .env ascend
```

The Dockerfile:

- Installs dependencies and builds packages, API, and web
- Merges web build into API dist
- Production image runs **`npx tsx dist/server.js`** (so workspace TS packages load correctly) and serves both API and SPA

---

## 10. Verifying

- **Health:** `curl http://localhost:3000/api/health` → `{"success":true,"data":{"status":"ok","service":"ascend-api"}}` (also `/api/health/db`, `/api/health/queue`)
- **App:** Open `http://localhost:3000` and confirm SPA and auth/API work.

---

## 11. Minimal E2E checklist

1. Copy **`.env.example`** to **`.env`** and set **`DATABASE_URL`** and **`NEXTAUTH_SECRET`** (or **`AUTH_SECRET`**).
2. `npm install`
3. `cd packages/database && npx prisma generate && cd ../..`
4. Apply DB schema: `npx prisma db push --schema=packages/database/prisma/schema.prisma` (or migrate).
5. `npm run build`
6. `npm run start` (from root; server runs via `tsx dist/server.js` in `apps/api`).
7. Open **http://localhost:3000** and check **`/api/health`** if needed.

This is the complete end-to-end build and run path for the refactored app.
