# CLAUDE.md — Sector Defense

This file gives Claude context about the Sector Defense project so it can assist effectively without re-reading the full GDD every session.

## Project Summary

Sector Defense is a mobile arcade defense game built for iOS/Android (19.5:9 aspect ratio). It is a web app (HTML/JS) using the Web Audio API with no external dependencies or build system. All audio is procedurally synthesized — no sample files.

**Full specs:**
- [Core Gameplay GDD](sector_defense_gdd.md)
- [Sound Design Document](sector_defense_sound.md)

---

## Architecture

- HTML + CSS in `index.html`; JS split across 8 files in `js/` (no framework, no build step, no ES modules)
- Plain `<script>` tags loaded in dependency order — all globals shared via top-level declarations
- **`AudioEngine` class** (`js/audio.js`) wraps Web Audio API; `AudioContext` initializes on first user tap (browser autoplay policy)
- Disposable oscillator + gain nodes per sound event (no persistent nodes)
- Game time tracked via `adt` (affected by slow-motion); real-time UI uses wall-clock time
- 19.5:9 layout with 4 equal vertical sectors, cannons at 88% screen height

### File Structure

```
index.html          → HTML + CSS + <script> tags (no inline JS)
js/
├── config.js       → Constants, canvas setup, resize(), layout helpers
├── audio.js        → AudioEngine class + singleton instance
├── state.js        → All mutable game state, entity arrays, initSectors()
├── waves.js        → Wave system, enemy spawning, difficulty scaling
├── input.js        → handleTap(), canvas mouse/touch listeners
├── update.js       → update(dt) — physics, collisions, scoring
├── renderer.js     → draw() — all canvas rendering
└── main.js         → startGame(), gameOver(), gameLoop(), button listeners, boot
```

### Script Load Order (matters — each file can reference globals from earlier files)

1. `config.js` → no deps
2. `audio.js` → no deps
3. `state.js` → uses constants from config.js
4. `waves.js` → uses config + state
5. `input.js` → uses config + audio + state + waves
6. `update.js` → uses config + audio + state + waves
7. `renderer.js` → uses config + state (reads state to draw)
8. `main.js` → uses everything (coordinates startup, loop, game over)

---

## Core Mechanics

### Cannon Firing
- Tap a sector → fire bullet upward at 0.9× screen height/sec
- Each cannon: 5 starting ammo, 8 max cap
- Ammo bar shown below cannon (green when ≥ 3, red when ≤ 2)

### Two-Chance Survival
| State | Player Action | Result |
|---|---|---|
| Cannon active | Tap → bullet | Destroy enemy (+10 pts) |
| Cannon destroyed | Tap in parry zone | Destroy enemy, rebuild cannon (3 ammo), trigger shockwave (+25 pts) |
| Cannon destroyed | Miss / no tap | **GAME OVER** |

### Shockwave
- Triggered by successful parry
- Travels up the parried lane at 0.7× screen height/sec
- Single-lane scope, half-points (5 per kill), no combo increment
- Intentionally not farmable — destroying cannons deliberately costs more than it gains

### Wave System
| Wave | Enemies | Spawn Interval | Speed |
|---|---|---|---|
| 1 | 6 | 1.3s | 0.172× | Pressure 2 adjacent lanes |
| 2 | 8 | 1.2s | 0.194× | Shift pressure to quiet lanes |
| 3 | 10 | 1.1s | 0.216× | Engineered first cannon death |
| 4+ | 8+2n | ≤1.0s | ≤0.45× | Fully dynamic |

- Enemy speed scales +0.022× per wave with ±15% per-enemy variance
- Heavy enemies (2 HP, orange) appear from Wave 6+, spawn rate: 15% + 2%/wave
- Ammo refill: +1/wave (Waves 1–3), +2/wave (Waves 4–6), +2–3/wave (Wave 7+)

### First-Death Lane Freeze (Tutorial)
- Triggers **once per session** on the very first cannon destruction
- Freezes all enemies in that lane for **1.8 seconds**
- Visual: blue-tinted enemies, frost particles, countdown bar, pulsing "TAP HERE" arrow
- Feels diegetic (looks like the explosion stunned enemies, not a tutorial popup)
- Other three lanes continue unaffected — the game never pauses

### Scoring & Combo
- Bullet kill: 10 pts + 2 per combo level (max +40)
- Parry: 25 pts + 1 combo
- Shockwave kill: 5 pts, no combo change
- Combo resets on cannon destruction
- Combo display appears at 3+; milestone chime every 5th combo hit

---

## Audio (Web Audio API — Procedural Only)

All 10 sounds are synthesized from oscillators. No files. No imports.

| Event | Key | Duration | Character |
|---|---|---|---|
| Cannon fire | `shoot` | 150ms | Descending sawtooth + square thump |
| Enemy kill | `hit` | 300ms | High→low sine crack + square rumble |
| Parry | `parry` | 400ms | Rising triangle shield + metallic clang |
| Shockwave | `shockwave` | 800ms | 3-layer rising sweep (sine + saw + square) |
| Cascade hit | `shockwave_hit` | 150ms | Light randomized sine pop (500–900Hz) |
| Cannon destroyed | `destroy` | 500ms | 3-stage descending sawtooth (100ms stagger) |
| Cannon rebuilt | `rebuild` | 390ms | Ascending 4-note sine arpeggio (~major tonality) |
| Combo milestone | `combo` | 200ms | Sine octave sweep 600→1200Hz (every 5th kill) |
| Empty chamber | `empty` | 100ms | Quiet 100Hz sine click |
| Game over | `gameover` | 1000ms | 4-stage halving descending sawtooth |

**Parry → Shockwave chain timing:**
- t+0ms: parry + shockwave + rebuild sounds (different freq ranges, no masking)
- t+50–500ms: staggered cascade pops as shockwave travels

**Implementation rules:**
- Use `AudioContext.currentTime` for all scheduling (sample-accurate, frame-rate independent)
- Max ~13 simultaneous oscillators during parry-shockwave chain — fine on modern mobile
- `AudioContext` must initialize inside a user gesture handler

---

## Visual Design Constants

**Background:** `#06060E` → `#0E0E20` gradient, horizontal grid lines, dashed vertical sector dividers

**Color language:**
| Element | Color | Meaning |
|---|---|---|
| Enemies (standard) | `#CC3333` | Threat |
| Enemies (heavy) | `#FF6644` | Elevated threat |
| Bullets | `#FFCC44` | Player power |
| Cannon | `#4A5A6A` | Player asset |
| Parry zone | `#44AAFF` | Second chance |
| Shockwave | `#44FFDD` | Power release |
| Ammo (healthy) | `#44AA66` | Resource available |
| Ammo (critical) | `#FF3333` | Resource danger |
| Frozen enemy | `#5577AA` | Stunned / tutorial |

**Fonts:** Orbitron (HUD, score, wave counter) · Share Tech Mono (labels, stats)

**Screen shake intensities:** Fire=3, Cascade=4, Kill=6, Parry=10, Destroy=12 · Decay 0.9×/frame

**Slow motion:** Parry triggers 0.2× time scale for 0.5s (gameplay only, not UI decay timers)

---

## Key Design Decisions — Do Not Break

1. **Shockwave is half-points + no combo.** Prevents players from intentionally tanking cannons to farm shockwave clears.
2. **Wave 3 is mathematically designed to kill one cannon.** The scripted spawn queue guarantees the player's first parry. Do not "balance" this away.
3. **Lane freeze is invisible and diegetic.** No tutorial popups. The freeze looks like the explosion stunned enemies. Do not add UI overlays or pauses.
4. **AudioContext initializes on first tap only.** Required for browser autoplay policy. Do not auto-initialize.
5. **Shockwave scope is single-lane.** Breathing room must be local, not global. A cross-lane shockwave would remove tension from other sectors.

---

## Future Features (Not Yet Implemented)

- Ammo pickups from destroyed enemies
- Critical shot (refund bullet for perfectly timed hits)
- Cross-lane boss spanning 2 sectors
- Adaptive procedural background music
- Haptic feedback via Vibration API
- Spatial audio panning by sector
- High score leaderboard + cannon skins
