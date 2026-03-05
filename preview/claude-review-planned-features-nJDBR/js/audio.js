// ============ AUDIO ENGINE (Web Audio API) ============
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;
  }

  play(type) {
    if (!this.initialized) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch(type) {
      case 'shoot': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noise = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.type = 'square';
        noise.frequency.setValueAtTime(80, now);
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain).connect(ctx.destination);
        noise.connect(noiseGain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.15);
        noise.start(now); noise.stop(now + 0.08);
        break;
      }
      case 'hit': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(120, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain2.gain.setValueAtTime(0.25, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc2.connect(gain2).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.2);
        osc2.start(now); osc2.stop(now + 0.3);
        break;
      }
      case 'parry': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.1);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.4);
        // shield clang
        const clang = ctx.createOscillator();
        const cGain = ctx.createGain();
        clang.type = 'square';
        clang.frequency.setValueAtTime(1200, now);
        clang.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        cGain.gain.setValueAtTime(0.2, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        clang.connect(cGain).connect(ctx.destination);
        clang.start(now); clang.stop(now + 0.15);
        break;
      }
      case 'destroy': {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150 - i * 30, now + i * 0.1);
          osc.frequency.exponentialRampToValueAtTime(20, now + i * 0.1 + 0.3);
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.3);
        }
        break;
      }
      case 'rebuild': {
        [400, 500, 600, 800].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          gain.gain.setValueAtTime(0.2, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.15);
        });
        break;
      }
      case 'empty': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.1);
        break;
      }
      case 'destruction_blast': {
        // Rising fiery whoosh — accompanies cannon explosion blast
        const rumble = ctx.createOscillator();
        const rumbleGain = ctx.createGain();
        rumble.type = 'sawtooth';
        rumble.frequency.setValueAtTime(60, now);
        rumble.frequency.exponentialRampToValueAtTime(180, now + 0.35);
        rumbleGain.gain.setValueAtTime(0.25, now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        rumble.connect(rumbleGain).connect(ctx.destination);
        rumble.start(now); rumble.stop(now + 0.4);
        const crackle2 = ctx.createOscillator();
        const crackle2Gain = ctx.createGain();
        crackle2.type = 'square';
        crackle2.frequency.setValueAtTime(80, now);
        crackle2.frequency.exponentialRampToValueAtTime(250, now + 0.3);
        crackle2Gain.gain.setValueAtTime(0.08, now);
        crackle2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        crackle2.connect(crackle2Gain).connect(ctx.destination);
        crackle2.start(now); crackle2.stop(now + 0.35);
        break;
      }
      case 'gameover': {
        [200, 150, 100, 60].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + i * 0.2);
          osc.frequency.exponentialRampToValueAtTime(f * 0.5, now + i * 0.2 + 0.3);
          gain.gain.setValueAtTime(0.3, now + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.4);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.2); osc.stop(now + i * 0.2 + 0.4);
        });
        break;
      }
      case 'combo': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.2);
        break;
      }
      case 'shockwave': {
        // Deep bass sweep rising in pitch
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(40, now);
        bass.frequency.exponentialRampToValueAtTime(200, now + 0.6);
        bassGain.gain.setValueAtTime(0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        bass.connect(bassGain).connect(ctx.destination);
        bass.start(now); bass.stop(now + 0.8);
        // Layered whoosh
        const whoosh = ctx.createOscillator();
        const whooshGain = ctx.createGain();
        whoosh.type = 'sawtooth';
        whoosh.frequency.setValueAtTime(80, now);
        whoosh.frequency.exponentialRampToValueAtTime(400, now + 0.5);
        whooshGain.gain.setValueAtTime(0.15, now);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        whoosh.connect(whooshGain).connect(ctx.destination);
        whoosh.start(now); whoosh.stop(now + 0.6);
        // Crackle texture
        const crackle = ctx.createOscillator();
        const crackleGain = ctx.createGain();
        crackle.type = 'square';
        crackle.frequency.setValueAtTime(60, now + 0.05);
        crackle.frequency.exponentialRampToValueAtTime(300, now + 0.4);
        crackleGain.gain.setValueAtTime(0.08, now + 0.05);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        crackle.connect(crackleGain).connect(ctx.destination);
        crackle.start(now + 0.05); crackle.stop(now + 0.5);
        break;
      }
      case 'hit_weak': {
        // First hit on a multi-HP enemy — lighter than the kill sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.13);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.13);
        break;
      }
      case 'shockwave_hit': {
        // Individual enemy popping in the shockwave cascade
        const pop = ctx.createOscillator();
        const popGain = ctx.createGain();
        pop.type = 'sine';
        pop.frequency.setValueAtTime(500 + Math.random() * 400, now);
        pop.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        popGain.gain.setValueAtTime(0.2, now);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        pop.connect(popGain).connect(ctx.destination);
        pop.start(now); pop.stop(now + 0.15);
        break;
      }
      case 'shield_break': {
        // Metallic ping + glass shatter when shield breaks
        const ping = ctx.createOscillator();
        const pingGain = ctx.createGain();
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(1000, now);
        ping.frequency.exponentialRampToValueAtTime(400, now + 0.18);
        pingGain.gain.setValueAtTime(0.3, now);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        ping.connect(pingGain).connect(ctx.destination);
        ping.start(now); ping.stop(now + 0.18);
        // Glass shatter texture
        const shatter = ctx.createOscillator();
        const shatterGain = ctx.createGain();
        shatter.type = 'square';
        shatter.frequency.setValueAtTime(1500, now);
        shatter.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        shatterGain.gain.setValueAtTime(0.08, now);
        shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        shatter.connect(shatterGain).connect(ctx.destination);
        shatter.start(now); shatter.stop(now + 0.08);
        break;
      }
    }
  }
}

const audio = new AudioEngine();
