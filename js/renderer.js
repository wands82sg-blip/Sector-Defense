// ============ DRAW ============

function draw() {
  const W = dims.w;
  const H = dims.h;
  const sw = getSectorWidth();
  const cannonY = getCannonY();

  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);

  // === LAYER 1: Background atmosphere ===
  const wt = worldTransform;
  const phase = wt.phase;
  const phaseIdx = Math.floor(phase);
  const phaseFrac = phase - phaseIdx;
  const p0 = WORLD_PHASES[Math.min(phaseIdx, WORLD_PHASES.length - 1)];
  const p1 = WORLD_PHASES[Math.min(phaseIdx + 1, WORLD_PHASES.length - 1)];

  function lerpColor(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }
  const cTop = lerpColor(p0.top, p1.top, phaseFrac);
  const cMid = lerpColor(p0.mid, p1.mid, phaseFrac);
  const cBot = lerpColor(p0.bot, p1.bot, phaseFrac);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, `rgb(${cTop[0]},${cTop[1]},${cTop[2]})`);
  bgGrad.addColorStop(0.5, `rgb(${cMid[0]},${cMid[1]},${cMid[2]})`);
  bgGrad.addColorStop(1, `rgb(${cBot[0]},${cBot[1]},${cBot[2]})`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // === LAYER 2: Star field ===
  if (wave >= 3) {
    const starVisibility = Math.min(1, (wave - 2) / 4); // fade in over waves 3-6
    const now = Date.now();
    wt.stars.forEach(s => {
      const twinkle = 0.5 + 0.5 * Math.sin(now * 0.001 * s.twinkleSpeed + s.twinkleOffset);
      const alpha = s.brightness * twinkle * starVisibility;
      if (alpha < 0.05) return;
      const sx = s.x * W;
      // Parallax: stars drift downward slowly based on depth
      const drift = wave >= 10 ? ((now * 0.003 * s.depth * 0.3) % H) : 0;
      const sy = ((s.y * H) + drift) % H;
      ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
      ctx.fillRect(sx, sy, s.size, s.size);
    });

    // Shooting stars (wave 15+)
    wt.shootingStars.forEach(ss => {
      if (ss.life <= 0) return;
      const alpha = Math.min(1, ss.life * 3) * 0.6;
      ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.vx * 0.06, ss.y - ss.vy * 0.06);
      ctx.stroke();
    });
  }

  // === LAYER 4: Ambient background particles (wave 8+) ===
  if (wave >= 8) {
    wt.bgParticles.forEach(bp => {
      if (bp.life <= 0) return;
      const alpha = (bp.life / bp.maxLife) * bp.alpha;
      ctx.fillStyle = `rgba(${bp.r}, ${bp.g}, ${bp.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // === LAYER 3: Grid evolution ===
  const gridR = Math.round(p0.gridR + (p1.gridR - p0.gridR) * phaseFrac);
  const gridG = Math.round(p0.gridG + (p1.gridG - p0.gridG) * phaseFrac);
  const gridB = Math.round(p0.gridB + (p1.gridB - p0.gridB) * phaseFrac);
  const gridBrightness = wave >= 5 ? Math.min(1, 0.3 + (wave - 4) * 0.05) : 0.3;

  // Grid flicker (wave 17+): occasionally skip drawing a grid element
  const flickering = wt.gridFlicker > 0;

  // Vertical sector dividers
  ctx.lineWidth = 1;
  for (let i = 1; i < SECTOR_COUNT; i++) {
    if (flickering && Math.random() < 0.3) continue;

    // Energy glow on dividers (wave 13+)
    if (wave >= 13) {
      const glowAlpha = 0.08 + Math.sin(Date.now() * 0.002 + i) * 0.04;
      const glowGrad = ctx.createLinearGradient(sw * i - 15, 0, sw * i + 15, 0);
      glowGrad.addColorStop(0, `rgba(${gridR}, ${gridG}, ${gridB}, 0)`);
      glowGrad.addColorStop(0.5, `rgba(${gridR}, ${gridG}, ${gridB}, ${glowAlpha})`);
      glowGrad.addColorStop(1, `rgba(${gridR}, ${gridG}, ${gridB}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.fillRect(sw * i - 15, 0, 30, H);
    }

    ctx.strokeStyle = `rgba(${gridR}, ${gridG}, ${gridB}, ${gridBrightness})`;
    ctx.beginPath();
    ctx.setLineDash([4, 8]);
    ctx.moveTo(sw * i, 0);
    ctx.lineTo(sw * i, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Horizontal grid with pulse (wave 9+)
  for (let y = 0; y < H; y += 60) {
    if (flickering && Math.random() < 0.15) continue;
    let baseAlpha = 0.1 + Math.sin(y * 0.01) * 0.05;
    if (wave >= 9) {
      baseAlpha += Math.sin(wt.gridPulse + y * 0.005) * 0.04;
    }
    baseAlpha = Math.max(0, Math.min(0.25, baseAlpha));
    const hGridR = Math.round(gridR * 0.75);
    const hGridG = Math.round(gridG * 0.75);
    const hGridB = Math.round(gridB * 0.75);
    ctx.strokeStyle = `rgba(${hGridR}, ${hGridG}, ${hGridB}, ${baseAlpha})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // === LAYER 5: Milestone overlay effects ===
  if (wt.milestone.active && wt.milestone.timer > 0) {
    const ms = wt.milestone;
    const progress = ms.timer / ms.duration;
    if (ms.type === 'shimmer') {
      // Wave 5: subtle screen-wide shimmer
      const shimmerAlpha = Math.sin(progress * Math.PI) * 0.08;
      ctx.fillStyle = `rgba(150, 180, 255, ${shimmerAlpha})`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    } else if (ms.type === 'deep_pulse') {
      // Wave 10: background briefly brightens
      const pulseAlpha = Math.sin(progress * Math.PI) * 0.12;
      ctx.fillStyle = `rgba(100, 60, 150, ${pulseAlpha})`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    } else if (ms.type === 'grid_surge') {
      // Wave 20: grid power surge flash
      const surgeAlpha = progress > 0.7 ? 0 : Math.sin((1 - progress) * Math.PI * 2) * 0.15;
      ctx.fillStyle = `rgba(${gridR * 3}, ${gridG * 3}, ${gridB * 3}, ${surgeAlpha})`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }
  }

  // Parry zones for destroyed cannons
  sectors.forEach((s, i) => {
    if (!s.alive) {
      const zoneTop = cannonY - H * PARRY_ZONE_HEIGHT_FACTOR;
      const isFrozenLane = laneFreeze.active && laneFreeze.lane === i;

      // Brighter zone during tutorial freeze
      const zoneAlpha = isFrozenLane ? 0.2 : 0.06;
      const grad = ctx.createLinearGradient(0, zoneTop, 0, cannonY + 20);
      grad.addColorStop(0, 'rgba(68, 170, 255, 0)');
      grad.addColorStop(0.5, `rgba(68, 170, 255, ${zoneAlpha})`);
      grad.addColorStop(1, `rgba(68, 170, 255, ${zoneAlpha * 2})`);
      ctx.fillStyle = grad;
      ctx.fillRect(sw * i, zoneTop, sw, cannonY + 20 - zoneTop);

      // Parry zone border - pulses during freeze
      const borderAlpha = isFrozenLane ?
        0.5 + Math.sin(Date.now() * 0.01) * 0.3 : 0.3;
      ctx.strokeStyle = `rgba(68, 170, 255, ${borderAlpha})`;
      ctx.lineWidth = isFrozenLane ? 2 : 1;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(sw * i + 2, zoneTop, sw - 4, cannonY + 20 - zoneTop);
      ctx.setLineDash([]);

      if (isFrozenLane) {
        // TUTORIAL: Big pulsing prompt with arrow
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
        const promptY = cannonY - H * PARRY_ZONE_HEIGHT_FACTOR * 0.5;

        // Glowing backdrop behind text
        const textGlow = ctx.createRadialGradient(
          getSectorX(i), promptY, 0,
          getSectorX(i), promptY, sw * 0.4
        );
        textGlow.addColorStop(0, `rgba(68, 170, 255, ${pulse * 0.15})`);
        textGlow.addColorStop(1, 'rgba(68, 170, 255, 0)');
        ctx.fillStyle = textGlow;
        ctx.fillRect(sw * i, promptY - 40, sw, 80);

        // Pointing arrow bouncing down
        const arrowBounce = Math.sin(Date.now() * 0.006) * 6;
        ctx.fillStyle = `rgba(68, 220, 255, ${pulse})`;
        ctx.font = `bold 18px "Orbitron", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('▼', getSectorX(i), cannonY - 40 + arrowBounce);

        // TAP HERE text
        ctx.fillStyle = `rgba(68, 220, 255, ${pulse})`;
        ctx.font = `bold 12px "Orbitron", sans-serif`;
        ctx.fillText('TAP', getSectorX(i), cannonY - 55);
        ctx.fillText('HERE', getSectorX(i), cannonY - 65);

        // Countdown ring/bar showing freeze time remaining
        const freezeProgress = laneFreeze.timer / laneFreeze.maxTime;
        const barW = sw * 0.6;
        const barX = getSectorX(i) - barW / 2;
        const barY = cannonY + 22;
        ctx.fillStyle = 'rgba(30, 30, 60, 0.6)';
        ctx.fillRect(barX, barY, barW, 3);
        ctx.fillStyle = `rgba(68, 170, 255, ${0.5 + pulse * 0.3})`;
        ctx.fillRect(barX, barY, barW * freezeProgress, 3);

      } else {
        // Normal TAP TO PARRY text
        ctx.fillStyle = 'rgba(68, 170, 255, 0.5)';
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TAP TO', getSectorX(i), cannonY - 20);
        ctx.fillText('PARRY', getSectorX(i), cannonY - 8);
      }
    }

    // Shield flash
    if (s.shieldFlash > 0) {
      ctx.fillStyle = `rgba(68, 170, 255, ${s.shieldFlash * 0.3})`;
      ctx.fillRect(sw * i, 0, sw, H);
    }

    // Rebuild flash
    if (s.rebuildFlash > 0) {
      ctx.fillStyle = `rgba(68, 255, 170, ${s.rebuildFlash * 0.15})`;
      ctx.fillRect(sw * i, 0, sw, H);
    }
  });

  // Enemies
  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.save();
    ctx.translate(e.x, e.y);

    const eType = e.type;
    const isFrozen = false;

    // Glow — per-type color
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, e.width * 0.8);
    if (eType === 'weaver') {
      glow.addColorStop(0, 'rgba(180, 80, 220, 0.2)');
      glow.addColorStop(1, 'rgba(180, 80, 220, 0)');
    } else if (eType === 'sprinter') {
      glow.addColorStop(0, 'rgba(50, 220, 170, 0.2)');
      glow.addColorStop(1, 'rgba(50, 220, 170, 0)');
    } else if (eType === 'splitter' || eType === 'fragment') {
      glow.addColorStop(0, 'rgba(220, 170, 50, 0.2)');
      glow.addColorStop(1, 'rgba(220, 170, 50, 0)');
    } else if (eType === 'shielded') {
      glow.addColorStop(0, e.shielded ? 'rgba(68, 136, 221, 0.25)' : 'rgba(255, 60, 60, 0.15)');
      glow.addColorStop(1, e.shielded ? 'rgba(68, 136, 221, 0)' : 'rgba(255, 60, 60, 0)');
    } else if (eType === 'switcher') {
      glow.addColorStop(0, 'rgba(221, 68, 170, 0.2)');
      glow.addColorStop(1, 'rgba(221, 68, 170, 0)');
    } else if (isFrozen) {
      glow.addColorStop(0, 'rgba(100, 180, 255, 0.25)');
      glow.addColorStop(1, 'rgba(100, 180, 255, 0)');
    } else {
      glow.addColorStop(0, 'rgba(255, 60, 60, 0.15)');
      glow.addColorStop(1, 'rgba(255, 60, 60, 0)');
    }
    ctx.fillStyle = glow;
    ctx.fillRect(-e.width, -e.width, e.width * 2, e.width * 2);

    // Ship body color
    let shipColor;
    if (e.hitFlash > 0) {
      shipColor = '#fff';
    } else if (eType === 'weaver') {
      shipColor = '#aa44cc';
    } else if (eType === 'sprinter') {
      shipColor = '#33ddaa';
    } else if (eType === 'splitter') {
      shipColor = '#ddaa33';
    } else if (eType === 'fragment') {
      shipColor = '#bb8822';
    } else if (eType === 'shielded') {
      shipColor = '#cc3333'; // body is standard red
    } else if (eType === 'switcher') {
      shipColor = '#dd44aa';
    } else if (isFrozen) {
      shipColor = e.maxHp > 1 ? '#6688bb' : '#5577aa';
    } else {
      shipColor = e.maxHp > 1 ? '#ff6644' : '#cc3333';
    }
    ctx.fillStyle = shipColor;

    // --- Shape rendering per type ---

    if (eType === 'weaver') {
      // Weaver shape: sinuous, swept-back wings
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2);
      ctx.quadraticCurveTo(-e.width * 0.3, -e.height * 0.1, -e.width / 2, e.height * 0.3);
      ctx.lineTo(-e.width * 0.3, e.height * 0.15);
      ctx.lineTo(0, e.height / 2);
      ctx.lineTo(e.width * 0.3, e.height * 0.15);
      ctx.lineTo(e.width / 2, e.height * 0.3);
      ctx.quadraticCurveTo(e.width * 0.3, -e.height * 0.1, 0, -e.height / 2);
      ctx.closePath();
      ctx.fill();
      // Weaver detail — glowing core
      ctx.fillStyle = e.hitFlash > 0 ? '#fff' : '#cc77ee';
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 3);
      ctx.lineTo(-e.width / 5, e.height / 6);
      ctx.lineTo(e.width / 5, e.height / 6);
      ctx.closePath();
      ctx.fill();

    } else if (eType === 'sprinter') {
      // Sprinter shape: elongated narrow dart
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2); // sharp nose
      ctx.lineTo(-e.width / 2, e.height * 0.35); // left fin
      ctx.lineTo(-e.width * 0.15, e.height * 0.15); // body inset
      ctx.lineTo(-e.width * 0.2, e.height / 2); // left tail
      ctx.lineTo(0, e.height * 0.35); // tail center
      ctx.lineTo(e.width * 0.2, e.height / 2); // right tail
      ctx.lineTo(e.width * 0.15, e.height * 0.15); // body inset
      ctx.lineTo(e.width / 2, e.height * 0.35); // right fin
      ctx.closePath();
      ctx.fill();
      // Sprinter detail — speed stripe
      ctx.fillStyle = e.hitFlash > 0 ? '#fff' : '#66ffcc';
      ctx.beginPath();
      ctx.moveTo(0, -e.height * 0.35);
      ctx.lineTo(-e.width * 0.08, e.height * 0.2);
      ctx.lineTo(e.width * 0.08, e.height * 0.2);
      ctx.closePath();
      ctx.fill();

    } else if (eType === 'splitter') {
      // Splitter shape: diamond/rhombus
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2); // top
      ctx.lineTo(-e.width / 2, 0); // left
      ctx.lineTo(0, e.height / 2); // bottom
      ctx.lineTo(e.width / 2, 0); // right
      ctx.closePath();
      ctx.fill();
      // Split line down the center
      ctx.strokeStyle = e.hitFlash > 0 ? '#fff' : '#eedd66';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, -e.height * 0.35);
      ctx.lineTo(0, e.height * 0.35);
      ctx.stroke();
      ctx.setLineDash([]);

    } else if (eType === 'fragment') {
      // Fragment shape: half-diamond (smaller)
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2);
      ctx.lineTo(-e.width / 2, 0);
      ctx.lineTo(0, e.height / 2);
      ctx.lineTo(e.width * 0.3, 0);
      ctx.closePath();
      ctx.fill();

    } else if (eType === 'switcher') {
      // Switcher shape: asymmetric chevron
      const switchDir = e.switchLane > e.originLane ? 1 : -1;
      const longWing = e.switched ? 0.5 : 0.6;
      const shortWing = e.switched ? 0.5 : 0.35;
      const leftWing = switchDir < 0 ? longWing : shortWing;
      const rightWing = switchDir > 0 ? longWing : shortWing;
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2);
      ctx.lineTo(-e.width * leftWing, e.height / 2);
      ctx.lineTo(-e.width / 4, e.height / 3);
      ctx.lineTo(0, e.height / 2);
      ctx.lineTo(e.width / 4, e.height / 3);
      ctx.lineTo(e.width * rightWing, e.height / 2);
      ctx.closePath();
      ctx.fill();
      // Switcher detail
      ctx.fillStyle = e.hitFlash > 0 ? '#fff' : '#ee77cc';
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 3);
      ctx.lineTo(-e.width / 5, e.height / 5);
      ctx.lineTo(e.width / 5, e.height / 5);
      ctx.closePath();
      ctx.fill();

      // Telegraph dotted line (before switch starts)
      if (!e.switched && e.switchProgress === 0 && e.y > dims.h * 0.15 && e.y < dims.h * 0.35) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#dd44aa';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        const targetX = getSectorX(e.switchLane) - e.x;
        ctx.beginPath();
        ctx.moveTo(0, e.height);
        ctx.lineTo(targetX, e.height + (e.switchY - e.y));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

    } else {
      // Standard / heavy / shielded body shape
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 2);
      ctx.lineTo(-e.width / 2, e.height / 2);
      ctx.lineTo(-e.width / 4, e.height / 3);
      ctx.lineTo(0, e.height / 2);
      ctx.lineTo(e.width / 4, e.height / 3);
      ctx.lineTo(e.width / 2, e.height / 2);
      ctx.closePath();
      ctx.fill();
      // Ship detail
      ctx.fillStyle = e.hitFlash > 0 ? '#fff' : (isFrozen ? '#7799cc' : '#ff8866');
      ctx.beginPath();
      ctx.moveTo(0, -e.height / 3);
      ctx.lineTo(-e.width / 5, e.height / 5);
      ctx.lineTo(e.width / 5, e.height / 5);
      ctx.closePath();
      ctx.fill();
    }

    // Shield overlay for shielded enemies
    if (eType === 'shielded' && e.shielded) {
      const shimmer = 0.6 + Math.sin(Date.now() * 0.008) * 0.15;
      ctx.globalAlpha = shimmer;
      ctx.fillStyle = '#4488dd';
      ctx.strokeStyle = '#66aaff';
      ctx.lineWidth = 1.5;
      // Hexagonal shield
      ctx.beginPath();
      const shR = e.width * 0.45;
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        const px = Math.cos(a) * shR;
        const py = Math.sin(a) * shR - e.height * 0.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // HP bar for multi-hp enemies
    if (e.maxHp > 1) {
      const barW = e.width * 0.6;
      const barH = 3;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barW/2, -e.height/2 - 8, barW, barH);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(-barW/2, -e.height/2 - 8, barW * (e.hp / e.maxHp), barH);
    }

    ctx.restore();
  });

  // Shockwaves
  shockwaves.forEach(sw => {
    if (!sw.alive) return;
    const swX = sw.x;
    const swY = sw.y;
    const halfW = sw.width / 2;
    const halfH = sw.height / 2;

    ctx.save();
    ctx.globalAlpha = sw.alpha;

    // Outer glow
    const outerGlow = ctx.createRadialGradient(swX, swY, 0, swX, swY, halfW * 1.2);
    outerGlow.addColorStop(0, 'rgba(68, 255, 221, 0.25)');
    outerGlow.addColorStop(0.5, 'rgba(68, 170, 255, 0.12)');
    outerGlow.addColorStop(1, 'rgba(68, 170, 255, 0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(swX - halfW * 1.3, swY - halfH * 2.5, sw.width * 1.3, sw.height * 2.5);

    // Main shockwave bar - energy band
    const mainGrad = ctx.createLinearGradient(swX - halfW, swY, swX + halfW, swY);
    mainGrad.addColorStop(0, 'rgba(68, 170, 255, 0)');
    mainGrad.addColorStop(0.15, 'rgba(68, 220, 255, 0.6)');
    mainGrad.addColorStop(0.3, 'rgba(68, 255, 221, 0.9)');
    mainGrad.addColorStop(0.5, 'rgba(150, 255, 240, 1)');
    mainGrad.addColorStop(0.7, 'rgba(68, 255, 221, 0.9)');
    mainGrad.addColorStop(0.85, 'rgba(68, 220, 255, 0.6)');
    mainGrad.addColorStop(1, 'rgba(68, 170, 255, 0)');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(swX - halfW, swY - 4, sw.width, 8);

    // Bright center core
    const coreGrad = ctx.createLinearGradient(swX - halfW * 0.6, swY, swX + halfW * 0.6, swY);
    coreGrad.addColorStop(0, 'rgba(200, 255, 250, 0)');
    coreGrad.addColorStop(0.3, 'rgba(200, 255, 250, 0.8)');
    coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    coreGrad.addColorStop(0.7, 'rgba(200, 255, 250, 0.8)');
    coreGrad.addColorStop(1, 'rgba(200, 255, 250, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(swX - halfW * 0.6, swY - 2, sw.width * 0.6, 4);

    // Leading edge arc (the front of the wave)
    ctx.strokeStyle = `rgba(150, 255, 240, ${sw.alpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(swX, swY - halfH * 0.3, halfW * 0.7, halfH * 0.6, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Trailing energy wisps
    ctx.strokeStyle = `rgba(68, 170, 255, ${sw.alpha * 0.3})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const trailY = swY + 8 + i * 6;
      const trailW = halfW * (0.8 - i * 0.15);
      ctx.beginPath();
      ctx.moveTo(swX - trailW, trailY);
      ctx.quadraticCurveTo(swX, trailY + 3, swX + trailW, trailY);
      ctx.stroke();
    }

    ctx.restore();
  });

  // Destruction blasts
  destructionBlasts.forEach(db => {
    if (!db.alive) return;
    const dbX = db.x;
    const dbY = db.y;
    const halfW = db.width / 2;
    const halfH = db.height / 2;

    ctx.save();
    ctx.globalAlpha = db.alpha;

    // Outer fiery glow
    const outerGlow = ctx.createRadialGradient(dbX, dbY, 0, dbX, dbY, halfW * 1.2);
    outerGlow.addColorStop(0, 'rgba(255, 100, 50, 0.3)');
    outerGlow.addColorStop(0.5, 'rgba(255, 60, 30, 0.12)');
    outerGlow.addColorStop(1, 'rgba(255, 40, 20, 0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(dbX - halfW * 1.3, dbY - halfH * 2.5, db.width * 1.3, db.height * 2.5);

    // Main blast bar — fire band
    const mainGrad = ctx.createLinearGradient(dbX - halfW, dbY, dbX + halfW, dbY);
    mainGrad.addColorStop(0, 'rgba(255, 80, 30, 0)');
    mainGrad.addColorStop(0.15, 'rgba(255, 100, 40, 0.6)');
    mainGrad.addColorStop(0.3, 'rgba(255, 140, 50, 0.9)');
    mainGrad.addColorStop(0.5, 'rgba(255, 200, 100, 1)');
    mainGrad.addColorStop(0.7, 'rgba(255, 140, 50, 0.9)');
    mainGrad.addColorStop(0.85, 'rgba(255, 100, 40, 0.6)');
    mainGrad.addColorStop(1, 'rgba(255, 80, 30, 0)');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(dbX - halfW, dbY - 4, db.width, 8);

    // Bright core
    const coreGrad = ctx.createLinearGradient(dbX - halfW * 0.6, dbY, dbX + halfW * 0.6, dbY);
    coreGrad.addColorStop(0, 'rgba(255, 240, 200, 0)');
    coreGrad.addColorStop(0.3, 'rgba(255, 240, 200, 0.8)');
    coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    coreGrad.addColorStop(0.7, 'rgba(255, 240, 200, 0.8)');
    coreGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(dbX - halfW * 0.6, dbY - 2, db.width * 0.6, 4);

    // Leading edge arc
    ctx.strokeStyle = `rgba(255, 180, 80, ${db.alpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(dbX, dbY - halfH * 0.3, halfW * 0.6, halfH * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Trailing fire wisps
    ctx.strokeStyle = `rgba(255, 80, 30, ${db.alpha * 0.3})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const trailY = dbY + 8 + i * 6;
      const trailW = halfW * (0.7 - i * 0.15);
      ctx.beginPath();
      ctx.moveTo(dbX - trailW, trailY);
      ctx.quadraticCurveTo(dbX, trailY + 3, dbX + trailW, trailY);
      ctx.stroke();
    }

    ctx.restore();
  });

  // Bullets
  bullets.forEach(b => {
    if (!b.alive) return;
    ctx.fillStyle = '#ffcc44';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Cannons
  sectors.forEach((s, i) => {
    const cx = getSectorX(i);
    const cy = cannonY;

    if (s.disabled) {
      // Disabled cannon — dim silhouette with X overlay
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = 0.25;

      // Cannon base (dimmed)
      ctx.fillStyle = '#2a3a4a';
      ctx.fillRect(-18, 5, 36, 12);
      // Cannon barrel (dimmed)
      ctx.fillStyle = '#4a5a6a';
      ctx.fillRect(-6, -22, 12, 30);
      // Cannon detail
      ctx.fillStyle = '#5a7a8a';
      ctx.fillRect(-10, 0, 20, 6);
      // Cannon tip
      ctx.fillStyle = '#6a8a9a';
      ctx.fillRect(-8, -24, 16, 4);

      ctx.globalAlpha = 1;

      // Red X over the cannon
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.6)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, -18);
      ctx.lineTo(14, 14);
      ctx.moveTo(14, -18);
      ctx.lineTo(-14, 14);
      ctx.stroke();

      // "LOCKED" label
      ctx.fillStyle = 'rgba(255, 60, 60, 0.4)';
      ctx.font = '8px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED', 0, 28);

      ctx.restore();
    } else if (s.alive) {
      const recoilY = s.cannonRecoil > 0 ? s.cannonRecoil * 8 : 0;

      ctx.save();
      ctx.translate(cx, cy + recoilY);

      // Muzzle flash
      if (s.muzzleFlash > 0) {
        ctx.fillStyle = `rgba(255, 200, 100, ${s.muzzleFlash * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(0, -25, 8 + s.muzzleFlash * 5, 15 + s.muzzleFlash * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cannon base
      ctx.fillStyle = '#2a3a4a';
      ctx.fillRect(-18, 5, 36, 12);

      // Cannon barrel
      ctx.fillStyle = '#4a5a6a';
      ctx.fillRect(-6, -22, 12, 30);

      // Cannon detail
      ctx.fillStyle = '#5a7a8a';
      ctx.fillRect(-10, 0, 20, 6);

      // Cannon tip
      ctx.fillStyle = '#6a8a9a';
      ctx.fillRect(-8, -24, 16, 4);

      ctx.restore();

      // Ammo display
      const ammoY = cy + 28;
      const ammoW = Math.min(sw * 0.7, s.maxAmmo * 7);
      const dotW = ammoW / s.maxAmmo;
      const startX = cx - ammoW / 2;

      for (let a = 0; a < s.maxAmmo; a++) {
        const filled = a < s.ammo;
        ctx.fillStyle = filled ?
          (s.ammo <= 2 ? '#ff3333' : '#44aa66') :
          'rgba(60, 60, 80, 0.4)';
        ctx.fillRect(startX + a * dotW + 1, ammoY, dotW - 2, 4);
      }
    } else {
      // Destroyed cannon - rubble
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(cx - 15, cy + 2, 30, 10);
      ctx.fillStyle = '#222235';
      ctx.fillRect(cx - 8, cy - 5, 6, 10);
      ctx.fillRect(cx + 2, cy - 3, 8, 8);

      // Warning indicator
      const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 50, 50, ${0.3 + pulse * 0.4})`;
      ctx.font = 'bold 10px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', cx, cy + 30);
    }
  });

  // Tutorial: "TAP TO FIRE" hint on hintLane
  if (tutorial.active) {
    const hintX = getSectorX(tutorial.hintLane);
    const hintY = cannonY - 50;
    const pulse = Math.sin(Date.now() * 0.006) * 0.3 + 0.7;

    // Glow behind text
    const glow = ctx.createRadialGradient(hintX, hintY, 0, hintX, hintY, sw * 0.4);
    glow.addColorStop(0, `rgba(255, 204, 68, ${pulse * 0.12})`);
    glow.addColorStop(1, 'rgba(255, 204, 68, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sw * tutorial.hintLane, hintY - 35, sw, 70);

    // Bouncing arrow pointing down at cannon
    const arrowBounce = Math.sin(Date.now() * 0.008) * 5;
    ctx.fillStyle = `rgba(255, 204, 68, ${pulse})`;
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼', hintX, hintY + 20 + arrowBounce);

    // "TAP TO FIRE" text
    ctx.fillStyle = `rgba(255, 204, 68, ${pulse})`;
    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.fillText('TAP TO', hintX, hintY - 10);
    ctx.fillText('FIRE', hintX, hintY + 3);
  }

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Floating texts
  floatingTexts.forEach(ft => {
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = ft.big ?
      `bold ${20 * ft.scale}px "Orbitron", sans-serif` :
      `bold ${13 * ft.scale}px "Orbitron", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  });
  ctx.globalAlpha = 1;

  // HUD
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px "Orbitron", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(score, 12, 28);

  // Combo
  if (combo >= 3) {
    const comboAlpha = Math.min(1, 0.5 + Math.sin(Date.now() * 0.01) * 0.5);
    ctx.fillStyle = `rgba(255, 204, 0, ${comboAlpha})`;
    ctx.font = 'bold 11px "Orbitron", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${combo}x COMBO`, W - 12, 28);
  }

  // Wave
  ctx.fillStyle = '#667';
  ctx.font = '10px "Share Tech Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(wave === 0 ? 'TUTORIAL' : `WAVE ${wave}`, 12, 46);

  // Flash effect
  if (flashEffect.active && flashEffect.alpha > 0) {
    ctx.fillStyle = flashEffect.color;
    ctx.globalAlpha = flashEffect.alpha;
    ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
