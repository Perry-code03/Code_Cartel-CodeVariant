# Rules for The Project Graveyard (AGY: read this first, every session)

## Source of truth
- `docs/SPEC.md`: product, workflow, score formula, data model, seed data.
- `docs/DESIGN_BRIEF.md`: visual system, hero, motion map, accessibility.
- `docs/PROMPTS.md`: the ordered build prompts the user will give you.
If a prompt conflicts with these files, STOP and ask. Do not silently pick.

## Stack (fixed, do not swap)
Vite + React + TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, Motion (`import ... from "motion/react"`), react-router with HashRouter, localStorage, Vitest.
No backend. No paid API. No secrets. No network calls at runtime. No analytics.

## The user
A beginner on Windows (PowerShell). After each task, explain in plain words what you did and define any new technical term in one line.

## Safety
- Never delete, move or overwrite anything outside this project folder.
- Ask before any delete command (Remove-Item, rm), before `git reset --hard`, and before installing any package that the prompt did not name. For an unnamed package, first run `npm view <pkg>` and show me the publisher, last publish date and weekly downloads.
- Never pipe a download into a shell. Never read or print `.env` files.
- Never use `--force` or `--legacy-peer-deps` to get past an install error. Show me the error and propose options.
- Never sign in, pay, or create accounts on my behalf. If a tool asks for login, stop and tell me.

## Git
Before starting a prompt run `git status`. If the tree is dirty, ask me. When a prompt passes build + lint + tests, give me a one-line suggested commit message. I make the commits.

## Code rules
- TypeScript strict, no `any`.
- All logic (score, recommendations, status transitions, markdown export, oracle) lives in `src/lib/` as pure functions with unit tests. No formulas inside components.
- UI in `src/components/` and `src/pages/`. State in `src/store/`. Storage in `src/lib/storage.ts` only.
- Render user-provided text as text only. Never `dangerouslySetInnerHTML`.
- Every interactive element works with keyboard and has a visible focus ring.
- Animate `transform`, `opacity` and small `filter: blur` only. Never animate layout properties or `mask-position`. Respect `prefers-reduced-motion` everywhere.
- Keep file names, types and storage keys identical to `docs/SPEC.md`.

## Honesty rules (these apply to UI copy too)
- The Resurrection Score is a "rule-based heuristic". Never call it AI, a prediction, or validated.
- The assistant ("Graveyard Oracle") is rule-based and runs locally. The UI must say so. Never imply an AI model.
- Never claim repo import, GitHub analysis, sync, accounts or hosted share links. None exist.

## Third-party motion (transitions.dev)
Use only the FREE core transitions. Do NOT fetch, scrape or copy Pro-only recipes. Keep a comment `/* Based on transitions.dev (free core set) */` above adapted code.

## Verify, don't assume
After changes run `npm run build`, `npm run lint` and `npm test`. Report real output. Say clearly what you could not verify.
