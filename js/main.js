// ============ GAME INITIALIZATION & LOOP ============

function startGame(startWave) {
  score = 0;
  combo = 0;
  maxCombo = 0;
  totalKills = 0;
  totalParries = 0;
  totalShockwaveKills = 0;
  totalBlastKills = 0;
  bullets = [];
  enemies = [];
  particles = [];
  floatingTexts = [];
  shockwaves = [];
  destructionBlasts = [];
  spawnTimer = 0;
  spawnInterval = 1.4;
  enemySpeed = 0.15;
  pressureLanes = [];
  waveSpawnQueue = [];
  screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
  slowMo = { active: false, factor: 1, timer: 0 };
  flashEffect = { active: false, alpha: 0, color: '#fff' };
  firstDeathEver = true;
  laneFreeze = { active: false, lane: -1, timer: 0, maxTime: 60, waitingForParryEntry: false };
  wavePause = { active: false, timer: 0 };
  tutorial = { active: false, hintLane: -1, killCount: 0 };
  initSectors();

  // Jump to requested wave
  const targetWave = (typeof startWave === 'number' && startWave > 0) ? startWave : 0;
  wave = targetWave - 1;
  if (targetWave > 0) {
    firstDeathEver = false; // skip first-death tutorial when jumping ahead
    tutorial.active = false;
  }
  nextWave();
  gameState = 'playing';
}

function gameOver() {
  gameState = 'gameover';
  audio.play('gameover');

  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalStats').textContent =
    `WAVE ${wave} · ${totalKills} KILLS · ${totalParries} PARRIES · ${totalShockwaveKills + totalBlastKills} SWEPT · ${maxCombo}x COMBO`;

  setTimeout(() => {
    document.getElementById('gameOverScreen').style.display = 'flex';
  }, 800);
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Clamp dt
  if (dt > 0.1) dt = 0.016;

  if (gameState === 'playing') {
    update(dt);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// Button listeners
// Read wave input and store for restarts
let selectedStartWave = 0;

document.getElementById('startBtn').addEventListener('click', () => {
  audio.init();
  const val = Number(document.getElementById('waveInput').value);
  selectedStartWave = (isNaN(val) || val < 0) ? 0 : Math.floor(val);
  document.getElementById('startScreen').style.display = 'none';
  startGame(selectedStartWave);
});

document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('gameOverScreen').style.display = 'none';
  startGame(selectedStartWave);
});

// Boot
requestAnimationFrame(gameLoop);
