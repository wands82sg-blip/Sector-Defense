# Sector Defense

**Last Line of Defense** — A fast-paced mobile arcade defense game for iOS and Android.

| Field | Value |
|---|---|
| **Platform** | Mobile (iOS / Android) |
| **Genre** | Arcade / Tower Defense / Action |
| **Aspect Ratio** | 19.5:9 (iPhone standard) |
| **Version** | 1.0 (March 2026) |

---

## Overview

Four cannons. Four sectors. Limited ammo. Overwhelming odds.

Enemy ships descend from the top of the screen in four vertical lanes. Tap each sector to fire and destroy them before they reach your cannons. When a cannon is destroyed, the sector enters **Parry Mode** — tap at the right moment to parry the next enemy, rebuild the cannon, and unleash a lane-clearing shockwave.

Every tap is a life-or-death decision. The game ends when a destroyed cannon is hit a second time.

---

## Core Mechanics

- **Cannon Firing** — Tap a sector to shoot upward. Each cannon has a limited ammo bar (max 8 rounds).
- **Two-Chance Survival** — A destroyed cannon enters Parry Mode. A successful parry rebuilds it with 3 rounds and triggers a shockwave.
- **Shockwave** — Clears all enemies in the parried lane. Rewards survival, not farming (half-points, no combo).
- **Wave Escalation** — Waves 1–3 are scripted to teach mechanics; Wave 4+ is fully dynamic with increasing speed and enemy count.
- **Combo System** — Consecutive kills boost score. Resets on cannon destruction.

---

## Audio

All audio is procedurally synthesized using the **Web Audio API** — no sample files. 10 distinct sounds cover every gameplay event, from cannon fire to game over.

---

## Documentation

- [Core Gameplay GDD](sector_defense_gdd.md)
- [Sound Design Document](sector_defense_sound.md)
