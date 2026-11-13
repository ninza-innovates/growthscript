# GrowthScript

Next.js application. The root layout sets the document title to GrowthScript and the description to "AI-powered performance marketing strategist."

## What it does

- `/` renders `src/app/page.tsx`, the default Next.js starter home page.
- `/login` takes an email and password and calls Supabase Auth `signUp` and `signInWithPassword`. After a successful sign-up or sign-in, the page navigates to `/dashboard`. The repository has no page for that path.
- `src/lib/supabase.ts` exports a browser Supabase client, which the login page uses.
- `src/lib/supabase-server.ts` exports async `createSupabaseServerClient`, which reads and writes auth cookies through `next/headers`. It is a separate module so the login page does not import `next/headers`. `cookies()` is async in Next.js 15.
- `src/lib/stripe.ts` exports a server-side Stripe client created with `STRIPE_SECRET_KEY` and API version `2025-08-27.basil` (the version the installed `stripe` types require).
- `src/lib/env.ts` checks those variables before the clients are created. A missing or blank value throws `MissingEnvError` with the variable name. `npm test` covers that check.

`@langchain/langgraph` and `@langchain/openai` are dependencies in `package.json`. No file under `src/` imports them.

## Tech stack

- Next.js 15.3 (App Router), React 19, and TypeScript
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Stripe (`stripe`)
- LangGraph and OpenAI (`@langchain/langgraph`, `@langchain/openai`)

## Prerequisites

- Node.js 22 (the version [CI](.github/workflows/ci.yml) uses)
- npm
- A Supabase project URL and anon key
- A Stripe secret key

## Setup

From the repository root:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Fill in the placeholders in `.env.local`. That file stays local because `.gitignore` ignores `.env*`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for the browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for the browser and server clients |
| `STRIPE_SECRET_KEY` | Stripe secret key for the server client in `src/lib/stripe.ts` |

`package-lock.json` is gitignored. Install dependencies with `npm install`.

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `npm run dev` | Dev server with Turbopack (`next dev --turbopack`) |
| `build` | `npm run build` | Production build (`next build`). Set the env vars above first. |
| `start` | `npm run start` | Serve the production build (`next start`) after `npm run build` |
| `lint` | `npm run lint` | ESLint through `next lint` |
| `test` | `npm test` | Unit tests for required env checks (`node --test` on Node 22) |

## Project structure

```
.
├── .env.example                  # env var names the app reads
├── .github/workflows/ci.yml      # npm install, lint, test, and build
├── .github/workflows/vercel.yml  # deploy to Vercel on push to main
├── public/                       # static SVGs
├── src/app/layout.tsx            # root layout and metadata
├── src/app/page.tsx              # home page
├── src/app/globals.css
├── src/app/login/page.tsx        # email and password auth
├── src/lib/env.ts                # checks for required env vars
├── src/lib/env.test.ts           # unit tests for those checks
├── src/lib/stripe.ts             # Stripe server client
├── src/lib/supabase.ts           # Supabase browser client
├── src/lib/supabase-server.ts    # Supabase server client (auth cookies)
├── next.config.ts
├── package.json
└── tsconfig.json                 # path alias @/* → ./src/*
```
