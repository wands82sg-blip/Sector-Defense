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
