# Publishing Ascend by Coheron

This guide covers how to deploy the app to a production environment so it’s publicly accessible.

---

## How production works

- **Single Node server** serves both the API and the built frontend:
  - All `/api/*` requests go to the Hono app (auth, profiles, AI, jobs, etc.).
  - Static files (JS, CSS) are served from `dist/assets/`.
  - Any other path (e.g. `/dashboard`, `/profiles`) is served `dist/index.html` (SPA client-side routing).
- **Build steps:** `npm run build` (frontend → `dist/`) and `npm run build:server` (server → `dist/server.js`). Then `npm run start` runs `node dist/server.js`.
- **Requirements:** PostgreSQL database, environment variables (see below).

---

## 1. Environment variables

Configure these in your hosting dashboard (or `.env` in production).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/ascend`) |
| `NEXTAUTH_URL` | Yes | Full app URL (e.g. `https://your-app.railway.app`) |
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | Yes | Random secret for signing cookies (e.g. `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | Yes | For AI features (tailor, optimize, interview prep, etc.) |
| `PORT` | No | Server port (default `3000`; most hosts set this automatically) |
| `RAPIDAPI_KEY` | No | For job search (JSearch API) |
| `FIRECRAWL_API_KEY` | No | For optional crawl/search features |
| `STORAGE_PATH` | No | Directory for uploads (default `data/uploads`) |
| `CORS_ORIGIN` | No | Allowed origin (default `*`; set to your frontend URL if needed) |

**Google OAuth:** In [Google Cloud Console](https://console.cloud.google.com/) create OAuth 2.0 credentials. Set authorized redirect URI to `https://<your-domain>/api/auth/callback/google`.

---

## 2. Deploy with Railway

1. **Create a project:** [railway.app](https://railway.app) → New Project.
2. **Add PostgreSQL:** In the project, Add Service → Database → PostgreSQL. Copy the `DATABASE_URL` from the Variables tab.
3. **Add the app:** Add Service → GitHub Repo (or “Empty” and connect later). Point to this repo.
4. **Build & start:**
   - **Build command:** `npm ci && npm run build && npm run build:server`
   - **Start command:** `npm run start`
   - **Root directory:** leave default (repo root).
5. **Variables:** In the service, Variables → add all required env vars (see table above). Set `NEXTAUTH_URL` to your Railway URL (e.g. `https://<service>.up.railway.app`).
6. **Deploy:** Railway builds and runs the server. Open the generated URL.

**Note:** Uploads use local disk by default (`data/uploads`). For persistence across deploys, use a volume or switch to cloud storage (e.g. S3/R2) and wire it in `get-app-env` / R2 adapter.

---

## 3. Deploy with Render

1. **Create a Web Service:** [render.com](https://render.com) → New → Web Service. Connect this repo.
2. **Build & start:**
   - **Build command:** `npm ci && npm run build && npm run build:server`
   - **Start command:** `npm run start`
3. **Database:** New → PostgreSQL; copy the Internal Database URL into `DATABASE_URL`.
4. **Environment:** In the Web Service, Environment → add all required variables. Set `NEXTAUTH_URL` to your Render URL (e.g. `https://<service>.onrender.com`).
5. **Deploy:** Render builds and runs the server.

---

## 4. Deploy with Docker

A Dockerfile runs the same build and a single Node process.

1. **Build the image** (from repo root):

   ```bash
   docker build -t ascend-app .
   ```

2. **Run with PostgreSQL** (example; replace with your DB URL):

   ```bash
   docker run --rm -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:pass@host:5432/ascend" \
     -e NEXTAUTH_URL="https://your-domain.com" \
     -e NEXTAUTH_SECRET="your-secret" \
     -e GOOGLE_CLIENT_ID="..." \
     -e GOOGLE_CLIENT_SECRET="..." \
     -e ANTHROPIC_API_KEY="..." \
     ascend-app
   ```

You can use the same image on any cloud (e.g. Fly.io, ECS, Cloud Run) and pass env vars via their UI or secrets.

---

## 5. Database migrations

Before or at deploy time, run Prisma migrations against the production database:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Do this once per deployment (e.g. in a release step or a one-off job).

---

## 6. Post-deploy checklist

- [ ] `NEXTAUTH_URL` matches the public URL (no trailing slash).
- [ ] Google OAuth redirect URI is `https://<your-domain>/api/auth/callback/google`.
- [ ] `DATABASE_URL` is correct and migrations have been run.
- [ ] Open `https://<your-domain>/api/health` and confirm `{ "status": "ok" }`.
- [ ] Sign in with Google and test one flow (e.g. profile or job search).

---

## 7. Optional: separate frontend and API

If you prefer to host the frontend and API separately:

- **Frontend:** Build with `npm run build` and deploy `dist/` to a static host (Vercel, Netlify, Cloudflare Pages). Set the API base URL via env (e.g. `VITE_API_URL`) and proxy or use full URLs for `/api`.
- **API:** Deploy only the Node server (e.g. `npm run build:server && npm run start`) and set `CORS_ORIGIN` to your frontend URL.

The app is currently set up for a **single server** that serves both; no code changes are required for the options above if you use the same server for API + SPA.
