# CLAUDE.md — orgscale_interview_fe

Read this before editing any file. These rules are not suggestions.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript (Vite 5) |
| Routing | React Router v6 (`BrowserRouter`) |
| Server state | TanStack React Query v5 |
| Client state | Zustand v4 with `persist` middleware |
| Styling | Tailwind CSS 3 |
| HTTP | Native `fetch` — no axios, no libraries |
| Auth | JWT stored in `localStorage` via Zustand persist (`"auth"` key) |

---

## Folder Structure

```
src/
  api/
    client.ts       # All HTTP calls + snake_case→camelCase mappers
    types.ts        # Domain types (Campaign, Recipient, CampaignStats, etc.)
    mockData.ts     # Dead code — do not use or import
  components/
    Navbar.tsx
    ProtectedRoute.tsx
    StatusBadge.tsx   # draft=gray, scheduled=blue, sent=green
    ProgressBar.tsx   # Used for send_rate and open_rate
    SkeletonLoader.tsx
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    CampaignsPage.tsx      # Paginated list
    NewCampaignPage.tsx    # Create form with recipient checkbox list
    CampaignDetailPage.tsx # Stats, recipients, action buttons
  store/
    authStore.ts    # { token, setToken, logout } — only Zustand store
  App.tsx           # Route table
  main.tsx
```

---

## Rules

**API calls**
- All HTTP requests go through `client.ts`. Never use `fetch` directly in a page or component.
- `RegisterPage` currently calls `fetch` inline — this is a known inconsistency. New code must use `client.ts`.
- All snake_case→camelCase mapping belongs in `client.ts` mappers (`mapCampaign`, `mapRecipient`, `mapStats`). Pages receive camelCase types only.
- `VITE_API_BASE_URL` controls the API origin (default `http://localhost:3000`).

**State**
- Server state (campaigns, recipients, stats): React Query (`useQuery`, `useMutation`). Do not put API data in Zustand.
- Client state (auth token only): Zustand `authStore`. Do not add more stores without a clear reason.
- Access Zustand state outside React components with `useAuthStore.getState()` — not the hook.

**Types**
- All domain types live in `api/types.ts`. Do not declare inline types that duplicate them.
- `CampaignStatus` is `'draft' | 'scheduled' | 'sent'`. The `sending` status does not exist in this implementation.

**Components**
- `StatusBadge` must reflect the colour rules from the spec: `draft`=gray, `scheduled`=blue, `sent`=green.
- Action buttons must be conditionally rendered based on campaign status:
  - `draft`: Schedule (with `datetime-local` picker), Delete
  - `scheduled`: Send Now, Delete
  - `sent`: no actions
- Show `SkeletonLoader` / `SkeletonDetail` while queries are loading. Show error messages when queries fail.
- `ProgressBar` takes `value` as 0–100 (multiply rate × 100 before passing).

**Style**
- Tailwind utility classes only — no CSS modules, no inline `style` props unless unavoidable.
- Match the visual patterns already in the codebase before inventing new ones.

**General**
- Read the file before editing it.
- Do not add dependencies without asking. The current stack is intentional.
- Do not import from `mockData.ts` — it is dead code.
- TypeScript strict mode is on. Fix type errors; do not use `any` or `// @ts-ignore`.

---

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check + build
npm run build

# Lint (zero warnings allowed)
npm run lint
```

API base URL is configured in `.env`:
```
VITE_API_BASE_URL=http://localhost:3000
```

---

## Spec Requirements (what this UI must satisfy)

- `/login` — login form, JWT stored in memory/localStorage
- `/campaigns` — list with status badges and pagination
- `/campaigns/new` — create form (name, subject, body, recipient emails)
- `/campaigns/:id` — detail: stats, recipient list, action buttons
- Status badge colours: draft=grey, scheduled=blue, sent=green
- Stats: open rate + send rate displayed as progress bar or chart
- Error handling: show API errors meaningfully
- Loading states: skeleton loaders or spinners
