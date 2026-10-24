# Project Graveyard: Features Specification (FEATURES.md)

## Section 1: Intake & Burial (Add & Edit Project)
- [ ] Modal dialog for burying a project accessible from global navigation and Vault
- [ ] Required fields: Name (2–60 chars, unique ignoring case), Description (1–500 chars)
- [ ] Tech stack tags input (1–8 tags, 1–24 chars each, no duplicates, enter/comma to add)
- [ ] Project Category selection from fixed list (Web App, API / Backend, CLI Tool, Mobile App, Data / ML, Game, Library, Other)
- [ ] Estimated completion percentage (0–100 integer with interactive slider and numeric indicator)
- [ ] Last active date input (not in the future, drives the age indicator)
- [ ] Duplicate project name prevention with friendly inline error message
- [ ] Form error state shake animation and focus on first invalid field
- [ ] Success state checkmark drawing and prompt to immediately conduct autopsy or return to Vault
- [ ] Edit existing project metadata with prefilled form and update timestamp

## Section 2: Necropolis Vault
- [ ] Responsive grid of tombstone cards with arched top styling (.tombstone-arch)
- [ ] R.I.P. badge, project name, category, and human-readable age counter
- [ ] Status chip with distinct thematic styling for Deceased, In Stasis, Resurrecting, and Salvaged
- [ ] Interactive completion progress bar with gradient styling
- [ ] Circular Resurrection Score dial with qualitative band label (Low, Moderate, High)
- [ ] Pinned ("haunt") toggle button with ghost icon and particle burst effect
- [ ] Tech stack pill tags with overflow counter (+N more)
- [ ] Multi-filter by tech stack tags (OR within tags, AND across groups)
- [ ] Multi-filter by project category
- [ ] Multi-filter by age bracket (<3mo, 3-6mo, 6-12mo, 12mo+)
- [ ] Multi-filter by completion bracket (0-25%, 26-50%, 51-75%, 76-100%)
- [ ] Multi-filter by project status
- [ ] Full-text search across project name, description, and stack tags
- [ ] Sort dropdown (Recently Updated, Highest Score, Completion %, Oldest First, Name A-Z)
- [ ] Active filter count indicator and "Clear all filters" button
- [ ] Kebab menu for quick actions (Open dossier, Conduct autopsy, Edit, Delete with modal confirmation)

## Section 3: The Autopsy Wizard
- [ ] Step-by-step diagnostic stepper with progress rail (Stages 01–05)
- [ ] Step 1: What was built (10–1000 characters)
- [ ] Step 2: What broke (10–1000 characters)
- [ ] Step 3: Why development stopped (10–1000 characters)
- [ ] Keyword matching on stall reason to auto-suggest failure category (scope, burnout, priorities, technical, other) with one-click acceptance
- [ ] Step 4: Resuscitation heuristic inputs with clear required vs optional indicators
- [ ] Willingness to continue rating (1–5 mandatory)
- [ ] Salvageable components remaining count (0–50, optional, clear skip toggle)
- [ ] Available sprint hours count (0–200, optional, capped at 24h, clear skip toggle)
- [ ] Scope clarity rating (1–5, optional, clear skip toggle)
- [ ] Technical blocker severity rating (1–5 inverse, optional, clear skip toggle)
- [ ] Step 5: Review screen with editable links jumping back to each step
- [ ] "Performing autopsy..." loading shimmer transition during calculation
- [ ] Score reveal screen displaying animated score dial, band label, and "based on N of 6 factors"
- [ ] Transparent per-factor breakdown showing points earned vs possible with descriptive explanations
- [ ] Explicit label noting score is a rule-based heuristic and not an AI prediction
- [ ] Primary CTA to proceed directly to the Resurrection Engine

## Section 4: Resurrection Score Engine
- [ ] Mathematical formula: points / possible * 100 clamped between 0 and 100
- [ ] Factor weights: Completion (20), Useful Components (20), Willingness (15), Hours (15), Scope Clarity (15), Blocker Severity (15)
- [ ] Skipped optional factors are omitted from both points and possible without penalizing score
- [ ] Robust clamping: out-of-range numbers clamped defensively, NaN treated as skipped
- [ ] Exact worked example checks: email-worker (92), payment-core (67), legacy-auth (41), legacy-auth skipped optionals (42), campus-pulse (36)
- [ ] Boundary conditions: all-worst gives 0, all-best gives 100, hours >= 24 gives same credit as 24
- [ ] Score versioning (`scoreModelVersion: 1`) stored on autopsy records with automatic recalculation on load if model upgrades

## Section 5: Path Recommendation Engine
- [ ] Deterministic path suggestions based on autopsy and score inputs
- [ ] Phoenix Protocol suggested when score >= 60, willingness >= 3, hours >= 12 (if given), blocker <= 3 (if given)
- [ ] Pivot Path suggested when willingness >= 3 and (stopCategory == 'priorities' or scopeClarity <= 2)
- [ ] Salvage Yard suggested when usefulComponents >= 1
- [ ] Peaceful Archive suggested when (willingness <= 2 and usefulComponents == 0) or score < 25
- [ ] Clear human-readable justification sentence explaining why the engine recommended this path
- [ ] Display of alternative applicable paths without blocking user choice

## Section 6: The Resurrection Engine
- [ ] Visual Dead-to-Active lifecycle progress rail (Deceased -> In Stasis -> Resurrecting -> Salvaged)
- [ ] Path 1: Phoenix Protocol generates 3-day MVP sprint tasks from project post-mortem data
- [ ] Phoenix sprint task checklist with interactive completion toggles (progress saved)
- [ ] Add and remove custom sprint tasks (1–12 tasks, 1–120 chars each)
- [ ] Phoenix activation transitions project status to `resurrecting` and appends roadmap events
- [ ] Path 2: Pivot Path fields for new direction (10–500 chars) and rationale (10–500 chars)
- [ ] Pivot Path preserves original project description and post-mortem in an untouched "Before" state
- [ ] Pivot activation transitions status to `resurrecting` and logs roadmap events
- [ ] Path 3: Salvage Yard lists all currently harvested components linked to the project
- [ ] Salvage activation transitions status to `salvaged` (strictly enforced only if >= 1 component linked)
- [ ] Path 4: Peaceful Archive with engraved memorial epitaph (<= 280 chars) rendered in serif italic
- [ ] Peaceful Archive transitions status to `in_stasis`, records `archivedAt`, and provides a Reopen option

## Section 7: Component Salvage Market
- [ ] Dedicated `/salvage` market page and per-project Components tab
- [ ] Component cards with type badges: Code Snippet, Database Schema, UI Block
- [ ] Interactive code preview with syntax-safe monospace display
- [ ] Full code inspect dialog with line numbers, source project link, and copy-to-clipboard button
- [ ] Copy button triggers animated success checkmark with graceful fallback
- [ ] Add/Harvest Component dialog with name, type, description, source project, tags, and 20,000 char code textarea
- [ ] Full validation with field-level errors and error shake
- [ ] Filter components by type (snippet, schema, ui_block), source project, and stack tags
- [ ] Plain text code rendering to guarantee zero raw HTML or script execution
- [ ] License disclaimer banner clarifying that salvaged code is local and not a public hosted marketplace

## Section 8: Lifecycle Roadmap
- [ ] Global `/roadmap` timeline page displaying all historical events across all projects (newest first)
- [ ] Per-project Roadmap tab displaying project-specific history
- [ ] Append-only logging: events created strictly by real user actions (created, autopsied, path selected, status changed, component added/removed)
- [ ] Event cards with themed icons, timestamp formatting, and event-type chips
- [ ] Filter global roadmap by source project and by event kind
- [ ] Clear on-page note differentiating historical audit log (what happened) from forward-looking sprint checklists (what to do)

## Section 9: The Graveyard Oracle (Local Assistant)
- [ ] Floating panel / assistant drawer accessible from global navigation
- [ ] Explicit header stating it is a rule-based assistant running 100% locally with zero cloud AI or data leakage
- [ ] Deterministic query matching for: "which project to revive first", "summary of graveyard", "why did project stall", "what can I salvage", "3-day plan for project", "how is score calculated", and "help"
- [ ] Suggested quick-prompt chips for instant queries
- [ ] Interactive chat history with screen-reader friendly `aria-live="polite"`
- [ ] Matrix Dot Loader motion effect: 4x4 pulsing cybernetic dot grid
- [ ] Thinking States motion effect: shimmering status lines cycling diagnostic thoughts
- [ ] Streaming Text motion effect: word-by-word reveal with soft blur cross-fade
- [ ] Respects reduced motion preferences by skipping animation loops and displaying text instantly

## Section 10: System States, Layout & Transitions
- [ ] Responsive navigation shell: collapsible sidebar on desktop, slide-in drawer on mobile
- [ ] Live UTC clock in top bar updating every minute
- [ ] Skip to main content landmark link for keyboard accessibility
- [ ] Cyberpunk crypt aesthetic: dark slate palette, glowing acid/violet/amber accents, subtle dot grid
- [ ] Typography pairing: JetBrains Mono (headings/mono), Inter (body/UI), Instrument Serif (epitaphs)
- [ ] Custom 404 page in same theme with serif epitaph ("Here lies this page.")
- [ ] Empty states with thematic iconography and direct call-to-action buttons
- [ ] Error states: input shake animation on invalid submission
- [ ] Local storage persistence in `graveyard:data` with corrupt data backup and fallback to seed
- [ ] Restore demo data dialog preserving user-created projects

## Section 11: Future Features & Data Management
- [x] Downloadable JSON data backup (Export all data)
- [x] JSON data restore (Import backup with schema validation and confirmation prompt)
- [ ] Out of scope: GitHub repository analysis/import (do not build)
- [ ] Out of scope: User accounts and cloud synchronization (do not build)
- [ ] Out of scope: Public hosted marketplace (do not build)
- [ ] Out of scope: Paid LLM API integration (do not build)
