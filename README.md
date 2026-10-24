# The Project Graveyard 🪦

> *Your abandoned code isn't dead. It's waiting.*

A client-side cyberpunk crypt and diagnostic sanctuary for developers to file away stalled side projects, conduct objective post-mortem autopsies, compute a heuristic **Resurrection Score**, and either trigger a focused 72-hour revival sprint or harvest battle-tested components into a personal Salvage Market.

Built 100% in the browser with **React**, **TypeScript**, **Tailwind CSS v4**, **Motion**, and **localStorage**. Zero cloud dependencies, zero tracking, zero paid APIs.

---

## 🏛️ Core Modules

1. **Necropolis Vault (`/vault`)**:
   - Tombstone grid with completion meters, age tags, R.I.P. badges, and Resurrection Score dials.
   - Rich multi-filter system: tech stack tags, category, age brackets (`<3mo`, `3-6mo`, `6-12mo`, `12mo+`), completion % brackets, and status.
   - Project pinning ("haunt" button with custom particle burst).
   - "Bury a Project" modal with inline validation and shake animations on errors.

2. **The Autopsy Wizard (`/projects/:id/autopsy`)**:
   - Multi-step diagnostic workflow: What Was Built &rarr; What Broke &rarr; Why Development Stopped &rarr; Resuscitation Factors &rarr; Review & Score.
   - Keyword-based stop category suggestion (e.g. "too many features" suggests `scope`, "tired" suggests `burnout`).
   - Dynamic 0–100 Resurrection Score calculated purely from objective heuristic weights.

3. **The Resurrection Engine (`/project/:id?tab=engine`)**:
   - Four distinct paths:
     - **Phoenix Protocol**: Deterministic 3-day MVP sprint plan and interactive checklist. Status transitions to `resurrecting`.
     - **Pivot Path**: Reposition project direction while keeping historical narrative intact.
     - **Salvage Yard**: Extract reusable snippets, schemas, and UI blocks. Requires &ge; 1 linked component to transition status to `salvaged`.
     - **Peaceful Archive**: Engrave a memorial epitaph in serif stone. Transitions status to `in_stasis`.

4. **Component Salvage Market (`/salvage`)**:
   - Private catalog of code snippets, database schemas (PostgreSQL / SQL), and UI blocks.
   - Interactive code viewer with line numbers, copy-to-clipboard, and project source linkage.

5. **Lifecycle Roadmap (`/roadmap`)**:
   - Append-only historical event log with glowing nodes tracing every burial, score calculation, and status change.

6. **The Graveyard Oracle (Floating Panel)**:
   - Rule-based, local diagnostic assistant.
   - Answers natural language questions about your graveyard (which project to revive first, why code stalled, component audits, and score explanations).
   - Showcases custom motion effects: *Thinking States shimmer*, *4x4 Matrix Dot Loader*, and *Blur-Crossfade Streaming Text*.

---

## 📐 Resurrection Score Formula (0–100 Heuristic)

The score is a **rule-based heuristic** (not an AI prediction) calculated as a weighted average over answered factors:

| # | Input Factor | Required? | Normalization ($x \in [0, 1]$) | Weight |
|---|---|---|---|---|
| 1 | **Completion %** | Yes | `completion / 100` | 20 |
| 2 | **Salvageable Components** | Optional | `min(count, 5) / 5` | 20 |
| 3 | **Willingness to Continue (1–5)** | Yes | `(rating - 1) / 4` | 15 |
| 4 | **Sprint Hours Available** | Optional | `min(hours, 24) / 24` | 15 |
| 5 | **Scope Clarity (1–5)** | Optional | `(rating - 1) / 4` | 15 |
| 6 | **Blocker Severity (1–5, inverse)** | Optional | `1 - (rating - 1) / 4` | 15 |

$$\text{Points} = \sum (\text{weight} \times x) \quad \text{over answered inputs}$$
$$\text{Possible} = \sum (\text{weight}) \quad \text{over answered inputs}$$
$$\text{Score} = \text{clamp}\left(\text{round}\left(100 \times \frac{\text{Points}}{\text{Possible}}\right), 0, 100\right)$$

Skipped optional inputs are omitted without penalty, with the UI transparently showing *"based on $N$ of 6 factors"*.

### Score Bands
- **0–39**: Low Revival Potential
- **40–69**: Moderate Revival Potential
- **70–100**: High Revival Potential

---

## 🎨 Design System & Motion Map

- **Palette**: Dark slate crypt (`--bg: #0A0D12`, `--surface: #11161D`, `--border: #232C38`), glowing cybernetic accents (`--acid: #B6FF3C`, `--violet: #8B5CF6`, `--amber: #FFB224`).
- **Typography**:
  - Headings: **JetBrains Mono Variable**
  - Body & UI: **Inter Variable**
  - Epitaphs & 404: **Instrument Serif Italic**
- **Motion (transitions.dev & Custom Originals)**:
  - `text-states-swap`: Vertical roll on status chip updates.
  - `success-check`: Animated SVG checkmark path reveal.
  - `error-state-shake`: Horizontal input vibration on validation failure.
  - `like-button` (Cyberpunk Haunt): Ghost toggle with floating particle dispersion.
  - `matrix-dot-loader`: 4x4 dot grid wave pulse.
  - `thinking-states`: Shimmering diagnostic status cycling.
  - `streaming-text`: Soft blur cross-fade word reveal.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22+
- npm

### Installation & Run
```bash
# Clone and enter directory
cd project-graveyard

# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Run Vitest unit & domain test suite
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

Open `http://localhost:5173` to enter the Necropolis Vault.
