// ============ UPDATE ============

function update(dt) {
  if (gameState !== 'playing') return;

  // Slow mo
  let adt = dt;
  if (slowMo.active) {
    adt = dt * slowMo.factor;
    slowMo.timer -= dt;
    if (slowMo.timer <= 0) {
      slowMo.active = false;
      slowMo.factor = 1;
    }
  }

  // Screen shake decay
  if (screenShake.intensity > 0.1) {
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.intensity *= Math.pow(screenShake.decay, dt * 60);
  } else {
    screenShake.x = 0;
    screenShake.y = 0;
    screenShake.intensity = 0;
  }

  // Flash decay
  if (flashEffect.active) {
    flashEffect.alpha -= dt * 3;
    if (flashEffect.alpha <= 0) {
      flashEffect.active = false;
      flashEffect.alpha = 0;
    }
  }

  // Sector updates
  sectors.forEach(s => {
    if (s.cannonRecoil > 0) s.cannonRecoil -= dt * 8;
    if (s.muzzleFlash > 0) s.muzzleFlash -= dt * 6;
    if (s.shieldFlash > 0) s.shieldFlash -= dt * 3;
    if (s.rebuildFlash > 0) s.rebuildFlash -= dt * 2;
  });

  // Spawn enemies
  spawnTimer -= adt;
  if (spawnTimer <= 0 && waveEnemiesSpawned < waveEnemies) {
    // Use scripted queue if available, otherwise dynamic spawning
    if (waveSpawnQueue.length > 0) {
      const forcedLane = waveSpawnQueue.shift();
      spawnEnemy(forcedLane);
    } else {
      spawnEnemy();
    }
    waveEnemiesSpawned++;
    spawnTimer = spawnInterval * (0.6 + Math.random() * 0.4);
  }

  // Check wave complete
  if (waveEnemiesSpawned >= waveEnemies && enemies.filter(e => e.alive).length === 0) {
    nextWave();
  }

  // Update bullets
  bullets.forEach(b => {
    if (!b.alive) return;
    b.y -= b.speed * adt;
    if (b.y < -20) b.alive = false;

    // Trail particles
    if (Math.random() < 0.5) {
      particles.push({
        x: b.x + (Math.random()-0.5)*3,
        y: b.y + 5,
        vx: 0, vy: 10,
        life: 0.2, maxLife: 0.2,
        color: '#ff8844',
        size: 1.5
      });
    }
  });

  // Lane freeze timer countdown
  if (laneFreeze.active) {
    laneFreeze.timer -= dt;
    if (laneFreeze.timer <= 0) {
      laneFreeze.active = false;
      laneFreeze.lane = -1;
    }
  }

  // Update enemies
  enemies.forEach(e => {
    if (!e.alive) return;

    // Freeze enemies in the tutorial lane
    const frozen = laneFreeze.active && e.lane === laneFreeze.lane;
    if (!frozen) {
      e.y += e.speed * adt;
    }
    if (e.hitFlash > 0) e.hitFlash -= dt * 5;

    // Check if enemy reached cannon
    if (e.y > getCannonY() + 10) {
      const sector = sectors[e.lane];
      if (sector.alive) {
        // Destroy cannon
        sector.alive = false;
        sector.ammo = 0;
        e.alive = false;
        combo = 0;
        audio.play('destroy');
        screenShake.intensity = 12;
        flashEffect.active = true;
        flashEffect.alpha = 0.5;
        flashEffect.color = '#ff2222';

        // FIRST DEATH TUTORIAL: freeze this lane so player can learn parry
        if (firstDeathEver) {
          firstDeathEver = false;
          laneFreeze.active = true;
          laneFreeze.lane = e.lane;
          laneFreeze.timer = laneFreeze.maxTime;
        }

        // Destruction particles
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: getSectorX(e.lane),
            y: getCannonY(),
            vx: Math.cos(angle) * (40 + Math.random() * 120),
            vy: Math.sin(angle) * (40 + Math.random() * 120) - 50,
            life: 0.5 + Math.random() * 0.8,
            maxLife: 1.3,
            color: Math.random() > 0.5 ? '#ff4444' : '#ff8844',
            size: 3 + Math.random() * 5
          });
        }

        floatingTexts.push({
          text: 'DESTROYED!',
          x: getSectorX(e.lane),
          y: getCannonY() - 40,
          alpha: 1, scale: 1, life: 1.5,
          color: '#ff3333', big: false
        });
      } else {
        // Cannon already destroyed - GAME OVER
        e.alive = false;
        gameOver();
        return;
      }
    }
  });

  // Bullet-Enemy collisions
  bullets.forEach(b => {
    if (!b.alive) return;
    enemies.forEach(e => {
      if (!e.alive) return;
      if (b.lane !== e.lane) return;

      const dx = Math.abs(b.x - e.x);
      const dy = Math.abs(b.y - e.y);
      if (dx < e.width / 2 + 4 && dy < e.height / 2 + 8) {
        b.alive = false;
        e.hp--;

        if (e.hp <= 0) {
          e.alive = false;
          totalKills++;
          combo++;
          if (combo > maxCombo) maxCombo = combo;

          let points = 10 + Math.min(combo, 20) * 2;
          score += points;

          audio.play('hit');
          if (combo > 0 && combo % 5 === 0) audio.play('combo');

          screenShake.intensity = 6;
          flashEffect.active = true;
          flashEffect.alpha = 0.2;
          flashEffect.color = '#ff6644';

          // Explosion
          for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(angle) * (30 + Math.random() * 80),
              vy: Math.sin(angle) * (30 + Math.random() * 80),
              life: 0.3 + Math.random() * 0.4,
              maxLife: 0.7,
              color: Math.random() > 0.3 ? '#ff6644' : '#ffcc44',
              size: 2 + Math.random() * 4
            });
          }

          let comboText = combo >= 3 ? ` x${combo}` : '';
          floatingTexts.push({
            text: `+${points}${comboText}`,
            x: e.x,
            y: e.y,
            alpha: 1, scale: combo >= 5 ? 1.3 : 1, life: 1,
            color: combo >= 5 ? '#ffcc00' : '#fff', big: false
          });
        } else {
          // Hit but not dead
          e.hitFlash = 1;
          screenShake.intensity = 3;
          for (let i = 0; i < 5; i++) {
            particles.push({
              x: e.x + (Math.random()-0.5) * e.width * 0.5,
              y: e.y + (Math.random()-0.5) * e.height * 0.5,
              vx: (Math.random()-0.5) * 60,
              vy: (Math.random()-0.5) * 60,
              life: 0.2, maxLife: 0.2,
              color: '#ffaa44',
              size: 2
            });
          }
        }
      }
    });
  });

  // Update shockwaves
  shockwaves.forEach(sw => {
    if (!sw.alive) return;
    sw.y -= sw.speed * adt;
    sw.alpha = Math.max(0.3, sw.alpha - adt * 0.4);

    // Trail particles along the shockwave edges
    sw.trailParticleTimer -= adt;
    if (sw.trailParticleTimer <= 0) {
      sw.trailParticleTimer = 0.02;
      // Side trail particles
      for (let side = -1; side <= 1; side += 2) {
        particles.push({
          x: sw.x + side * sw.width * 0.4 + (Math.random() - 0.5) * 10,
          y: sw.y + (Math.random() - 0.5) * sw.height,
          vx: side * (20 + Math.random() * 30),
          vy: Math.random() * 30 + 10,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          color: Math.random() > 0.5 ? '#44aaff' : '#44ffdd',
          size: 1.5 + Math.random() * 2
        });
      }
      // Center energy particles
      particles.push({
        x: sw.x + (Math.random() - 0.5) * sw.width * 0.6,
        y: sw.y,
        vx: (Math.random() - 0.5) * 20,
        vy: 20 + Math.random() * 20,
        life: 0.2 + Math.random() * 0.15,
        maxLife: 0.35,
        color: '#88ddff',
        size: 1 + Math.random() * 2
      });
    }

    // Check collision with enemies in same lane
    enemies.forEach(e => {
      if (!e.alive || e.lane !== sw.lane) return;

      // Check if shockwave overlaps enemy
      const dy = Math.abs(sw.y - e.y);
      if (dy < sw.height / 2 + e.height / 2 + 5) {
        e.alive = false;
        totalKills++;
        totalShockwaveKills++;

        // Half points for shockwave kills
        let points = Math.floor((10 + Math.min(combo, 20)) * 0.5);
        score += points;

        audio.play('shockwave_hit');
        screenShake.intensity = Math.max(screenShake.intensity, 4);

        // Cascade explosion - slightly different from normal kills
        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * (40 + Math.random() * 60),
            vy: Math.sin(angle) * (40 + Math.random() * 60),
            life: 0.3 + Math.random() * 0.3,
            maxLife: 0.6,
            color: Math.random() > 0.4 ? '#44aaff' : '#44ffdd',
            size: 2 + Math.random() * 4
          });
        }
        // Add some fiery particles too
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * (20 + Math.random() * 50),
            vy: Math.sin(angle) * (20 + Math.random() * 50),
            life: 0.2 + Math.random() * 0.2,
            maxLife: 0.4,
            color: '#ffaa44',
            size: 2 + Math.random() * 3
          });
        }

        floatingTexts.push({
          text: `+${points}`,
          x: e.x + (Math.random() - 0.5) * 20,
          y: e.y,
          alpha: 1, scale: 0.9, life: 0.8,
          color: '#44ffdd', big: false
        });
      }
    });

    // Shockwave dies when it leaves the screen
    if (sw.y < sw.targetY) {
      sw.alive = false;
    }
  });

  // Update particles
  particles.forEach(p => {
    p.x += p.vx * adt;
    p.y += p.vy * adt;
    p.vy += 200 * adt; // gravity
    p.life -= adt;
  });

  // Update floating texts
  floatingTexts.forEach(ft => {
    ft.y -= 30 * adt;
    ft.life -= adt;
    ft.alpha = Math.min(1, ft.life * 2);
  });

  // Cleanup
  bullets = bullets.filter(b => b.alive);
  enemies = enemies.filter(e => e.alive);
  shockwaves = shockwaves.filter(sw => sw.alive);
  particles = particles.filter(p => p.life > 0);
  floatingTexts = floatingTexts.filter(ft => ft.life > 0);
}
