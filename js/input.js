// ============ INPUT HANDLING ============

function handleTap(clientX, clientY) {
  if (gameState !== 'playing') return;

  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const lane = Math.floor(x / (dims.w / SECTOR_COUNT));
  if (lane < 0 || lane >= SECTOR_COUNT) return;

  const sector = sectors[lane];

  if (sector.alive) {
    // Fire cannon
    if (sector.ammo > 0) {
      sector.ammo--;
      sector.cannonRecoil = 1;
      sector.muzzleFlash = 1;
      audio.play('shoot');

      bullets.push({
        x: getSectorX(lane),
        y: getCannonY() - 20,
        speed: BULLET_SPEED_FACTOR * dims.h,
        lane: lane,
        alive: true
      });

      // Muzzle particles
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: getSectorX(lane),
          y: getCannonY() - 20,
          vx: (Math.random() - 0.5) * 80,
          vy: -Math.random() * 150 - 50,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          color: '#ffaa44',
          size: 2 + Math.random() * 3
        });
      }

      screenShake.intensity = 3;
    } else {
      audio.play('empty');
    }
  } else {
    // Parry mode - cannon destroyed
    // Check if enemy is in parry zone
    const parryZoneTop = getCannonY() - dims.h * PARRY_ZONE_HEIGHT_FACTOR;
    const parryZoneBottom = getCannonY() + 20;

    let parried = false;
    for (let e of enemies) {
      if (e.lane === lane && e.alive && e.y + e.height / 2 > parryZoneTop && e.y - e.height / 2 < parryZoneBottom) {
        // Successful parry!
        e.alive = false;
        parried = true;
        totalParries++;
        score += 25;
        combo++;
        if (combo > maxCombo) maxCombo = combo;

        audio.play('parry');

        // Parry effects
        sector.shieldFlash = 1;
        slowMo.active = true;
        slowMo.factor = 0.2;
        slowMo.timer = 0.5;
        flashEffect.active = true;
        flashEffect.alpha = 0.4;
        flashEffect.color = '#44aaff';
        screenShake.intensity = 10;

        // SHOCKWAVE - travels up the lane
        audio.play('shockwave');
        shockwaves.push({
          lane: lane,
          x: getSectorX(lane),
          y: getCannonY() - 10,
          targetY: -50, // travels to top of screen
          speed: dims.h * 0.7, // fast but visible
          width: getSectorWidth() * 0.85,
          height: 30,
          alive: true,
          alpha: 1.0,
          trailParticleTimer: 0
        });

        floatingTexts.push({
          text: 'SHOCKWAVE!',
          x: getSectorX(lane),
          y: getCannonY() - 70,
          alpha: 1, scale: 1.4, life: 1.5,
          color: '#44ffdd', big: false
        });

        // Rebuild cannon
        sector.alive = true;
        sector.ammo = 3; // enough to fight but not comfortable
        sector.rebuildFlash = 1;
        audio.play('rebuild');

        // Cancel lane freeze if active (tutorial complete)
        if (laneFreeze.active && laneFreeze.lane === lane) {
          laneFreeze.active = false;
          laneFreeze.lane = -1;
        }

        // Shield particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: getSectorX(lane),
            y: getCannonY(),
            vx: Math.cos(angle) * (50 + Math.random() * 100),
            vy: Math.sin(angle) * (50 + Math.random() * 100),
            life: 0.5 + Math.random() * 0.5,
            maxLife: 1,
            color: '#44aaff',
            size: 2 + Math.random() * 4
          });
        }

        // Explosion particles for enemy
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * (30 + Math.random() * 80),
            vy: Math.sin(angle) * (30 + Math.random() * 80),
            life: 0.4 + Math.random() * 0.4,
            maxLife: 0.8,
            color: Math.random() > 0.5 ? '#ff4444' : '#ffaa44',
            size: 2 + Math.random() * 4
          });
        }

        floatingTexts.push({
          text: 'PARRY!',
          x: getSectorX(lane),
          y: getCannonY() - 40,
          alpha: 1, scale: 1.2, life: 1.2,
          color: '#44aaff', big: false
        });

        break;
      }
    }

    if (!parried) {
      // Failed parry / no enemy in zone - just show shield attempt
      sector.shieldFlash = 0.5;
    }
  }
}

// Canvas event listeners
canvas.addEventListener('mousedown', (e) => { e.preventDefault(); handleTap(e.clientX, e.clientY); });
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  for (let t of e.touches) handleTap(t.clientX, t.clientY);
}, { passive: false });
