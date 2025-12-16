# Technical Specification: WindRunner

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Game Engine | Phaser 3.80+ | Mature 2D engine, great particle system, built-in input handling |
| Language | TypeScript | Type safety, better IDE support |
| Bundler | Vite | Fast HMR, simple config, native TS support |
| Deployment | GitHub Pages | Free static hosting, integrated with repo |
| CI/CD | GitHub Actions | Native GitHub integration |

---

## Project Structure

```
windrunner/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── src/
│   ├── main.ts                 # Entry point, game instantiation
│   ├── config.ts               # Game constants, physics tuning values
│   ├── scenes/
│   │   ├── BootScene.ts        # Asset loading, initialization
│   │   ├── RaceScene.ts        # Main gameplay scene
│   │   └── UIScene.ts          # HUD overlay (parallel scene)
│   ├── objects/
│   │   ├── Boat.ts             # Player boat entity
│   │   ├── Wind.ts             # Wind state + particle emitter
│   │   ├── Waypoint.ts         # Single waypoint marker
│   │   └── Course.ts           # Course manager (waypoint collection)
│   ├── physics/
│   │   └── SailPhysics.ts      # Speed/angle calculations
│   ├── data/
│   │   └── courses.ts          # Course definitions (waypoint coords)
│   └── utils/
│       └── math.ts             # Angle normalization, vector helpers
├── public/
│   └── assets/                 # Minimal (mostly procedural graphics)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

---

## Scene Architecture

| Scene | Type | Responsibility |
|-------|------|----------------|
| `BootScene` | Sequential | Load any assets, initialize game state, transition to RaceScene |
| `RaceScene` | Main | Game world: boat, water, wind particles, waypoints, physics loop |
| `UIScene` | Parallel | HUD overlay: wind indicator, speed, sail trim, timer, lap counter |

**Scene Flow:**
```
BootScene → RaceScene (launches UIScene in parallel)
```

UIScene runs alongside RaceScene and communicates via Phaser's event emitter.

---

## Class Specifications

### `Boat`

| Property | Type | Description |
|----------|------|-------------|
| `x`, `y` | number | World position |
| `heading` | number | Direction in degrees (0 = north, clockwise) |
| `speed` | number | Current speed in knots |
| `sailTrim` | number | Sail openness 0–100% |

| Method | Description |
|--------|-------------|
| `update(windAngle, windSpeed)` | Called each frame; handles input, physics, rendering |
| `getPosition()` | Returns current {x, y} for collision checks |

**Graphics (procedural):**
- Hull: Elongated hexagon outline, white stroke
- Sail: Triangle, rotates based on `sailTrim`
- Wake: Two trailing lines, opacity scales with speed

---

### `Wind`

| Property | Type | Description |
|----------|------|-------------|
| `angle` | number | Current wind direction (degrees) |
| `speed` | number | Current wind speed |
| `targetAngle` | number | Angle wind is shifting toward |

| Method | Description |
|--------|-------------|
| `update()` | Interpolates toward target angle, triggers new shifts on timer |
| `scheduleShift()` | Sets next shift time and target angle |
| `getParticleConfig()` | Returns emitter config based on current wind state |

**Particle System:**
- Emitter type: Phaser particle emitter
- Particle shape: Small circle or short line
- Count: 50–100 particles on screen
- Lifespan: 3–5 seconds
- Velocity: Correlates to `wind.speed`
- Direction: Matches `wind.angle`
- Alpha: 0.2–0.4 (subtle mist effect)

---

### `SailPhysics`

Pure calculation class, no Phaser dependencies.

| Method | Inputs | Output |
|--------|--------|--------|
| `calculateBoatSpeed` | boatHeading, windAngle, windSpeed, sailTrim | targetSpeed (number) |
| `getPointOfSail` | boatHeading, windAngle | enum: NO_GO, CLOSE_HAULED, BEAM_REACH, BROAD_REACH, RUNNING |
| `getOptimalTrim` | pointOfSail | recommended sailTrim (number) |

**Speed Calculation Logic:**
1. Compute relative wind angle: `abs(boatHeading - windAngle)`
2. If in no-go zone (0–45°): return 0
3. Determine efficiency multiplier based on point of sail
4. Apply sail trim penalty: deviation from optimal = reduced power
5. Scale by wind speed
6. Clamp to max boat speed

**Efficiency Curve (approximate):**

| Relative Angle | Max Efficiency |
|----------------|----------------|
| 45° | 0.5 |
| 90° (beam reach) | 1.0 |
| 135° (broad reach) | 0.85 |
| 180° (running) | 0.6 |

---

### `Waypoint`

| Property | Type | Description |
|----------|------|-------------|
| `x`, `y` | number | Position |
| `radius` | number | Trigger radius (default: 40px) |
| `index` | number | Order in course |
| `isNext` | boolean | Currently active target |
| `isCompleted` | boolean | Already rounded |

| Method | Description |
|--------|-------------|
| `checkRounding(boatX, boatY)` | Returns true if boat within radius |
| `setActive(boolean)` | Updates visual state |

**Graphics:**
- Circle outline
- Number label in center
- Color: orange if active, gray if inactive, green flash on completion

---

### `Course`

| Property | Type | Description |
|----------|------|-------------|
| `waypoints` | Waypoint[] | Ordered list |
| `currentIndex` | number | Next waypoint to round |
| `startTime` | number | Race start timestamp |
| `isFinished` | boolean | All waypoints completed |

| Method | Description |
|--------|-------------|
| `update(boatX, boatY)` | Checks rounding, advances index, emits events |
| `getElapsedTime()` | Returns race duration |
| `reset()` | Restarts course |

---

## Input Mapping

| Action | Keys | Input Type |
|--------|------|------------|
| Rudder left | `A` / `←` | Continuous (hold) |
| Rudder right | `D` / `→` | Continuous (hold) |
| Ease sail (open) | `W` / `↑` | Continuous (hold) |
| Trim sail (close) | `S` / `↓` | Continuous (hold) |
| Restart race | `R` | Single press |
| Pause | `Esc` | Toggle |

Phaser's `keyboard.addKeys()` and `createCursorKeys()` handle input.

---

## Physics Constants

| Constant | Value | Unit |
|----------|-------|------|
| `WIND_SPEED_MIN` | 5 | knots |
| `WIND_SPEED_MAX` | 15 | knots |
| `WIND_SHIFT_INTERVAL_MIN` | 30 | seconds |
| `WIND_SHIFT_INTERVAL_MAX` | 60 | seconds |
| `WIND_SHIFT_AMOUNT_MIN` | 5 | degrees |
| `WIND_SHIFT_AMOUNT_MAX` | 15 | degrees |
| `NO_GO_ZONE_ANGLE` | 45 | degrees |
| `MAX_BOAT_SPEED` | 8 | knots |
| `RUDDER_TURN_RATE` | 2 | degrees/frame |
| `SAIL_ADJUST_RATE` | 2 | %/frame |
| `DRAG_COEFFICIENT` | 0.98 | multiplier/frame |
| `RUDDER_DRAG_PENALTY` | 0.995 | multiplier/frame |
| `WAYPOINT_RADIUS` | 40 | pixels |

---

## UI Elements (UIScene)

| Element | Position | Content |
|---------|----------|---------|
| Wind indicator | Top-left | Arrow showing direction + speed text |
| Timer | Top-center | `MM:SS.ms` elapsed |
| Lap/waypoint | Top-right | `Waypoint 2/5` |
| Sail trim bar | Bottom-left | Horizontal bar 0–100% |
| Speed display | Bottom-right | `4.2 kts` |

All UI rendered with Phaser Graphics + Text objects, no external assets.

---

## Course Data Format

```typescript
interface CourseDefinition {
  name: string;
  waypoints: { x: number; y: number }[];
  startLine: { x1: number; y1: number; x2: number; y2: number };
  spawnPoint: { x: number; y: number; heading: number };
}
```

Three courses defined in `src/data/courses.ts`:
1. **Triangle** — 3 marks, beginner
2. **Windward-Leeward** — 4 marks, intermediate
3. **Olympic** — 6 marks, advanced

---

## Build & Deployment

### Vite Configuration

- `base`: Set to `/<repo-name>/` for GitHub Pages subpath
- `outDir`: `dist`
- TypeScript compilation handled by Vite's esbuild

### GitHub Actions Workflow

**Trigger:** Push to `main` branch

**Steps:**
1. Checkout repository
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Build (`npm run build`)
5. Upload `dist/` as Pages artifact
6. Deploy to GitHub Pages

**Required Settings:**
- Repository Settings → Pages → Source: GitHub Actions
- Workflow permissions: Read contents, write Pages

---

## Gitignore Entries

| Pattern | Reason |
|---------|--------|
| `node_modules/` | Dependencies |
| `dist/` | Build output |
| `.vscode/`, `.idea/` | IDE config |
| `.DS_Store`, `Thumbs.db` | OS artifacts |
| `*.log` | Log files |
| `.env*` | Environment files |
| `.vite/`, `.cache/` | Build cache |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60 FPS stable |
| Initial load | < 2 seconds |
| Bundle size | < 500 KB gzipped |
| Memory | < 100 MB |

---

# Technical Specification: WindRunner (Addendum)

## Code Quality & Linting

### ESLint Configuration

Add ESLint with TypeScript support and custom rules.

**Additional Dev Dependencies:**
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-plugin-file-length` (or custom rule)

### Enforced Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Max file length | 500 lines | Encourages component extraction |
| No unused vars | error | Clean code |
| Explicit function return types | warn | Type safety |
| No `any` | warn | Type safety |
| Prefer `const` | error | Immutability |

### File Length Enforcement

**Method:** Custom ESLint rule or `eslint-plugin-file-progress`

| Check | Threshold | Action |
|-------|-----------|--------|
| Warning | 400 lines | Console warning |
| Error | 500 lines | Build fails |

If a file approaches 500 lines, it must be refactored into smaller components/modules.

---

## Component Extraction Guidelines

### When to Extract

| Signal | Action |
|--------|--------|
| File > 300 lines | Consider splitting |
| File > 400 lines | Plan extraction |
| File > 500 lines | **Must** extract (build fails) |
| Class has > 5 public methods | Consider splitting responsibilities |
| Function > 50 lines | Extract helper functions |

### Extraction Patterns

| Scenario | Solution |
|----------|----------|
| Large scene file | Extract game objects to `objects/` |
| Complex physics | Extract calculators to `physics/` |
| Repeated logic | Extract to `utils/` |
| Multiple UI elements | One file per HUD component |
| Configuration bloat | Move constants to `config.ts` or `data/` |

---

## NPM Scripts (Updated)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Local dev server |
| `build` | `tsc && vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint src --ext .ts` | Run linter |
| `lint:fix` | `eslint src --ext .ts --fix` | Auto-fix issues |
| `check` | `npm run lint && npm run build` | Full validation |

---

## CI Pipeline (Updated)

**GitHub Actions workflow additions:**

| Step | Command | Fail Condition |
|------|---------|----------------|
| Lint | `npm run lint` | Any error (including file length) |
| Type check | `tsc --noEmit` | Type errors |
| Build | `npm run build` | Build failure |
| Deploy | GitHub Pages action | Only on success |

**Pipeline Order:**
```
Checkout → Install → Lint → Type Check → Build → Deploy
```

Build will not proceed if linting fails, enforcing the 500-line limit in CI.

---


If any file trends above 400 lines during development, refactor before merging.


## Future Considerations (not in v1)

- Texture atlas for boat/sail sprites if vector perf is an issue
- Web Workers for physics if complexity increases
- IndexedDB for persistent leaderboards
- Touch controls abstraction layer

---
