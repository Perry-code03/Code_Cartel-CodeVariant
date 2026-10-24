# AGY build prompts for The Project Graveyard

## How to use
1. Open PowerShell in the project folder and run `agy`. Start each new prompt in a fresh session (`/clear`) so context stays clean. AGY reads `AGENTS.md` automatically; the prompts also tell it to read the docs.
2. Paste ONE prompt at a time. Wait until it finishes and reports build/lint/test results. Run the app yourself and check the "Done when" list. Then commit.
3. Never use `--dangerously-skip-permissions`. Read `/diff` before approving edits.
4. If something breaks: `git status`, then `git restore <file>` for one file, or ask AGY to explain before it changes anything.
Priority order if time runs short: P1-P9 are the core loop. P10-P11 finish required features. P12 (Oracle) and P13 (polish) are extras. Never skip P13's build check.

---

## P0: Orientation (planning only, no edits). Start with: `agy --mode plan`
```
Read AGENTS.md, docs/SPEC.md and docs/DESIGN_BRIEF.md fully. Do NOT edit files or run commands that change anything.
Reply in plain language, for a beginner:
1. In 10 lines, restate what we are building and the 4 workflow stages.
2. List every conflict, gap or ambiguity you find between the three files (be specific).
3. List the routes, the main folders under src/, and the order you would build things.
4. List the packages you expect to install and why. Mark any you are unsure exist.
Ask me at most 3 questions, only if a decision truly blocks you.
```
Done when: you agree with its summary. Fix docs if it found real conflicts.

---

## P1: Scaffold and tooling
```
Read AGENTS.md first. Task: create the project foundation. Follow the official docs: https://vite.dev/guide/ and https://ui.shadcn.com/docs/installation/vite (verified: Vite needs Node 20.19+ or 22.12+; Tailwind v4 uses @tailwindcss/vite and no tailwind.config file).
Steps (PowerShell):
1. Run `git status`, `node -v`, `npm -v`, `git --version`. If Node is too old, STOP and tell me.
2. The current folder is not empty (docs/, AGENTS.md, .git). NEVER choose any "remove existing files" option. Scaffold into a temp folder instead: `npm create vite@latest _scaffold -- --template react-ts`, then COPY (not move, not delete) the generated files into the project root, merging .gitignore instead of overwriting. Do not copy a README that would overwrite mine. Then ask me before removing `_scaffold`.
3. `npm install`.
4. `npm install tailwindcss @tailwindcss/vite` and `npm install -D @types/node`. Replace src/index.css content with `@import "tailwindcss";`.
5. Add the `@/*` path alias (`baseUrl` "." and `paths` {"@/*": ["./src/*"]}) to BOTH tsconfig.json and tsconfig.app.json, and the alias plus the tailwind plugin to vite.config.ts, exactly as the shadcn Vite doc shows.
6. `npx shadcn@latest init` (Vite, Radix base, CSS variables, slate/neutral base color). Then `npx shadcn@latest add button card input textarea label badge dialog dropdown-menu tooltip tabs select checkbox slider progress separator scroll-area sheet`. If a component name is not found, say so and continue.
7. `npm install motion` and the router (check https://reactrouter.com for the current package name for HashRouter; use `react-router-dom` unless the current docs say otherwise; tell me which and why).
8. Fonts: first run `npm view @fontsource-variable/jetbrains-mono license version`, same for `@fontsource-variable/inter` and `@fontsource/instrument-serif`. If all exist and are OFL, install them. Otherwise stop and tell me.
9. Tests: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`. If npm shows a peer-dependency conflict with the installed Vite, do NOT force; show me the error and options. Add scripts "test": "vitest run" and "test:watch": "vitest".
10. Replace the starter App with a page showing one shadcn Button so I can see styling works.
Verify: `npm run dev` starts (tell me the URL, then stop the server), `npm run build` passes, `npm run lint` passes, `npm test` runs (0 tests is fine).
End with: package versions installed (read them from package.json, do not guess), files created, anything unverified.
```
Done when: `npm run dev` shows a styled button at http://localhost:5173, build passes.

---

## P2: Design system, fonts, motion tokens, free transitions
```
Read AGENTS.md, docs/DESIGN_BRIEF.md sections 2, 3, 4, 7. Task: build the visual foundation only (no features yet).
1. Define the color tokens from the brief as CSS variables and map them into Tailwind v4 `@theme` in src/index.css, plus shadcn's variable names so shadcn components use our palette. Dark only for now. Import the three fonts and set JetBrains Mono for h1-h4 and Inter for body; add utility classes `font-display` (mono) and `font-epitaph` (serif italic).
2. Create src/lib/motion.ts: duration/easing tokens from the brief and a `useMotionSafe()` hook (wraps Motion's reduced-motion support). Wrap the app in Motion's MotionConfig with reducedMotion="user".
3. Create a small style guide page at route `/styleguide` (dev only) that shows: color swatches, type scale, buttons, inputs, badges, status chips (4 statuses), score ring placeholder, focus ring. Check body-text contrast and report ratios.
4. transitions.dev FREE set. Run `npx transitions-dev list` and show me the output before installing anything. Then run `npx transitions-dev add <name>` for each of: text-states-swap, menu-dropdown, modal-open-close, page-side-by-side, success-check, error-state-shake, tooltip-open-close, like-button, shimmer-text. Rules: if any item asks for login, a plan, or is marked Pro, STOP and tell me; do not sign in. Open and review every file it adds (CSS only expected; flag anything else, such as scripts or network calls) before using it.
5. Port the CSS into src/styles/transitions.css (keep the `t-*` class names and the reduced-motion guard) and add a comment `/* Based on transitions.dev (free core set) */`. Create thin React wrappers in src/components/motion/ (e.g. TextSwap, SuccessCheck, useShake, Haunt button) only where React needs state. Demonstrate each on /styleguide with a working trigger.
Verify build/lint/tests. Report which of the nine transitions installed and which did not.
```
Done when: `/styleguide` shows tokens and all nine transitions working, and with OS "reduce motion" on they become calm.

---

## P3: Types, seed data, pure logic and unit tests
```
Read docs/SPEC.md fully. Task: implement the domain layer with NO UI.
Create: src/types/index.ts (exactly as SPEC section 7), src/lib/score.ts (formula, factor breakdown, band), src/lib/recommend.ts (path rules and stop-category keyword suggestion), src/lib/status.ts (transition table, `canTransition`, `applyPath`), src/lib/validation.ts (rules from SPEC section 7, returning field-level error messages), src/lib/date.ts (age in months, relative labels), src/data/seed.ts (4 projects, 6 components, roadmap events per SPEC section 9; scores COMPUTED via score.ts).
Write Vitest tests next to each module covering: the five worked score examples, all-worst = 0, all-best = 100, skipped optionals, NaN and out-of-range inputs, hours 500 equals 24, band edges (39/40, 69/70), every recommendation rule and seed expectation, every legal and illegal status transition, and each validation rule (valid and invalid).
All functions pure, strictly typed, documented with one-line comments. Do not touch UI files.
Verify: `npm test` all green; show me the test list. Report any place where the spec was ambiguous and what you chose.
```
Done when: tests pass and seed scores print 41, 67, 92, 36.

---

## P4: Store and persistence
```
Read docs/SPEC.md sections 7, 8. Task: state and storage, still no pages.
Create src/lib/storage.ts (key `graveyard:data`, safe load with shape validation, corrupt-data backup, debounced save, try/catch around every storage access, JSON export/import, `resetToSeed`), src/store/reducer.ts (pure reducer; actions for: addProject, updateProject, deleteProject, togglePin, saveAutopsy, selectPath, toggleTask, addComponent, updateComponent, deleteComponent, importData, restoreDemo), src/store/StoreProvider.tsx (React Context + useReducer + hooks `useStore`, `useProject(id)`).
Every action that changes a project must also append the correct RoadmapEvent (SPEC section 9 kinds) inside the reducer, using status.ts for transitions. Seed only when the key is absent. Run score recompute if scoreModelVersion is older.
Tests: reducer behaviour for each action (including events produced and status results), storage load/save/corrupt/unavailable paths (mock localStorage), seed-not-overwriting-user-data.
Verify build/lint/tests and explain in plain words how a click becomes a saved change.
```
Done when: tests pass; (in the browser console later) refreshing keeps data.

---

## P5: App shell, routing, hero and page transitions
```
Read docs/DESIGN_BRIEF.md fully and docs/SPEC.md section 10. Task: shell + Home hero.
1. HashRouter with the routes from SPEC (placeholder pages are fine for not-yet-built ones, each with a proper heading and empty state). Layout: collapsible sidebar on desktop, bottom tab bar on mobile, skip link, landmarks. Wordmark, nav, live clock (local time, updates each minute), "Bury a Project" button (opens the dialog in P7; for now route to a stub).
2. Page changes use the page-side-by-side transition; direction follows navigation (forward vs back).
3. Build the Home hero exactly per DESIGN_BRIEF section 5 using REAL store data for the preview cards and the stats strip (use the tombstone card from P6 if it exists, otherwise a simple temporary version I will upgrade in P6). Status chips on the preview cards cycle with text-states-swap (stop under reduced motion). Below the fold: numbered sections 01-04, modules grid, closing CTA with epitaph in the serif font.
4. Custom 404 page in the same style ("Here lies this page.").
Make it look excellent at 360px, 768px, 1280px and 1920px widths. Take screenshots if you can and check them; otherwise tell me you could not.
Verify build/lint/tests and keyboard-only navigation of the shell.
```
Done when: Home looks like a product, not a template; nav works; back/forward transitions feel right.

---

## P6: Necropolis Vault
```
Read docs/SPEC.md (Vault, statuses, filters) and DESIGN_BRIEF section 6. Task: /vault page and the tombstone card.
- Responsive grid of tombstone cards (arched top, R.I.P. label, name, status chip with icon, completion bar, score ring + number + band label, stack pills, age label, pin/"haunt" button using the like-button transition with a themed icon). Stable React keys (project id). Card click goes to /project/:id. Kebab menu (menu-dropdown): Open, Edit, Run autopsy, Pin, Delete (delete asks via modal-open-close and never happens without confirmation).
- Filter pills: stack (multi-select from all stacks), category, age (<3 mo, 3-6 mo, 6-12 mo, 12+ mo), completion % (0-25, 26-50, 51-75, 76-100), status. Combined filters narrow results (AND across groups, OR within a group). Show active-filter count, "clear all", result count, URL-synced via search params so a filtered view can be refreshed or shared on the same machine.
- Search by name/description/stack; sort menu (score, completion, age, name, recently updated, pinned first).
- Empty states: (a) no projects at all, (b) filters match nothing (offer clear). Loading/initialisation skeleton using shimmer-text style shimmer.
- Tooltips (tooltip-open-close) on the score ring explaining it is a rule-based heuristic with a mini breakdown.
- Cards enter with a short stagger; layout changes when filtering use Motion layout animation, kept subtle.
Add component tests for filtering logic (put the pure filter function in src/lib/filters.ts with unit tests).
Verify build/lint/tests and report how many seeded cards render on first load.
```
Done when: 4 sample tombstones, all filters work together, refresh keeps pins.

---

## P7: Bury a Project (create and edit)
```
Read SPEC sections 7 (validation), 9. Task: create/edit project flow.
- "Bury a Project" opens a dialog (modal-open-close) from the sidebar, the Vault, and the hero. Fields per SPEC: name, description, stack tags (type + Enter/comma to add, remove with Backspace or button), category select, completion slider with number input, why it stopped (short free text used later as a hint), last active date. Same dialog reused for Edit.
- Controlled form with validation from src/lib/validation.ts. Show inline errors linked via aria-describedby; on invalid submit, shake the first invalid field (error-state-shake) and focus it; errors clear as the user fixes them. Duplicate-name check.
- On success: success-check animation, toast, dispatch addProject (status deceased), then offer two buttons: "Run the autopsy now" and "Back to the Vault". New card appears in the grid with the enter animation.
- Edit saves updatedAt and logs project_updated. Warn before closing a dirty dialog.
Tests: validation (already covered) plus component tests for the form (invalid, valid, duplicate, edit).
Verify build/lint/tests and keyboard-only completion of the form.
```
Done when: you can bury a project, see it appear, refresh and it stays.

---

## P8: Autopsy Wizard and Resurrection Score reveal
```
Read SPEC sections 5, 6. Task: /projects/:id/autopsy wizard.
Steps with a stepper and progress: 1 What was built, 2 What broke, 3 Why it stopped (text + stop category; show the keyword-based suggestion as a removable hint the user must confirm), 4 Revival inputs: willingness (1-5, required), hours available (optional), useful components remaining (optional), scope clarity (optional), blocker severity (optional); each optional input has a clear "skip" state, 5 Review (all answers editable via "Edit" links jumping back). Required vs optional visibly marked. Back/Next preserve answers (draft kept in state; also saved as a draft in storage key `graveyard:draft:<id>` and cleared on submit or cancel). Step changes use page-side-by-side with direction.
Submit: compute score via score.ts, dispatch saveAutopsy (logs autopsy_completed and a score event with the score in meta).
Result screen: animated score ring counting up (instant under reduced motion), band label, "based on N of 6 factors", a per-factor breakdown bar list with tooltips explaining each factor and weight, the stop category, and the recommended path card (with the reason text and the alternatives). Primary buttons: "Choose a path" (goes to the Engine tab) and "Edit answers". Copy must say "rule-based heuristic" and never "AI". While computing, show shimmer-text "Performing autopsy..." for about 700 ms (skip under reduced motion).
Re-running the autopsy replaces the autopsy and logs a new event; earlier scores remain visible in the roadmap events.
Tests: wizard step validation, preserved answers, review edits, skipped optionals produce "based on N of 6".
Verify build/lint/tests.
```
Done when: seeded legacy-auth, re-run autopsy, you get a score and a sensible recommendation.

---

## P9: Project detail page and Resurrection Engine
```
Read SPEC sections 4, 6 and DESIGN_BRIEF section 6. Task: /project/:id with tabs (Overview, Autopsy, Engine, Components, Roadmap, Export). Tab changes use page-side-by-side. Overview: header with status chip, score ring, completion, stack, edit/pin/delete, a Dead-to-Active progress rail (Deceased, In Stasis, Resurrecting, Salvaged highlighting the current state), the story (what was built / broke / why).
Engine tab: four large path cards (Phoenix, Pivot, Salvage, Archive) with the recommended one badged and a reason line; the user may pick any (show a gentle note when overriding the recommendation, never block).
- Phoenix: generates a proposed 3-day MVP plan from the project's data (deterministic template in src/lib/phoenix.ts: Day 1 core flow, Day 2 polish and fix what broke, Day 3 ship; tasks mention the project's own "what broke" and components) that the user can edit, add/remove (1-12 tasks), tick off with a progress bar. Status becomes resurrecting.
- Pivot: fields for new direction and reason (10-500 chars, validated); original project info stays visible and unchanged in a "Before" panel; status becomes resurrecting.
- Salvage: shows linked components, button "Add component" (reuses the P10 form if it exists, else a stub), and a "Mark as salvaged" button enabled only with >= 1 component; otherwise explain why.
- Archive: optional epitaph (max 280 chars, rendered in the serif font on a small engraved-stone card), confirm dialog, status becomes in_stasis, plus a "Reopen" action later.
All status changes go through status.ts; illegal ones are impossible in the UI. success-check on confirmation, error shake on invalid fields.
Tests: phoenix.ts, each path's reducer result and events, UI tests for disabled Salvage.
Verify build/lint/tests.
```
Done when: each of the four paths changes status per the table and the card re-renders correctly in the Vault.

---

## P10: Component Salvage Market
```
Read SPEC section 2 (Market), 7 (component validation). Task: /salvage and the Components tab.
- Grid/list toggle of component cards: type icon (snippet, schema, UI block), name, description, source project link, stack pills, tags, created date, a code preview (monospace, text only, 6 lines, fade-out).
- Detail view in a dialog (modal-open-close): full content in a scrollable monospace block with line numbers, Copy button (success-check, with clipboard fallback), Edit, Delete (confirm), "Go to source project".
- Add/Edit form: name, type, description, source project (required select), stack tags, tags, content (large textarea, 20,000 char limit with counter). Validation with shake on errors. Logs component_added / component_removed events.
- Search (name, description, tags, content), filters by type, stack, source project, tag; sort (newest, name). Empty states.
- Add a visible "License and reuse" note: code salvaged from third-party or team repos may be under licenses; check before reuse; this is a local catalog, not a hosted marketplace.
Security: render content as plain text only. Test with content containing `<script>` and triple-backtick sequences.
Tests: add/edit/delete reducer paths, search/filter pure functions (src/lib/componentFilters.ts), copy button behaviour.
Verify build/lint/tests.
```
Done when: seeded 6 components browsable; add one; its project's roadmap shows the event.

---

## P11: Roadmap and Markdown export
```
Read SPEC sections 9, 11. Task: roadmap + export.
Roadmap: per-project timeline in the Roadmap tab and a global /roadmap page (all events newest first, filter by project and kind). Events come ONLY from real reducer actions (already logged); render icon, message, relative time with absolute time in a tooltip, and a Dead-to-Active rail at the top. Staggered reveal. Explain on-page in one sentence the difference between this event log (what happened) and the Phoenix checklist (what to do).
Export: src/lib/markdown.ts (pure; per SPEC section 11, safe code fences, escaped project text where needed, deterministic output) with golden-file style unit tests (snapshot a seeded project). Export tab: live preview (rendered as text in a monospace panel, no HTML rendering), "Download .md" (Blob + object URL, revoke after use, filename slug + date), "Copy Markdown", success-check, and "Export all data (JSON)" / "Import JSON" with validation and a confirm dialog that says imports replace current data.
Add a clear note in the UI: export is a local file; there is no hosted share link.
Verify build/lint/tests. Download a file and read it to confirm it is valid Markdown; report what you checked.
```
Done when: exporting email-worker gives a complete, readable .md file.

---

## P12: Graveyard Oracle (rule-based assistant) with thinking, streaming and dot-loader effects
```
Read AGENTS.md honesty rules and DESIGN_BRIEF section 7 (ORIGINAL items). Task: an assistant that runs locally by default with an optional opt-in AI mode; UI copy must clearly distinguish them.
Logic in src/lib/oracle.ts (pure, tested): intent matching via keywords/regex plus fuzzy project-name matching. Intents: summary of my graveyard; which project to revive first (highest score among non-archived, with reasoning); why did <project> stall (from its autopsy); what can I salvage (components list); compare <A> and <B>; show a 3-day plan for <project> (uses phoenix.ts); how is the score calculated; help. Unknown questions get a friendly fallback listing what it can do. Answers are built from real store data and may include links to projects.
UI: floating button + panel (or /oracle page), suggested-question chips, message list with aria-live="polite", input with Enter to send.
Effects (build ORIGINAL implementations with Motion/CSS; do NOT fetch or copy transitions.dev Pro code):
1. Thinking states: while "thinking" (about 900 ms), show a status line (e.g. "Reading your graveyard", "Weighing scores", "Drafting an answer") that shimmers, then swaps to the next line.
2. Matrix dot loader: a 4x4 grid of dots pulsing in 3-4 patterns beside the status line.
3. Streaming text: reveal the answer word by word with a soft blur-to-sharp cross-fade; the full text is in the DOM from the start for screen readers.
Under reduced motion: no shimmer, static dots, answer appears at once.
Tests for each intent with the seed data.
Verify build/lint/tests.
```
Done when: ask "which project should I revive first?" and get a sourced answer with the effects.

---

## P13: Polish, accessibility, QA and demo readiness
```
Read AGENTS.md and DESIGN_BRIEF section 8. Task: quality pass; fix real problems, do not add features.
1. Accessibility audit by hand and with tooling you can run (e.g. eslint-plugin-jsx-a11y if it installs cleanly; ask first): landmarks, headings order, focus order, dialog focus trapping and return, labels, contrast, 200% zoom, keyboard-only run of the whole core loop.
2. Responsive check at 360, 768, 1280, 1920 for every page; fix overflow and tap targets.
3. Reduced-motion check on every animated element.
4. Empty/error states: corrupted storage banner (simulate by writing bad JSON), storage unavailable, 404, deleting the last project.
5. Add a Settings/Data menu: Restore demo data (confirm), Export/Import JSON, "Clear everything" (double confirm, explain data cannot be recovered).
6. Add an end-to-end test (Playwright, only if it installs cleanly; ask before installing) or, if not, a written manual checklist in docs/QA.md covering: Bury, Autopsy, Score, Choose path (all four), Salvage, Roadmap, Export, Refresh persistence, Reset demo.
7. `npm run build` then `npm run preview`; load it and click through the core loop; report results honestly. Write docs/DEMO.md: 5-minute demo script following Bury, Autopsy, Score, Path, Salvage, Roadmap, Export, plus a fallback plan if a feature fails.
8. Update README.md: overview, prerequisites, install/dev/build/test commands, folder structure, features, data model summary, score formula, storage strategy, limitations (local-first, optional AI/import), troubleshooting.
Report: what you fixed, what you could not verify, and a list of known issues.
```
Done when: build + preview clean, core loop works on the production build.

---

## Surprise Challenge prompt (use at hour 6, in plan mode first)
```
Read AGENTS.md and docs/SPEC.md. A new requirement has arrived: <PASTE IT HERE>.
Do not edit anything yet. Tell me: which modules and files it touches, the smallest change that satisfies it, what could break, and a step list with a test for each step. Wait for my approval before changing code.
```
