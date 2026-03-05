## Ascend by Coheron

Ascend by Coheron is an AI-powered career copilot for job seekers.  
It helps users:

- **Build rich career profiles** (experience, education, skills, goals)
- **Parse and import resumes** to structured profile data
- **Optimize profiles and resumes** for specific roles and platforms
- **Search and track job opportunities** in one place
- **Prepare for interviews** with AI-generated questions and feedback
- **Manage data and privacy** with clear controls, exports, and deletion workflows

It runs as a modern **React + Vite SPA** front-end with a **Hono** backend on **Node.js**.

- **Backend**: Single Node server entry at `src/server.ts` using `@hono/node-server`. Data is stored in **PostgreSQL** (via **Prisma**) and the **local filesystem** for uploads. Set `DATABASE_URL` and run `npx prisma migrate deploy` (or `npx prisma migrate dev` for development) to apply migrations from `prisma/migrations/`.

---

## High-Level Architecture

At a high level Ascend consists of:

- **Frontend SPA** (React 19 + Vite + React Router)
  - Lives under `src/react-app`
  - Served by Vite in development (`npm run dev`); Vite proxies `/api/*` to `http://localhost:3000` so the app hits the Node backend. For production, build with `npm run build` and serve the `dist/` assets (e.g. via Node, nginx, or a CDN).
- **Backend API** (Hono)
  - `src/server.ts` runs the Hono app with Prisma (PostgreSQL) and local storage adapters (`src/node/`). Start with `npm run dev:server` or `npm run start`.
- **Shared Types & Validation**
  - `src/shared/types.ts` — shared Zod schemas and TypeScript types (profiles, applications, stats).
  - `src/env-types.ts` — backend environment types (`AppEnv`: Prisma client, R2-style bucket interface, API keys).
- **Data Layer**
  - PostgreSQL via Prisma (`DATABASE_URL`). Schema and migrations in `prisma/schema.prisma` and `prisma/migrations/`. Uploads under `data/uploads` (or `STORAGE_PATH`).
- **External Services**
  - **NextAuth.js** for auth (Google OAuth, JWT sessions; Prisma adapter for User/Account)
  - **Anthropic Claude** for all AI-powered flows (resume parsing, fit scoring, tailoring, interview prep, insights)
  - **Firecrawl** for crawling/scraping where needed
  - **RapidAPI jsearch** for job search aggregation

---

## Frontend Architecture (`src/react-app`)

### Tech Stack

- **React 19**, **React DOM**
- **Vite 7** (`npm run dev`, `npm run build`)
- **React Router** for in-app routing (`BrowserRouter`, `Routes`, `Route`)
- **Tailwind CSS** + `tailwindcss-animate` for styling and animation
- **shadcn-style UI primitives** under `src/react-app/components/ui/*`
- **Lucide Icons** (`lucide-react`)
- **DND Kit**, **Recharts**, **canvas-confetti**, **html-to-image** for rich UX

### Structure

- `src/react-app/main.tsx`
  - Vite entry; mounts React into `#root` and renders `<App />`.

- `src/react-app/App.tsx`
  - Wraps the app in custom `AuthProvider` (`src/react-app/contexts/AuthContext.tsx`) which uses `GET /api/auth/session` (Vite SPA; no NextAuth SessionProvider).
  - Configures the main route map:
    - `/` — landing/home
    - `/auth/callback` — after OAuth, redirects to `/dashboard` if session exists, else `/`
    - `/dashboard` — primary dashboard
    - `/profiles` — profile list/editor
    - `/optimize` — AI profile optimization
    - `/tailor` — resume tailoring against job descriptions
    - `/jobs` — job search and discovery
    - `/tracker` — application tracker (alternate path)
    - `/applications` — applications list & kanban-like view
    - `/interview-prep` / `/interview-prep/:applicationId` — interview preparation flows
    - `/resume` / `/resume/generate` — resume builder and generator
    - `/referrals` / `/referral` — referral-centric features and tracking
    - `/settings` — data & privacy, consent, export, deletion
    - Legal and policy pages: `/eula`, `/privacy-policy`, `/terms-of-service`

- `src/react-app/pages/*`
  - **Dashboard**: high-level overview, onboarding, quick actions, profile cards, metrics, and charts
  - **Profiles**: listing and editing of user profiles, driven by `/api/profiles` endpoints
  - **ProfileBuilder** (component) and **ProfileCompleteness**: rich profile editor + completeness scoring UI
  - **ResumeBuilder / ResumeGenerator / ResumeTailor**:
    - Upload and parse resumes, generate new resumes, and tailor content to job descriptions
  - **JobSearch**:
    - Integrates job search via `/api/jsearch` with **Load More** and **numbered pagination** when a total count is available. Displays “Showing 1–10 of N results” and preserves search query, location, and results-per-page when changing pages.
    - Outbound links to popular job boards and companies; platform/company tracking endpoints.
  - **Applications / ApplicationTracker**:
    - CRUD for applications (`/api/applications`),
    - Stats views and filtering by status (applied/interviewing/offered/rejected/accepted)
  - **InterviewPrep / InterviewPrepLanding**:
    - Uses AI-driven questions and feedback to help practice for interviews
  - **Settings**:
    - Integrates with `/api/data-privacy/*` for consent, data export, and account deletion
  - **Referrals**:
    - Referral sharing via WhatsApp/LinkedIn and server-side referral tracking
  - **CareerInsights**:
    - Derives metrics and career insights based on profiles and application data

- `src/react-app/components/*`
  - Layout: `SidebarLayout`, brand components (`AscendMark`, `CoheronMark`)
  - UI kit: buttons, cards, inputs, switches, tabs, dialogs, tables, sliders, etc. under `components/ui/*`
  - Feature components: `ProfileBuilder`, `ProfileCompleteness`, various insight cards and charts

- `src/react-app/hooks/useProfile.ts`
  - Encapsulates fetch logic for saving/loading profiles and listing the current user’s profiles.
- `src/react-app/utils/roleFit.ts`
  - Shared Role Fit display logic: `getRoleFitDisplay(score, loading)` (score vs loading vs “Not analysed”), `getRoleFitScoreBgClass`, `getRoleFitScorePanelClass`. Used by JobSearch cards and expansion panel so the same stored score is shown consistently.

---

## Backend Architecture

The backend is a single **Hono** application (`src/worker/index.ts`) that runs on **Node.js**. It wires together **NextAuth.js** (Google OAuth, JWT sessions), Prisma (PostgreSQL), object storage (local filesystem), and third-party APIs (Anthropic, Firecrawl, RapidAPI).

### Node.js runtime (`src/server.ts`)

- **Entry**: `src/server.ts` — uses `@hono/node-server`; listens on `process.env.PORT` or `3000`. Request handlers use `getEnv()` and `process.env` (no request-time bindings).
- **Env construction**: `src/node/get-app-env.ts` — reads `process.env`, creates a **Prisma** client (PostgreSQL) and the R2 adapter; `getEnv()` exposes a singleton for handlers.
- **Database**: **Prisma** + PostgreSQL. Schema in `prisma/schema.prisma`; run `npx prisma migrate dev` or `npx prisma migrate deploy` to apply migrations.
- **R2 adapter** (`src/node/r2-node.ts`): implements the same async API as R2 using the **local filesystem** (e.g. `data/uploads`). Keys map to paths; optional `.meta` files store content-type.

**Local development (PostgreSQL)**

1. Start a local PostgreSQL instance (e.g. with Docker):

   ```bash
   docker run --name ascend-db -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=ascend -p 5432:5432 -d postgres
   ```

2. Set `DATABASE_URL` in `.env` (or `.env.local`):

   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/ascend"
   ```

3. Apply the migration:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

Run the Node backend only (no Vite frontend):

```bash
npm run dev:server   # tsx watch — development with hot reload
# Server listening on http://localhost:3000
```

For production-style run: `npm run build:server` then `npm run start` (runs `node dist/server.js`). Use `tsconfig.server.json` for server builds so path aliases (`@/*`) resolve (or use a bundler if emitting with `tsc`).

### Environment & bindings

**Node.js** — set in `.env` or `.env.local` (or the process environment):

- `DATABASE_URL` — PostgreSQL connection string (required; e.g. `postgresql://postgres:password@localhost:5432/ascend`)
- `STORAGE_PATH` — directory for uploads (default: `data/uploads`)
- `PORT` — HTTP port (default: `3000`)
- `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `RAPIDAPI_KEY` — API keys
- `NEXTAUTH_URL` — canonical app URL (e.g. `http://localhost:5173` in dev)
- `NEXTAUTH_SECRET` or `AUTH_SECRET` — secret for signing cookies/session
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials

### Major Route Groups

**1. Health & Auth**

- `GET /api/health`
  - Simple JSON health check; returns `{ status: "ok", service: "ascend-worker" }`.
- `* /api/auth/*`
  - NextAuth.js: session, signin (Google), callback, signout, csrf, providers. See [NextAuth.js routes](https://next-auth.js.org/getting-started/rest-api).
- `GET /api/users/me`
  - Returns authenticated user (via `requireAuth`: NextAuth JWT from cookie).
- `GET /api/logout`
  - Clears NextAuth session cookie(s); returns 200.

**2. EULA, Data & Privacy**

- `GET /api/eula/status`
  - Returns EULA acceptance info and flags for age verification and marketing consent.
- `POST /api/eula/accept`
  - Records EULA acceptance, marketing consent, IP, user agent, and age verification.
- `GET /api/data-privacy/status`
  - Aggregates:
    - Current consent preferences
    - EULA acceptance info
    - Data inventory (profile count, applications count, etc.)
    - Pending data export / account deletion requests
- `POST /api/data-privacy/consent`
  - Upserts consent preferences (e.g. “help improve Ascend”).
- `POST /api/data-privacy/export-request`
  - Creates a pending data export request (later fulfilled via email).
- `POST /api/data-privacy/delete-account`
  - Creates a pending deletion request with a scheduled deletion date.
- `POST /api/data-privacy/cancel-deletion`
  - Cancels any pending deletion requests.

**3. Profiles & Resumes**

- `GET /api/profiles/me`
  - Lists profiles belonging to the current user, sorted by `updated_at`.
- `POST /api/profiles`
  - Create or update a profile from structured data (`ProfileSchema`), and writes related tables:
    - `experiences`, `education`, `skills`.
- `GET /api/profiles/:id`
  - Returns full structured profile including experiences, education, and skills.

Resume-oriented endpoints:

- `POST /api/resumes/upload`
  - Accepts file uploads (e.g. PDF/DOCX), stores them in **R2** under a generated key.
- `POST /api/resumes/parse`
  - Fetches resume file from R2, extracts text (using `mammoth` for DOCX, other strategies for PDFs), and sends to Claude to produce:
    - Name, email, phone, location, summary
    - Experiences, education, skills, other metadata
- `GET /api/resume-versions/:profileId`
  - Lists stored resume versions associated with a given profile.
- `POST /api/resume-versions`
  - Persists a tailored resume variant to the database.
- `GET /api/resume-versions/detail/:id`, `DELETE /api/resume-versions/:id`
  - Retrieve or delete individual resume versions.

**4. AI Profile Optimization & Tailoring**

- `POST /api/profiles/:id/assess-fit`
  - Computes how well a given profile matches a job description (Role Fit).
  - Uses Claude to score fit, extract required vs. candidate experience, and identify strengths and gaps.
  - Caches results in `role_fit_assessments` keyed by a normalized `job_key` (title + company + first 500 chars of description). Lookup is shared with job search cards via `getStoredRoleFit(userId, jobKey)` so the same score is shown on cards and the full Role Fit Analysis page; when no analysis has run, the UI shows “Not analysed”.
- `POST /api/profiles/me/assess-fit`
  - Convenience endpoint that targets the current user’s default profile.

- `POST /api/profiles/:id/optimize`
  - Generates platform-specific optimized profiles (LinkedIn, Naukri, Indeed, Foundit, Glassdoor). Supports streaming (`body.stream: true`) or non-streaming. Response keys are normalized to lowercase so the frontend can reliably map to platform tabs and strength scores.

- `POST /api/profiles/:id/tailor`
  - Uses Claude to generate a tailored resume from profile data, job title, company, and description.
  - Job description is truncated to 2000 characters to avoid token limits. AI response parsing is wrapped in try/catch; raw response is logged for debugging. Handles markdown-wrapped JSON via `extractJSON()`.
- `POST /api/profiles/me/tailor`
  - Convenience endpoint that targets the current user’s default profile.

- `POST /api/profiles/:id/generate-resume`
  - Generates a resume from a profile, without a specific JD, for general use.

**5. Job Search & Saved Searches**

- `GET /api/jsearch`
  - Wraps RapidAPI’s **jsearch** endpoint, using `RAPIDAPI_KEY`.
  - Query params: `query`, `location`, `country`, `page`, `num_results`. Returns job list and, when the API provides it, `totalResults` for “Showing 1–10 of N results” and numbered pagination on the frontend.
- `POST /api/jobs/stored-fit-scores`
  - Returns stored Role Fit scores for a list of jobs (same source as assess-fit). Used by job search cards; filters are preserved when paginating (Load More or go to page).
- `GET/POST /api/saved-searches`
  - CRUD around saved job searches:
    - `GET /api/saved-searches?profileId=...`
    - `POST /api/saved-searches`
    - `DELETE /api/saved-searches/:id`

**6. Applications & Tracking**

- `POST /api/applications`
  - Creates a new application record for a specific profile.
  - Enforces ownership by joining profiles on `user_id`.
- `GET /api/applications/me`
  - **New**: Returns all applications for the authenticated user across all profiles (used by `ApplicationTracker`).
- `GET /api/applications/:profileId`
  - Returns applications for a specific profile. Supports `profileId = "me"` to fall back to the user’s default profile.
- `PATCH /api/applications/:id`
  - Updates status, notes, match score, priority, interview date, contact name, and follow-up reminders.
- `DELETE /api/applications/:id`
  - Deletes an application, verifying ownership.
- `GET /api/applications/me/stats`
  - **New**: Aggregated counts across all of the user’s applications.
- `GET /api/applications/:profileId/stats`
  - Per-profile aggregation of application counts by status.

**7. Interview Prep**

- `POST /api/interview-prep/:applicationId`
  - Looks up the application by `applicationId` and the authenticated user’s ID (either `application.user_id` or `profile.user_id`). Returns 404 if not found. Frontend redirects to `/applications` when the application is missing or the response indicates “application not found”.
  - Uses application + job description + profile context to generate interview questions (with STAR answers) via Claude.
- `POST /api/interview-prep/feedback`
  - Takes the user’s free-text answer and returns AI feedback on how to improve.

**8. Referrals & Tracking**

- `GET /api/referral`
  - Returns information needed to render referral CTAs and share links.
- `POST /api/referral/track`
  - Tracks referral clicks.
- `POST /api/referral/convert`
  - Marks referral conversions.
- `POST /api/tracking/platform-referral`
  - Tracks when users click out to specific platforms (LinkedIn, Indeed, etc.).
- `POST /api/tracking/company-search`
  - Tracks clicks out to specific company career pages.

---

## Shared Types & Validation (`src/shared/types.ts`)

This file centralizes shapes shared by frontend and backend:

- `ProfileSchema` (`zod`)
  - Validates profile input on the server.
- `ProfileData`, `ProfileResponse`
  - Used in profile builder UIs and API responses.
- `Application`, `ApplicationStats`
  - Backed by the database and used in Applications & ApplicationTracker pages.

Using Zod at the boundary ensures that invalid shapes are rejected early and the database only sees trusted structures.

---

## Environment & Configuration

### Node backend and Vite (`.env` / `.env.local`)

Use `.env` or `.env.local` for local development. The **Node server** and **Vite** both read `process.env`.

**Backend (Node)**

- `DATABASE_URL` — PostgreSQL connection string (required)
- `PORT` — HTTP port (default: `3000`)
- `STORAGE_PATH` — uploads directory (default: `data/uploads`)
- `ANTHROPIC_API_KEY` — Claude API key
- `FIRECRAWL_API_KEY` — Firecrawl API key
- `RAPIDAPI_KEY` — RapidAPI key for jsearch
- `NEXTAUTH_URL` — canonical app URL (e.g. `http://localhost:5173` in dev)
- `NEXTAUTH_SECRET` or `AUTH_SECRET` — secret for signing cookies/session
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials (from Google Cloud Console)
- `CORS_ORIGIN` — optional; CORS allowed origin (default: `*`)


---

## Development Workflow

### Prerequisites

- **Node.js 18+** (LTS recommended; required for Vite, tsx, Prisma)
- **PostgreSQL** (local or remote) for the backend database
- **npm** (or pnpm/yarn; the project is configured for npm)

### Install

```bash
npm install
```

Copy or create `.env.local` with the required keys (see [Environment & Configuration](#environment--configuration)).

### Run locally

**Full stack (recommended)**

1. Start the API server:
   ```bash
   npm run dev:server
   ```
   API: `http://localhost:3000` (e.g. `GET /api/health`).

2. In another terminal, start the frontend:
   ```bash
   npm run dev
   ```
   App: `http://localhost:5173` (or next available port). Vite proxies `/api/*` to `http://localhost:3000`, so the app talks to the backend with no extra config.

**Frontend only**

- Run `npm run dev`; Vite runs on `http://localhost:5173`. Start `npm run dev:server` in another terminal so `/api` requests are proxied to the Node backend.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (frontend); proxies `/api` to `http://localhost:3000`. |
| `npm run dev:server` | Start Node backend with tsx watch (Hono on port 3000). |
| `npm run start` | Run built server: `node dist/server.js` (run `npm run build:server` first). |
| `npm run build` | Typecheck and Vite build (frontend). |
| `npm run build:server` | Compile server with `tsc -p tsconfig.server.json` → `dist/`. |
| `npm run lint` | Lint the codebase. |
| `npm run check` | Typecheck + Vite build. |

### Type checking, linting, build

```bash
npm run build   # tsc -b && vite build
npm run lint    # eslint
npm run check   # tsc && vite build
```

### Post-implementation verification (NextAuth)

With `npm run dev:server` and `npm run dev` running, confirm:

- [ ] `GET /api/health` returns 200
- [ ] `GET /api/auth/session` returns null when not logged in
- [ ] Clicking Sign In redirects to Google OAuth
- [ ] After Google login, `GET /api/auth/session` returns a user object
- [ ] `GET /api/users/me` returns the authenticated user (with session cookie)
- [ ] `GET /api/profiles/me` returns profiles for the logged-in user
- [ ] Logout clears session and redirects to home

---

## Deployment (Overview)

### Self-hosted Node (e.g. Vultr)

1. **Server**: Run the Node backend with a process manager (e.g. systemd, PM2).
   - Development: `npm run dev:server` (tsx watch).
   - Production: `npm run build:server` then `npm run start` (`node dist/server.js`), or run with `tsx --tsconfig tsconfig.server.json src/server.ts` if path aliases are not bundled.
   - Set env: `PORT`, `DATABASE_URL`, `STORAGE_PATH`, `ANTHROPIC_API_KEY`, `RAPIDAPI_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
2. **Frontend**: Run `npm run build` and serve the `dist/` directory (nginx, Node static middleware, or a CDN). Configure the app so API requests go to your Node backend (e.g. same host under `/api` or a separate API URL).
3. **Data**: Ensure PostgreSQL is available (`DATABASE_URL`), run `npx prisma migrate deploy`, and that `data/` (or `STORAGE_PATH`) exists for uploads.

---

## Recent Updates (Summary)

- **AI Optimize** (`/optimize`): Streaming and non-streaming responses; platform keys normalized (linkedin, naukri, etc.); loading overlay while generating.
- **Resume Tailor**: Job description capped at 2000 chars; try/catch and raw response logging around AI parsing; markdown-wrapped JSON handled.
- **Role Fit**: Single stored source (`getStoredRoleFit` + normalized `job_key`); job search cards and full analysis page show the same score; “Not analysed” when no assessment has been run.
- **Interview Prep** (`/interview-prep/:applicationId`): Application lookup by authenticated user (UUID); graceful redirect to `/applications` when not found.
- **Job Search**: Pagination via Load More and numbered pages; `page` and `num_results` passed to JSearch; “Showing 1–10 of N results”; filters preserved when paginating.

---

## Future Improvements & Notes

- **Config**: Consider `.env.example` listing all variables. For production (e.g. Vultr), use a process manager and secure env (e.g. systemd, PM2).
- **API docs**: A formal API reference (OpenAPI or Markdown) would help integrators.
- **Observability**: Add structured logging and metrics for production.

---

