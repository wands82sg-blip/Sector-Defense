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

  if (wave === 1) {
    // Wave 1: Pick 2 adjacent lanes to pressure hard - 6 enemies, mostly in 2 lanes
    const startLane = Math.floor(Math.random() * 3); // 0, 1, or 2
    pressureLanes = [startLane, startLane + 1];
    // Queue: pressure, pressure, other, pressure, pressure, pressure
    waveSpawnQueue = [
      pressureLanes[0], pressureLanes[1],
      (startLane + 2) % SECTOR_COUNT,
      pressureLanes[0], pressureLanes[1], pressureLanes[0]
    ];
  } else if (wave === 2) {
    // Wave 2: Shift pressure to different lanes, slightly more enemies
    // Pick lanes that WEREN'T pressured in wave 1 + one overlap
    const newPrimary = (pressureLanes[1] + 1) % SECTOR_COUNT;
    const newSecondary = (pressureLanes[1] + 2) % SECTOR_COUNT;
    pressureLanes = [newPrimary, newSecondary];
    // 8 enemies, heavily concentrated to force ammo depletion
    waveSpawnQueue = [
      newPrimary, newPrimary, newSecondary, newPrimary,
      newSecondary, newPrimary, newSecondary, newPrimary
    ];
  } else if (wave === 3) {
    // Wave 3: THE DESIGNED OVERWHELM - one lane gets slammed to force first cannon death
    // Pick the lane with lowest ammo to guarantee the death
    let lowestAmmoLane = 0;
    let lowestAmmo = Infinity;
    sectors.forEach((s, i) => {
      if (s.alive && s.ammo < lowestAmmo) {
        lowestAmmo = s.ammo;
        lowestAmmoLane = i;
      }
    });
    pressureLanes = [lowestAmmoLane];
    const otherLanes = [0,1,2,3].filter(l => l !== lowestAmmoLane);
    // Key design: after the ammo-draining burst (first 3-4 in target lane),
    // insert OTHER lane enemies as spacers before the kill shot + parry target.
    // This guarantees the parry target arrives with a visible gap.
    waveSpawnQueue = [
      // Phase 1: Drain ammo (these will use up remaining bullets)
      lowestAmmoLane, lowestAmmoLane, lowestAmmoLane,
      // Phase 2: Spacers in other lanes (builds tension, gives cannon-kill time)
      otherLanes[0], otherLanes[1],
      // Phase 3: The kill shot - cannon has no ammo, this destroys it
      lowestAmmoLane,
      // Phase 4: MORE spacers - this is the critical gap for parry learning
      otherLanes[2], otherLanes[0],
      // Phase 5: The parry target - arrives well after cannon death
      lowestAmmoLane
    ];
  } else {
    // Wave 4+: no scripted queue, use dynamic lane pressure
    pressureLanes = [];
    waveSpawnQueue = [];
  }
}

function spawnEnemy(forceLane) {
  const lane = forceLane !== undefined ? forceLane : pickLane();
  const sw = getSectorWidth();
  const speed = enemySpeed * dims.h;

  // Speed variance: some enemies slightly faster/slower for visual interest
  const speedVariance = 0.85 + Math.random() * 0.3;

  enemies.push({
    lane: lane,
    x: getSectorX(lane),
    y: -30,
    width: sw * 0.45,
    height: sw * 0.35,
    speed: speed * speedVariance,
    alive: true,
    hitFlash: 0,
    hp: wave >= 6 ? (Math.random() < 0.15 + wave * 0.02 ? 2 : 1) : 1,
    maxHp: 1
  });

  if (enemies[enemies.length-1].hp === 2) {
    enemies[enemies.length-1].maxHp = 2;
  }
}

function nextWave() {
  wave++;
  waveEnemiesSpawned = 0;

  // Wave sizing: starts aggressive, scales steadily
  if (wave <= 3) {
    waveEnemies = 4 + wave * 2; // 6, 8, 10
  } else {
    waveEnemies = 8 + wave * 2; // 16, 18, 20...
  }

  // Spawn interval: tight from the start, gets relentless
  spawnInterval = Math.max(0.35, 1.4 - wave * 0.1);

  // Enemy speed: noticeable from wave 1, dangerous by wave 6
  enemySpeed = Math.min(0.45, 0.15 + wave * 0.022);

  // Build scripted spawn queue for early waves
  buildWaveSpawnQueue();

  // Ammo economy: stingy early, gradually more generous
  // Wave 1-3: +1 ammo per wave (forces scarcity)
  // Wave 4-6: +2 ammo per wave (slight relief)
  // Wave 7+: +2-3 ammo per wave (scaled to enemy count)
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

  // floating wave text
  floatingTexts.push({
    text: `WAVE ${wave}`,
    x: dims.w / 2,
    y: dims.h * 0.35,
    alpha: 1,
    scale: 1.5,
    life: 2.0,
    color: '#ff3a3a',
    big: true
  });
}
