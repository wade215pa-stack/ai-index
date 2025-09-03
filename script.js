/* script.js — Jarvay Diamond Protocol 2.2 Interactive Start Screen
   - Matrix-style rain (4D vibe)
   - Falling red JDP diamonds
   - Clickable START button triggers intro → main → outro sequence
   - Audio stack: retro (intro/outro), glitch rain (loop), AI hum (loop)
*/

/* ========= DOM & CONFIG ========= */
const $ = (q) => document.querySelector(q);

const canvas = $('#matrix');
const ctx = canvas.getContext('2d');

const ghost = $('#bg-ghost');
const diamondImg = $('#diamond'); // used as sprite source too
const startBtn = $('#startBtn');

const retro = $('#retro-cue');   // non-looping, used for intro/outro
const ambRain = $('#amb-rain');  // looping
const ambHum  = $('#amb-hum');   // looping

const cfgEl = $('#config');
const DUR_INTRO = parseFloat(cfgEl.dataset.introSeconds || '3');
const DUR_MAIN  = parseFloat(cfgEl.dataset.mainSeconds  || '9');
const DUR_OUTRO = parseFloat(cfgEl.dataset.outroSeconds || '3');
const MASTER_VOL = parseFloat(cfgEl.dataset.masterVolume || '0.85');

/* ========= CANVAS SETUP ========= */
let W = 0, H = 0, deviceRatio = 1;
function resize() {
  deviceRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = canvas.width  = Math.floor(window.innerWidth  * deviceRatio);
  H = canvas.height = Math.floor(window.innerHeight * deviceRatio);
  canvas.style.width  = '100%';
  canvas.style.height = '100%';

  // Recreate columns for matrix rain
  makeColumns();
}
window.addEventListener('resize', resize);
resize();

/* ========= MATRIX RAIN ========= */
const glyphs = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let columns = [];
let colWidth = 14 * deviceRatio;
let fontSize = 16 * deviceRatio;

function makeColumns() {
  fontSize = Math.max(12, Math.floor((window.innerWidth < 500 ? 14 : 16) * deviceRatio));
  colWidth = Math.floor(fontSize * 0.85);
  const cols = Math.ceil(W / colWidth);
  columns = new Array(cols).fill(0).map(() => ({
    y: Math.floor(Math.random() * H),
    speed: (Math.random() * 2 + 2) * deviceRatio,  // base speed
  }));
}

/* ========= DIAMOND RAIN ========= */
const diamonds = [];
function spawnDiamond(force = false) {
  // Chance scales with intensity; during main we spawn more.
  const chance = (state === 'main' ? 0.35 : state === 'intro' ? 0.25 : 0.1);
  if (!force && Math.random() > chance) return;
  const size = (Math.random() * 28 + 18) * deviceRatio;
  diamonds.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size, h: size,
    vy: (Math.random() * 1.5 + 2.2) * deviceRatio,
    alpha: 0.9,
  });
}

function updateDiamonds() {
  for (let i = diamonds.length - 1; i >= 0; i--) {
    const d = diamonds[i];
    d.y += d.vy;
    d.alpha -= 0.0015;
    if (d.y > H + d.h || d.alpha <= 0) {
      diamonds.splice(i, 1);
    }
  }
}

function drawDiamonds() {
  if (!diamondImg.complete) return;
  for (const d of diamonds) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.alpha);
    ctx.drawImage(diamondImg, d.x, d.y, d.w, d.h);
    ctx.restore();
  }
}

/* ========= STATE MACHINE ========= */
let state = 'idle'; // 'idle' | 'intro' | 'main' | 'outro'
let tStateStart = performance.now();

// Intensity scale applied to rain speed & density
function intensityForState() {
  switch (state) {
    case 'idle':  return 0.5;
    case 'intro': return 0.9;
    case 'main':  return 1.0;
    case 'outro': return 0.7;
    default: return 0.6;
  }
}

/* ========= AUDIO HELPERS ========= */
function safePlay(a) {
  if (!a) return;
  a.volume = 0;
  const p = a.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {/* ignore autoplay errors; requires user gesture */});
  }
}

function fadeTo(a, target, ms = 800) {
  if (!a) return;
  target = Math.max(0, Math.min(1, target)) * MASTER_VOL;
  const start = a.volume || 0;
  const diff = target - start;
  const startTime = performance.now();
  function step(now) {
    const k = Math.min(1, (now - startTime) / ms);
    a.volume = start + diff * k;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function stopAndReset(a) {
  if (!a) return;
  a.pause();
  a.currentTime = 0;
}

/* ========= RENDER LOOP ========= */
function drawMatrix(bgAlpha = 0.08) {
  // Fade the whole canvas slightly for trail effect
  ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#00ff99';
  ctx.textAlign = 'center';
  ctx.font = `${fontSize}px monospace`;

  const intensity = intensityForState();
  const speedBoost = 0.5 + intensity; // boost for active states
  const spawnEvery = state === 'main' ? 2 : state === 'intro' ? 3 : 4; // frames per spawn

  for (let i = 0; i < columns.length; i++) {
    const colX = i * colWidth + colWidth / 2;
    const column = columns[i];
    const char = glyphs[Math.floor(Math.random() * glyphs.length)];
    ctx.fillText(char, colX, column.y);

    column.y += column.speed * speedBoost;

    if (column.y > H + fontSize * 2) {
      column.y = -Math.random() * 300;
      column.speed = (Math.random() * 2 + 2) * deviceRatio;
    }

    // Occasionally spawn a diamond in this column
    if (frameCount % spawnEvery === 0 && Math.random() < (0.01 + 0.03 * intensity)) {
      spawnDiamond();
    }
  }
}

let frameCount = 0;
function loop() {
  frameCount++;
  const bgAlpha =
    state === 'main' ? 0.06 :
    state === 'intro' ? 0.07 :
    state === 'outro' ? 0.08 : 0.1;

  drawMatrix(bgAlpha);
  updateDiamonds();
  drawDiamonds();

  // handle state duration transitions
  const now = performance.now();
  const elapsed = (now - tStateStart) / 1000;

  if (state === 'intro' && elapsed >= DUR_INTRO) {
    gotoMain();
  } else if (state === 'main' && elapsed >= DUR_MAIN) {
    gotoOutro();
  } else if (state === 'outro' && elapsed >= DUR_OUTRO) {
    gotoIdle();
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ========= STATE TRANSITIONS ========= */
function gotoIntro() {
  state = 'intro';
  tStateStart = performance.now();
  startBtn.dataset.state = 'running';

  // AUDIO
  // Start amb loops quietly
  safePlay(ambRain);
  safePlay(ambHum);
  fadeTo(ambRain, 0.35, 1200);
  fadeTo(ambHum,  0.28, 1500);

  // Retro intro (fade in quickly)
  stopAndReset(retro);
  retro.loop = false;
  safePlay(retro);
  fadeTo(retro, 0.65, 900);

  // Visual pop: briefly scale the center diamond
  diamondImg.style.transition = 'transform 350ms ease, filter 350ms ease';
  diamondImg.style.transform = 'scale(1.18)';
  diamondImg.style.filter = 'drop-shadow(0 0 28px red)';
  setTimeout(() => {
    diamondImg.style.transform = '';
    diamondImg.style.filter = '';
  }, 420);
}

function gotoMain() {
  state = 'main';
  tStateStart = performance.now();

  // Keep ambients, ride them slightly higher
  fadeTo(ambRain, 0.48, 1000);
  fadeTo(ambHum,  0.38, 1000);

  // Ensure retro is low or off during main (we want clean loop)
  fadeTo(retro, 0.0, 600);
}

function gotoOutro() {
  state = 'outro';
  tStateStart = performance.now();

  // Trigger retro again for the cinematic exit tail
  stopAndReset(retro);
  retro.loop = false;
  safePlay(retro);
  fadeTo(retro, 0.6, 800);

  // Gently lower ambients so the exit is noticeable
  fadeTo(ambRain, 0.28, 1200);
  fadeTo(ambHum,  0.22, 1200);

  // Subtle pulse on the diamond
  diamondImg.style.transition = 'transform 600ms ease';
  diamondImg.style.transform = 'scale(1.06)';
  setTimeout(() => { diamondImg.style.transform = ''; }, 700);
}

function gotoIdle() {
  state = 'idle';
  tStateStart = performance.now();
  startBtn.dataset.state = 'idle';

  // Ambients remain playing but lower for idle loop
  fadeTo(ambRain, 0.18, 900);
  fadeTo(ambHum,  0.14, 900);

  // Kill retro so it doesn't stack
  fadeTo(retro, 0.0, 400);
  setTimeout(() => stopAndReset(retro), 500);

  // Lightly clear out excess diamonds
  while (diamonds.length > 64) diamonds.shift();
}

/* ========= START BUTTON ========= */
function kickOff() {
  // On first user gesture, we can safely start audio on iOS/desktop
  if (state === 'idle') {
    gotoIntro();
  } else {
    // If pressed mid-sequence, restart from intro for a clean experience
    gotoIntro();
  }
  // Haptic (if supported)
  try {
    if (window.navigator.vibrate) window.navigator.vibrate(8);
  } catch (_) {}
}

startBtn.addEventListener('click', kickOff);

/* ========= ACCESSIBILITY & READY ========= */
// Ensure assets decode for smoother first frame
if ('decode' in diamondImg) {
  diamondImg.decode().catch(()=>{});
}
if ('decode' in ghost) {
  ghost.decode().catch(()=>{});
}

// Start in idle ambience muted until user presses START
stopAndReset(ambRain);
stopAndReset(ambHum);
stopAndReset(retro);

/* ========= OPTIONAL: FALLBACK KEYBOARD START ========= */
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'enter' || e.key.toLowerCase() === ' ') {
    kickOff();
  }
});
