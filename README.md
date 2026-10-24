# The Project Graveyard 🪦

A local-first register and diagnostic tool for stalled and abandoned side projects.

> **Status**: Completed hackathon project for Problem Statement 05 (PS 05) by Team **Code_Cartel**.  
> **Live Demo**: [Live Demo](https://project-graveyard.vercel.app) *(Replace with your deployment link)*

---

## What It Is

The Project Graveyard is a private, client-side registry to catalog shelved projects, conduct structured 5-step autopsies, calculate a heuristic Resurrection Score, and determine an actionable revival or archive path.

- It is **not** a project management tool (no issue trackers, kanban boards, or sprint velocity metrics).
- It is **not** only for software (works equally for hardware, writing, design, and non-code projects).

---

## Features

- **Landing Page**: Explains abandoned project rot, previews feature workflows, and answers common questions.
- **Necropolis Vault**: Project crypt grid with tombstone-shaped cards, completion bars, age tags, score dials, and pinning.
- **Bury Project**: Modal form supporting manual entry and optional public GitHub repository analysis.
- **Autopsy Wizard**: 5-step diagnostic assessing built scope, technical blockers, motivation, and available sprint hours.
- **Resurrection Engine**: 4 revival strategies: Phoenix Protocol (72h MVP sprint), Pivot Path, Salvage Yard, and Peaceful Archive.
- **Salvage Market**: Reusable part catalog to store, categorize, tag, and copy code snippets and architectural patterns.
- **Roadmap**: Chronological, append-only audit trail logging project burials, autopsies, and revival milestones.
- **Export and Restore**: Backup data as JSON, restore backups with schema validation, or export post-mortems as Markdown.
- **Graveyard Oracle**: Diagnostic drawer assistant with a deterministic local heuristic mode and an optional serverless AI advisor.
- **Keyboard Shortcuts**: Global shortcuts (`[` toggles sidebar navigation, `ArrowDown`/`ArrowUp` cycles workspaces).

---

## Application Routes

The application uses React Router with a `HashRouter` (`#/path`):

| Route | Page Component | Purpose |
|---|---|---|
| `#/` | [HomePage](file:///src/pages/HomePage.tsx) | Project introduction and feature walkthrough |
| `#/vault` | [VaultPage](file:///src/pages/VaultPage.tsx) | Project crypt catalog and filtering |
| `#/autopsy` | [AutopsyHubPage](file:///src/pages/AutopsyHubPage.tsx) | Autopsy dashboard to select projects for review |
| `#/projects/:id/autopsy` | [AutopsyWizardPage](file:///src/pages/AutopsyWizardPage.tsx) | 5-step post-mortem diagnostic questionnaire |
| `#/engine` | [EngineHubPage](file:///src/pages/EngineHubPage.tsx) | Resurrection strategy overview |
| `#/project/:id` | [ProjectDetailPage](file:///src/pages/ProjectDetailPage.tsx) | Single project view with details, plan, and salvage tabs |
| `#/market`, `#/salvage` | [SalvageMarketPage](file:///src/pages/SalvageMarketPage.tsx) | Harvested component catalog |
| `#/roadmap` | [RoadmapPage](file:///src/pages/RoadmapPage.tsx) | Audit event log of burials and completions |
| `#/export` | [ExportPage](file:///src/pages/ExportPage.tsx) | JSON backup/restore and Markdown summary download |
| `#/styleguide` | [StyleguidePage](file:///src/pages/StyleguidePage.tsx) | Design system tokens and UI components |

---

## Resurrection Score (0–100 Heuristic)

The Resurrection Score is a **rule-based heuristic**, not an AI prediction or validated statistical model. It is computed in [src/lib/score.ts](file:///src/lib/score.ts) across up to 6 factors:

| # | Factor | Required | Weight | Normalization ($x$) |
|---|---|---|---|---|
| 1 | **Completion %** | Yes | 20 | `completion / 100` |
| 2 | **Salvageable Components** | Optional | 20 | `min(count, 5) / 5` |
| 3 | **Willingness to Continue (1–5)** | Yes | 15 | `(rating - 1) / 4` |
| 4 | **Sprint Hours Available** | Optional | 15 | `min(hours, 24) / 24` |
| 5 | **Scope Clarity (1–5)** | Optional | 15 | `(rating - 1) / 4` |
| 6 | **Blocker Severity (1–5, inverse)** | Optional | 15 | `1 - (rating - 1) / 4` |

$$\text{Score} = \text{clamp}\left(\text{round}\left(100 \times \frac{\sum (\text{weight} \times x)}{\sum \text{weight of answered factors}}\right), 0, 100\right)$$

Skipped optional inputs are omitted from both numerator and denominator without penalty (minimum denominator is 35 points from the two required factors).

- **0–39 (Low Revival Potential)**: Recommend component salvage or peaceful archive.
- **40–69 (Moderate Revival Potential)**: Worth a deliberate review of blockers and available time.
- **70–100 (High Revival Potential)**: High potential; recommend a 72-hour Phoenix Protocol sprint.

---

## AI Features and Privacy

All core workflows operate locally without network access. AI enhancements are optional serverless calls requiring user-provided provider keys:

1. **GitHub Import ([api/analyze-repo.ts](file:///api/analyze-repo.ts))**:
   - Reads: Public repository details, detected languages, manifest files (up to 20 KB), and README (up to 6 KB). Private repositories are not supported.
   - Sent to AI: Name, description, languages, topics, and truncated README.
   - Fallback: Deterministic package manifest stack detection (`github-only`).
2. **Autopsy Diagnostic Assist ([api/suggest-autopsy.ts](file:///api/suggest-autopsy.ts))**:
   - Sent to AI: Project name, category, stack, description, and README excerpt. Personal reasons, ratings, scores, and schedules are never sent or guessed.
   - Output: Extracts `whatWasBuilt` and `whatBroke` (1-2 sentences).
   - Fallback: Deterministic repository activity facts (creation date, months since last push, TODO/WIP markers).
3. **Graveyard Oracle Chat ([api/oracle-chat.ts](file:///api/oracle-chat.ts))**:
   - Sent to AI: User question (up to 500 characters) and up to 10 project summaries (name, status, completion, score, category, stack, stop category).
   - Fallback: Local rule-based intent matching in [src/lib/oracle.ts](file:///src/lib/oracle.ts).

All AI output is labeled `Suggested by AI, please review`. Data is stored in browser `localStorage`. No accounts, no user databases, and no analytics tracking.

---

## Tech Stack

- **Frontend**: React 19 (`react`, `react-dom`), TypeScript, Vite, Tailwind CSS v4, Motion (`motion`), react-router-dom, shadcn/ui (`@base-ui/react`, `lucide-react`, `class-variance-authority`).
- **Fonts**: Inter (`@fontsource-variable/inter`), JetBrains Mono (`@fontsource-variable/jetbrains-mono`), Instrument Serif (`@fontsource/instrument-serif`), Geist (`@fontsource-variable/geist`).
- **Backend**: Vercel Serverless Functions (`/api/*.ts`) using Web-standard Request/Response handlers in Node ESM.
- **Testing & Tooling**: Vitest, React Testing Library, JSDOM, oxlint.

---

## Project Structure

```
api/                     Vercel serverless API handlers (repo analysis, autopsy assist, oracle chat)
docs/                    Project specifications and design documentation
src/
  components/            Layout shell, tombstone cards, dialog modals, and oracle drawer
  landing/               Landing page sections and presentation components
  lib/                   Pure calculation logic (scoring, recommendations, GitHub parser, storage)
  pages/                 Router views (Vault, Autopsy, Engine, Salvage, Roadmap, Export)
  store/                 Global state provider and localStorage synchronization
  types/                 Shared TypeScript interfaces and data models
```

---

## Getting Started on Windows PowerShell

### Prerequisites
- Node.js 20.19+ or 22+
- npm

### Installation and Run
```powershell
# 1. Clone repository
git clone https://github.com/Radicalpanther/project-graveyard.git
Set-Location project-graveyard

# 2. Install dependencies
npm install

# 3. Create local environment file
Copy-Item .env.example .env.local

# 4. Start local development server
npm run dev
```

The dev server runs at `http://localhost:5173/` (or next free port).

### Available Scripts
- `npm run dev`: Starts local Vite development server.
- `npm test`: Runs Vitest test suite.
- `npm run lint`: Runs oxlint code inspection.
- `npm run build`: Compiles TypeScript and creates production bundle in `dist/`.
- `npm run preview`: Locally previews production build.

---

## Deploying to Vercel

1. Import the repository in the Vercel Dashboard.
2. Select the **Vite** preset (build command: `npm run build`, output directory: `dist`).
3. Add the following environment variables in **Project Settings > Environment Variables** for **Production** and **Preview**:
   - `AI_API_KEY`: Groq (`gsk_...`) or xAI (`xai-...`) key without quotes (optional).
   - `AI_MODEL`: Active model name (e.g. `llama-3.3-70b-versatile`) without quotes (required if `AI_API_KEY` is set).
   - `AI_BASE_URL`: (Optional) Defaults to `https://api.groq.com/openai/v1`.
   - `GITHUB_TOKEN`: (Optional) GitHub personal access token with public read access to increase rate limits. Never commit this token.
4. Redeploy after saving variables (**Deployments** > `...` > **Redeploy**).
5. [vercel.json](file:///vercel.json) handles SPA URL rewrites to `/index.html` and allocates a 30-second `maxDuration` for serverless API routes.

### App Fallback Notices
When AI configuration is missing or providers fail, the app displays honest notices:
- `"AI is not configured on this deployment (missing AI_API_KEY or AI_MODEL). Showing repository activity facts."`
- `"The AI provider rejected the key."`
- `"The configured AI model was not found."`
- `"The AI provider is rate limiting requests."`
- `"The AI request timed out."`
- `"The AI found nothing in the repository text to suggest."`
- `"AI Oracle unavailable right now. Showing local guidance."`

---

## Testing

Run the test suite with:
```powershell
npm test
```

Current test status: **16 test files passed, 179 unit and integration tests passed**.
