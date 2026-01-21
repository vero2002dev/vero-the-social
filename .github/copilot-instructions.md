<!-- .github/copilot-instructions.md -->
# Copilot / AI Agent Instructions — Vero

Purpose: quick, actionable facts to make an AI coding agent productive in this repository.

Big picture
- This is a Next.js 13 app using the `app/` router (Server Components by default).
- UI entry: `app/layout.tsx` (root layout / font and CSS setup) and `app/page.tsx` (home).
- Auth-ish routes live in `app/login`, `app/signup`, `app/verify` — follow those folders for route changes.
- Single Supabase client in `lib/supabaseClient.ts` — the app reads public env vars and uses `@supabase/supabase-js`.

Key files & where to make changes
- `app/layout.tsx`: root HTML, fonts and global styles (see how `next/font` is used).
- `app/*.tsx` and `app/**/page.tsx`: primary route handlers and UI; prefer editing these for pages.
- `lib/supabaseClient.ts`: central Supabase client — change env names or usage here if integration changes.
- `package.json`: run scripts (`dev`, `build`, `start`, `lint`) and core dependencies.
- `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`: tool/config entry points.

Run / build / debug
- Development server: `npm run dev` (Next default, serves at http://localhost:3000).
- Build: `npm run build` then `npm run start` for production preview.
- Lint: `npm run lint` (runs `eslint` — check `eslint.config.mjs` if lint rules need updating).
- When testing integrations that require Supabase, set the env vars locally:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-url> NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key> npm run dev
```

Env & integration notes (important)
- Supabase client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `lib/supabaseClient.ts`.
- Those env keys are exposed client-side (prefixed with `NEXT_PUBLIC_`); keep only anon keys there.
- Deployments: app is standard Next.js and is compatible with Vercel; env vars must be configured in the deployment.

Project-specific conventions & patterns
- Uses the `app/` router (Server Components). Mark components with `'use client'` when they require client-side behavior.
- Font loading uses `next/font` (see `Geist` import in `app/layout.tsx`) and injects CSS variables for classname usage.
- Global CSS lives in `app/globals.css`. Tailwind is configured (check `postcss.config.mjs` and dependencies).
- Centralize external clients in `lib/` (example: `lib/supabaseClient.ts`) — prefer reusing this instead of creating new clients.

Dependency highlights
- `next` 16.x, `react` 19.x, `@supabase/supabase-js` — editing integration code should respect these versions.
- Tailwind v4 + `@tailwindcss/postcss` present — style changes should respect Tailwind conventions.

How to edit safely (quick rules for PRs)
- Keep changes scoped to `app/` routes for UI changes; avoid changing `lib/supabaseClient.ts` unless integration needs it.
- If adding client-side interactivity, add `'use client'` at the top of the file and keep server-only code out of it.
- When modifying env names or secrets, update `lib/supabaseClient.ts` and document the change in README and deployment settings.

Examples (call sites found)
- Supabase client creation: `lib/supabaseClient.ts` uses `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`.
- Root layout: `app/layout.tsx` shows `Geist` font usage and `app/globals.css` import.

If something's unclear or you want more detail (tests, CI, or deploy config), tell me which area and I'll expand this file.
