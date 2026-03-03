# SECTOR DEFENSE

## Sound Design Document — Audio Architecture & Implementation Reference

| Field | Value |
|---|---|
| **Version** | 1.0 |
| **Date** | March 2026 |
| **Audio Engine** | Web Audio API |
| **Approach** | Procedural / Synthesized |

---

## 1. Audio Design Philosophy

All audio in Sector Defense is procedurally generated using the Web Audio API. No sample files are used. This ensures zero-latency playback, tiny package size, and precise synchronization with gameplay events. Every sound is synthesized in real-time from oscillators, gain nodes, and frequency ramps.

The audio design follows a dopamine-reinforcement principle: every player action produces immediate, satisfying audio feedback that escalates in intensity with the significance of the event. The hierarchy is: cannon fire (punchy) → enemy hit (explosive) → parry (metallic clash) → shockwave (deep power sweep). Each layer is more rewarding than the last.

### 1.1 Design Goals

- **Immediate feedback:** Sound triggers within 1 frame of the gameplay event
- **Escalating reward:** Higher-impact events produce richer, more complex sounds
- **Emotional arc support:** Audio reinforces the tension–release cycle of shoot/parry/shockwave
- **No fatigue:** Short durations (0.1–0.8s) prevent ear fatigue during long sessions
- **Clarity:** Each sound occupies a distinct frequency range to avoid masking

---

## 2. Sound Catalog

### 2.1 Cannon Fire (`shoot`)

A punchy, short-burst cannon sound. Two oscillators layer a descending sawtooth with a low square thump for body.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Primary | Sawtooth | 200 Hz → 60 Hz | 0.3 → 0.001 over 150ms |
| Thump | Square | 80 Hz (flat) | 0.15 → 0.001 over 80ms |

**Total duration:** 150ms. **Frequency ramp:** exponential. The descending sawtooth creates the percussive "blast" character while the square sub-oscillator adds physical impact weight.

### 2.2 Enemy Hit / Kill (`hit`)

A two-layer explosion with a high descending sine for the "crack" and a low square for the rumble.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Crack | Sine | 800 Hz → 200 Hz | 0.4 → 0.001 over 200ms |
| Rumble | Square | 120 Hz → 40 Hz | 0.25 → 0.001 over 300ms |

**Total duration:** 300ms. The high-to-low frequency sweep on both layers creates a satisfying "crunch" that signals destruction. Louder and longer than the cannon fire to differentiate impact from action.

### 2.3 Parry (`parry`)

A two-part sound: a rising triangle sweep for the shield activation and a metallic clang for the impact.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Shield | Triangle | 300 → 900 → 600 Hz | 0.35 → 0.001 over 400ms |
| Clang | Square | 1200 Hz → 100 Hz | 0.2 → 0.001 over 150ms |

**Total duration:** 400ms. The shield layer uses a linear ramp (not exponential) for a smoother, more musical rise. The clang layer's extreme high-to-low sweep (1200 → 100 Hz in 150ms) creates the metallic "shield clash" character. This is the most emotionally significant sound — it signals survival and recovery.

### 2.4 Shockwave (`shockwave`)

The most complex sound in the game. Three layers create a deep, rising power sweep that accompanies the visual shockwave traveling up the lane.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Bass Sweep | Sine | 40 Hz → 200 Hz | 0.35 → 0.001 over 800ms |
| Whoosh | Sawtooth | 80 Hz → 400 Hz | 0.15 → 0.001 over 600ms |
| Crackle | Square | 60 Hz → 300 Hz | 0.08 → 0.001 over 500ms (50ms delay) |

**Total duration:** 800ms. All three layers sweep upward in pitch, matching the visual of the shockwave traveling up-screen. The bass sine provides the physical "weight" of the wave, the sawtooth adds aggressive texture, and the delayed square crackle adds electrical energy. The rising pitch creates the sensation of building power rather than a simple explosion.

### 2.5 Shockwave Cascade Hit (`shockwave_hit`)

Individual enemy pop when caught by the shockwave. Intentionally lighter than a normal kill sound to let the shockwave sound remain dominant.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Pop | Sine | 500–900 Hz (random) → 100 Hz | 0.2 → 0.001 over 150ms |

**Total duration:** 150ms. The randomized start frequency (500–900 Hz range) means each cascade hit sounds slightly different, preventing auditory monotony when multiple enemies are destroyed in rapid sequence. The low gain (0.2) keeps these subordinate to the main shockwave sweep.

### 2.6 Cannon Destruction (`destroy`)

A three-stage descending explosion. Each stage is a sawtooth oscillator at progressively lower frequencies, staggered by 100ms.

| Stage | Waveform | Frequency | Envelope |
|---|---|---|---|
| Stage 1 (t+0ms) | Sawtooth | 150 Hz → 20 Hz | 0.3 → 0.001 over 300ms |
| Stage 2 (t+100ms) | Sawtooth | 120 Hz → 20 Hz | 0.3 → 0.001 over 300ms |
| Stage 3 (t+200ms) | Sawtooth | 90 Hz → 20 Hz | 0.3 → 0.001 over 300ms |

**Total duration:** 500ms. The staggered, descending stages create a "crumbling" sensation — the cannon breaking apart in stages. All frequencies end at 20 Hz (sub-bass), reinforcing the heaviness of loss. This is deliberately unpleasant compared to the rewarding kill/parry sounds.

### 2.7 Cannon Rebuild (`rebuild`)

An ascending four-note arpeggio in sine waves. The rising pitch signifies recovery and hope.

| Note | Waveform | Frequency | Envelope |
|---|---|---|---|
| Note 1 (t+0ms) | Sine | 400 Hz | 0.2 → 0.001 over 150ms |
| Note 2 (t+80ms) | Sine | 500 Hz | 0.2 → 0.001 over 150ms |
| Note 3 (t+160ms) | Sine | 600 Hz | 0.2 → 0.001 over 150ms |
| Note 4 (t+240ms) | Sine | 800 Hz | 0.2 → 0.001 over 150ms |

**Total duration:** 390ms. The notes follow roughly a major tonality (G4–B4–D5–G5 approximation), creating a hopeful, "powering up" sensation. Plays immediately after the parry sound, creating a parry → rebuild audio sequence.

### 2.8 Combo Milestone (`combo`)

A quick rising sine sweep that triggers on every 5th consecutive kill.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Chime | Sine | 600 Hz → 1200 Hz | 0.2 → 0.001 over 200ms |

**Total duration:** 200ms. Linear frequency ramp. The octave jump (600 → 1200) creates a bright, celebratory "ding" that cuts through the mix without dominating. Triggers at combo counts of 5, 10, 15, 20, etc.

### 2.9 Empty Chamber (`empty`)

A muted click that signals the player tapped a cannon with no ammo.

| Layer | Waveform | Frequency | Envelope |
|---|---|---|---|
| Click | Sine | 100 Hz (flat) | 0.15 → 0.001 over 100ms |

**Total duration:** 100ms. Deliberately quiet and low-pitched — the absence of the expected cannon blast is itself the feedback. The player learns to associate this dull thud with "I need to parry soon."

### 2.10 Game Over (`gameover`)

A four-stage descending sawtooth sequence, each note lower and slower than the last.

| Stage | Waveform | Frequency | Envelope |
|---|---|---|---|
| Stage 1 (t+0ms) | Sawtooth | 200 Hz → 100 Hz | 0.3 → 0.001 over 400ms |
| Stage 2 (t+200ms) | Sawtooth | 150 Hz → 75 Hz | 0.3 → 0.001 over 400ms |
| Stage 3 (t+400ms) | Sawtooth | 100 Hz → 50 Hz | 0.3 → 0.001 over 400ms |
| Stage 4 (t+600ms) | Sawtooth | 60 Hz → 30 Hz | 0.3 → 0.001 over 400ms |

**Total duration:** 1000ms. The descending sequence mirrors the emotional collapse of defeat. Each note halves in frequency, creating an accelerating sense of falling. The sawtooth waveform keeps it harsh and final.

---

## 3. Audio Hierarchy & Mix

Sounds are layered in priority order. When multiple sounds trigger simultaneously, the mix must remain clear.

| Priority | Sound | Peak Gain | Freq Range | Duration |
|---|---|---|---|---|
| 1 (highest) | Shockwave | 0.35 | 40–400 Hz | 800ms |
| 2 | Parry | 0.35 | 100–1200 Hz | 400ms |
| 3 | Enemy Hit | 0.40 | 40–800 Hz | 300ms |
| 4 | Cannon Destroy | 0.30 | 20–150 Hz | 500ms |
| 5 | Cannon Fire | 0.30 | 60–200 Hz | 150ms |
| 6 | Rebuild | 0.20 | 400–800 Hz | 390ms |
| 7 | Shockwave Hit | 0.20 | 100–900 Hz | 150ms |
| 8 | Combo Chime | 0.20 | 600–1200 Hz | 200ms |
| 9 (lowest) | Empty Chamber | 0.15 | 100 Hz | 100ms |

---

## 4. Audio Event Chains

Certain gameplay moments trigger multiple sounds in sequence. These chains are designed to create compound emotional arcs.

### 4.1 Parry → Shockwave → Cascade Chain

The most complex audio sequence in the game:

- **t+0ms:** Parry sound (shield rise + metallic clang)
- **t+0ms:** Shockwave sound (bass sweep + whoosh + crackle, all rising)
- **t+0ms:** Rebuild sound (ascending arpeggio)
- **t+50–500ms:** Shockwave cascade hits (staggered pops as wave reaches each enemy)

The parry, shockwave, and rebuild sounds trigger simultaneously but occupy different frequency ranges: parry sits in the mids (300–1200 Hz), shockwave sits in the lows (40–400 Hz), and rebuild sits in the upper mids (400–800 Hz). The cascade pops layer on top with randomized frequencies to avoid masking.

### 4.2 Cannon Death Chain

- **t+0ms:** Cannon destruction sound (three-stage descending rumble)
- **Visual:** Screen shake intensity 12, red flash
- **Audio gap:** No sound during the parry window — silence builds tension

### 4.3 Game Over Chain

- **t+0ms:** Game over sound (four-stage descending sequence)
- 800ms delay before UI appears
- No additional sounds during the delay — the silence is the punctuation

---

## 5. Implementation Notes

### 5.1 Web Audio API Architecture

All sounds are generated through an `AudioEngine` class that wraps the Web Audio API. The `AudioContext` is initialized on the first user interaction (tap to start) to comply with browser autoplay policies. Each sound creates disposable oscillator and gain nodes that are connected to the destination, started, and stopped. No persistent nodes are maintained.

### 5.2 Timing Precision

All frequency ramps and gain envelopes use the `AudioContext`'s `currentTime` for scheduling, ensuring sample-accurate timing regardless of frame rate. This means a 60fps game and a 30fps game produce identical audio output.

### 5.3 Performance

The maximum simultaneous oscillator count occurs during a parry–shockwave chain: 2 (parry) + 3 (shockwave) + 4 (rebuild) + N (cascade pops) = 9 + N oscillators. In practice, N rarely exceeds 3–4 due to shockwave travel time. Modern mobile browsers handle 20+ simultaneous oscillators without performance issues.

### 5.4 Future Audio Considerations

- **Adaptive background music:** Procedurally generated ambient track that escalates with wave/combo
- **Haptic integration:** Vibration API patterns synchronized to screen shake intensity
- **Spatial panning:** Pan sounds left/right based on which sector triggers them
- **Dynamic compression:** Add a `DynamicsCompressorNode` to prevent clipping during dense chains

---

*— End of Sound Design Document —*
