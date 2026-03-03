// ============ GAME INITIALIZATION & LOOP ============

function startGame() {
  score = 0;
  wave = 0;
  combo = 0;
  maxCombo = 0;
  totalKills = 0;
  totalParries = 0;
  totalShockwaveKills = 0;
  bullets = [];
  enemies = [];
  particles = [];
  floatingTexts = [];
  shockwaves = [];
  spawnTimer = 0;
  spawnInterval = 1.4;
  enemySpeed = 0.15;
  pressureLanes = [];
  waveSpawnQueue = [];
  screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
  slowMo = { active: false, factor: 1, timer: 0 };
  flashEffect = { active: false, alpha: 0, color: '#fff' };
  laneFreeze = { active: false, lane: -1, timer: 0, maxTime: 1.8 };
  initSectors();
  nextWave();
  gameState = 'playing';
}

function gameOver() {
  gameState = 'gameover';
  audio.play('gameover');

  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalStats').textContent =
    `WAVE ${wave} · ${totalKills} KILLS · ${totalParries} PARRIES · ${totalShockwaveKills} SWEPT · ${maxCombo}x COMBO`;

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
document.getElementById('startBtn').addEventListener('click', () => {
  audio.init();
  document.getElementById('startScreen').style.display = 'none';
  startGame();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('gameOverScreen').style.display = 'none';
  startGame();
});

// Boot
requestAnimationFrame(gameLoop);
