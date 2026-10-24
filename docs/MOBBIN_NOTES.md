# Mobbin Design Reference Notes: Project Graveyard

*Note: Mobbin MCP API endpoint requires an active paid tier subscription; reference research synthesized from curated web SaaS desktop dashboard & developer tool design patterns (Linear, Supabase, Vercel, Railway, Raycast) conforming strictly to `docs/DESIGN_BRIEF.md`.*

---

## Topic Research Notes

### (a) Dark SaaS Dashboard Sidebar Navigation
- **Hierarchy & Visual Weight**: Dark backgrounds (`#0a0b10` to `#12131c`) with subtle 1px border dividers (`#1f2133`). High contrast active state with muted inactive state (`#94a3b8` vs `#f8fafc`).
- **Active State Indicators**: A vertical accent line (2-3px) on the left border, complemented by a soft background tint (e.g. 8-12% opacity brand violet/emerald glow) with slight inner border highlight.
- **Micro-interactions**: 150ms transitions on hover with slight brightness bump and 1px inset shift rather than heavy shadows.

### (b) Collapsible Sidebar with Grouped Sections
- **Grouping Structure**: Visual grouping with uppercase micro-labels (10-11px, letter-spacing 0.08em, 40-50% opacity) separating categories (e.g. "WORKSPACE", "LIBRARY", "TOOLS").
- **Collapsible Rail Behavior**: Icon-only mode (~64px width) with tooltips or expandable slide-out text on hover. Keyboard shortcut indicator (e.g. `[` or `Cmd+B`) visible in header/footer.
- **State Persistence**: Saving collapsed/expanded preference in `localStorage` across reloads to avoid UI layout flashes.
- **Item Indexing**: Numeric index prefixes (`01`, `02`, etc.) in mono font to convey an intentional developer-first tool aesthetic.

### (c) Developer Tool Landing Page Hero
- **Typography Stance**: High-contrast pairing: an expressive editorial serif or technical mono headline flanked by clean sans body copy.
- **Clarity of Pitch**: Single clear value proposition focusing on saving wasted developer hours and salvageable code rather than generic hype.
- **Dual CTAs**: High-contrast primary action ("Open the Vault" or "Explore Demo") paired with a low-contrast anchor link ("See how it works" with smooth scroll).
- **Subtle Ambiance**: Radial gradient glow centered behind hero elements rather than sprawling animated canvas bloat.

### (d) Landing Page "How it Works" Numbered Steps Section
- **Linear Progression**: 4 clear chronological steps connected by a subtle, dashed or faint 1px connector line.
- **Content Discipline**: Single concise sentence per step describing what the developer actually does (Bury -> Autopsy -> Decide -> Harvest).
- **Step Badging**: Monospace numeral badges (`01`, `02`, `03`, `04`) with subtle colored glow when activated.

### (e) Empty State & Onboarding Screens
- **Thematic Illustrations**: In place of blank slates or generic sad icons, thematic SVG silhouettes (arched tombstone outlines, weathered chisels, crypt lanterns).
- **Direct Next Action**: Centered primary CTA button immediately in the empty state card to initiate creation or reset demo data.
- **Contextual Helper Copy**: Brief two-line explanation of what will populate here once projects or components are added.

### (f) Data Card & List Layouts
- **Card Geometry**: Arched top corners (`rounded-t-2xl` with `rounded-b-md`) invoking tombstone silhouettes.
- **Metadata Badges**: Monospace status pills with dot indicators (Deceased: slate/red, Stasis: amber, Resurrecting: violet, Salvaged: emerald).
- **Data Density**: Metrics (completion %, score, components) clearly delineated with 1px dividers rather than loose whitespace.

---

## Patterns to Adopt for Project Graveyard (Crypt & Tombstone Theme)

1. **Arched Tombstone Card Silhouettes**: Use `border-t border-x border-b` with distinct rounded top corners (`rounded-t-2xl rounded-b-md`) across project cards and preview centerpieces.
2. **Crypt Division Fence Lines**: Subtle horizontal dividers with faint cross-hatch or dashed border patterns (`border-dashed border-violet-950/60`) separating landing sections and sidebar groups.
3. **Ghost Status Dot Counters**: Live mini-dot counters in the sidebar showing real counts of Deceased, Stasis, Resurrecting, and Salvaged projects.
4. **Monospace Index Numbers**: Prefix navigation items with faint `01`–`07` numbers in JetBrains Mono (`text-zinc-600 font-mono text-xs`).
5. **Left Accent Violet Rail**: An active indicator featuring a 2px violet rail (`bg-violet-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]`) with an arched background highlight.
6. **Hero Arched Centerpiece**: A single static tombstone preview card on the landing page exhibiting the Resurrection Score, epitaph, and status without live interactive clutter.
7. **Single-Sentence 4-Step Pathway**: Connected 4-stage pipeline (01 Bury &rarr; 02 Autopsy &rarr; 03 Decide &rarr; 04 Harvest) with a thin connector line.
8. **Collapsible Rail with Keyboard `[`**: Instant keyboard toggle and arrow key navigation with state persisted in `localStorage`.
