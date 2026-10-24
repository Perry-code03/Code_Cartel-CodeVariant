# The Project Graveyard: Product + Technical Spec (source of truth)

Team Code_Cartel, PS 05. Labels: [PPT] stated in the slides, [REC] recommended, [OPT] optional extra.

## 1. What it is
A client-side web app that catalogs abandoned side projects and hackathon repos, diagnoses why they stalled, scores how revivable they are, lets the user choose a revival path, and stores salvaged reusable parts. [PPT]
Everything stays in the browser (localStorage) by default; the app is local-first and fully usable offline. Optional backend capabilities run via Vercel serverless functions in `/api`. One opt-in serverless function (`api/analyze-repo.ts`) enables public GitHub repo metadata normalization via a configurable AI provider (e.g. Groq or xAI).

## 2. Modules [PPT]
1. **Necropolis Vault**: grid of tombstone cards. Shows status, completion %, Resurrection Score. Filters: stack, category, age, completion %. Entry point "Bury a Project" (includes optional "Import from GitHub" button).
2. **Autopsy Wizard**: multistep form (what was built / what broke / why it stopped + score inputs). Ends with review and a Resurrection Score.
3. **Resurrection Engine**: four paths: Phoenix Protocol (3-day MVP sprint plan + checklist), Pivot Path (new direction + reason, original preserved), Salvage Yard (extract components), Peaceful Archive (epitaph/closure note).
4. **Component Salvage Market**: local catalog of snippets, schemas, UI blocks. Add, view, edit, delete, search, filter, copy, link to source project. It is NOT a public marketplace.
Bonus [PPT]: Revival Roadmap timeline (Dead to Active) and one-click Markdown export (download + copy). No hosted share links.
Extras the user requested [OPT]: landing hero, "Graveyard Oracle" assistant (rule-based, local), project pinning ("haunt" button), rich motion.

## 3. Workflow [PPT]
Intake & Burial, then The Autopsy, then The Decision, then Harvest & Execute.

## 4. Statuses and transitions [REC; slides list statuses only]
Statuses: `deceased`, `in_stasis`, `resurrecting`, `salvaged`.
| From | Action | To |
|---|---|---|
| (new) | Bury | deceased |
| deceased / in_stasis / salvaged | Phoenix or Pivot chosen | resurrecting |
| deceased / in_stasis / resurrecting | Salvage chosen AND at least 1 component linked | salvaged |
| deceased / resurrecting / salvaged | Peaceful Archive | in_stasis (+ epitaph, archivedAt) |
| resurrecting | "Declare dead again" | deceased |
| in_stasis | Reopen via Phoenix/Pivot | resurrecting |
Choosing Salvage with 0 components: status unchanged; prompt the user to add one. Re-choosing the current path is allowed (updates plan, logs event). Every status change appends a roadmap event. Transition logic lives in `src/lib/status.ts`.

## 5. Resurrection Score (rule-based heuristic, 0-100) [REC]
Not AI, not validated. Completion % is a separate field and is NOT the score.
| Input | Required | x (0..1) | Weight |
|---|---|---|---|
| completion (project) | yes | completion/100 | 20 |
| usefulComponents | no | min(count,5)/5 | 20 |
| willingness 1-5 | yes | (r-1)/4 | 15 |
| hoursAvailable | no | min(hours,24)/24 | 15 |
| scopeClarity 1-5 | no | (r-1)/4 | 15 |
| blockerSeverity 1-5 | no | 1-(r-1)/4 | 15 |
```
points = sum(weight * x) over ANSWERED inputs
possible = sum(weight) over ANSWERED inputs   (>= 35 always)
score = clamp(round(100 * points / possible), 0, 100)
```
Skipped optional input: excluded from both sums. NaN treated as skipped. Out-of-range numbers clamped. UI shows "based on N of 6 factors" and a per-factor breakdown (points earned vs possible).
Bands (proposed product rules): 0-39 Low, 40-69 Moderate, 70-100 High. Store `scoreModelVersion: 1`; on load, if older than code version, recompute from saved inputs.
Boundary tests: all-worst = 0, all-best = 100, hours 500 equals hours 24.
Worked checks (must match in unit tests):
- email-worker: completion 84, comps 4, will 5, hours 22, scope 5, blocker 1 gives 92
- payment-core: 58, 4, 4, 15, 4, 3 gives 67
- legacy-auth: 32, 3, 2, 6, 3, 3 gives 41
- legacy-auth with hours and blocker skipped gives 42
- campus-pulse: 22, 1, 3, 8, 2, 2 gives 36

Stop-category suggestion: keyword match on "why it stopped" text suggests one of scope/burnout/priorities/technical/other. The user confirms. Plain string matching.

## 6. Path recommendation [REC]
Suggestions only. The user can always choose any path. Checked in this order; first match is primary, others are alternatives. Unknown optional inputs never block, except Pivot's scope-clarity clause counts as false when unknown.
- Phoenix: score >= 60 AND willingness >= 3 AND (hours >= 12 if given) AND (blocker <= 3 if given)
- Pivot: willingness >= 3 AND (stopCategory == priorities OR scopeClarity <= 2)
- Salvage: usefulComponents >= 1
- Archive: (willingness <= 2 AND usefulComponents == 0) OR score < 25
Fallback: Salvage if components exist, else Archive.
Seed expectations: legacy-auth gives Salvage; payment-core gives Phoenix (alt Salvage); email-worker gives Phoenix (alt Salvage); campus-pulse gives Pivot.

## 7. Data model (`src/types/index.ts`)
```ts
export type Status = 'deceased' | 'in_stasis' | 'resurrecting' | 'salvaged';
export type PathId = 'phoenix' | 'pivot' | 'salvage' | 'archive';
export type StopCategory = 'scope' | 'burnout' | 'priorities' | 'technical' | 'other';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type ComponentType = 'snippet' | 'schema' | 'ui_block';
export const CATEGORIES = ['Web App','API / Backend','CLI Tool','Mobile App','Data / ML','Game','Library','Other'] as const;
export type Category = (typeof CATEGORIES)[number];
export interface Autopsy { whatWasBuilt: string; whatBroke: string; whyStopped: string; stopCategory: StopCategory; willingness: Rating; usefulComponents?: number; hoursAvailable?: number; scopeClarity?: Rating; blockerSeverity?: Rating; score: number; scoreModelVersion: number; completedAt: string; }
export interface PlanTask { id: string; text: string; done: boolean; }
export interface RevivalPlan { path: PathId; chosenAt: string; recommendedPath?: PathId; notes?: string; tasks?: PlanTask[]; pivotDirection?: string; pivotReason?: string; epitaph?: string; archivedAt?: string; }
export interface Project { id: string; name: string; description: string; stack: string[]; category: Category; completion: number; status: Status; lastActiveAt: string; createdAt: string; updatedAt: string; pinned?: boolean; isSample?: boolean; autopsy?: Autopsy; plan?: RevivalPlan; }
export interface SalvagedComponent { id: string; projectId: string; name: string; type: ComponentType; description: string; stack: string[]; content: string; tags: string[]; createdAt: string; updatedAt: string; }
export type EventKind = 'project_created'|'autopsy_completed'|'path_selected'|'status_changed'|'component_added'|'component_removed'|'project_updated';
export interface RoadmapEvent { id: string; projectId: string; kind: EventKind; message: string; at: string; meta?: Record<string, string | number>; }
export interface AppData { schemaVersion: 1; projects: Project[]; components: SalvagedComponent[]; events: RoadmapEvent[]; }
export interface RepoAnalysis { name: string; description: string; stack: string[]; category: Category; lastPushedAt?: string; source: 'github+ai' | 'github-only'; repoUrl: string; aiProviderName?: string; notice?: string; }
```
`pinned` and `isSample` are additions to the earlier model. Timestamps are ISO strings. IDs via `crypto.randomUUID()`; seeds use readable ids like `seed-legacy-auth`.

Validation (enforced in `src/lib/validation.ts`, shown inline in forms):
- Project: name 2-60 chars, unique ignoring case; description 1-500; stack 1-8 tags (1-24 chars, no duplicates); category in CATEGORIES; completion integer 0-100; lastActiveAt not in the future.
- Autopsy: three text fields 10-1000 chars; stopCategory required; willingness required; usefulComponents 0-50; hoursAvailable 0-200.
- Pivot: direction and reason 10-500. Epitaph max 280. Phoenix tasks 1-12 items, 1-120 chars.
- Component: name 2-80; description 1-300; content 1-20000; max 8 tags (1-24 chars).

## 8. Storage [REC]
Single key `graveyard:data` holding `AppData`. Load: parse JSON, validate shape, on failure keep a backup copy under `graveyard:data:corrupt-<timestamp>`, show a banner, fall back to seed. Save: debounced (about 300 ms) full write, wrapped in try/catch (quota, private mode). Seed only when the key is absent or the user clicks "Restore demo data" (confirm dialog; keeps user-created projects unless they choose "Reset everything"). Provide JSON export/import backup. Data lives only in this browser: clearing site data erases it, and nothing syncs.

## 9. Seed data (4 projects, all `isSample: true`, status derived from workflow)
| id | name | category | stack | completion | status | autopsy inputs (comps/will/hrs/scope/blocker) | stopCategory |
|---|---|---|---|---|---|---|---|
| seed-legacy-auth | legacy-auth | API / Backend | Node, Express, JWT, PostgreSQL | 32 | deceased | 3/2/6/3/3 | burnout |
| seed-payment-core | payment-core | API / Backend | TypeScript, Stripe, Redis | 58 | in_stasis | 4/4/15/4/3 | priorities |
| seed-email-worker | email-worker | API / Backend | Python, Celery, SES | 84 | resurrecting (Phoenix plan with 5 tasks, 2 done) | 4/5/22/5/1 | scope |
| seed-campus-pulse | campus-pulse | Web App | React, Firebase, Tailwind | 22 | deceased | 1/3/8/2/2 | priorities |
Write believable descriptions, whatWasBuilt/whatBroke/whyStopped text, lastActiveAt dates spread between 2 and 14 months before today, and `createdAt` consistent. Seed 6 components (e.g. jwt-refresh-middleware snippet, users-sessions schema, stripe-webhook-handler snippet, checkout-form UI block, queue-retry-worker snippet, email-template-grid UI block) and roadmap events consistent with each project's state. Scores are COMPUTED by `score.ts`, never hardcoded.

## 10. Routes (HashRouter)
`/` Home (hero) | `/vault` | `/project/:id` (tabs: Overview, Autopsy, Engine, Components, Roadmap, Export) | `/projects/:id/autopsy` wizard | `/salvage` market | `/roadmap` (all projects) | `/oracle` or a floating panel | `*` custom 404 in the same visual style.

## 11. Markdown export
Per project: title, status, completion, score + band + factor breakdown, autopsy summary, selected path details (tasks, pivot, epitaph), roadmap list, salvaged components in fenced code blocks (fence length safely exceeds any backtick run in content). Download via Blob + object URL (`<slug>-graveyard.md`), plus "Copy to clipboard" with fallback. Also "Export all" JSON backup.

## 12. Backend roadmap (Phase 2)
1. **GitHub Import (built)**: Opt-in public repository intake via `/api/analyze-repo`, with deterministic manifest analysis and optional OpenAI-compatible AI normalization (Groq, xAI).
2. **Later backend extensions [OPT]**: Optional cloud backup/sync [OPT], hosted authenticated workspace [OPT], component team sharing [OPT]. Claim nothing until built.

## 13. Out of scope (do not build, do not imply)
Private repo analysis, user accounts, cloud database sync, public marketplace, hosted share links, payments.
