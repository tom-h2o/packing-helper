# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (tsc -b) then build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build locally

npx vitest                        # Run all tests
npx vitest NewTrip.test.tsx       # Run a single test file
```

## Architecture

Packing Helper is a React SPA for managing trip packing lists. Users build a personal item inventory, create trips (with destination, dates, temperature, activities), and get AI-generated packing suggestions.

**Data flow**: React pages → `src/lib/db.ts` Firestore helpers → Firebase Firestore. AI suggestions go through `src/lib/ai.ts` → `/api/generate` (Vercel serverless) → Google Gemini API. The serverless proxy exists specifically to keep `GEMINI_API_KEY` server-side only.

**Auth**: Firebase Authentication (email/password). All Firestore documents have a `user_id` field; row-level security is enforced by Firebase Security Rules, not application code.

**Key files**:
- [src/lib/schema.ts](src/lib/schema.ts) — TypeScript interfaces for all 5 Firestore collections (`Category`, `Tag`, `Item`, `Trip`, `TripItem`)
- [src/lib/db.ts](src/lib/db.ts) — All Firestore CRUD helpers and `seedDefaultData()` (pre-populates categories, tags, 50+ items on first login)
- [src/lib/ai.ts](src/lib/ai.ts) — Frontend client that POSTs to `/api/generate`
- [api/generate.ts](api/generate.ts) — Vercel serverless function; sole consumer of `GEMINI_API_KEY`
- [src/App.tsx](src/App.tsx) — React Router config (5 routes, protected behind auth check)
- [src/components/Layout.tsx](src/components/Layout.tsx) — Auth wrapper + sidebar shell

**Data model**: Items are tagged with `Tag` IDs (tags have `type: 'activity' | 'temperature' | 'general'`). Trips also reference tag IDs for temperature and activities. `generateListForTrip()` in db.ts filters items by OR-matching any item tag against trip tags. `TripItem` is a junction collection linking items to trips with `is_packed` status.

**UI**: Shadcn/UI primitives in `src/components/ui/`, styled with Tailwind CSS utility classes. Theme uses HSL CSS custom properties defined in [src/index.css](src/index.css) with dark mode support. Path alias `@/` resolves to `src/`.

## Environment Variables

Requires a `.env` file with `VITE_FIREBASE_*` keys (all exposed to the browser) and `GEMINI_API_KEY` (server-side only, no `VITE_` prefix). See [architecture.md](architecture.md) for the full list.

## Testing

Tests live in `src/__tests__/`. Uses Vitest + React Testing Library + jsdom. Mock Firestore helpers with `vi.mock()`. See [src/__tests__/NewTrip.test.tsx](src/__tests__/NewTrip.test.tsx) for the established pattern.
