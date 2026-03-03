# SECTOR DEFENSE

## Game Design Document — Last Line of Defense

| Field | Value |
|---|---|
| **Version** | 1.0 |
| **Date** | March 2026 |
| **Platform** | Mobile (iOS / Android) |
| **Genre** | Arcade / Tower Defense / Action |
| **Aspect Ratio** | 19.5:9 (iPhone standard) |

---

## 1. Game Overview

Sector Defense is a fast-paced, vertically-oriented arcade defense game designed for mobile devices with a 19.5:9 aspect ratio. The player commands four stationary cannons, each occupying one vertical sector of the screen. Enemy ships descend from the top of the screen in their respective lanes, and the player must tap each sector to fire and destroy them before they reach the cannons.

The game is built around a core tension loop of resource management, precision timing, and a unique two-chance survival system that transforms defensive desperation into offensive power.

### 1.1 Core Fantasy

The player is the last line of defense. Four cannons. Limited ammo. Overwhelming odds. Every tap is a life-or-death decision. The game delivers its dopamine through the rhythmic cycle of shooting, surviving, and the visceral satisfaction of perfectly timed parries and shockwaves.

### 1.2 Design Pillars

- **Resource Scarcity:** Ammo is always insufficient. Every bullet must count.
- **Decision Density:** Every tap is meaningful. No idle moments.
- **Two-Chance Survival:** Losing a cannon is not failure — it is a phase shift into parry mode, offering a path to recovery.
- **Escalating Tension:** The game compresses the time between critical decisions as waves progress.
- **Juice and Feel:** Screen shake, particle explosions, slow-motion, and sound design create visceral feedback that rewards the player's brain.

---

## 2. Screen Layout & Sectors

The screen is divided into four equal vertical sectors, each containing one cannon stationed near the bottom of the screen (at 88% screen height). Each sector operates as an independent defense lane.

```
| SECTOR 1       | SECTOR 2       | SECTOR 3       | SECTOR 4       |
|                 |                 |                 |                 |
| Enemy ships     | Enemy ships     | Enemy ships     | Enemy ships     |
| descend         | descend         | descend         | descend         |
| vertically      | vertically      | vertically      | vertically      |
|                 |                 |                 |                 |
| [Cannon ↑]      | [Cannon ↑]      | [Cannon ↑]      | [Cannon ↑]      |
```

### 2.1 HUD Elements

- **Score:** Top-left, Orbitron font, white
- **Wave Counter:** Below score, Share Tech Mono font, muted gray
- **Combo Counter:** Top-right, pulsing gold when combo ≥ 3
- **Ammo Bars:** Below each cannon, green when sufficient, red when ≤ 2 rounds remaining
- **Parry Zone:** Blue dashed border with "TAP TO PARRY" text, visible only when cannon is destroyed

---

## 3. Core Mechanics

### 3.1 Cannon Firing

Tapping a sector fires the cannon in that lane. A bullet travels vertically upward in a straight line at 90% of screen height per second. Each cannon has a limited ammo pool displayed as a segmented bar beneath it.

| Parameter | Value |
|---|---|
| Starting Ammo | 5 rounds per cannon |
| Max Ammo Cap | 8 rounds per cannon |
| Bullet Speed | 0.9x screen height per second |
| Cannon Position | 88% from top of screen |
| Input | Single tap anywhere in the sector |

### 3.2 Enemy Ships

Enemy ships spawn at the top of the screen and descend vertically in their assigned lane. They move in a straight line toward the cannon. Each enemy has a hitbox for bullet collision.

| Parameter | Value |
|---|---|
| Base Speed (Wave 1) | 0.15x screen height/sec |
| Max Speed | 0.45x screen height/sec |
| Speed Scaling | +0.022x per wave |
| Speed Variance | ±15% per enemy (0.85–1.15 multiplier) |
| Standard HP | 1 hit |
| Heavy HP | 2 hits (appear from Wave 6+) |
| Heavy Spawn Rate | 15% + 2% per wave |
| Ship Width | 45% of sector width |

### 3.3 Two-Chance Survival System

This is the defining mechanic of Sector Defense. Each sector has exactly two survival states:

**Chance 1: Active Cannon (Shoot)**

The cannon is operational with ammo. The player taps to fire bullets and destroy incoming enemies. If the cannon runs out of ammo and an enemy reaches it, the cannon is destroyed.

**Chance 2: Destroyed Cannon (Parry)**

When a cannon is destroyed, the sector enters parry mode. A blue-highlighted parry zone appears in the lower 18% of the lane. Tapping the sector when an enemy enters this zone executes a parry — destroying the enemy, rebuilding the cannon with 3 rounds of ammo, and triggering a lane-clearing shockwave.

**Game Over Condition**

If an enemy reaches a destroyed cannon (i.e., the player fails to parry), the game ends. The player has exhausted both chances for that sector.

| State | Action | Result |
|---|---|---|
| Cannon Active | Tap → Fire bullet | Destroy enemy (+10 pts) |
| Cannon Destroyed | Tap → Parry shield | Destroy enemy, rebuild cannon, trigger shockwave (+25 pts) |
| Cannon Destroyed | No tap / missed parry | **GAME OVER** |

### 3.4 Shockwave Mechanic

A successful parry triggers a shockwave that travels vertically upward through the parried lane, destroying all enemies in its path. This mechanic serves as a breathing room reward for executing a high-risk parry.

#### 3.4.1 Shockwave Properties

| Parameter | Value |
|---|---|
| Travel Speed | 0.7x screen height/sec |
| Width | 85% of sector width |
| Height (hitbox) | 30px |
| Scope | Single lane only (the parried lane) |
| Points per Kill | 50% of normal points (half score) |
| Combo Effect | Does not increment combo counter |

#### 3.4.2 Design Rationale

The shockwave is deliberately designed as a survival tool, not a scoring exploit. Half-points and no combo contribution prevent players from intentionally tanking cannons to farm shockwave kills. The single-lane scope ensures other sectors still demand attention — breathing room is local, not global.

The emotional arc is critical: the player transitions from "I barely survived" (parry) to "I just unleashed destruction" (shockwave cascade). This flip from defensive desperation to offensive power is the peak dopamine moment in the game.

#### 3.4.3 Visual Design

- Energy band with bright white core, cyan gradient edges, and trailing wisps
- Leading arc at the front of the wave
- Side-trail particles streaming off both edges in cyan/teal
- Enemies hit by the shockwave explode sequentially with staggered cascade (not simultaneously)
- Each cascade hit produces blue-teal explosion particles mixed with fiery orange

---

## 4. Wave System & Difficulty Curve

### 4.1 Design Philosophy

The wave system is tuned to compress the time-to-engagement. Players should experience every core mechanic (shoot, lose cannon, parry, shockwave, rebuild) within the first 60 seconds of play. The early waves are not a tutorial — they are designed to teach through experience by engineering specific moments of resource pressure.

### 4.2 Wave Structure

| Wave | Enemies | Spawn Interval | Enemy Speed | Design Intent |
|---|---|---|---|---|
| 1 | 6 | 1.3s | 0.172x | Pressure 2 adjacent lanes. Teach ammo scarcity. |
| 2 | 8 | 1.2s | 0.194x | Shift pressure to previously quiet lanes. Drain ammo globally. |
| 3 | 10 | 1.1s | 0.216x | Designed overwhelm: force first cannon death and first parry. |
| 4+ | 8+2n | ≤1.0s | ≤0.45x | Dynamic spawning. Escalating speed and count. |

### 4.3 Ammo Economy

| Waves | Refill per Wave | Rationale |
|---|---|---|
| 1–3 | +1 round | Forces severe scarcity. Player must miss shots or lose a cannon. |
| 4–6 | +2 rounds | Slight relief as difficulty ramps. Player still rationing. |
| 7+ | +2–3 rounds | Scaled to enemy count. Never fully comfortable. |
| Parry Rebuild | 3 rounds | Fixed amount. Viable but not generous. |
| Max Cap | 8 rounds | Hard ceiling prevents hoarding. |

### 4.4 Scripted Early Waves

Waves 1–3 use a scripted spawn queue to engineer specific learning moments. From Wave 4 onward, spawning is fully dynamic.

#### 4.4.1 Wave 1 — Uneven Pressure

Two adjacent lanes are selected as pressure lanes. 4 of 6 enemies spawn in these lanes, with the remaining 2 in other lanes. With only 5 starting ammo, the pressured lanes drain to 1–2 rounds. This immediately teaches that sectors are independent resource problems.

#### 4.4.2 Wave 2 — Pressure Shift

Pressure shifts to the lanes that were quiet in Wave 1. 8 enemies concentrated in 2 new lanes against cannons that only received +1 ammo refill. Ammo becomes critical across all sectors.

#### 4.4.3 Wave 3 — The Designed Overwhelm

The game identifies the cannon with the lowest ammo and sends 5 of 9 enemies down that lane. This is mathematically unwinnable for that cannon — it will be destroyed, guaranteeing the player's first parry experience.

Spawn queue structure:

- **Phase 1 (Drain):** 3 rapid enemies in target lane exhaust remaining ammo
- **Phase 2 (Spacers):** 2 enemies in other lanes give the kill-shot travel time
- **Phase 3 (Kill Shot):** 1 enemy destroys the empty cannon
- **Phase 4 (Gap):** 2 more enemies in other lanes create breathing room
- **Phase 5 (Parry Target):** 1 enemy arrives with clear spacing for the player to parry

The gap between Phase 3 and Phase 5 is critical — it ensures the parry target never arrives immediately after cannon destruction, giving the player time to read the new situation.

---

## 5. First-Death Tutorial System

New players face a knowledge gap when their first cannon is destroyed. The parry mechanic is invisible until that moment, and if a trailing enemy arrives immediately, the player dies without ever understanding what happened.

### 5.1 Lane Freeze Mechanic

The very first cannon destruction in a session triggers a lane freeze: all enemies in the destroyed cannon's lane stop moving for 1.8 seconds. This is a one-time, invisible tutorial that only triggers once per session (persists across retries within the same session).

| Parameter | Value |
|---|---|
| Freeze Duration | 1.8 seconds |
| Scope | Only the destroyed lane (other lanes continue) |
| Trigger | First cannon death in the session only |
| Cancel | Immediately on successful parry |
| Visual | Enemies turn blue, emit ice particles, countdown bar shown |

### 5.2 Tutorial Visual Cues

- Pulsing "TAP HERE" text with bouncing arrow pointing at the parry zone
- Brighter parry zone with intensified blue border
- Frozen enemies rendered with blue tint and icy glow
- Frost particles emitting from frozen enemies
- Countdown bar beneath the cannon showing remaining freeze time

### 5.3 Design Rationale

The freeze is diegetic — it looks like the cannon explosion stunned nearby enemies, not like a tutorial popup. The rest of the game continues in the other three lanes, so the player never feels like the game paused. After the first parry is experienced, the player understands the mechanic and all subsequent cannon deaths play at full speed.

This distinction between teachability and difficulty is fundamental: the game can be brutally hard after the player understands the rules, but the first encounter with each mechanic must be legible, not just survivable.

---

## 6. Scoring & Combo System

| Action | Base Points | Combo Bonus |
|---|---|---|
| Bullet Kill | 10 | +2 per combo (max +40) |
| Parry | 25 | +1 combo increment |
| Shockwave Kill | 5 (50% of base) | No combo increment |

### 6.1 Combo Rules

- Combo increments on each successful bullet kill or parry
- Combo resets to 0 when a cannon is destroyed
- Combo display appears at 3+ (pulsing gold text, top-right)
- Every 5th combo hit triggers a bonus audio chime
- Shockwave kills do not increment or break the combo
- Max combo is tracked and displayed on the game over screen

### 6.2 Game Over Stats

The end screen displays: final score, wave reached, total kills, total parries, total shockwave kills (labeled "SWEPT"), and max combo.

---

## 7. Visual Effects & Juice

Every player action produces immediate, exaggerated visual feedback. The goal is to make the player feel powerful and keep their brain engaged through constant stimulation.

### 7.1 Screen Shake

| Event | Intensity | Decay |
|---|---|---|
| Cannon Fire | 3 | 0.9x per frame |
| Shockwave Cascade Hit | 4 (min floor) | 0.9x per frame |
| Bullet Kill | 6 | 0.9x per frame |
| Parry | 10 | 0.9x per frame |
| Cannon Destruction | 12 | 0.9x per frame |

### 7.2 Flash Effects

- **Bullet Kill:** Orange (#FF6644), alpha 0.2, fades at 3/sec
- **Parry:** Blue (#44AAFF), alpha 0.4, fades at 3/sec
- **Cannon Destroyed:** Red (#FF2222), alpha 0.5, fades at 3/sec

### 7.3 Slow Motion

Triggered on successful parry. Time scale reduces to 0.2x (20% speed) for 0.5 seconds. Only affects gameplay time (adt), not real-time UI elements like decay timers.

### 7.4 Particle Systems

- **Muzzle Flash:** 6 orange particles, burst upward from cannon tip
- **Bullet Trail:** Continuous orange particles trailing behind bullets
- **Enemy Explosion (Bullet Kill):** 12 particles, orange/yellow mix, radial burst
- **Enemy Explosion (Shockwave Kill):** 10 blue-teal + 5 orange particles, radial burst
- **Cannon Destruction:** 25 particles, red/orange, large radial burst with upward bias
- **Parry Shield:** 20 blue particles, radial burst from cannon position
- **Shockwave Trail:** Continuous cyan/teal particles streaming from wave edges
- **Frozen Enemy (Tutorial):** Intermittent ice-blue particles rising from enemy

### 7.5 Floating Text

- **Score popups:** White text (+points), gold when combo ≥ 5, float upward and fade
- **"PARRY!" text:** Blue (#44AAFF), scale 1.2x
- **"SHOCKWAVE!" text:** Teal (#44FFDD), scale 1.4x
- **"DESTROYED!" text:** Red (#FF3333), scale 1.0x
- **"WAVE N" text:** Red (#FF3A3A), scale 1.5x, center screen, 2 sec duration

---

## 8. Visual Design

### 8.1 Art Style

Dark sci-fi minimalism. The background is a deep navy-black gradient (#06060E to #0E0E20) with subtle horizontal grid lines. Sector dividers are dashed vertical lines in muted blue. The visual language is clean geometric shapes — no textures, no photorealism.

### 8.2 Color Language

| Element | Color | Meaning |
|---|---|---|
| Enemies | #CC3333 (red) | Threat |
| Heavy Enemies | #FF6644 (orange) | Elevated threat |
| Bullets | #FFCC44 (gold) | Player power |
| Cannon | #4A5A6A (steel) | Player asset |
| Parry Zone | #44AAFF (blue) | Second chance |
| Shockwave | #44FFDD (teal) | Power release |
| Ammo (healthy) | #44AA66 (green) | Resource available |
| Ammo (critical) | #FF3333 (red) | Resource danger |
| Frozen Enemy | #5577AA (blue tint) | Stunned/tutorial |

### 8.3 Typography

- **Primary (HUD, Score, Wave):** Orbitron — bold, futuristic, geometric
- **Secondary (Labels, Stats):** Share Tech Mono — monospaced, technical

### 8.4 Enemy Ship Design

Geometric chevron shape pointing downward (toward cannon). Standard enemies are red, heavy enemies are orange with a visible HP bar. Hit flash turns the entire ship white for one frame.

### 8.5 Cannon Design

Rectangular barrel with base platform. Steel-gray color palette (#2A3A4A base, #4A5A6A barrel, #6A8A9A tip). Recoil animation on fire (8px downward, spring back). Destroyed state shows rubble fragments with a pulsing warning triangle.

---

## 9. Future Considerations

The following features are identified for future development but are not yet implemented in the current prototype:

### 9.1 Gameplay Expansion

- **Ammo Pickups:** Destroyed enemies drop ammo that the player taps to collect
- **Critical Shot:** Perfectly timed shots (enemy in a specific zone) refund a bullet
- **Cross-Lane Boss:** Boss enemy spanning 2 sectors requiring coordinated fire
- **Sacrifice Mechanic:** Dump one cannon's remaining ammo into another for an overcharged burst
- **Last Stand Mode:** Intensified music and visuals when down to one cannon
- **Streak Shield:** 10 consecutive kills without missing auto-repairs a destroyed cannon

### 9.2 Audio & Feel

- Adaptive music system that escalates intensity with combo/wave count
- Haptic feedback via the Vibration API on mobile devices
- Distinct audio layers that build as more sectors become active

### 9.3 Meta Progression

- High score leaderboard
- Unlockable cannon skins
- Achievement system tied to parry streaks, wave milestones, and combo records

---

*— End of Game Design Document —*
