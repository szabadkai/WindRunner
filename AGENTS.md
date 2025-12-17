# Repository Guidelines

## Project Structure & Module Organization
- `src/main.ts` boots Phaser, wires the scene order, and defines the game config.
- Scenes live in `src/scenes` (Boot, Menu, Race, Courier, UI, Pause); scene-specific UI helpers sit in `src/systems` and `src/objects`.
- Shared logic and data: `src/utils` (helpers), `src/physics` (movement/collision), `src/data` (tunable values), `src/shaders` (visual effects), `style.css` (global styles).
- Static assets are served from `public/`; built artifacts land in `dist/` and should not be edited directly.

## Build, Test, and Development Commands
- `npm run dev` — start Vite on all hosts for desktop or device testing.
- `npm run build` — type-checks via `tsc` then creates a production bundle in `dist/`.
- `npm run preview` — serves the built bundle locally to spot prod-only issues.
- `npm run lint` / `npm run lint:fix` — ESLint with TypeScript rules; keep the tree clean before PRs.
- `npm run check` — convenience to run lint then build; use as a pre-PR gate.

## Coding Style & Naming Conventions
- TypeScript with `strict` mode; avoid `any`, prefer typed helpers and Phaser generics.
- Two-space indentation, single quotes, and trailing commas per ESLint defaults.
- Classes and scenes: `PascalCase` file and class names (e.g., `CourierScene.ts`). Functions, variables, and instances: `camelCase`. Config/constants: `SCREAMING_SNAKE_CASE` when shared.
- Favor small modules with named exports; keep scene setup in constructors/create, and gameplay logic in systems/objects to avoid bloated scenes.

## Testing Guidelines
- No automated test suite yet; rely on manual passes. At minimum, smoke-test Boot → Menu → Race and Courier flows, audio unlock behavior, pause/resume, and mobile controls.
- When adding features, prefer writing small harness functions that can be invoked from scenes for quick manual verification.
- Add tests if introducing deterministic logic; colocate future tests under `src/**/__tests__` and mirror file names.

## Commit & Pull Request Guidelines
- Recent history favors short, imperative subjects (e.g., `fix finish timing`, `mobile controls`); use `fix:` prefix when repairing regressions.
- Keep commits focused; include asset provenance when adding new media.
- PRs should state intent, list user-visible changes, describe test/preview steps, and attach screenshots or clips for gameplay/UI tweaks. Link related issues and call out risk areas (audio, input, physics) so reviewers can target validation.
