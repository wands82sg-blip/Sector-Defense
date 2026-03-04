// ============ CONFIG & LAYOUT ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('gameContainer');

// Constants
const SECTOR_COUNT = 4;
const INITIAL_AMMO = 5;
const MAX_AMMO_CAP = 8;
const BULLET_SPEED_FACTOR = 0.9; // relative to height per second
const PARRY_WINDOW = 0.6; // seconds
const PARRY_ZONE_HEIGHT_FACTOR = 0.18;

// Sizing for 19.5:9 aspect ratio
function resize() {
  const ratio = 19.5 / 9;
  let w = window.innerWidth;
  let h = window.innerHeight;

  if (h / w > ratio) {
    h = w * ratio;
  } else {
    w = h / ratio;
  }

  container.style.width = Math.floor(w) + 'px';
  container.style.height = Math.floor(h) + 'px';

  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * scale);
  canvas.height = Math.floor(h * scale);
  ctx.scale(scale, scale);

  return { w: Math.floor(w), h: Math.floor(h) };
}

let dims = resize();
window.addEventListener('resize', () => { dims = resize(); });

// Layout helpers
function getSectorX(i) {
  const sw = dims.w / SECTOR_COUNT;
  return sw * i + sw / 2;
}

function getSectorWidth() {
  return dims.w / SECTOR_COUNT;
}

function getCannonY() {
  return dims.h * 0.88;
}
