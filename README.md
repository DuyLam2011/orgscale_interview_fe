# orgscale_interview_fe

Campaign Management UI built with React 18, TypeScript, Vite, TanStack React Query, Zustand, and Tailwind CSS.

## Quick Start

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

The app will be available at `http://localhost:5173`. The backend must be running — see `orgscale_interview_be`.

## Commands

```bash
npm run dev      # start Vite dev server with HMR
npm run build    # tsc type-check + production build
npm run lint     # ESLint (zero warnings allowed)
npm run preview  # serve the production build locally
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email + password login, JWT stored in localStorage |
| `/register` | New account registration |
| `/campaigns` | Paginated campaign list with status badges |
| `/campaigns/new` | Create campaign — name, subject, body, recipient selector |
| `/campaigns/:id` | Detail view: stats, recipient list, action buttons |

## UI Features

- **Status badges** — `draft` (grey), `scheduled` (blue), `sent` (green)
- **Action buttons** — conditionally shown: draft → Schedule / Delete; scheduled → Send Now / Delete; sent → none
- **Stats** — open rate and send rate displayed as labelled progress bars
- **Loading states** — skeleton loaders while fetching, spinners on mutations
- **Error handling** — API errors surfaced inline on forms and detail views
- **Auth persistence** — token survives page refresh via Zustand `persist` middleware

## Environment

```
VITE_API_BASE_URL=http://localhost:3000
```

---

## How Claude Was Used

This project was built with [Claude Code](https://claude.ai/code) as an AI pair-programmer. The frontend was initially scaffolded with entirely fake mock data — every API call was an in-memory simulation that reset on page refresh. The work described here is the process of turning that into a real, connected application.

---

### The Starting Brief

The frontend was built from the following specification:

**Pages**

- `/login` — login form, store JWT in memory or httpOnly cookie
- `/campaigns` — list campaigns with status badges, pagination or infinite scroll
- `/campaigns/new` — create campaign form (name, subject, body, recipient emails)
- `/campaigns/:id` — campaign detail: stats, recipient list, action buttons

**UI features**

Status badge colour-coding: `draft` = grey, `scheduled` = blue, `sent` = green. Action buttons conditionally shown based on status. Stats displayed as progress bar or simple chart. Error handling with meaningful API error messages. Loading states with skeleton loaders or spinners.

**Tech requirements**

React 18+ with TypeScript (Vite), React Query or SWR for data fetching, any component library (shadcn/ui, Chakra, MUI, or Tailwind), Zustand or Redux required.

---

### Prompt 1 — Giving the AI a persistent memory of the codebase

*"create a .claude folder for this React TypeScript Vite project — CLAUDE.md with rules for the stack (React 18, React Query v5 for server state, Zustand for auth token only, Tailwind, native fetch no axios, strict TypeScript), and a settings.json with a PostToolUse hook that runs npm run lint after every file edit plus permission rules that allow lint/build/dev but block npm install. The backend is a Node.js Express API at VITE_API_BASE_URL — document that all HTTP calls go through client.ts, snake_case mapping happens there, and server state never goes into Zustand."*

The backend already had a full `.claude/` context system with eight reference files, agent definitions, and slash commands. The frontend needed its own — but simpler, because the scope is narrower. Rather than recreating the same elaborate structure, the AI read every source file, inferred the conventions, and produced two files. `CLAUDE.md` documented the full stack, the folder structure with the purpose of every file, and a set of rules covering API calls, state management, types, component behaviour, and style. Critically it documented the one known inconsistency in the codebase: `RegisterPage` calls `fetch` directly instead of going through `client.ts`, so future code would not repeat that pattern. `settings.json` configured two things: a `PostToolUse` hook that runs `npm run lint` automatically after every file edit so TypeScript errors surface immediately, and permission rules that pre-approve `lint`, `build`, and `dev` while blocking `npm install` without discussion.

---

### Prompt 2 — Building the full React TypeScript frontend

*"setup a react typescript with React 18+ with TypeScript (Vite), React Query for data fetching, Tailwind, Zustand. Pages: /login, /campaigns, /campaigns/new, /campaigns/:id fine usage of MUI components"*

This prompt produced the entire frontend from scratch. The AI scaffolded a Vite + React 18 + TypeScript project, wired up React Router v6 with a `ProtectedRoute` wrapper that redirects unauthenticated users to `/login`, and established the two-layer state architecture the spec required: React Query for all server state (campaigns, recipients, stats) and a single Zustand store with `persist` middleware for the auth token so a page refresh does not log the user out.

Every page in the spec was built in one pass. `/login` posts credentials and stores the returned JWT. `/campaigns` fetches a paginated list via `useQuery`, renders colour-coded status badges (`draft` = grey, `scheduled` = blue, `sent` = green), and includes pagination controls backed by server-side `LIMIT`/`OFFSET` — the backend `list` controller runs a COUNT query with the same `created_by` ownership clause so the total is always scoped to the authenticated user. `/campaigns/new` fetches all recipients from `GET /recipients` and renders a searchable checkbox list — the spec said "recipient emails" but the backend requires `recipient_ids: uuid[]`, so the form resolves UUIDs from the recipient list before submitting. `/campaigns/:id` fetches the campaign and its stats in parallel, shows open rate and send rate as labelled progress bars, and renders action buttons conditionally by status: draft gets Schedule (with an inline `datetime-local` picker) and Delete; scheduled gets Send Now and Delete; sent gets nothing.

The HTTP layer was built as a single `request<T>()` wrapper in `client.ts` that attaches `Authorization: Bearer` headers from Zustand state, handles 401 auto-logout, and maps all snake_case response fields to camelCase in one place — so no page component ever touches raw API shapes. The backend needed `cors()` middleware added to allow requests from the Vite dev server. A `RegisterPage.tsx` was added alongside login because the backend had `POST /auth/register` with no corresponding frontend route. Skeleton loaders cover the loading state on the list and detail pages; API errors surface inline on forms and mutations.

---

### Prompt 3 — Full backend integration

*"this is the front-end version connected to the backend, but its using mock data, can you have them integrated — connect it to the real Express API using VITE_API_BASE_URL, remove all mock data and mock functions, and fix any contract mismatches between the frontend types and what the backend actually returns"*

At this point the frontend was visually complete but entirely fake. `src/api/client.ts` was an in-memory simulation — no network calls, no persistence, all data reset on every page refresh. `mockData.ts` held a static array of twelve campaigns that every page read from directly. Replacing this with a real integration required the AI to read both codebases simultaneously, map every frontend function call to its real backend counterpart, and resolve every contract mismatch. There were ten.

**The backend API surface.** Before any code changed, the AI catalogued every endpoint the frontend needed to call:

| Method | Path | Auth | Used by |
|--------|------|------|---------|
| `POST` | `/auth/register` | No | `RegisterPage` |
| `POST` | `/auth/login` | No | `LoginPage` — returns `{ user, token }` |
| `GET` | `/campaigns?page=&limit=` | Bearer | `CampaignsPage` — returns `{ data, total, page, limit, totalPages }` |
| `POST` | `/campaigns` | Bearer | `NewCampaignPage` — body: `{ name, subject, body, recipient_ids: uuid[] }` |
| `GET` | `/campaigns/:id` | Bearer | `CampaignDetailPage` — returns campaign + `recipients[]` with per-recipient `status` |
| `PATCH` | `/campaigns/:id` | Bearer | `CampaignDetailPage` — draft only, 403 otherwise |
| `DELETE` | `/campaigns/:id` | Bearer | `CampaignDetailPage` — draft only, 403 otherwise |
| `POST` | `/campaigns/:id/schedule` | Bearer | `CampaignDetailPage` — body: `{ scheduled_at: ISO8601 }`, must be future |
| `POST` | `/campaigns/:id/send` | Bearer | `CampaignDetailPage` — transitions to `sent`, irreversible |
| `GET` | `/campaigns/:id/stats` | Bearer | `CampaignDetailPage` — returns `{ total, sent, failed, opened, open_rate, send_rate }` |
| `GET` | `/recipients` | Bearer | `NewCampaignPage` — returns `{ id, email, name }[]` ordered by name |

All responses are snake_case JSON. All IDs are UUID v4. Campaign status is a three-value enum: `draft`, `scheduled`, or `sent` — there is no `sending` state. The `open_rate` and `send_rate` fields are decimals between 0 and 1, not percentages.

**VITE_API_BASE_URL.** The first change was structural: a `.env` file with `VITE_API_BASE_URL=http://localhost:3000` and a single `const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'` at the top of `client.ts`. Every `fetch` call is prefixed with this value, so switching environments requires changing one variable.

**Removing mock data.** `mockData.ts` and all imports of it were deleted. The in-memory `client.ts` functions were replaced with a real `request<T>()` wrapper around `fetch` that reads the auth token from `useAuthStore.getState()` (not the hook — this runs outside React), attaches `Authorization: Bearer <token>`, and throws a typed `ApiError` on non-2xx responses. On 401 it calls `logout()` and throws immediately. On 204 it returns `undefined` without attempting to parse a body.

**Recipient IDs vs emails.** The create-campaign form sent `recipientEmails: string[]` but the backend `POST /campaigns` requires `recipient_ids: uuid[]`. The mock never exposed this because it accepted anything. The fix required adding `GET /recipients` to the backend, fetching that list in `NewCampaignPage`, and changing the free-text email textarea to a searchable checkbox list. The `CreateCampaignRequest` type was updated from `recipientEmails` to `recipientIds`.

**Response shape mismatches.** The mock returned camelCase everywhere; the backend sends snake_case. A `mapCampaign()` function in `client.ts` converts `created_at → createdAt`, `scheduled_at → scheduledAt`, `created_by → createdBy`, and all `campaign_recipients` fields. All mapping is in one place — no page component sees raw API shapes. The `Recipient` type had `opened: boolean` but the backend sends `status: 'pending' | 'sent' | 'failed' | 'opened'`; the type was corrected and the detail page's recipient list was updated to derive opened state from the status string.

**Stats as a separate endpoint.** The mock embedded stats inside the campaign object. The real API separates them: `GET /campaigns/:id/stats` returns `{ total, sent, failed, opened, open_rate, send_rate }`. The detail page was updated to fire both `GET /campaigns/:id` and `GET /campaigns/:id/stats` in parallel via `Promise.all`, then merge the results before rendering.

**Schedule payload.** The mock's `scheduleCampaign()` took no arguments. The real endpoint requires `{ scheduled_at: ISO8601 }` in the request body. The Schedule button gained an inline `datetime-local` picker; the value is converted to an ISO string before being sent.

**Token persistence.** The mock never needed token storage — it was always "logged in". Connecting to a real backend meant a page refresh would call `useAuthStore.getState().token` and find `null`, causing every request to 401. Zustand's `persist` middleware was added to `authStore`, writing the token to `localStorage` under the key `"auth"` so the session survives refreshes.

**CORS.** The Vite dev server runs on port 5173; the Express API runs on 3000. The browser blocked every cross-origin request because the backend had no CORS header. `cors()` middleware was added to `app.js` before any route registration.

**Login response shape.** The mock's `login()` returned `{ token }`. The real backend returns `{ user, token }`. The `LoginResponse` type was updated and `LoginPage` was changed to destructure `token` from the response correctly.

**Pagination.** The mock returned a flat array. The real `GET /campaigns` returns `{ data, total, page, limit, totalPages }`. `getCampaigns()` was updated to accept `page` and `limit` parameters, pass them as query string arguments, and return a typed `PaginatedCampaigns` object. The backend `list` controller runs a COUNT query with the same `created_by: req.user.id` ownership clause as the data query — so the total is always scoped to the authenticated user, not all campaigns in the database.

Because all ten fixes were isolated in `client.ts` and the type layer, no page component needed to change its rendering logic. The components were already correct — they were just reading from the wrong source.

---

### Why the `.claude` folder matters

The backend's `.claude/` folder was built first and had eight context files. The frontend's is two files. The difference in size reflects the difference in complexity — but both serve the same purpose. Without `CLAUDE.md`, the integration work would likely have introduced axios, might have put server state in Zustand instead of React Query, would have missed the parallel stats fetch on the detail page, and would have gotten the snake_case mapping wrong in at least one place. The registration page might not have matched the existing visual style. Pagination might have stayed client-side. Context-first is not about writing documentation — it is about giving the AI enough institutional knowledge that short prompts produce correct, on-pattern implementations the first time.
