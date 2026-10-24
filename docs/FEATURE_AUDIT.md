# Project Graveyard: Feature Audit (docs/FEATURE_AUDIT.md)

Audit completed against `docs/FEATURES.md`, `docs/SPEC.md`, and `docs/DESIGN_BRIEF.md`.

## Checkbox Audit (Sections 1–10)

### Section 1: Intake & Burial (Add & Edit Project)
- [x] Modal dialog for burying a project accessible from global navigation and Vault (`src/components/layout/Shell.tsx:90`, `src/pages/VaultPage.tsx:125`)
- [x] Required fields: Name (2–60 chars, unique ignoring case), Description (1–500 chars) (`src/lib/validation.ts:validateProject`)
- [x] Tech stack tags input (1–8 tags, 1–24 chars each, no duplicates, enter/comma to add) (`src/components/project/BuryProjectDialog.tsx:handleAddTag`, `src/lib/validation.ts`)
- [x] Project Category selection from fixed list (`src/components/project/BuryProjectDialog.tsx:280`, `src/lib/validation.ts`)
- [x] Estimated completion percentage (0–100 integer with interactive slider and numeric indicator) (`src/components/project/BuryProjectDialog.tsx:332`, `src/lib/validation.ts`)
- [x] Last active date input (not in the future, drives the age indicator) (`src/components/project/BuryProjectDialog.tsx:300`, `src/lib/validation.ts`)
- [x] Duplicate project name prevention with friendly inline error message (`src/lib/validation.ts:validateProject`)
- [x] Form error state shake animation and focus on first invalid field (`src/components/project/BuryProjectDialog.tsx:handleSubmit`, `src/components/motion/useShake.ts`)
- [x] Success state checkmark drawing and prompt to immediately conduct autopsy or return to Vault (`src/components/project/BuryProjectDialog.tsx:SuccessCheck`)
- [x] Edit existing project metadata with prefilled form and update timestamp (`src/components/project/BuryProjectDialog.tsx:useEffect`, `src/store/reducer.ts:UPDATE_PROJECT`)

### Section 2: Necropolis Vault
- [x] Responsive grid of tombstone cards with arched top styling (.tombstone-arch) (`src/pages/VaultPage.tsx:300`, `src/components/project/TombstoneCard.tsx`)
- [x] R.I.P. badge, project name, category, and human-readable age counter (`src/components/project/TombstoneCard.tsx:89-140`)
- [x] Status chip with distinct thematic styling for Deceased, In Stasis, Resurrecting, and Salvaged (`src/components/project/TombstoneCard.tsx:getStatusBadge`)
- [x] Interactive completion progress bar with gradient styling (`src/components/project/TombstoneCard.tsx:152-164`)
- [x] Circular Resurrection Score dial with qualitative band label (Low, Moderate, High) (`src/components/project/TombstoneCard.tsx:167-198`, `src/lib/score.ts:getScoreBand`)
- [x] Pinned ("haunt") toggle button with ghost icon and particle burst effect (`src/components/motion/HauntButton.tsx`)
- [x] Tech stack pill tags with overflow counter (+N more) (`src/components/project/TombstoneCard.tsx:201-216`)
- [x] Multi-filter by tech stack tags (OR within tags, AND across groups) (`src/lib/filters.ts:filterProjects`)
- [x] Multi-filter by project category (`src/lib/filters.ts:filterProjects`)
- [x] Multi-filter by age bracket (<3mo, 3-6mo, 6-12mo, 12mo+) (`src/lib/filters.ts:filterProjects`)
- [x] Multi-filter by completion bracket (0-25%, 26-50%, 51-75%, 76-100%) (`src/lib/filters.ts:filterProjects`)
- [x] Multi-filter by project status (`src/lib/filters.ts:filterProjects`)
- [x] Full-text search across project name, description, and stack tags (`src/lib/filters.ts:filterProjects`)
- [x] Sort dropdown (Recently Updated, Highest Score, Completion %, Oldest First, Name A-Z) (`src/lib/filters.ts:filterProjects`)
- [x] Active filter count indicator and "Clear all filters" button (`src/pages/VaultPage.tsx:73-88`, `src/pages/VaultPage.tsx:252`)
- [x] Kebab menu for quick actions (Open dossier, Conduct autopsy, Edit, Delete with modal confirmation) (`src/components/project/TombstoneCard.tsx:112-140`)

### Section 3: The Autopsy Wizard
- [x] Step-by-step diagnostic stepper with progress rail (Stages 01–05) (`src/pages/AutopsyWizardPage.tsx:192-206`)
- [x] Step 1: What was built (10–1000 characters) (`src/pages/AutopsyWizardPage.tsx:208-238`)
- [x] Step 2: What broke (10–1000 characters) (`src/pages/AutopsyWizardPage.tsx:240-278`)
- [x] Step 3: Why development stopped (10–1000 characters) (`src/pages/AutopsyWizardPage.tsx:280-349`)
- [x] Keyword matching on stall reason to auto-suggest failure category with one-click acceptance (`src/lib/recommend.ts:suggestStopCategory`, `src/pages/AutopsyWizardPage.tsx:304`)
- [x] Step 4: Resuscitation heuristic inputs with clear required vs optional indicators (`src/pages/AutopsyWizardPage.tsx:351-488`)
- [x] Willingness to continue rating (1–5 mandatory) (`src/pages/AutopsyWizardPage.tsx:360`)
- [x] Salvageable components remaining count (0–50, optional, clear skip toggle) (`src/pages/AutopsyWizardPage.tsx:390`)
- [x] Available sprint hours count (0–200, optional, capped at 24h, clear skip toggle) (`src/pages/AutopsyWizardPage.tsx:415`)
- [x] Scope clarity rating (1–5, optional, clear skip toggle) (`src/pages/AutopsyWizardPage.tsx:440`)
- [x] Technical blocker severity rating (1–5 inverse, optional, clear skip toggle) (`src/pages/AutopsyWizardPage.tsx:465`)
- [x] Step 5: Review screen with editable links jumping back to each step (`src/pages/AutopsyWizardPage.tsx:490-562`)
- [x] "Performing autopsy..." loading shimmer transition during calculation (`src/pages/AutopsyWizardPage.tsx:543`, `src/styles/transitions.css`)
- [x] Score reveal screen displaying animated score dial, band label, and "based on N of 6 factors" (`src/pages/AutopsyWizardPage.tsx:565-602`)
- [x] Transparent per-factor breakdown showing points earned vs possible with descriptive explanations (`src/pages/AutopsyWizardPage.tsx:604-633`)
- [x] Explicit label noting score is a rule-based heuristic and not an AI prediction (`src/pages/AutopsyWizardPage.tsx:568`)
- [x] Primary CTA to proceed directly to the Resurrection Engine (`src/pages/AutopsyWizardPage.tsx:654`)

### Section 4: Resurrection Score Engine
- [x] Mathematical formula: points / possible * 100 clamped between 0 and 100 (`src/lib/score.ts:computeResurrectionScore`)
- [x] Factor weights: Completion (20), Useful Components (20), Willingness (15), Hours (15), Scope Clarity (15), Blocker Severity (15) (`src/lib/score.ts:computeResurrectionScore`)
- [x] Skipped optional factors are omitted from both points and possible without penalizing score (`src/lib/score.ts:86,123,149,175`)
- [x] Robust clamping: out-of-range numbers clamped defensively, NaN treated as skipped (`src/lib/score.ts:43-48,70,102`)
- [x] Exact worked example checks: email-worker (92), payment-core (67), legacy-auth (41), legacy-auth skipped optionals (42), campus-pulse (36) (`src/lib/__tests__/domain.test.ts:9-70`)
- [x] Boundary conditions: all-worst gives 0, all-best gives 100, hours >= 24 gives same credit as 24 (`src/lib/__tests__/domain.test.ts:72-106`)
- [x] Score versioning (`scoreModelVersion: 1`) stored on autopsy records with automatic recalculation on load if model upgrades (`src/lib/storage.ts:recomputeStaleScores`)

### Section 5: Path Recommendation Engine
- [x] Deterministic path suggestions based on autopsy and score inputs (`src/lib/recommend.ts:recommendRevivalPath`)
- [x] Phoenix Protocol suggested when score >= 60, willingness >= 3, hours >= 12 (if given), blocker <= 3 (if given) (`src/lib/recommend.ts:34-37`)
- [x] Pivot Path suggested when willingness >= 3 and (stopCategory == 'priorities' or scopeClarity <= 2) (`src/lib/recommend.ts:40-42`)
- [x] Salvage Yard suggested when usefulComponents >= 1 (`src/lib/recommend.ts:45`)
- [x] Peaceful Archive suggested when (willingness <= 2 and usefulComponents == 0) or score < 25 (`src/lib/recommend.ts:48`)
- [x] Clear human-readable justification sentence explaining why the engine recommended this path (`src/lib/recommend.ts:61-75`)
- [x] Display of alternative applicable paths without blocking user choice (`src/lib/recommend.ts:51-57`)

### Section 6: The Resurrection Engine
- [x] Visual Dead-to-Active lifecycle progress rail (Deceased -> In Stasis -> Resurrecting -> Salvaged) (`src/pages/ProjectDetailPage.tsx:294-318`)
- [x] Path 1: Phoenix Protocol generates 3-day MVP sprint tasks from project post-mortem data (`src/lib/phoenix.ts:generatePhoenixSprintTasks`)
- [x] Phoenix sprint task checklist with interactive completion toggles (`src/pages/ProjectDetailPage.tsx:410`, `src/store/reducer.ts:TOGGLE_TASK`)
- [x] Add and remove custom sprint tasks (1–12 tasks, 1–120 chars each) (`src/pages/ProjectDetailPage.tsx:434-453`)
- [x] Phoenix activation transitions project status to `resurrecting` and appends roadmap events (`src/lib/status.ts:applyPath`, `src/store/reducer.ts:SELECT_PATH`)
- [x] Path 2: Pivot Path fields for new direction (10–500 chars) and rationale (10–500 chars) (`src/pages/ProjectDetailPage.tsx:458-518`)
- [~] Pivot Path preserves original project description and post-mortem in an untouched "Before" state (Original story is visible in Overview tab, but Engine tab lacks an explicit side-by-side "Before" comparison card)
- [x] Pivot activation transitions status to `resurrecting` and logs roadmap events (`src/lib/status.ts:applyPath`, `src/store/reducer.ts:SELECT_PATH`)
- [x] Path 3: Salvage Yard lists all currently harvested components linked to the project (`src/pages/ProjectDetailPage.tsx:520-575`)
- [x] Salvage activation transitions status to `salvaged` (strictly enforced only if >= 1 component linked) (`src/lib/status.ts:applyPath`, `src/pages/ProjectDetailPage.tsx:567`)
- [x] Path 4: Peaceful Archive with engraved memorial epitaph (<= 280 chars) rendered in serif italic (`src/pages/ProjectDetailPage.tsx:577-635`)
- [x] Peaceful Archive transitions status to `in_stasis`, records `archivedAt`, and provides a Reopen option (`src/lib/status.ts:applyPath`, `src/store/reducer.ts:SELECT_PATH`)

### Section 7: Component Salvage Market
- [x] Dedicated `/salvage` market page and per-project Components tab (`src/pages/SalvageMarketPage.tsx`, `src/pages/ProjectDetailPage.tsx:637`)
- [x] Component cards with type badges: Code Snippet, Database Schema, UI Block (`src/pages/SalvageMarketPage.tsx:185-236`)
- [x] Interactive code preview with syntax-safe monospace display (`src/pages/SalvageMarketPage.tsx:218-223`)
- [x] Full code inspect dialog with line numbers, source project link, and copy-to-clipboard button (`src/pages/SalvageMarketPage.tsx:242-300`)
- [x] Copy button triggers animated success checkmark with graceful fallback (`src/pages/SalvageMarketPage.tsx:59`, `src/lib/markdown.ts:copyToClipboard`)
- [x] Add/Harvest Component dialog with name, type, description, source project, tags, and 20,000 char code textarea (`src/pages/SalvageMarketPage.tsx:304-415`)
- [x] Full validation with field-level errors and error shake (`src/lib/validation.ts:validateComponent`, `src/components/motion/useShake.ts`)
- [x] Filter components by type (snippet, schema, ui_block), source project, and stack tags (`src/lib/componentFilters.ts:filterComponents`)
- [x] Plain text code rendering to guarantee zero raw HTML or script execution (`src/pages/SalvageMarketPage.tsx:273`)
- [x] License disclaimer banner clarifying that salvaged code is local and not a public hosted marketplace (`src/pages/SalvageMarketPage.tsx:114`)

### Section 8: Lifecycle Roadmap
- [x] Global `/roadmap` timeline page displaying all historical events across all projects (newest first) (`src/pages/RoadmapPage.tsx:98-164`)
- [x] Per-project Roadmap tab displaying project-specific history (`src/pages/ProjectDetailPage.tsx:686-712`)
- [x] Append-only logging: events created strictly by real user actions (`src/store/reducer.ts:44,79,114,142,216,240`)
- [x] Event cards with themed icons, timestamp formatting, and event-type chips (`src/pages/RoadmapPage.tsx:120-142`)
- [x] Filter global roadmap by source project and by event kind (`src/pages/RoadmapPage.tsx:58-88`)
- [x] Clear on-page note differentiating historical audit log from forward-looking sprint checklists (`src/pages/RoadmapPage.tsx:46-50`)

### Section 9: The Graveyard Oracle (Local Assistant)
- [x] Floating panel / assistant drawer accessible from global navigation (`src/components/layout/Shell.tsx:69`, `src/components/oracle/OraclePanel.tsx`)
- [x] Explicit header stating it is local-first with an optional opt-in cloud AI mode (`src/components/oracle/OraclePanel.tsx:65-79`)
- [x] Deterministic query matching for 7+ intents (`src/lib/oracle.ts:queryGraveyardOracle`)
- [x] Suggested quick-prompt chips for instant queries (`src/components/oracle/OraclePanel.tsx:135-154`)
- [x] Interactive chat history with screen-reader friendly `aria-live="polite"` (`src/components/oracle/OraclePanel.tsx:86`)
- [x] Matrix Dot Loader motion effect: 4x4 pulsing cybernetic dot grid (`src/components/motion/MatrixLoader.tsx`)
- [x] Thinking States motion effect: shimmering status lines cycling diagnostic thoughts (`src/components/motion/ThinkingStates.tsx`)
- [x] Streaming Text motion effect: word-by-word reveal with soft blur cross-fade (`src/components/motion/StreamingText.tsx`)
- [x] Respects reduced motion preferences by skipping animation loops and displaying text instantly (`src/lib/motion.ts`, `src/styles/transitions.css`)

### Section 10: System States, Layout & Transitions
- [x] Responsive navigation shell: collapsible sidebar on desktop, slide-in drawer on mobile (`src/components/layout/Shell.tsx`)
- [x] Live UTC clock in top bar updating every minute (`src/components/layout/Shell.tsx:27-41`)
- [x] Skip to main content landmark link for keyboard accessibility (`src/components/layout/Shell.tsx:61-66`)
- [x] Cyberpunk crypt aesthetic: dark slate palette, glowing acid/violet/amber accents, subtle dot grid (`src/index.css`)
- [x] Typography pairing: JetBrains Mono (headings/mono), Inter (body/UI), Instrument Serif (epitaphs) (`src/index.css`)
- [x] Custom 404 page in same theme with serif epitaph (`src/pages/NotFoundPage.tsx`)
- [x] Empty states with thematic iconography and direct call-to-action buttons (`src/pages/VaultPage.tsx:317`, `src/pages/SalvageMarketPage.tsx:238`)
- [x] Error states: input shake animation on invalid submission (`src/components/motion/useShake.ts`, `src/styles/transitions.css`)
- [x] Local storage persistence in `graveyard:data` with corrupt data backup and fallback to seed (`src/lib/storage.ts:loadGraveyardData`)
- [x] Restore demo data dialog preserving user-created projects (`src/components/layout/Shell.tsx:60`, `src/store/reducer.ts:257`)

---

## 1. Missing or Partial List (Ordered by Main Journey) — Progress & Resolutions

1. **Path (Resurrection Engine - Pivot)**:
   - *Status*: `[x] Fully working`.
   - *Resolution*: Added side-by-side "Original Baseline (Before)" reference panel in `src/pages/ProjectDetailPage.tsx:585-610` displaying scope, stall rationale, and category while formulating a new pivot direction.
2. **Dedicated Route Navigation**:
   - *Status*: `[x] Fully working`.
   - *Resolution*: Dedicated top-level routes (`/vault`, `/autopsy`, `/engine`, `/market`, `/roadmap`, `/export`) registered in `src/App.tsx`. Added `AutopsyHubPage.tsx` and `EngineHubPage.tsx`.
3. **Sidebar Grouping & Status Dots**:
   - *Status*: `[x] Fully working`.
   - *Resolution*: Redesigned `src/components/layout/Shell.tsx` into 3 groups ("Workspace", "Library", "Tools"), indexes `01`–`07`, live status dots with real data, keyboard `[` toggle, and localStorage rail persistence.
4. **Standalone Export & Import View**:
   - *Status*: `[x] Fully working`.
   - *Resolution*: Created dedicated `src/pages/ExportPage.tsx` with full JSON backup verification before commit, and markdown digest generation.

---

## 2. Landing Page Problem — Resolved

- Refactored `src/pages/HomePage.tsx`:
  - Retained high-impact hero with "Open the Vault" &rarr; `/vault` and smooth-scroll "See how it works".
  - Implemented 4-stage connected workflow line (01 Bury, 02 Autopsy, 03 Decide, 04 Harvest).
  - Added 3 problem cards (Scrap Trap, Missing Diagnostics, Ghost Repo Problem).
  - Built single static preview tombstone centerpiece with score (email-worker: 92/100).
  - Added 4 non-functional teaser cards linking to `/vault`, `/autopsy`, `/engine`, `/market`.
  - Added closing epitaph CTA and privacy-centric footer.
  - Removed all live functional UI from landing page.

---

## 3. Verification
- `npm run build`: Successful (0 TypeScript or build errors).
- `npm test`: 33 of 33 tests passing across all 4 suites.
