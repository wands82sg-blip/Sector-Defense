// ============ WAVE & ENEMY MANAGEMENT ============

function pickLane() {
  // Early waves: use pressure lanes for uneven distribution
  if (wave <= 4 && pressureLanes.length > 0) {
    // 70% chance to spawn in a pressure lane
    if (Math.random() < 0.7) {
      return pressureLanes[Math.floor(Math.random() * pressureLanes.length)];
    }
  }
  return Math.floor(Math.random() * SECTOR_COUNT);
}

function buildWaveSpawnQueue() {
  waveSpawnQueue = [];

  if (wave === 0) {
    // Wave 0: TUTORIAL — fixed lanes 0 and 1 only
    // Phase 1: enemies in lane 0, "TAP TO FIRE" teaches the player to shoot
    // Phase 2: lane 1 has 0 ammo → enemy destroys cannon
    // Phase 3: next enemy enters parry zone → 60s freeze, "TAP HERE" teaches parry
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
    // DIAGONAL: L1→L2→L3→L4 sweep, repeat
    // Teaches sequential tapping — fingers chase the wave left to right
    waveEnemies = 8;
    waveSpawnQueue = [
      {lanes:[0], delay:0.2}, {lanes:[1], delay:0.2},
      {lanes:[2], delay:0.2}, {lanes:[3], delay:0.8},
      {lanes:[0], delay:0.2}, {lanes:[1], delay:0.2},
      {lanes:[2], delay:0.2}, {lanes:[3], delay:0}
    ];

  } else if (wave === 2) {
    // PINCER: outer pair → inner pair, closing jaws
    // Teaches splitting attention — outer then inner, forces eyes to center
    waveEnemies = 8;
    waveSpawnQueue = [
      {lanes:[0,3], delay:0.25}, {lanes:[1,2], delay:0.6},
      {lanes:[0,3], delay:0.25}, {lanes:[1,2], delay:0}
    ];

  } else if (wave === 3) {
    // CHEVRON: center-out pattern targeting weakest cannon
    // Designed to overwhelm one lane and force the first cannon death
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

    waveEnemies = 10;
    waveSpawnQueue = [
      // Chevron: inner pair converges on target side
      {lanes:[target, adjacent], delay:0.3},
      {lanes:[others[0], others[1]], delay:0.3},
      // Second chevron pulse — drains target ammo
      {lanes:[target, adjacent], delay:0.3},
      // Extra solo hit on target — pressure builds
      {lanes:[target], delay:0.5},
      // Spacers in other lanes — give blast time to clear
      {lanes:[others[0], others[1]], delay:0.5},
      // Parry target — arrives after cannon death
      {lanes:[target], delay:0}
    ];

  } else if (wave === 4) {
    // ZIGZAG: non-linear lane hopping, then reverses
    // Teaches non-linear tracking — eyes can't just sweep, must jump
    waveEnemies = 8;
    waveSpawnQueue = [
      {lanes:[0], delay:0.2}, {lanes:[2], delay:0.2},
      {lanes:[1], delay:0.2}, {lanes:[3], delay:0.3},
      {lanes:[3], delay:0.2}, {lanes:[1], delay:0.2},
      {lanes:[2], delay:0.2}, {lanes:[0], delay:0}
    ];

  } else if (wave === 5) {
    // BLITZ: all 4 lanes simultaneous, decreasing gaps
    // Teaches rapid full-width defense — graduation exam before dynamic waves
    waveEnemies = 12;
    waveSpawnQueue = [
      {lanes:[0,1,2,3], delay:0.6},
      {lanes:[0,1,2,3], delay:0.4},
      {lanes:[0,1,2,3], delay:0}
    ];

  } else {
    // Wave 6+: no scripted queue, use dynamic lane pressure
    pressureLanes = [];
    waveSpawnQueue = [];
  }
}

function spawnEnemy(forceLane) {
  const lane = forceLane !== undefined ? forceLane : pickLane();
  const sw = getSectorWidth();
  const speed = enemySpeed * dims.h;

  // Wave 0: lane 2 (index 1) enemies are 2x faster to ensure cannon destruction
  const finalSpeed = (wave === 0 && lane === 1) ? speed * 2 : speed;

  // Determine enemy type: weaver from wave 6+ (waves 1-5 are formation waves, standard only)
  let type = 'standard';
  if (wave > 5 && Math.random() < 0.18 + wave * 0.02) {
    // Only allow one weaver per lane at a time
    const hasWeaver = enemies.some(e => e.alive && e.type === 'weaver' && e.lane === lane);
    if (!hasWeaver) {
      type = 'weaver';
    }
  }

  // Heavy enemies override type (heavy and weaver are mutually exclusive)
  let hp = 1;
  if (wave >= 6 && type === 'standard' && Math.random() < 0.15 + wave * 0.02) {
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
  } else if (wave <= 5) {
    // Formation waves: max speed, standard enemies only
    // waveEnemies is set by buildWaveSpawnQueue() for each formation
    enemySpeed = 0.45;
    spawnInterval = 0.5; // fallback only, formations use their own timing
  } else {
    // Dynamic waves (wave 6+)
    waveEnemies = 8 + wave * 2;
    spawnInterval = Math.max(0.35, 1.4 - wave * 0.1);
    enemySpeed = Math.min(0.45, 0.15 + wave * 0.022);
  }

  // Build scripted spawn queue for early waves
  buildWaveSpawnQueue();

  // Ammo economy: stingy early, gradually more generous
  if (wave >= 1) {
    sectors.forEach(s => {
      if (s.alive) {
        let refill;
        if (wave <= 3) {
          refill = 1;
        } else if (wave <= 6) {
          refill = 2;
        } else {
          refill = 2 + Math.floor(wave / 5);
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
  } else if (wave === 10) {
    worldTransform.milestone = { active: true, type: 'deep_pulse', timer: 1.2, duration: 1.2 };
  } else if (wave === 20) {
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
