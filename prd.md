# Product Requirements Document: Sailboat Simulator

## Overview

**Product Name:** WindRunner  
**Version:** 1.0  
**Platform:** Web (Canvas/WebGL)  
**Target Users:** Casual gamers, sailing enthusiasts, educational use

---

## Problem Statement

Sailing mechanics are difficult to understand without hands-on experience. Existing simulators are either too complex or lack visual feedback for wind dynamics.

---

## Goals

1. Teach basic sailing concepts (points of sail, tacking, jibing)
2. Provide intuitive wind visualization
3. Deliver satisfying physics-based gameplay
4. Enable quick regatta racing sessions

---

## Core Features

### 1. Sailboat Controls

| Control | Primary Key | Alt Key | Action |
|---------|-------------|---------|--------|
| Rudder Left | `A` | `←` | Turn boat port |
| Rudder Right | `D` | `→` | Turn boat starboard |
| Open Sail | `W` | `↑` | Let out sail (more power off-wind) |
| Close Sail | `S` | `↓` | Trim sail (more power upwind) |

- Rudder has continuous input (hold to turn)
- Sail position: 0% (fully trimmed) to 100% (fully eased)
- Visual indicator for current sail angle

### 2. Simplified Physics Model

```text
Boat Speed = f(wind_speed, angle_to_wind, sail_trim)
```

**Core mechanics:**
- **No-go zone:** ~45° either side of wind direction (boat stalls)
- **Optimal sail trim:** Varies by point of sail
- **Momentum:** Boat carries speed through turns
- **Drag:** Reduces speed when sail is over/under trimmed
- **Rudder drag:** Turning reduces speed slightly

**Points of Sail (simplified):**
| Angle to Wind | Zone | Optimal Sail |
|---------------|------|--------------|
| 0°–45° | No-go | N/A |
| 45°–90° | Close-hauled/Beam | 20–40% |
| 90°–135° | Broad reach | 50–70% |
| 135°–180° | Running | 80–100% |

### 3. Wind Visualization

- **Particle system:** Steam/mist particles drift across water surface
- **Direction:** Particles move in wind direction
- **Speed indication:** Particle velocity correlates to wind strength
- **Density:** Denser particles = stronger wind
- **Gusts:** Periodic clusters of faster, denser particles
- **Wind shifts:** Gradual direction changes (5–15° every 30–60s)

### 4. Visual Design

**Style:** Minimalist vector graphics, top-down 2D

| Element | Design |
|---------|--------|
| Water | Solid blue with subtle animated ripples |
| Boat | Simple hull outline + triangular sail |
| Wake | Trailing lines behind boat (speed-dependent) |
| Waypoints | Circular markers with number/flag |
| Course boundary | Dashed line polygon |
| Wind indicator | Arrow in corner showing direction/strength |

**Color Palette:**
- Water: `#1a5f7a`
- Boat hull: `#ffffff` stroke
- Sail: `#f0f0f0` fill
- Waypoints: `#ff6b35` (next), `#888888` (others)
- Wind particles: `#ffffff` at 30% opacity

### 5. Regatta Mode

**Course structure:**
- Start line (between two buoys)
- 3–5 waypoints forming a course
- Finish line
- Waypoints must be rounded in order

**Gameplay:**
- Countdown timer before start
- Penalty for early start (return behind line)
- Timer tracks elapsed race time
- Ghost boat (optional): replay of best run
- Leaderboard: local storage for best times per course

**Courses:**
1. Triangle (3 marks) — beginner
2. Windward-leeward (4 marks) — intermediate
3. Olympic course (6 marks) — advanced

---

## Technical Requirements

| Requirement | Specification |
|-------------|---------------|
| Framework | Vanilla JS + Canvas API or Pixi.js |
| Target FPS | 60 |
| Resolution | Responsive, 16:9 preferred |
| Browser Support | Chrome, Firefox, Safari, Edge (last 2 versions) |
| Mobile | Not in scope for v1 |
| State Management | Simple game loop, no external deps |

---

## UI Layout

```
┌─────────────────────────────────────────┐
│ [Wind Arrow]              [Timer] [Lap] │
│                                         │
│                                         │
│              GAME CANVAS                │
│           (boat, water, marks)          │
│                                         │
│                                         │
│ [Sail: ████░░ 65%]    [Speed: 4.2 kts]  │
└─────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first race completion | < 3 min |
| Physics feel "realistic" (user survey) | > 70% positive |
| Session length | > 5 min average |
| Return visits | > 30% within 7 days |

---

## Out of Scope (v1)

- Multiplayer
- Mobile/touch controls
- 3D graphics
- Weather conditions (rain, waves)
- Boat customization
- Sound effects (consider for v1.1)

---
### Wind Behavior (Final)

- Direction shifts randomly ±5–15° every 30–60 seconds
- Shifts are gradual (animated over 2–3 seconds)
- Occasional larger shifts (±20–30°) as "wind shifts" events
- Visual: particles smoothly transition to new direction

### Waypoint Rounding (Final)

- Waypoint triggers when boat center crosses marker radius
- No physical collision/bounce
- Visual feedback: marker pulses/changes color on successful rounding
- Radius: ~2 boat lengths for forgiving detection

## Milestones

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| 1 | Core physics + boat control | 2 weeks |
| 2 | Wind system + visualization | 1 week |
| 3 | Regatta mode + waypoints | 1 week |
| 4 | UI polish + leaderboard | 1 week |
| 5 | Testing + tuning | 1 week |

## Updated Sections



