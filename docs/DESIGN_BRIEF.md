# Design Brief: "Cyberpunk crypt, engineer-first"

Goal: a polished, professional, memorable product UI. Not a generic admin dashboard. Dark-mode first, minimal noise, every element earns its place.

## 1. Inspiration: take structure and ideas, never copy layouts, copy text, assets or branding
(Notes come from page text only; visuals were not reviewed. AGY: if you can open these pages, look at hero composition and spacing, then design your own.)
- **melius.com**: giant headline, one clear CTA, product shown as a real canvas not a screenshot, logo strip, tabbed showcase.
- **cofounder.co**: hero with live product mock, staged "1.0 / 2.0 / 3.0" sections, workflow step lists with status chips, human-in-the-loop framing.
- **set.space**: editorial restraint, numbered sections (01 to 05), small uppercase labels, a live clock in the nav, private-database tone.
- Also browsed for patterns: godly.design, collectui.com, designspells.com (404 pages), curated.design, httpster.net, minimal.gallery, nicelydone.club, pageflows.com, pigment.shapefactory.co.
What we take: one confident headline, product-as-hero, numbered stages, restrained palette, delightful empty and 404 states, a "live" feel (clock, counters, status ticks).

## 2. Color tokens (adjustable; verify contrast, body text >= 4.5:1, large text >= 3:1)
| Token | Value | Use |
|---|---|---|
| --bg | #0A0D12 | page (slate, near-black) |
| --surface | #11161D | cards, panels |
| --surface-2 | #171E27 | raised, hover |
| --border | #232C38 | hairlines |
| --text | #E6EAF0 | primary text |
| --muted | #8A96A7 | secondary text |
| --violet | #8B5CF6 | primary accent, focus rings, links |
| --violet-soft | #A78BFA | hover, glows |
| --acid | #B6FF3C | success, "alive", primary CTA fill (text on it: --bg) |
| --amber | #FFB224 | warnings, In Stasis, low score |
| --danger | #FF5C7A | validation errors (not in the slides; recommended) |
Status colors: Deceased = violet-gray outline with a faint violet glow; In Stasis = amber; Resurrecting = acid; Salvaged = violet. Score bands: Low = amber, Moderate = violet, High = acid. Never rely on color alone: always show text labels and icons.
Light mode is not required. If time allows only, add it later via the same tokens.
Atmosphere: very subtle dot grid, one soft violet radial glow behind the hero, faint "fog" gradient at the bottom of tombstone cards. No heavy particles, no scanline overlays, no noisy textures.

## 3. Typography
- Headings: **JetBrains Mono** (variable, self-hosted via @fontsource-variable/jetbrains-mono). Tight tracking (-0.02em) at display sizes. Weights 600-700.
- Body/UI: **Inter** (variable, @fontsource-variable/inter), 16-17px, line-height 1.55, max line length about 65 characters.
- Accent (epitaphs, closure notes, 404 line only): **Instrument Serif** italic (@fontsource/instrument-serif). One serif moment gives the "engraved" feel.
- Small labels: Inter or Mono, 11-12px, uppercase, letter-spacing 0.08em, never for long text.
- Use real typographic characters (curly quotes, en/em dashes, ellipsis), tabular numerals for scores and percentages.
- Fluid scale with clamp(): display 3.25rem to 6.5rem, h1 2.25 to 3.5rem, h2 1.5 to 2rem.
Fonts from fontshare.com were not used: its catalog could not be read and licensing was not verified. The slide-specified pair stays.
Before installing any font package AGY runs `npm view <pkg>` and reports the license (expect OFL).

## 4. Layout system
- 12-col grid, max content width 1280px, 16px gutters on phones, 24-32px on desktop.
- Breakpoints: 640 / 768 / 1024 / 1280. Mobile: bottom tab bar or sheet menu; desktop: left sidebar (collapsible to icons).
- Spacing scale 4/8/12/16/24/32/48/72/120. Radius 12 on cards, 8 on controls, 999 on pills.
- Cards: 1px border, --surface, hover raises to --surface-2 with a violet hairline glow.

## 5. Hero (Home `/`)
Full viewport. Composition:
1. Top bar: wordmark "the-project-graveyard" in mono, nav (Vault, Salvage, Roadmap, Oracle), live local clock, "Bury a Project" button.
2. Display headline (mono, huge): "Your abandoned code isn't dead. It's waiting." Sub line (Inter, muted): "Autopsy it. Score it. Resurrect it, or harvest the parts." (Copy may be refined, but keep it short.)
3. Two CTAs: primary acid "Enter the Necropolis", ghost "Bury a project".
4. Product-as-hero: a framed live preview of 3 real tombstone cards from the store, slightly offset in depth, with status chips that cycle (Deceased to Resurrecting) using the text-states-swap transition. Stats strip under it: Buried / Resurrecting / Salvaged parts / Avg score, all computed from store.
5. Below the fold: numbered sections 01 Intake & Burial, 02 The Autopsy, 03 The Decision, 04 Harvest & Execute (cards with small illustrative UI), then the four modules grid, then a closing CTA with an epitaph in Instrument Serif.
Hero must work with seeded data on first load and must not block access: sidebar is always present, CTA navigates with the page side-by-side transition.

## 6. Components to design with care
Tombstone card (arched top via CSS clip or border-radius, R.I.P. label, name, status chip, completion bar, score ring with number, stack pills, age, pin button). Filter pills (multi-select, count badge, clear all). Score ring + factor breakdown. Wizard stepper. Path cards for the four paths. Roadmap vertical timeline with "Dead to Active" progress rail. Component card with type icon, code preview, copy button. Empty states with a small illustration and one action. 404 page with an epitaph ("Here lies this page.").

## 7. Motion map
Use only these. Source: transitions.dev FREE core set (adapt, keep attribution comment) unless marked ORIGINAL.
| Where | Transition |
|---|---|
| Status chip / button label / score label changes | text-states-swap |
| Sort menu, card kebab menu, user/settings menu, filter dropdowns | menu-dropdown (origin-aware) |
| Bury dialog, component detail, confirmations | modal-open-close |
| Route changes, wizard steps (forward/back), Overview/Engine/etc. tabs | page-side-by-side (direction follows navigation) |
| Save succeeded, component added, export done, path chosen | success-check |
| Invalid form field on submit or blur | error-state-shake (then auto-revert) |
| Score factor info, icon buttons, truncated names | tooltip-open-close |
| Pin ("haunt") a project | like-button (use a ghost or bat or flame icon instead of a heart; particle burst small) |
| "Analyzing..." and loading labels | shimmer-text |
| Oracle thinking status lines | ORIGINAL "thinking states": status line shimmers then swaps to next line |
| Oracle answer reveal | ORIGINAL "streaming text": words resolve through a soft blur cross-fade |
| Oracle / long operations loader | ORIGINAL "matrix dot loader": 4x4 dots pulsing in a few patterns |
The three ORIGINAL items correspond to transitions that transitions.dev lists under Pro. Build your own from the general idea. Do not fetch or reproduce their paid code.
Timing: 150-300 ms for UI feedback, 300-450 ms for page/modal, ease-out for entering, ease-in-out for moving. Stagger lists 30-50 ms. No animation over 600 ms except the one-time hero intro.
Reduced motion: under `prefers-reduced-motion: reduce` replace movement with instant or simple opacity changes, stop loops (cycling chips, shimmer, dot loader becomes static dots), and keep the score reveal as a plain number.
Performance: animate transform and opacity (plus short blur ramps). Never animate layout, width/height, or mask-position.

## 8. Accessibility checklist
Semantic landmarks and headings; skip link; visible focus rings (violet, 2px offset); dialogs trap focus and restore it; `aria-live="polite"` for toasts and oracle answers; form errors linked with `aria-describedby`; icon-only buttons have labels; touch targets >= 40px; works at 200% zoom; color is never the only signal.
