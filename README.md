# Proj-revi-camp (The Project Graveyard) 🪦

> *Your abandoned code isn't dead. It's waiting.*

A client-side cyberpunk crypt and diagnostic sanctuary for developers to file away stalled side projects, conduct objective post-mortem autopsies, compute a heuristic **Resurrection Score**, and either trigger a focused 72-hour revival sprint or harvest battle-tested components into a personal Salvage Market.

Built primarily in the browser with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Motion**, and **localStorage**. Zero external telemetry, no user accounts, and all data stored locally by default.

---

## 🏛️ Core Workspaces & Architecture

| Module | Route | Purpose | Key Capabilities |
|---|---|---|---|
| **Necropolis Vault** | `/vault` | Crypt Index | Tombstone grid with completion meters, age brackets, Resurrection Score dials, stack filters, and project pinning ("haunt" particle burst). |
| **Autopsy Suite** | `/autopsy`, `/projects/:id/autopsy` | Post-Mortem Diagnostics | 5-step diagnostic wizard assessing completion, motivation, hours, and blockers with automated stop-category heuristics. |
| **Resurrection Engine** | `/engine`, `/project/:id?tab=engine` | Revival Pathways | 4 strategic paths: **Phoenix Protocol** (72h sprint plan), **Pivot Path** (side-by-side baseline reframe), **Salvage Yard**, and **Peaceful Archive**. |
| **Component Salvage Market** | `/market` *(or `/salvage`)* | Reusable Part Catalog | Private local library of code snippets, SQL schemas, and UI blocks with syntax-safe line numbers, copy-to-clipboard, and project linkage. |
| **Lifecycle Roadmap** | `/roadmap` | Append-Only Audit Trail | Chronological event log recording burials, autopsies, and sprint completions. |
| **Data Export & Recovery** | `/export` | Full Portability | JSON backup download, schema-verified archive restoration, and markdown post-mortem summary generator. |
| **Graveyard Oracle** | *Global Drawer* | Rule-Based Local Assistant | Deterministic NLP matcher for 7+ query intents with Matrix Dot Loader, Thinking States shimmer, and Streaming Text. |

---

## 📐 Resurrection Score Formula (0–100 Heuristic)

The score is a **rule-based heuristic** (not an AI prediction) calculated as a weighted average over answered factors:

| # | Input Factor | Required? | Normalization ($x \in [0, 1]$) | Weight | Rationale |
|---|---|---|---|---|---|
| 1 | **Completion %** | Yes | `completion / 100` | 20 | More existing code means less work to finish |
| 2 | **Salvageable Components** | Optional | `min(count, 5) / 5` | 20 | Core metric of reusable engineering value |
| 3 | **Willingness to Continue (1–5)** | Yes | `(rating - 1) / 4` | 15 | Personal motivation is prerequisite for revival |
| 4 | **Sprint Hours Available** | Optional | `min(hours, 24) / 24` | 15 | 24h corresponds to a 3-day sprint capacity |
| 5 | **Scope Clarity (1–5)** | Optional | `(rating - 1) / 4` | 15 | Clear boundaries make a restart realistic |
| 6 | **Blocker Severity (1–5, inverse)** | Optional | `1 - (rating - 1) / 4` | 15 | Technical barriers lower revival probability |

$$\text{Points} = \sum (\text{weight} \times x) \quad \text{over answered inputs}$$
$$\text{Possible} = \sum (\text{weight}) \quad \text{over answered inputs} \ge 35$$
$$\text{Score} = \text{clamp}\left(\text{round}\left(100 \times \frac{\text{Points}}{\text{Possible}}\right), 0, 100\right)$$

Skipped optional inputs are excluded from both sums without penalizing the project, and the UI displays *"based on $N$ of 6 factors"*.

### Heuristic Score Bands
- **0–39 (Low)**: Revival unlikely; recommend component salvage or peaceful archive.
- **40–69 (Moderate)**: Worth a deliberate decision; evaluate blockers and available hours.
- **70–100 (High)**: High revival potential; recommend a 72-hour Phoenix Protocol sprint.

---

## 🎨 Design System & Visual Motif

- **Aesthetic**: Dark cyberpunk crypt with arched tombstone silhouettes, faint fence-line dividers, and subtle ambient glows.
- **Color Palette**:
  - Backgrounds: Deep Crypt Slate (`#0A0D12`, `#11161D`, `#19202A`)
  - Accent Neon: Acid Lime (`#B6FF3C`), Soft Violet (`#A78BFA` / `#8B5CF6`), Amber Glow (`#FFB224`)
- **Typography**:
  - Headings & Accents: **JetBrains Mono**
  - Body & UI: **Inter**
  - Memorial Epitaphs: **Instrument Serif**
- **Keyboard Shortcuts**:
  - `[` : Toggle collapsible sidebar rail (persisted in `localStorage`)
  - `↑` / `↓` : Cycle and navigate between dashboard workspaces
  - `Esc` : Dismiss modals and drawer overlays

---

## 🧪 Testing & Verification

Comprehensive unit test coverage across deterministic logic:
- `src/lib/__tests__/domain.test.ts`: Formula score verification, boundary edge cases, status transitions, and recommendation rules.
- `src/lib/__tests__/oracle.test.ts`: Deterministic intent matching across all query types.
- `src/store/__tests__/reducer.test.ts`: Action dispatching, persistence, and state updates.
- `src/lib/__tests__/markdown.test.ts`: Post-mortem markdown digestion and copy utilities.

```bash
# Run Vitest test suite
npm test
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22+
- npm

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/Perry-code03/Proj-revi-camp.git
cd Proj-revi-camp

# Install dependencies
npm install

# Start local development server
npm run dev

# Run Vitest unit & domain test suite
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) to enter the Necropolis Vault.

---

## 🔒 Privacy & Local-First Philosophy
Project Graveyard is local-first and fully usable offline, storing your catalog in browser storage (`localStorage`) with no telemetry, no tracking, and no required accounts or sync. Your project post-mortems and salvaged snippets remain entirely private on your device.

**Opt-In GitHub Import Feature**: When optionally analyzing a public repository, the URL is sent to our serverless endpoint (`api/analyze-repo.ts`), which queries public GitHub API metadata and passes public excerpts to a configured AI provider (such as Groq or xAI) to normalize suggestions. Nothing is stored on our server, private repositories are not supported, and all suggestions are reviewed and confirmed manually.
