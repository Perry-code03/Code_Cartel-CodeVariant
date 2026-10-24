# Rules for The Project Graveyard (AGY: read this first, every session)

## Source of truth
- `docs/SPEC.md`: product, workflow, score formula, data model, seed data.
- `docs/DESIGN_BRIEF.md`: visual system, hero, motion map, accessibility.
- `docs/PROMPTS.md`: the ordered build prompts the user will give you.
If a prompt conflicts with these files, do the prompt, note the conflict in the summary, and update the doc line in the same task. Ask only if truly ambiguous or deleting data.

## Stack
Frontend (done, do not swap): Vite + React + TypeScript (strict), Tailwind CSS v4, shadcn/ui, Motion, react-router with HashRouter, Vitest.
Backend (Phase 2, allowed): Vercel serverless functions in `/api` (TypeScript, Web-standard `Request`/`Response` handlers). A hosted database or auth provider (e.g. Supabase) may be added ONLY when a prompt names it. No other servers, no separate backend repos.

## Backend rules (Phase 2)
- The browser calls our `/api/*` routes via `src/lib/api.ts`; client-side fallback fetches to third-party APIs (e.g. public GitHub) are allowed when the backend is unavailable.
- All secrets live in environment variables (`.env.local` for dev, Vercel dashboard for prod). Never in client code, never in git, never printed, never in logs. Keep `.env.example` with placeholder names only.
- Every API route must: allow only the methods it needs, validate input strictly (type, length, allowed characters), cap body size, use timeouts on outbound calls, return friendly errors without leaking upstream error bodies, and have basic rate limiting.
- Outbound hosts must come from a fixed allowlist, even when the host comes from an environment variable.
- Treat all external data (GitHub content, READMEs, model output) as untrusted. Validate model output against a strict schema in `src/lib/` before using it. Never execute or render it as HTML.
- Pure logic (parsing, validation, normalizing, scoring) stays in `src/lib/` with Vitest tests. API route files stay thin: they call lib functions.
- The app must keep working when the backend is down, a key is missing, or the AI provider rate-limits us: every backend feature has a local/manual fallback, and the UI says so honestly.
- Shared types between frontend and API live in `src/types/`. No `any`.
- Database changes (tables, auth, row-level security) need a written plan from you and my approval BEFORE you run anything. localStorage stays the source of truth until a prompt explicitly migrates it.
- Add a new package only if the prompt names it; otherwise run `npm view <pkg>` and show me the publisher, last publish date and weekly downloads first.

## The user
A beginner on Windows (PowerShell). After each task, explain in plain words what you did and define any new technical term in one line.

## Safety
- Never delete, move or overwrite anything outside this project folder.
- Ask before any delete command (Remove-Item, rm), before `git reset --hard`, and before installing any package that the prompt did not name. For an unnamed package, first run `npm view <pkg>` and show me the publisher, last publish date and weekly downloads.
- Never pipe a download into a shell. Never read or print `.env` files.
- Never use `--force` or `--legacy-peer-deps` to get past an install error. Show me the error and propose options.
- Never sign in, pay, or create accounts on my behalf. If a tool asks for login or a deploy needs one, stop and tell me. You may edit `.env.example`, but never create or read `.env.local` with real keys; I add those myself.

## Git
Before starting a prompt run `git status`. If the tree is dirty, ask me. When a prompt passes build + lint + tests, give me a one-line suggested commit message. I make the commits.

## Code rules
- TypeScript strict, no `any`.
- All logic (score, recommendations, status transitions, markdown export, oracle) lives in `src/lib/` as pure functions with unit tests. No formulas inside components.
- UI in `src/components/` and `src/pages/`. State in `src/store/`. Storage in `src/lib/storage.ts` only.
- Render user-provided text as text only. Never `dangerouslySetInnerHTML`.
- Every interactive element works with keyboard and has a visible focus ring.
- Animate `transform`, `opacity` and small `filter: blur` only. Never animate layout properties or `mask-position`. Respect `prefers-reduced-motion` everywhere.
- Keep file names, types and storage keys aligned with `docs/SPEC.md`, updating SPEC.md when requirements evolve.

## Honesty rules (these apply to UI copy too)
- The Resurrection Score is a "rule-based heuristic". Never call it AI, a prediction, or validated.
- The assistant ("Graveyard Oracle") is local rule-based by default with an optional opt-in serverless AI mode; UI copy must clearly distinguish them.
- Any feature that sends data off-device (GitHub Import, anything using an AI provider) must be opt-in, must name where data goes in one plain sentence in the UI, and must label AI-generated suggestions as "suggested by AI, please review".
- Never claim accounts, sync, hosted share links, private repo access, or any feature that does not exist yet.

## Third-party motion (transitions.dev)
Use only the FREE core transitions. Do NOT fetch, scrape or copy Pro-only recipes. Keep a comment `/* Based on transitions.dev (free core set) */` above adapted code.

## Verify, don't assume
After changes run `npm run build`, `npm run lint` and `npm test`. Report real output. Say clearly what you could not verify.

## When you finish a task
- Run this command once, as the very last step, to play a sound:
  powershell -c "[System.Media.SystemSounds]::Exclamation.Play()"
- Keep your final summary under 20 lines. Say what changed, which files changed, and how to see it.
- Only go over 20 lines when it is truly necessary, such as a bug that needs a detailed explanation or a decision I must make.
- Don't repeat the code in the summary.
