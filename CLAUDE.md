# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (tsc -b) then build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build locally

npx vitest                        # Run all tests (uses vitest.config.ts)
npx vitest NewTrip.test.tsx       # Run a single test file
```

**Full check pipeline before pushing**: `npm run build && npm run lint`

## Architecture

Packing Helper is a React SPA for managing trip packing lists. Users build a personal item inventory, create trips (with destination, dates, temperature, activities), and get AI-generated packing suggestions.

**Data flow**: React pages → `src/lib/db.ts` Firestore helpers → Firebase Firestore. AI suggestions go through `src/lib/ai.ts` → `/api/generate` (Vercel serverless) → Google Gemini API. The serverless proxy exists specifically to keep `GEMINI_API_KEY` server-side only.

**Auth**: Firebase Authentication (email/password). All Firestore documents have a `user_id` field; row-level security is enforced by Firebase Security Rules, not application code.

**Key files**:
- [src/lib/schema.ts](src/lib/schema.ts) — TypeScript interfaces for 4 Firestore collections (`Tag`, `Item`, `Trip`, `TripItem`)
- [src/lib/db.ts](src/lib/db.ts) — All Firestore CRUD helpers and `seedDefaultData()` (pre-populates tags + 50+ items on first login)
- [src/lib/countries.ts](src/lib/countries.ts) — UN country list + `getFlagEmoji()` helper
- [src/lib/ai.ts](src/lib/ai.ts) — Frontend client that POSTs to `/api/generate`
- [api/generate.ts](api/generate.ts) — Vercel serverless function; sole consumer of `GEMINI_API_KEY`
- [src/App.tsx](src/App.tsx) — React Router config (4 routes, protected behind auth check)
- [src/components/Layout.tsx](src/components/Layout.tsx) — Auth wrapper + nav shell

**Data model**: The `Category` collection has been removed. Everything is unified under `Tag` with `type: 'activity' | 'temperature' | 'category'`. Items carry all their tags in a single `tags: string[]` array — categories, activities, and temperatures all live there. Trips reference tag IDs for `temperature` (single) and `activities` (array). `generateListForTrip()` filters items by OR-matching any item tag against trip tags. `TripItem` is a junction collection linking items to trips with `is_packed` and optional `quantity`.

**Quantity system**: Items have an optional `quantity_relevant: boolean` and `default_quantity: number`. When a trip is generated, quantity-relevant items get their `default_quantity` copied into `TripItem.quantity`. The TripView checklist shows a `−/qty/+` stepper for these items.

**UI**: Base UI primitives (`@base-ui/react`) wrapped in `src/components/ui/`, styled with Tailwind CSS utility classes. Theme uses HSL CSS custom properties in [src/index.css](src/index.css) with dark mode support. Glassmorphism cards via `.glass-card` utility. Path alias `@/` resolves to `src/`. Country flags rendered as emoji via `getFlagEmoji()` — used in NewTrip form, TripView header, and Dashboard cards.

## Pages

| Route | File | Description |
|---|---|---|
| `/` | Dashboard.tsx | Trip grid with stats, country flags on cards |
| `/inventory` | Inventory.tsx | Tag management (add/rename/delete per type) + item grid with slide-over edit drawer |
| `/new-trip` | NewTrip.tsx | Trip creation form with inline 2-month calendar, country combobox |
| `/trip/:id` | TripView.tsx | Packing checklist with quantity steppers, AI suggestions, country flag header |

## Vite / Vitest config split

- `vite.config.ts` — production build config only (no `test` block)
- `vitest.config.ts` — test config using `vitest/config` (separate to avoid TS errors in Vercel builds)

## Environment Variables

Requires a `.env` file with `VITE_FIREBASE_*` keys (all exposed to the browser) and `GEMINI_API_KEY` (server-side only, no `VITE_` prefix). See [architecture.md](architecture.md) for the full list.

## Testing

Tests live in `src/__tests__/`. Uses Vitest + React Testing Library + jsdom. Mock Firestore helpers with `vi.mock()`. See [src/__tests__/NewTrip.test.tsx](src/__tests__/NewTrip.test.tsx) for the established pattern.
