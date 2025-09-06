/* script.js — Jarvay Diamond Protocol 2.2 (JDP diamond rain build)
   - Replaces Matrix glyphs with falling JDP diamond logos (transparent PNG)
   - Central diamond pulses; trench-coat figure is in the HTML as a ghost image
   - States: idle → intro → main → outro → idle
   - Audio: hum (loop), glitch rain (loop), retro cue (intro/outro), intro/outro VO, click SFX
*/

const $ = (q) => document.querySelector(q);

/* ===== DOM ===== */
const canvas = $('#matrix');
const ctx = canvas.getContext('2d');

const ghost = $('#bg-ghost');      // background silhouette (from index.html)
const centerDiamond = $('#diamond'); // center emblem image (same PNG file OK)
const startBtn = $('#startBtn');

/* ===== Audio from index.html ===== */
const retro  = $('#retro-cue');  // non-looping cue (intro & outro)
const ambRain = $('#amb-rain');  // loop ambience
const ambHum  = $('#amb-hum');   // loop ambience

// Extra audio (loaded here; no HTML changes needed)
const clickSfx = new Audio('assets/click_start.mp3');
const introVO  = new Audio('assets/intro_voice.mp3');
const outroVO  = new Audio('assets/outro_voice.mp3');
[clickSfx, introVO, outroVO].forEach(a => { a.preload = 'auto'; });

/* ===== Config (from HTML data-attrs) ===== */
const cfgEl = $('#config');
const DUR_INTRO = parseFloat(cfgEl?.dataset.introSeconds || '3');
const DUR_MAIN  = parseFloat(cfgEl?.dataset.mainSeconds  || '9');
const DUR_OUTRO = parseFloat(cfgEl?.dataset.outroSeconds || '3');
const MASTER_VOL = parseFloat(cfgEl?.dataset.masterVolume || '0.85');

/* ===== Canvas & DPI ===== */
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = canvas.width  = Math.floor(window.innerWidth  * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width  = '100%';
  canvas.style.height = '100%';
}
window.addEventListener('resize', resize);
resize();

/* ===== JDP Diamond rain (replaces Matrix glyphs) ===== */
const diamondSprite = new Image();
diamondSprite.src = 'assets/jdp-diamond.png'; // transparent background required

const diamonds = [];
function spawnDiamond(force = false) {
  // spawn probability by state
  const base =
    state === 'main'  ? 0.45 :
    state === 'intro' ? 0.30 :
    state === 'outro' ? 0.22 : 0.14;

  if (!force && Math.random() > base) return;

  const size = (Math.random() * 44 + 28) * DPR; // 28–72px at DPR=1
  diamonds.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    vy: (Math.random() * 1.6 + 2.4) * DPR,
    alpha: 0.95,
    rot: (Math.random() * 0.04 - 0.02), // gentle rotation
    r: 0
  });
}

function updateDiamonds() {
  for (let i = diamonds.length - 1; i >= 0; i--) {
    const d = diamonds[i];
    d.y += d.vy;
    d.r += d.rot;
    d.alpha -= 0.0016;
    if (d.y > H + d.h || d.alpha <= 0) {
      diamonds.splice(i, 1);
    }
  }
}

function drawDiamonds() {
  if (!diamondSprite.complete) return;
  for (const d of diamonds) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, d.alpha);
    ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
    ctx.rotate(d.r);
    ctx.drawImage(diamondSprite, -d.w / 2, -d.h / 2, d.w, d.h);
    ctx.restore();
  }
}

/* ===== State machine ===== */
let state = 'idle'; // 'idle' | 'intro' | 'main' | 'outro'
let tStateStart = performance.now();

function bgTrailAlpha() {
  return state === 'main' ? 0.06 :
         state === 'intro' ? 0.07 :
         state === 'outro' ? 0.08 : 0.10;
}

/* ===== Audio helpers ===== */
function safePlay(a) {
  if (!a) return;
  a.volume = a.volume || 0;
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}
function fadeTo(a, target, ms = 800) {
  if (!a) return;
  target = Math.max(0, Math.min(1, target)) * MASTER_VOL;
  const start = a.volume || 0;
  const diff = target - start;
  const t0 = performance.now();
  function step(t) {
    const k = Math.min(1, (t - t0) / ms);
    a.volume = start + diff * k;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function stopAndReset(a) { if (a) { a.pause(); a.currentTime = 0; } }

/* ===== Render loop ===== */
let frameCount = 0;
function loop() {
  frameCount++;

  // trail/fade
  ctx.fillStyle = `rgba(0,0,0,${bgTrailAlpha()})`;
  ctx.fillRect(0, 0, W, H);

  // rain
  updateDiamonds();
  drawDiamonds();

  // spawn frequency (higher in active states)
  if (frameCount % 2 === 0) spawnDiamond();

  // handle timed transitions
  const elapsed = (performance.now() - tStateStart) / 1000;
  if (state === 'intro' && elapsed >= DUR_INTRO) gotoMain();
  else if (state === 'main' && elapsed >= DUR_MAIN) gotoOutro();
  else if (state === 'outro' && elapsed >= DUR_OUTRO) gotoIdle();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ===== Transitions ===== */
function gotoIntro() {
  state = 'intro';
  tStateStart = performance.now();
  startBtn.dataset.state = 'running';

  // bring up ambients
  safePlay(ambRain); safePlay(ambHum);
  fadeTo(ambRain, 0.35, 1200);
  fadeTo(ambHum,  0.28, 1500);

  // retro cue + intro VO
  stopAndReset(retro); retro.loop = false; safePlay(retro);  fadeTo(retro,  0.65, 900);
  stopAndReset(introVO); introVO.loop = false; safePlay(introVO); fadeTo(introVO, 0.75, 900);

  // center diamond pop
  centerDiamond.style.transition = 'transform 350ms ease, filter 350ms ease';
  centerDiamond.style.transform = 'scale(1.18)';
  centerDiamond.style.filter = 'drop-shadow(0 0 28px red)';
  setTimeout(() => { centerDiamond.style.transform = ''; centerDiamond.style.filter = ''; }, 420);
}

function gotoMain() {
  state = 'main';
  tStateStart = performance.now();
  fadeTo(ambRain, 0.48, 1000);
  fadeTo(ambHum,  0.38, 1000);
  fadeTo(retro,   0.0,  600);
  fadeTo(introVO, 0.0,  600);
}

function gotoOutro() {
  state = 'outro';
  tStateStart = performance.now();

  // retro cue + outro VO
  stopAndReset(retro);  retro.loop = false;  safePlay(retro);  fadeTo(retro,  0.60, 800);
  stopAndReset(outroVO);outroVO.loop = false;safePlay(outroVO);fadeTo(outroVO,0.70, 800);

  // ease ambients down slightly
  fadeTo(ambRain, 0.28, 1200);
  fadeTo(ambHum,  0.22, 1200);

  // gentle pulse
  centerDiamond.style.transition = 'transform 600ms ease';
  centerDiamond.style.transform = 'scale(1.06)';
  setTimeout(() => { centerDiamond.style.transform = ''; }, 700);
}

function gotoIdle() {
  state = 'idle';
  tStateStart = performance.now();
  startBtn.dataset.state = 'idle';

  // keep low ambience for idle
  fadeTo(ambRain, 0.18, 900);
  fadeTo(ambHum,  0.14, 900);

  // kill cues/VO so they don't stack
  fadeTo(retro,   0.0, 400); setTimeout(() => stopAndReset(retro), 500);
  fadeTo(introVO, 0.0, 200); setTimeout(() => stopAndReset(introVO), 300);
  fadeTo(outroVO, 0.0, 200); setTimeout(() => stopAndReset(outroVO), 300);

  // keep particle count sane
  while (diamonds.length > 80) diamonds.shift();
}

/* ===== Start button ===== */
function kickOff() {
  stopAndReset(clickSfx); safePlay(clickSfx); fadeTo(clickSfx, 0.7, 120);
  gotoIntro();
  try { if (navigator.vibrate) navigator.vibrate(8); } catch(_) {}
}
startBtn.addEventListener('click', kickOff);

// Keyboard fallback (Enter/Space)
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'enter' || k === ' ') kickOff();
});

/* ===== Decode hints & initial volumes ===== */
[centerDiamond, ghost].forEach(img => { if (img && 'decode' in img) img.decode().catch(()=>{}); });
[ambRain, ambHum, retro, introVO, outroVO, clickSfx].forEach(a => { if (a) { a.volume = 0; a.pause(); a.currentTime = 0; }});
