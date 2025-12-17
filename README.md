# WindRunner

Phaser-powered sailing sim with regatta and courier modes, built with TypeScript and Vite.

## Quick Start
- Requires Node 18+ and npm.
- Install deps: `npm install`
- Dev server with HMR: `npm run dev` (opens on all hosts; visit the printed URL)
- Production build: `npm run build` (outputs `dist/`)
- Preview the build: `npm run preview`
- Lint TypeScript sources: `npm run lint` (or `npm run lint:fix`)
- Full check before PRs: `npm run check` (lint + build)

## Project Layout
- `src/main.ts` — boots Phaser and registers scenes (Boot, Menu, Race, UIScene, Pause, Courier, CourierUIScene).
- `src/scenes/` — flow and UI orchestration for each mode.
- `src/objects/` — game entities (Boat, Wind, Course, GhostBoat, Waypoint, Islands, Minimap, Cargo, DeliveryBoard).
- `src/physics/` — sail and heel calculations; `src/data/courses.ts` holds course definitions.
- `src/systems/` — audio settings/manager, progression, helpers; `src/utils/` shared utilities; `src/shaders/` visual effects.
- `public/` — static assets (audio, images); `dist/` — generated build output.

## Gameplay Notes
- **Regatta mode:** Launch from Menu, follow the highlighted course, and beat your best time; `R` restarts, `Esc` pauses.
- **Courier mode:** Deliver cargo between islands within the session timer; press `E` to dock/pick up/deliver; `Esc` pauses.
- **Controls:** Arrow keys steer (left/right) and trim the sail (up/down). Touch input is supported on mobile via the UI. Toggle mute with `M` in menus and during races.
- Audio unlocks on the first input (click or key press) due to browser policies.

## Development Tips
- Core tuning lives in `src/config.ts` (physics, fog, courier settings). Course layouts live in `src/data/courses.ts`.
- Scenes are intentionally lean: gameplay logic is pushed into `objects`, math into `physics`, and shared UI/audio into `systems`.
- Keep files small and typed strictly; prefer named exports and avoid `any`.
- Contributor process and code-quality expectations are documented in `AGENTS.md`.
