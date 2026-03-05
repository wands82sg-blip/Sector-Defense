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

  // Wave transition pause
  if (wavePause.active) {
    wavePause.timer -= dt;
    if (wavePause.timer <= 0) {
      wavePause.active = false;
      nextWave();
    }
  } else {
    // Spawn enemies (only when not paused between waves)
    spawnTimer -= adt;
    if (spawnTimer <= 0 && waveEnemiesSpawned < waveEnemies) {
      if (waveSpawnQueue.length > 0) {
        const entry = waveSpawnQueue.shift();
        if (typeof entry === 'object' && entry.lanes) {
          // Formation spawn: multiple lanes with optional type overrides
          entry.lanes.forEach(lane => {
            let type = undefined;
            let hp = undefined;
            if (entry.heavy && entry.heavy.includes(lane)) { hp = 2; }
            if (entry.weaver && entry.weaver.includes(lane)) { type = 'weaver'; }
            if (entry.sprinter && entry.sprinter.includes(lane)) { type = 'sprinter'; }
            if (entry.splitter && entry.splitter.includes(lane)) { type = 'splitter'; }
            if (entry.shielded && entry.shielded.includes(lane)) { type = 'shielded'; }
            if (entry.switcher && entry.switcher.includes(lane)) { type = 'switcher'; }
            spawnEnemy(lane, type, hp);
          });
          waveEnemiesSpawned += entry.lanes.length;
          spawnTimer = entry.delay;
        } else {
          // Single-lane spawn (wave 0 tutorial)
          spawnEnemy(entry);
          waveEnemiesSpawned++;
          spawnTimer = spawnInterval * (0.6 + Math.random() * 0.4);
        }
      } else {
        // Dynamic spawning (wave 11+)
        spawnEnemy();
        waveEnemiesSpawned++;
        spawnTimer = spawnInterval * (0.6 + Math.random() * 0.4);
      }
    }

    // Check wave complete
    if (waveEnemiesSpawned >= waveEnemies && enemies.filter(e => e.alive).length === 0) {
      // Wave 0: don't advance until player has completed the parry tutorial
      if (wave === 0 && (laneFreeze.active || laneFreeze.waitingForParryEntry)) {
        // Still waiting for parry — don't end the wave yet
      } else {
        wavePause.active = true;
        wavePause.timer = 2.0;
      }
    }
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
      laneFreeze.waitingForParryEntry = false;
      laneFreeze.lane = -1;
    }
  }

  // Update enemies
  enemies.forEach(e => {
    if (!e.alive) return;

    // Detect first enemy entering the parry window — triggers full-game freeze
    if (laneFreeze.waitingForParryEntry && e.lane === laneFreeze.lane) {
      const parryZoneTop = getCannonY() - dims.h * PARRY_ZONE_HEIGHT_FACTOR;
      if (e.y + e.height / 2 > parryZoneTop) {
        laneFreeze.waitingForParryEntry = false;
        laneFreeze.active = true;
        laneFreeze.timer = laneFreeze.maxTime;
      }
    }

    // Freeze ALL enemies while tutorial freeze is active
    const frozen = laneFreeze.active;
    if (!frozen) {
      e.y += e.speed * adt;

      // Weaver: oscillate horizontally using sine wave keyed to y position
      if (e.type === 'weaver') {
        e.x = getSectorX(e.lane) + Math.sin(e.y * 0.018 + e.weaverPhase) * e.weaverAmplitude;
      }

      // Switcher: lane-switch at switchY with smoothstep ease
      if (e.type === 'switcher' && !e.switched && e.switchLane >= 0 && e.y >= e.switchY) {
        // Update lane to target at start of switch (for bullet collision)
        if (e.switchProgress === 0) {
          e.lane = e.switchLane;
        }
        e.switchProgress += adt * 3.3; // ~0.3s to complete
        const t = Math.min(1, e.switchProgress);
        const ease = t * t * (3 - 2 * t); // smoothstep
        const originX = getSectorX(e.originLane);
        const targetX = getSectorX(e.switchLane);
        e.x = originX + (targetX - originX) * ease;
        if (t >= 1) {
          e.switched = true;
          e.x = getSectorX(e.switchLane);
        }
      }
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

        // TUTORIAL FREEZE: wait for an enemy to enter the parry window,
        // then freeze the entire game so the player has time to react.
        // Wave 0 always freezes; later waves freeze only on first-ever death.
        if (wave === 0 || firstDeathEver) {
          firstDeathEver = false;
          laneFreeze.lane = e.lane;
          laneFreeze.waitingForParryEntry = true;
        }

        // End fire tutorial — parry tutorial takes over
        if (tutorial.active) {
          tutorial.active = false;
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

        // Destruction blast — sweeps upward to mid-screen, clearing trailing enemies
        destructionBlasts.push({
          lane: e.lane,
          x: getSectorX(e.lane),
          y: getCannonY(),
          targetY: dims.h * 0.5,
          speed: dims.h * 1.2,
          width: getSectorWidth() * 0.75,
          height: 35,
          alive: true,
          alpha: 1.0,
          trailParticleTimer: 0
        });
        audio.play('destruction_blast');
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

        // Shielded: first hit breaks shield, no HP damage, no ammo refund
        if (e.shielded) {
          e.shielded = false;
          e.hitFlash = 1;
          audio.play('shield_break');
          screenShake.intensity = 4;
          // Shield break particles
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
              x: e.x, y: e.y - e.height * 0.3,
              vx: Math.cos(angle) * (40 + Math.random() * 60),
              vy: Math.sin(angle) * (40 + Math.random() * 60),
              life: 0.3 + Math.random() * 0.3,
              maxLife: 0.6,
              color: Math.random() > 0.5 ? '#4488dd' : '#66aaff',
              size: 2 + Math.random() * 3
            });
          }
          return; // skip HP reduction, no ammo refund
        }

        e.hp--;

        // Reward: +1 ammo on every hit (not just kills)
        const killerSector = sectors[b.lane];
        if (killerSector && killerSector.alive) {
          killerSector.ammo = Math.min(MAX_AMMO_CAP, killerSector.ammo + 1);
        }

        if (e.hp <= 0) {
          e.alive = false;
          totalKills++;
          combo++;
          if (combo > maxCombo) maxCombo = combo;

          let points = e.type === 'fragment' ? 5 : 10 + Math.min(combo, 20) * 2;
          score += points;

          audio.play('hit');
          if (combo > 0 && combo % 5 === 0) audio.play('combo');

          // Tutorial: hide fire hint after 2 kills
          if (tutorial.active) {
            tutorial.killCount++;
            if (tutorial.killCount >= 2) {
              tutorial.active = false;
            }
          }

          // Splitter: spawn 2 fragments on bullet kill
          if (e.type === 'splitter') {
            const offsetX = e.width * 0.3;
            [-1, 1].forEach(side => {
              const sw = getSectorWidth();
              enemies.push({
                lane: e.lane,
                x: e.x + side * offsetX,
                y: e.y,
                width: sw * 0.27,
                height: sw * 0.21,
                speed: e.speed * 0.85,
                alive: true,
                hitFlash: 0,
                hp: 1,
                maxHp: 1,
                type: 'fragment',
                weaverPhase: 0,
                weaverAmplitude: 0,
                shielded: false,
                originLane: e.lane,
                switchLane: -1,
                switchY: 0,
                switched: false,
                switchProgress: 0
              });
            });
          }

          screenShake.intensity = 6;
          flashEffect.active = true;
          flashEffect.alpha = 0.2;
          flashEffect.color = '#ff6644';

          // Explosion
          const explodeColor1 = e.type === 'splitter' ? '#ddaa33' : (e.type === 'sprinter' ? '#33ddaa' : '#ff6644');
          const explodeColor2 = e.type === 'splitter' ? '#bb8822' : (e.type === 'sprinter' ? '#22aa88' : '#ffcc44');
          for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(angle) * (30 + Math.random() * 80),
              vy: Math.sin(angle) * (30 + Math.random() * 80),
              life: 0.3 + Math.random() * 0.4,
              maxLife: 0.7,
              color: Math.random() > 0.3 ? explodeColor1 : explodeColor2,
              size: 2 + Math.random() * 4
            });
          }

          // Fragment kills are worth 5 pts, no combo text
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
          audio.play('hit_weak');
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

  // Update destruction blasts
  destructionBlasts.forEach(db => {
    if (!db.alive) return;
    db.y -= db.speed * adt;
    db.alpha = Math.max(0.4, db.alpha - adt * 0.8);

    // Fire trail particles
    db.trailParticleTimer -= adt;
    if (db.trailParticleTimer <= 0) {
      db.trailParticleTimer = 0.02;
      for (let side = -1; side <= 1; side += 2) {
        particles.push({
          x: db.x + side * db.width * 0.4 + (Math.random() - 0.5) * 10,
          y: db.y + (Math.random() - 0.5) * db.height,
          vx: side * (15 + Math.random() * 25),
          vy: Math.random() * 40 + 20,
          life: 0.25 + Math.random() * 0.2,
          maxLife: 0.45,
          color: Math.random() > 0.5 ? '#ff4444' : '#ff8844',
          size: 1.5 + Math.random() * 2
        });
      }
      particles.push({
        x: db.x + (Math.random() - 0.5) * db.width * 0.5,
        y: db.y,
        vx: (Math.random() - 0.5) * 15,
        vy: 25 + Math.random() * 25,
        life: 0.2 + Math.random() * 0.15,
        maxLife: 0.35,
        color: '#ffaa44',
        size: 1 + Math.random() * 2
      });
    }

    // Collision with enemies in same lane
    enemies.forEach(e => {
      if (!e.alive || e.lane !== db.lane) return;
      // Don't let destruction blast kill the parry target
      if (laneFreeze.waitingForParryEntry && e.lane === laneFreeze.lane) return;
      const dy = Math.abs(db.y - e.y);
      if (dy < db.height / 2 + e.height / 2 + 5) {
        e.alive = false;
        totalKills++;
        totalBlastKills++;
        score += 5;
        audio.play('shockwave_hit');
        screenShake.intensity = Math.max(screenShake.intensity, 4);

        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle) * (30 + Math.random() * 50),
            vy: Math.sin(angle) * (30 + Math.random() * 50),
            life: 0.25 + Math.random() * 0.25,
            maxLife: 0.5,
            color: Math.random() > 0.4 ? '#ff6644' : '#ffaa44',
            size: 2 + Math.random() * 3
          });
        }

        floatingTexts.push({
          text: '+5',
          x: e.x + (Math.random() - 0.5) * 15,
          y: e.y,
          alpha: 1, scale: 0.8, life: 0.7,
          color: '#ff8844', big: false
        });
      }
    });

    if (db.y < db.targetY) {
      db.alive = false;
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

  // === World transform updates (real time, not affected by slow-mo) ===
  const wt = worldTransform;

  // Smoothly lerp phase toward target
  wt.targetPhase = getWorldPhaseForWave(wave);
  if (wt.phase < wt.targetPhase) {
    wt.phase = Math.min(wt.targetPhase, wt.phase + dt * 0.15);
  } else if (wt.phase > wt.targetPhase) {
    wt.phase = Math.max(wt.targetPhase, wt.phase - dt * 0.15);
  }

  // Grid pulse accumulator (wave 9+)
  if (wave >= 9) {
    wt.gridPulse += dt * 1.5;
  }

  // Grid flicker countdown (wave 17+)
  if (wave >= 17) {
    if (wt.gridFlicker <= 0 && Math.random() < dt * 0.3) {
      wt.gridFlicker = 0.05 + Math.random() * 0.08; // brief flicker
    }
  }
  if (wt.gridFlicker > 0) {
    wt.gridFlicker -= dt;
  }

  // Shooting stars (wave 15+)
  if (wave >= 15) {
    // Spawn
    if (Math.random() < dt * 0.15) {
      wt.shootingStars.push({
        x: Math.random() * dims.w,
        y: Math.random() * dims.h * 0.5,
        vx: 150 + Math.random() * 200,
        vy: 80 + Math.random() * 120,
        life: 0.4 + Math.random() * 0.4
      });
    }
    // Update
    wt.shootingStars.forEach(ss => {
      ss.x += ss.vx * dt;
      ss.y += ss.vy * dt;
      ss.life -= dt;
    });
    wt.shootingStars = wt.shootingStars.filter(ss => ss.life > 0);
  }

  // Ambient background particles (wave 8+)
  if (wave >= 8) {
    const maxBgParticles = 50;
    const density = Math.min(1, (wave - 7) / 8); // ramps up over waves 8-15
    wt.bgParticleTimer -= dt;
    if (wt.bgParticleTimer <= 0 && wt.bgParticles.length < maxBgParticles) {
      wt.bgParticleTimer = 0.3 - density * 0.2; // 0.3s to 0.1s
      // Color based on current phase
      const phaseIdx = Math.min(Math.floor(wt.phase), WORLD_PHASES.length - 1);
      const phaseName = WORLD_PHASES[phaseIdx].name;
      let r, g, b;
      if (phaseName === 'hostile' || phaseName === 'furnace') {
        r = 200 + Math.random() * 55; g = 80 + Math.random() * 60; b = 30 + Math.random() * 40;
      } else if (phaseName === 'abyss') {
        r = 120 + Math.random() * 60; g = 60 + Math.random() * 40; b = 180 + Math.random() * 75;
      } else {
        r = 80 + Math.random() * 60; g = 120 + Math.random() * 60; b = 200 + Math.random() * 55;
      }
      // Lateral wisps (wave 16+) vs upward motes
      const isWisp = wave >= 16 && Math.random() < 0.3;
      wt.bgParticles.push({
        x: Math.random() * dims.w,
        y: isWisp ? Math.random() * dims.h : dims.h + 5,
        vx: isWisp ? (30 + Math.random() * 40) * (Math.random() > 0.5 ? 1 : -1) : (Math.random() - 0.5) * 8,
        vy: isWisp ? (Math.random() - 0.5) * 10 : -(8 + Math.random() * 15),
        size: isWisp ? 1 + Math.random() * 2 : 0.5 + Math.random() * 1,
        alpha: 0.15 + density * 0.15,
        life: 3 + Math.random() * 4,
        maxLife: 7,
        r: Math.round(r), g: Math.round(g), b: Math.round(b)
      });
    }
    wt.bgParticles.forEach(bp => {
      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;
      bp.life -= dt;
    });
    wt.bgParticles = wt.bgParticles.filter(bp => bp.life > 0 && bp.y > -10 && bp.x > -20 && bp.x < dims.w + 20);
  }

  // Milestone effect timer
  if (wt.milestone.active) {
    wt.milestone.timer -= dt;
    if (wt.milestone.timer <= 0) {
      wt.milestone.active = false;
    }
  }

  // Cleanup
  bullets = bullets.filter(b => b.alive);
  enemies = enemies.filter(e => e.alive);
  shockwaves = shockwaves.filter(sw => sw.alive);
  destructionBlasts = destructionBlasts.filter(db => db.alive);
  particles = particles.filter(p => p.life > 0);
  floatingTexts = floatingTexts.filter(ft => ft.life > 0);
}
