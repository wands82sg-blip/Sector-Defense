// ============ GAME STATE ============

// Core state
let gameState = 'menu'; // menu, playing, gameover
let score = 0;
let wave = 0;
let combo = 0;
let maxCombo = 0;
let totalKills = 0;
let totalParries = 0;
let totalShockwaveKills = 0;
let totalBlastKills = 0;
let screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
let slowMo = { active: false, factor: 1, timer: 0 };
let flashEffect = { active: false, alpha: 0, color: '#fff' };

// First-death tutorial system
let firstDeathEver = true; // tracks across the entire session (not reset per game)
let laneFreeze = { active: false, lane: -1, timer: 0, maxTime: 60, waitingForParryEntry: false };

// Wave 0 tutorial: teach fire → cannon destroyed → teach parry
let tutorial = {
  active: false,
  hintLane: -1,      // lane showing "TAP TO FIRE" hint
  killCount: 0       // kills during fire-teaching phase
};

// Entity arrays
let sectors = [];
let bullets = [];
let enemies = [];
let particles = [];
let floatingTexts = [];
let shockwaves = [];
let destructionBlasts = [];

// Spawn control
let spawnTimer = 0;
let spawnInterval = 2.0;
let enemySpeed = 0;
let pressureLanes = [];
let waveSpawnQueue = [];
let waveEnemies = 0;
let waveEnemiesSpawned = 0;

// Wave transition pause
let wavePause = { active: false, timer: 0 };

// World transform — evolving atmosphere
let worldTransform = {
  // Background atmosphere phase (lerps between color palettes)
  phase: 0,          // 0-4 representing current color phase
  targetPhase: 0,    // where we're lerping to

  // Star field
  stars: [],
  shootingStars: [],

  // Ambient background particles
  bgParticles: [],
  bgParticleTimer: 0,

  // Grid evolution
  gridPulse: 0,      // sine accumulator for grid pulsing
  gridFlicker: 0,    // countdown for grid flicker effect

  // Milestone effects
  milestone: { active: false, type: '', timer: 0, duration: 0 }
};

// World transform color palettes (gradient top, mid, bottom for each phase)
const WORLD_PHASES = [
  // Phase 0: Cold void (waves 0-4)
  { top: [6,6,14], mid: [10,10,24], bot: [14,14,32], gridR:40, gridG:40, gridB:80, name:'void' },
  // Phase 1: Deep space awakens (waves 5-8)
  { top: [8,6,18], mid: [14,10,32], bot: [20,14,44], gridR:40, gridG:40, gridB:100, name:'awakens' },
  // Phase 2: Hostile territory (waves 9-12)
  { top: [14,6,10], mid: [24,10,16], bot: [36,14,22], gridR:60, gridG:30, gridB:50, name:'hostile' },
  // Phase 3: The furnace (waves 13-16)
  { top: [16,8,6], mid: [28,14,10], bot: [42,20,14], gridR:70, gridG:40, gridB:30, name:'furnace' },
  // Phase 4: The abyss (waves 17+)
  { top: [12,4,16], mid: [18,6,26], bot: [24,8,36], gridR:50, gridG:20, gridB:70, name:'abyss' }
];

function getWorldPhaseForWave(w) {
  if (w <= 4) return 0;
  if (w <= 8) return 1;
  if (w <= 12) return 2;
  if (w <= 16) return 3;
  return 4;
}

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(),           // 0-1 normalized
      y: Math.random(),           // 0-1 normalized
      size: 0.5 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 1 + Math.random() * 4,
      twinkleOffset: Math.random() * Math.PI * 2,
      depth: 0.2 + Math.random() * 0.8  // parallax depth (0=far, 1=close)
    });
  }
  return stars;
}

function initWorldTransform() {
  worldTransform.phase = 0;
  worldTransform.targetPhase = 0;
  worldTransform.stars = generateStars(80);
  worldTransform.shootingStars = [];
  worldTransform.bgParticles = [];
  worldTransform.bgParticleTimer = 0;
  worldTransform.gridPulse = 0;
  worldTransform.gridFlicker = 0;
  worldTransform.milestone = { active: false, type: '', timer: 0, duration: 0 };
}

// Game loop timing
let lastTime = 0;

// Sector initialization
function initSectors() {
  sectors = [];
  for (let i = 0; i < SECTOR_COUNT; i++) {
    sectors.push({
      index: i,
      ammo: INITIAL_AMMO,
      maxAmmo: MAX_AMMO_CAP,
      alive: true,
      parryActive: false,
      parryTimer: 0,
      shieldFlash: 0,
      cannonRecoil: 0,
      destroyed: false,
      disabled: false,
      rebuildFlash: 0,
      muzzleFlash: 0
    });
  }
}
