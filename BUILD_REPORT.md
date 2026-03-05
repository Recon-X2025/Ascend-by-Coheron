# Build Report — Ascend by Coheron

**Date:** Generated from current workspace state  
**Commands run:** `npm run build`, `npm run build:server`, `npm run lint`

---

## Summary

| Target | Status | Notes |
|--------|--------|--------|
| **Frontend build** (`npm run build`) | ✅ **PASS** | After fixes below |
| **Server build** (`npm run build:server`) | ❌ FAIL | Pre-existing tsconfig/type issues |
| **Lint** (`npm run lint`) | ❌ FAIL | 53 errors, 10 warnings (mostly `no-explicit-any`, unused vars) |

---

## 1. Frontend build (`npm run build`)

**Status: PASS** (after fixes)

**Script:** `tsc -b && vite build`

**Output:**
- TypeScript project build (tsc -b) succeeds.
- Vite build completes: 2440 modules, ~1.8 MB JS (gzip ~420 KB), ~102 KB CSS (gzip ~16 KB).
- Artifacts: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`.

**Fixes applied to get to green:**
1. **AuthUser type** (`src/react-app/contexts/AuthContext.tsx`)  
   - Added optional `google_user_data?: { given_name?: string; picture?: string; name?: string } | null` so SidebarLayout, Dashboard, and Settings compile when using `user?.google_user_data?.given_name` etc.

2. **NextAuth session callback** (`src/node/auth.ts`)  
   - Assigned `session.user.id` via cast: `(session.user as { id?: string }).id = ...` to satisfy TypeScript (default NextAuth user type has no `id`).

3. **R2 resume fetch** (`src/worker/index.ts`)  
   - Replaced direct `object.writeHttpMetadata` / `object.httpEtag` (not on Node R2 adapter type) with a safe cast and optional calls so both Cloudflare R2 and Node adapter shapes work.

---

## 2. Server build (`npm run build:server`)

**Status: FAIL**

**Script:** `tsc -p tsconfig.server.json`

**Errors (pre-existing):**
1. **src/server.ts (around line 20)**  
   - `Argument of type '{}' is not assignable to parameter of type 'ExecutionContext'` — Hono app is being run with an env object that doesn’t match the worker `ExecutionContext` type (e.g. missing `waitUntil`, `passThroughOnException`). This is a type mismatch between Node server and worker-style bindings.

2. **src/worker/index.ts (line 12)**  
   - `Module 'mammoth/lib/index' can only be default-imported using the 'allowSyntheticDefaultImports' flag` — need `allowSyntheticDefaultImports: true` (or equivalent) in the server tsconfig, or change the mammoth import to a namespace/require-style import.

**Config change made (for reference):**  
- `tsconfig.server.json`: set `allowImportingTsExtensions: false` so `tsc` can emit with `noEmit: false` (fixes TS5096). Server build still fails on the two issues above.

---

## 3. Lint (`npm run lint`)

**Status: FAIL** — 53 errors, 10 warnings

**Breakdown:**
- **@typescript-eslint/no-explicit-any:** ~45 occurrences (worker, several pages and components).
- **@typescript-eslint/no-unused-vars:** e.g. `parseErr`, `err`, `_jobUrl`, `locationScore`, `e`, `jsonString` (prefer const).
- **prefer-const:** 1 (worker).
- **react-hooks/exhaustive-deps:** 3 warnings (JobSearch, ResumeBuilder, ResumeTailor).
- **react-refresh/only-export-components:** 7 warnings (ProfileCompleteness, badge, button, tabs, AuthContext).

**Notable files:**  
`src/worker/index.ts`, `src/react-app/pages/ResumeTailor.tsx`, `src/react-app/pages/ResumeBuilder.tsx`, `src/react-app/pages/AIOptimize.tsx`, `src/react-app/components/ProfileBuilder.tsx`, others.

Lint does not block the frontend build; `npm run build` only runs `tsc -b && vite build`.

---

## 4. Recommendations

1. **Keep frontend build green**  
   - Avoid removing or narrowing `AuthUser.google_user_data` without updating all usages (SidebarLayout, Dashboard, Settings).

2. **Server build**  
   - Resolve `ExecutionContext` typing for the Node server (e.g. define a Node-specific env type and use it in `src/server.ts`).  
   - Enable `allowSyntheticDefaultImports` (or adjust mammoth import) in the server tsconfig so the worker compiles under that config.

3. **Lint**  
   - Tackle in batches: replace `any` with concrete types, remove or use unused variables, fix the few `prefer-const`/dependency-array issues.  
   - Consider relaxing or scoping `@typescript-eslint/no-explicit-any` for legacy files if you want lint to pass sooner while cleaning up types over time.

---

## 5. Commands reference

```bash
npm run build          # Frontend: tsc -b && vite build  → PASS
npm run build:server   # Server:  tsc -p tsconfig.server.json → FAIL
npm run lint           # eslint . → 53 errors, 10 warnings
npm run dev            # Vite dev server (proxies /api to backend)
npm run dev:server     # Node backend (Hono on port 3000)
```
