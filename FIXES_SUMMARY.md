# Fixes Summary & Manual Test Guide

**Date:** Current session  
**Build status:** `npm run build` ✅ | `npm run build:server` ✅ | `npm run lint` ✅ (zero errors, zero warnings)

---

## What Was Fixed

### 1. Resume Tailor 500 error (`POST /api/profiles/:id/tailor`)

- **Parsing:** Wrapped AI response parsing in try/catch; log raw Claude response before parsing.
- **Markdown JSON:** `stripMarkdownJson()` strips \`\`\`json / \`\`\` before parsing; `extractJSON` uses it.
- **Token limit:** If profile + job description exceed 150k tokens, job description is truncated to first 2,000 characters; if still over limit, return **400** with `code: "TOKEN_LIMIT"`.
- **Parse failure:** If parsing fails after all attempts, return **200** with `{ rawText, parseFailed: true, code: "PARSE_ERROR" }` instead of 500 so the client can show raw text.
- **Error codes:** Distinct responses for `TOKEN_LIMIT` (400), `CONFIG_ERROR` (503), `AUTH_ERROR` (500), `PARSE_ERROR` (200 with fallback or 500 from API), `SERVER_ERROR` (500).
- **Streaming tailor:** On parse failure, final SSE event includes `rawText` and `parseFailed: true` for fallback display.
- **Tailor-enhanced:** Same pattern (log raw, try/catch, 200 + raw on parse failure, truncation, error codes).

### 2. Role Fit % inconsistency (job cards vs full analysis)

- **Single source:** Fit % comes only from `role_fit_assessments.fit_score`. Only **assess-fit** writes; **stored-fit-scores** and full analysis read via `getDisplayFitScore()` / `getStoredRoleFit()`.
- **Job key:** Same `generateJobKey(title, company, description)` for storing (assess-fit) and lookup (stored-fit-scores); description normalized to first 500 chars.
- **Job cards:** Show stored score or **"Not analysed"**; no quick-estimate. Use `getRoleFitDisplay()` and shared badge classes from `utils/roleFit.ts`.
- **Full analysis page:** Uses same `getRoleFitScoreBgClass` / `getRoleFitScorePanelClass` from `roleFit.ts` so styling matches.
- **match-scores API:** Returns **410 Gone** with message to use stored-fit-scores + assess-fit; legacy implementation removed so only one scoring path exists.

### 3. Optimize button / broken route (My Profiles → Optimize)

- **Navigation:** All Optimize entry points (My Profiles, Dashboard, ProfileBuilder) now use `navigate('/optimize')` with **no** `profileId` in state.
- **Optimize page:** Loads profiles via **GET /api/profiles/me** only (`useMyProfiles`). No profile → redirect to **/profiles** with `state: { message: "Create a profile first to optimize." }`.
- **Profiles page:** Shows dismissible amber banner when `location.state.message` is set; auto-opens profile builder when message is "Create a profile first to optimize." or `?create=true`.
- **Multiple profiles:** Profile selector (step 1) is shown; first profile is auto-selected, user can change before generating.
- **useMyProfiles:** Response is treated as array only; on non-array or fetch error, `profiles` set to `[]`.

### 4. Interview Prep failing to load (`/interview-prep/:applicationId`)

- **Lookup:** Application is fetched with **ownership check:** `WHERE id = :id AND profile.user_id = current_user.id` (single query with `include: { profile }`).
- **Logging:** Invalid id, not-found, and catch block log exact error (name, message, stack, full error).
- **Not found / no access:** Return **404** with clear message; frontend redirects to **/applications** with `state: { error: "..." }`.
- **Applications page:** Shows dismissible banner when `location.state.error` is set (e.g. after redirect from interview prep).
- **No job description:** If application exists but has no job description, API returns **200** with `application`, `profile`, `questions: []`, `noJobDescription: true`. Frontend shows amber card: “Add a job description to generate questions” and “Go to Applications”.

### 5. Job Search pagination (Load More)

- **Load More:** Single “Load More” button below results; calls `handleSearch(true)` which uses `currentPage + 1` and **appends** new jobs to `searchResults`.
- **Page param:** `page` is sent to **GET /api/jsearch** and forwarded to RapidAPI.
- **Result count:** Header shows **“Showing X of Y results”** (X = loaded count, Y = `totalResultsFromApi` when available, or “+” when more may exist).
- **Hide Load More:** When `!hasMoreResults` or when `totalResultsFromApi != null && searchResults.length >= totalResultsFromApi`.
- **Filters:** Query, location, and results-per-page are preserved when loading more (same state used for every request).
- **Numbered pagination:** Removed; only Load More remains. Unused `handleGoToPage` removed to satisfy lint/build.

---

## Build & Lint Fixes This Session

- **JobSearch.tsx:** Removed unused `handleGoToPage` (TS6133). Added `searchResults.length` to `handleSearch` useCallback deps to satisfy `react-hooks/exhaustive-deps`.

---

## Manual Testing Checklist

Run the app (`npm run dev` or your usual command), then:

1. **Resume Tailor**
   - Paste a JD and tailor; confirm success.
   - If you can trigger a bad/partial AI response, confirm you get 200 with raw text and no 500.
   - Confirm token limit message if you use an extremely long JD.

2. **Role Fit**
   - On Job Search, confirm cards show either a **number %** (from stored assessment) or **“Not analysed”**.
   - Run “Assess Fit” for a job from the full Role Fit flow; then on Job Search confirm the same job shows the **same %** on the card.

3. **Optimize**
   - From **My Profiles**, click **Optimize** on a profile → should go to `/optimize` (no ID in URL).
   - Confirm profile list loads from API; if you have one profile it’s pre-selected; if multiple, selector is shown.
   - With **no profiles**, open `/optimize` → should redirect to `/profiles` with message and builder open.

4. **Interview Prep**
   - From Applications, click **Prepare** (or similar) on an application → `/interview-prep/:id`.
   - Confirm questions load when the application has a job description.
   - For an application **without** job description, confirm the “Add a job description” card and “Go to Applications”.
   - Use an invalid or other user’s application ID → should redirect to `/applications` with an error banner.

5. **Job Search Load More**
   - Run a search (e.g. “engineer” + location).
   - Confirm “Showing X of Y results” (or “X+ results”) at top.
   - Click **Load More** → more jobs append; count updates; filters unchanged.
   - Keep loading until no more; confirm **Load More** disappears when all results are loaded.

---

## Remaining / Known Issues

- **npm warning:** `Unknown env config "devdir"` appears in build/lint; harmless, can be cleared in npm config if desired.
- **JSearch total:** “Y” in “Showing X of Y” depends on RapidAPI returning a total; if the API doesn’t, only “X+” is shown.
- **Browser testing:** The above checklist is intended to be run manually in the browser; no automated E2E was run in this session.
