// ============ WAVE & ENEMY MANAGEMENT ============

function pickLane() {
  // Early waves: use pressure lanes for uneven distribution
  if (wave <= 12 && pressureLanes.length > 0) {
    if (Math.random() < 0.7) {
      return pressureLanes[Math.floor(Math.random() * pressureLanes.length)];
    }
  }
  return Math.floor(Math.random() * SECTOR_COUNT);
}

// --- Formation helpers ---

// Repeat a formation cycle N times with a gap between cycles
function repeatFormation(cycle, times, gap) {
  const queue = [];
  for (let i = 0; i < times; i++) {
    cycle.forEach((entry, idx) => {
      const clone = {lanes: entry.lanes.slice(), delay: entry.delay};
      if (entry.heavy) clone.heavy = entry.heavy.slice();
      if (entry.weaver) clone.weaver = entry.weaver.slice();
      // Last entry of each cycle: gap before next cycle (0 on final cycle)
      if (idx === cycle.length - 1) {
        clone.delay = (i < times - 1) ? gap : 0;
      }
      queue.push(clone);
    });
  }
  return queue;
}

// Count total enemies in a spawn queue
function countQueueEnemies(queue) {
  let total = 0;
  queue.forEach(entry => {
    if (typeof entry === 'object' && entry.lanes) {
      total += entry.lanes.length;
    } else {
      total++;
    }
  });
  return total;
}

// --- Formation definitions ---
// Each cycle is the minimal recognizable unit of the pattern (4 enemies each)

// F1: DIAGONAL — L1→L2→L3→L4 sequential sweep
var F_DIAGONAL = [
  {lanes:[0], delay:0.2}, {lanes:[1], delay:0.2},
  {lanes:[2], delay:0.2}, {lanes:[3], delay:0}
];

// F2: PINCER — outer pair closes to inner pair
var F_PINCER = [
  {lanes:[0,3], delay:0.25}, {lanes:[1,2], delay:0}
];

// F3: CHEVRON — center pair expands to outer pair (built dynamically for targeting)

// F4: ZIGZAG — non-adjacent lane hops
var F_ZIGZAG = [
  {lanes:[0], delay:0.2}, {lanes:[2], delay:0.2},
  {lanes:[1], delay:0.2}, {lanes:[3], delay:0}
];

// F5: BLITZ — all 4 lanes simultaneous
var F_BLITZ = [
  {lanes:[0,1,2,3], delay:0}
];

// F6: CROSSFIRE — non-adjacent pairs (checkerboard)
var F_CROSSFIRE = [
  {lanes:[0,2], delay:0.25}, {lanes:[1,3], delay:0}
];

// F7: CASCADE — rapid burst in one lane (lane rotates per cycle, built dynamically)

// F8: HELIX — two crossing spirals (L1+L4 crossing to L2+L3)
var F_HELIX = [
  {lanes:[0], delay:0.2}, {lanes:[3], delay:0.2},
  {lanes:[1], delay:0.2}, {lanes:[2], delay:0}
];

// F9: FORTRESS — center pair then flanker pair (built dynamically)

// F10: PENDULUM — swings edge-to-edge (direction alternates, built dynamically)

// Build cascade queue: rapid 4-burst in one lane, lane rotates each cycle
function buildCascadeQueue(times, gap) {
  const queue = [];
  for (let i = 0; i < times; i++) {
    const lane = i % SECTOR_COUNT;
    for (let j = 0; j < 4; j++) {
      queue.push({lanes:[lane], delay: (j < 3) ? 0.12 : (i < times - 1 ? gap : 0)});
    }
  }
  return queue;
}

// Build pendulum queue: swings 0→1→2→3 then 3→2→1→0 alternating
function buildPendulumQueue(times, gap) {
  const queue = [];
  for (let i = 0; i < times; i++) {
    const forward = (i % 2 === 0);
    const order = forward ? [0,1,2,3] : [3,2,1,0];
    order.forEach((lane, idx) => {
      queue.push({lanes:[lane], delay: (idx < 3) ? 0.15 : (i < times - 1 ? gap : 0)});
    });
  }
  return queue;
}

function buildWaveSpawnQueue() {
  waveSpawnQueue = [];

  if (wave === 0) {
    // Wave 0: TUTORIAL — unchanged
    pressureLanes = [0, 1];
    tutorial.active = true;
    tutorial.hintLane = 0;
    tutorial.killCount = 0;
    waveEnemies = 5;
    waveSpawnQueue = [
      0, 0,   // Phase 1: teach firing in lane 1
      1,      // Phase 2: this enemy destroys lane 2 cannon (0 ammo)
      0,      // Spacer — gives blast time to clear
      1       // Phase 3: parry target arrives after blast
    ];

  } else if (wave === 1) {
    // W1 — F1: DIAGONAL ×5
    // Teaches sequential L→R tapping
    waveSpawnQueue = repeatFormation(F_DIAGONAL, 5, 0.8);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 2) {
    // W2 — F2: PINCER ×5
    // Teaches simultaneous outer→inner attention
    waveSpawnQueue = repeatFormation(F_PINCER, 5, 0.8);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 3) {
    // W3 — F3: CHEVRON ×5 (targeting weakest cannon for designed death)
    let lowestAmmoLane = 0;
    let lowestAmmo = Infinity;
    sectors.forEach((s, i) => {
      if (s.alive && s.ammo < lowestAmmo) {
        lowestAmmo = s.ammo;
        lowestAmmoLane = i;
      }
    });
    const target = lowestAmmoLane;
    const adjacent = target <= 1 ? (1 - target) : (target === 2 ? 3 : 2);
    const others = [0,1,2,3].filter(l => l !== target && l !== adjacent);
    const chevronCycle = [
      {lanes:[target, adjacent], delay:0.3},
      {lanes:[others[0], others[1]], delay:0}
    ];
    waveSpawnQueue = repeatFormation(chevronCycle, 5, 0.8);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 4) {
    // W4 — F4: ZIGZAG ×5
    // Teaches non-linear tracking — eyes must jump across lanes
    waveSpawnQueue = repeatFormation(F_ZIGZAG, 5, 0.6);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 5) {
    // W5 — F5: BLITZ ×5
    // All 4 lanes at once — tests full-width reaction
    waveSpawnQueue = repeatFormation(F_BLITZ, 5, 0.6);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 6) {
    // W6 — F6: CROSSFIRE ×5
    // Non-adjacent pairs — diagonal attention, combines zigzag + pincer
    waveSpawnQueue = repeatFormation(F_CROSSFIRE, 5, 0.6);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 7) {
    // W7 — F7: CASCADE ×5
    // Rapid 4-burst per lane, lane rotates each cycle
    waveSpawnQueue = buildCascadeQueue(5, 0.5);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 8) {
    // W8 — F8: HELIX ×5
    // Two crossing spirals — tests tracking two simultaneous paths
    waveSpawnQueue = repeatFormation(F_HELIX, 5, 0.5);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 9) {
    // W9 — F9: FORTRESS ×5
    // Center pair then flanker pair — teaches inside-out defense
    const fortressCycle = [
      {lanes:[1,2], delay:0.4},
      {lanes:[0,3], delay:0}
    ];
    waveSpawnQueue = repeatFormation(fortressCycle, 5, 0.4);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else if (wave === 10) {
    // W10 — F10: PENDULUM ×5
    // Swings 0→1→2→3 then 3→2→1→0 — sustained edge-to-edge tracking
    waveSpawnQueue = buildPendulumQueue(5, 0.4);
    waveEnemies = countQueueEnemies(waveSpawnQueue);

  } else {
    // Wave 11+: dynamic spawning, no scripted queue
    pressureLanes = [];
    waveSpawnQueue = [];
  }
}

function spawnEnemy(forceLane, forceType, forceHp) {
  const lane = forceLane !== undefined ? forceLane : pickLane();
  const sw = getSectorWidth();
  const speed = enemySpeed * dims.h;

  // Wave 0: lane 2 (index 1) enemies are 2x faster to ensure cannon destruction
  const finalSpeed = (wave === 0 && lane === 1) ? speed * 2 : speed;

  // Determine type: use override from formation, or roll for dynamic waves (11+)
  let type = forceType || 'standard';
  if (!forceType && wave > 10 && Math.random() < 0.18 + wave * 0.02) {
    const hasWeaver = enemies.some(e => e.alive && e.type === 'weaver' && e.lane === lane);
    if (!hasWeaver) {
      type = 'weaver';
    }
  }

  // Heavy: use override from formation, or roll for dynamic waves (11+)
  let hp = forceHp || 1;
  if (!forceHp && wave > 10 && type === 'standard' && Math.random() < 0.15 + wave * 0.02) {
    hp = 2;
  }

  enemies.push({
    lane: lane,
    x: getSectorX(lane),
    y: -30,
    width: sw * 0.45,
    height: sw * 0.35,
    speed: finalSpeed,
    alive: true,
    hitFlash: 0,
    hp: hp,
    maxHp: hp,
    type: type,
    weaverPhase: type === 'weaver' ? Math.random() * Math.PI * 2 : 0,
    weaverAmplitude: type === 'weaver' ? sw * 0.35 : 0
  });
}

function nextWave() {
  wave++;
  waveEnemiesSpawned = 0;

  if (wave === 0) {
    // Tutorial wave: slow, few enemies, fixed lanes
    waveEnemies = 5;
    spawnInterval = 2.0;
    enemySpeed = 0.10;
  } else if (wave <= 10) {
    // Formation waves (1-10): max speed, types set per-formation
    // waveEnemies is set by buildWaveSpawnQueue() for each formation
    enemySpeed = 0.6;
    spawnInterval = 0.5; // fallback only, formations use their own timing
  } else {
    // Dynamic waves (wave 11+)
    waveEnemies = 8 + wave * 2;
    spawnInterval = Math.max(0.35, 1.4 - wave * 0.1);
    enemySpeed = Math.min(0.6, 0.15 + wave * 0.022);
  }

  // Build scripted spawn queue for early waves
  buildWaveSpawnQueue();

  // Ammo economy: stingy early, generous later to match longer formation phase
  if (wave >= 1) {
    sectors.forEach(s => {
      if (s.alive) {
        let refill;
        if (wave <= 3) {
          refill = 1;       // teaching phase — tight ammo
        } else if (wave <= 7) {
          refill = 2;       // mid formations — moderate
        } else if (wave <= 10) {
          refill = 3;       // gauntlet formations — generous (tighter gaps drain more)
        } else {
          refill = 2 + Math.floor(wave / 5); // dynamic waves — scaling
        }
        s.ammo = Math.min(MAX_AMMO_CAP, s.ammo + refill);
      }
    });
  }

  // Tutorial: lane 1 (index 1) starts with 0 ammo so enemy destroys cannon
  // Lanes 2 & 3 are disabled (locked) during tutorial
  if (wave === 0) {
    sectors[1].ammo = 0;
    sectors[2].disabled = true;
    sectors[3].disabled = true;
  } else {
    // Re-enable all lanes and ensure tutorial is off
    sectors.forEach(s => { s.disabled = false; });
    tutorial.active = false;
  }

  // World transform: milestone triggers
  if (wave === 5) {
    worldTransform.milestone = { active: true, type: 'shimmer', timer: 0.8, duration: 0.8 };
  } else if (wave === 7) {
    // Mid-formation intensity shift
    worldTransform.milestone = { active: true, type: 'deep_pulse', timer: 1.2, duration: 1.2 };
  } else if (wave === 10) {
    // Final formation wave — intensity peak
    worldTransform.milestone = { active: true, type: 'grid_surge', timer: 0.5, duration: 0.5 };
  }

  // When jumping to a later wave, snap the world phase immediately
  if (typeof worldTransform !== 'undefined') {
    const targetPhase = getWorldPhaseForWave(wave);
    if (wave > 1 && Math.abs(worldTransform.phase - targetPhase) > 1) {
      worldTransform.phase = targetPhase; // snap, don't lerp
    }
  }

  // floating wave text
  floatingTexts.push({
    text: wave === 0 ? 'TUTORIAL' : `WAVE ${wave}`,
    x: dims.w / 2,
    y: dims.h * 0.35,
    alpha: 1,
    scale: 1.5,
    life: 2.0,
    color: wave === 0 ? '#44aaff' : '#ff3a3a',
    big: true
  });
}
