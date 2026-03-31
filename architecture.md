# Packing Helper Architecture

This document serves as an overview of the technical architecture for the Packing Helper application. It is designed to familiarize new developers with the technology stack, directory structure, data models, and the AI integration strategy.

## 1. High-Level Overview
Packing Helper is a modern Single Page Application (SPA) that assists users in tracking their customizable inventory items and dynamically generating packing lists for different trips based on destination parameters (like temperature and chosen activities). 

The application is heavily frontend-driven but employs a robust real-time cloud database and a serverless AI function.

## 2. Technology Stack
Our stack emphasizes modern React ecosystem standards, strong TypeScript safety, and developer-friendly aesthetics:

**Frontend Ecosystem:**
*   **Vite**: For rapid and highly optimized local development and production bundling.
*   **React (v18+)**: Standard component-driven UI.
*   **TypeScript**: Ensures type safety across all React components and Firebase data fetching.
*   **React Router (v6+)**: Handles frontend routing and route protection.

**Styling & UI:**
*   **Tailwind CSS (v3)**: Deeply integrated utility-first styling.
*   **Shadcn/UI**: Acts as the un-styled, fully accessible primitive component library (cards, inputs, dialogs, buttons), styled out of the box using our central Tailwind variables.

**Backend Services:**
*   **Firebase Authentication**: Manages secure email/password sessions.
*   **Firebase Firestore**: A NoSQL document database configured to seamlessly synchronize states across clients.
*   **Vercel Serverless Functions**: Specifically utilized to encapsulate and hide the Google Gemini LLM API interactions dynamically without configuring a dedicated monolithic backend server.

## 3. Directory Structure
```
packing-helper/
├── api/                # Vercel Serverless Functions
│   └── generate.ts     # Proxy endpoint that securely queries the Gemini API
├── src/
│   ├── components/     
│   │   ├── ui/         # Shadcn raw primitives
│   │   └── Layout.tsx  # Core layout wrapper managing the sidebar & auth state
│   ├── lib/
│   │   ├── ai.ts       # Frontend client that calls the backend /api
│   │   ├── db.ts       # Centralized Firestore query/mutation helpers
│   │   ├── firebase.ts # Startup configuration for standard Firebase 
│   │   └── schema.ts   # Core TypeScript interfaces for Firestore documents
│   ├── pages/          # Full Route views (Dashboard, TripView, Inventory...)
│   ├── App.tsx         # Central React Router switch board
│   └── index.css       # Tailwind directives & centralized UI Color Tokens
├── .env                # Holds public Firebase config & private GEMINI_API_KEY
├── tailwind.config.js  # Heavily configured Shadcn extension rules
└── vite.config.ts      # Enters path aliases handling `@/` structure
```

## 4. Database Schema (Firestore NoSQL)

Firestore operates strictly on Collections containing Documents. Every document securely stores a `user_id` property string pointing to the Firebase Authentication UID to enforce row-level security.

### Core Collections:
1.  **categories**: `{ name: string, user_id: string }`
    Provides grouping semantics for items (e.g., "Toiletries", "Electronics").
2.  **tags**: `{ name: string, type: 'activity' | 'temperature' | 'general', user_id: string }`
    Allows dynamic labeling of items for AI and exact-match trip matching (e.g., "Beach", "Cold").
3.  **items**: `{ name: string, category_id: string, tags: string[], user_id: string }`
    The universal inventory list of all objects the user actually owns.
4.  **trips**: `{ name: string, date_start: string, date_end: string, temperature: string, activities: string[], user_id: string }`
    The orchestrator document. Defines a specific journey.
5.  **trip_items**: `{ trip_id: string, item_id: string, is_packed: boolean }`
    The junction collection mapping global `items` distinctly to `trips`, recording volatile UI state (`is_packed`).

## 5. Security Architecture

### Public Client Configuration
The Firebase client connection logic inside `src/lib/firebase.ts` depends on environment variables prefixed with `VITE_` (e.g., `VITE_FIREBASE_API_KEY`). These are exposed to the public browser intentionally. Security is maintained entirely inside *Firebase Security Rules*, verifying the user's secure authentication tokens rather than obfuscating the endpoint keys themselves.

### Secure Hidden Integrations (Gemini API)
Because the Google Gemini API bills linearly based on external token calls, the `GEMINI_API_KEY` operates entirely on the backend and lacks the `VITE_` prefix. 
Instead of rendering inside React, it lives exclusively in Vercel's secure process environment inside `api/generate.ts`. The frontend merely points an anonymous fetch sequence to our domain's `/api/generate` endpoint, protecting us from arbitrary API scraping directly from the browser window.

## 6. Deployment
The application deploys natively to **Vercel**. When connected to a GitHub repository, Vercel analyzes the file tree and splits the architecture simultaneously:
*   Builds the `/src` using Vite's production command into a cached static edge CDN.
*   Spawns the `/api` directory into rapid serverless Node environments.
