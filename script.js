// Basic helpers
const $ = (q, ctx=document) => ctx.querySelector(q);
const $$ = (q, ctx=document) => Array.from(ctx.querySelectorAll(q));

const state = {
  tts: false,
  reduceMotion: false,
  highContrast: false,
  ageGroup: 'adult',
  crisisShown: false,
};

// Audio
const aBgm = $('#bgm');
const aVoice = $('#voice');
const aClick = $('#click');

// UI elements
const startBtn = $('#start');
const gate = $('.gate');
const form = $('#form');
const statusEl = $('#status');
const needHelp = $('#need-help');
const crisis = $('#crisis');
const closeCrisis = $('#closeCrisis');
const copyHelp = $('#copyHelp');

// Toggles
const tContrast = $('#toggle-contrast');
const tTts = $('#toggle-tts');
const tMotion = $('#toggle-motion');

// Business visibility
const bizRadios = $$('input[name="hasBiz"]');
const bizBlock = $('#bizBlock');

// Safety keywords (simple client-side heuristic)
const HARM_KEYWORDS = [
  'suicide','suicidal','kill myself','end my life','self harm','self-harm','hurt myself',
  'harm myself','i want to die','i want die','i dont want to live','cut myself','overdose'
];

function playClick(){ try{ aClick.currentTime = 0; aClick.play(); }catch(e){} }
function speak(line){
  if(!state.tts) return;
  try{ aVoice.currentTime = 0; aVoice.play(); }catch(e){}
  // Optional: use SpeechSynthesis for dynamic copy (fallback if voice file not desired)
  // const u = new SpeechSynthesisUtterance(line); speechSynthesis.speak(u);
}

// Age-based adaptation
function applyAgeGroup(age){
  let group = 'adult';
  const n = Number(age);
  if(!isNaN(n)){
    if(n < 18) group = 'teen';
    else if(n >= 55) group = 'senior';
  }
  document.body.classList.remove('age-teen','age-adult','age-senior');
  document.body.classList.add(`age-${group}`);
  state.ageGroup = group;
  // Seniors: default to reduced motion
  if(group === 'senior'){
    document.body.classList.add('reduce-motion');
    tMotion.setAttribute('aria-pressed','true');
    state.reduceMotion = true;
  }
}

// Safety modal
// Localize helpline guidance based on selected State/City
const openFinder = $('#openFinder');
const localBlock = $('#localBlock');
const localDesc = $('#localDesc');
const selState = $('#state');
const selCity = $('#city');

function mkFinderUrl(state, city){
  // We use authoritative directories rather than hardcoded numbers.
  // findahelpline.com covers international, 211.org covers US local services.
  const baseUS = 'https://findahelpline.com/us';
  const query = [city, state].filter(Boolean).join('%20');
  // Provide a general US page, user can refine there.
  return `${baseUS}`;
}
function mk211Url(state){
  return `https://www.211.org/`;
}

function updateLocalHelplines(){
  const st = selState?.value || '';
  const ct = selCity?.value || '';
  if(!st || st === 'Select state'){
    localBlock?.classList.add('hidden');
    return;
  }
  // Describe local guidance
  const parts = [];
  if(ct && ct !== 'Select city' && ct !== 'Other') parts.push(ct);
  if(st && st !== 'Other') parts.push(st);
  const place = parts.join(', ');
  let desc = '';
  if(place){
    desc = `Dial 211 for local services in ${place}. You can also use the directory below to find helplines near you.`;
  }else{
    desc = `Dial 211 for local services in your state. You can also use the directory below to find helplines near you.`;
  }
  if(localDesc) localDesc.textContent = desc;
  localBlock?.classList.remove('hidden');
}

openFinder?.addEventListener('click', () => {
  const st = selState?.value || '';
  const ct = selCity?.value || '';
  const url = mkFinderUrl(st, ct);
  window.open(url, '_blank', 'noopener,noreferrer');
});

['change','input'].forEach(evt => {
  selState?.addEventListener(evt, updateLocalHelplines);
  selCity?.addEventListener(evt, updateLocalHelplines);
});
// Also update when opening the crisis modal
needHelp?.addEventListener('click', updateLocalHelplines);

function showCrisis(){
  if(state.crisisShown) return;
  crisis.classList.remove('hidden');
  crisis.setAttribute('aria-hidden','false');
  $('#crisisTitle').focus({preventScroll:true});
  state.crisisShown = true;
  statusEl.textContent = 'Help resources shown.';
}

// Copy numbers
copyHelp?.addEventListener('click', async () => {
  const text = [
    'US: Call/Text 988 (Suicide & Crisis Lifeline).',
    'Immediate danger: 911.',
    'US/CA Text: HOME to 741741 (Crisis Text Line).',
    'Outside US: findahelpline.com or IASP directory.'
  ].join('\n');
  try{
    await navigator.clipboard.writeText(text);
    copyHelp.textContent = 'Copied ✅';
    setTimeout(()=>copyHelp.textContent='Copy numbers', 2000);
  }catch(e){ /* ignore */}
});
closeCrisis?.addEventListener('click', () => {
  crisis.classList.add('hidden');
  crisis.setAttribute('aria-hidden','true');
  state.crisisShown = false;
});
needHelp?.addEventListener('click', showCrisis);

// Toggle handlers
tContrast?.addEventListener('click', () => {
  const pressed = tContrast.getAttribute('aria-pressed') === 'true';
  tContrast.setAttribute('aria-pressed', String(!pressed));
  document.body.classList.toggle('high-contrast', !pressed);
  state.highContrast = !pressed;
});
tTts?.addEventListener('click', () => {
  const pressed = tTts.getAttribute('aria-pressed') === 'true';
  tTts.setAttribute('aria-pressed', String(!pressed));
  state.tts = !pressed;
  if(state.tts) speak('Voice guidance enabled.');
});
tMotion?.addEventListener('click', () => {
  const pressed = tMotion.getAttribute('aria-pressed') === 'true';
  tMotion.setAttribute('aria-pressed', String(!pressed));
  document.body.classList.toggle('reduce-motion', !pressed);
  state.reduceMotion = !pressed;
});

// Start -> reveal form
startBtn?.addEventListener('click', () => {
  playClick();
  const name = $('#name').value.trim();
  const age = $('#age').value.trim();
  if(!name || !age){
    statusEl.textContent = 'Please enter your name and age to continue.';
    return;
  }
  applyAgeGroup(age);
  gate.classList.add('hidden');
  form.classList.remove('hidden');
  statusEl.textContent = `Welcome${name ? ', ' + name : ''}.`;
  try{ aBgm.volume = 0.5; aBgm.loop = true; aBgm.play(); }catch(e){}
});

// Show/hide business block
bizRadios.forEach(r => r.addEventListener('change', e => {
  if(e.target.value === 'Yes') bizBlock.classList.remove('hidden');
  else bizBlock.classList.add('hidden');
}));

// Wellbeing radio trigger
$$('input[name="mood"]').forEach(r => r.addEventListener('change', e => {
  const val = e.target.value;
  if(val === 'Crisis') showCrisis();
  if(val === 'Struggling'){
    statusEl.textContent = 'Thanks for letting us know. If you want support now, tap “Need help now?”.';
  }
}));

// Keyword watcher for text fields
['styleText','name'].forEach(id => {
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('input', (e) => {
    const v = (e.target.value || '').toLowerCase();
    for(const k of HARM_KEYWORDS){
      if(v.includes(k)){
        showCrisis();
        break;
      }
    }
  });
});

// Submit
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  playClick();
  // Soft validation: max 3 goals
  const goals = $$('input[name="goals"]:checked');
  if(goals.length > 3){
    statusEl.textContent = 'Please select at most 3 goals.';
    return;
  }
  // Collect payload
  const data = new FormData(form);
  const payload = {};
  data.forEach((val, key) => {
    if(payload[key]){
      if(Array.isArray(payload[key])) payload[key].push(val);
      else payload[key] = [payload[key], val];
    } else {
      payload[key] = val;
    }
  });
  console.log('Form payload:', payload);
  statusEl.textContent = 'Thanks! Your preferences are saved locally.';
  speak('Form submitted. Thank you.');
  // Optional: persist to localStorage
  try{ localStorage.setItem('ai-index-onboarding', JSON.stringify(payload)); }catch(e){}
});


// ==== 4D Matrix Rain ====
function initMatrixRain(){
  const cont = document.getElementById('matrixRain');
  if(!cont) return;
  // Clear existing
  cont.innerHTML = '';
  const layers = [ {cls:'layer-1', count: 26, dur:[14,20]},
                   {cls:'layer-2', count: 22, dur:[10,14]},
                   {cls:'layer-3', count: 18, dur:[7,11]} ];
  const glyphsJDP = 'JDPJDP◇◇◆◆△▽◬◭◮◈0123456789JDPJDP';
  const glyphs = glyphsJDP;
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function pick(s){ return s[Math.floor(Math.random()*s.length)]; }
  layers.forEach(layer => {
    const layerEl = document.createElement('div');
    layerEl.className = layer.cls;
    cont.appendChild(layerEl);
    for(let i=0;i<layer.count;i++){
      const div = document.createElement('div');
      // 1 in 4 streams go red for POP
      const red = Math.random() < 0.25;
      div.className = red ? 'stream accent-red' : 'stream';
      // Build a column of random glyphs
      const len = Math.floor(rand(18, 40));
      let str = '';
      for(let j=0;j<len;j++){ str += pick(glyphs) + '\n'; }
      div.textContent = str;
      // Position & speed
      const x = rand(0, 100);
      div.style.left = x + 'vw';
      const dur = rand(layer.dur[0], layer.dur[1]);
      const anim = layer.cls==='layer-3' ? 'fallFast' : (layer.cls==='layer-2' ? 'fallMed' : 'fallSlow');
      div.style.animation = anim + ' ' + dur + 's linear infinite';
      div.style.animationDelay = (-rand(0, dur)) + 's';
      // Subtle sway
      div.style.transform = 'translateX(0)';
      layerEl.appendChild(div);
    }
  });
}
// Reinit after toggling motion/age
document.addEventListener('DOMContentLoaded', initMatrixRain);

// === Brand-to-glyph live engine ===
let DEFAULT_GLYPHS = 'JDPJDP◇◇◆◆△▽◬◭◮◈0123456789JDPJDP';
window.currentGlyphs = DEFAULT_GLYPHS;

function makeGlyphsFromName(name){
  const clean = (name || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!clean) return DEFAULT_GLYPHS;
  return (clean.repeat(30) + '0123456789◇◆△▽').slice(0, 500);
}

function updateGlyphsFromBrand(){
  const el = document.getElementById('brandName');
  if(!el) return;
  const val = el.value || '';
  window.currentGlyphs = makeGlyphsFromName(val);
  initMatrixRain();
}

const brandEl = document.getElementById('brandName');
brandEl?.addEventListener('input', () => {
  updateGlyphsFromBrand();
});

document.addEventListener('DOMContentLoaded', () => {
  updateGlyphsFromBrand();
});

tMotion?.addEventListener('click', () => { if(!document.body.classList.contains('reduce-motion')) initMatrixRain(); });

// === Demo brand cycle ===
const demoBrands = ["JDP", "Nike", "Ethel's Bakery", "Matrix Records", "Your Brand Here"];
let demoIndex = 0;
let demoTimer = null;

function cycleDemoBrands(){
  if(document.getElementById('brandName')?.value) return; // stop if user typed
  demoIndex = (demoIndex + 1) % demoBrands.length;
  const brand = demoBrands[demoIndex];
  window.currentGlyphs = makeGlyphsFromName(brand);
  initMatrixRain();
}

function startDemoCycle(){
  if(demoTimer) clearInterval(demoTimer);
  demoTimer = setInterval(cycleDemoBrands, 6000);
}

// Start demo cycle on load
document.addEventListener('DOMContentLoaded', () => {
  startDemoCycle();
});


// ==== Demo Mode: cycle through brand names when idle ====
const demoBtn = document.getElementById('toggle-demo');
const brandInput = document.getElementById('brandName');
let demoEnabled = true;
let demoTimer = null;
let demoIndex = 0;
let typingTimeout = null;

// Customize this list for sales demos
const DEMO_BRANDS = [
  'JDP',
  "Ethel's Bakery",
  'Your Brand',
  'Philly Sound',
  'Matrix Media'
];

function setBrand(name){
  if(!brandInput) return;
  brandInput.value = name;
  updateGlyphsFromBrand();
}

// Start/stop demo cycle
function startDemoCycle(){
  clearInterval(demoTimer);
  // Only cycle when input is empty OR demo explicitly enabled
  demoTimer = setInterval(() => {
    if(!demoEnabled) return;
    // If user has typed something, don't override
    if(brandInput && brandInput.value.trim().length > 0) return;
    const name = DEMO_BRANDS[demoIndex % DEMO_BRANDS.length];
    demoIndex++;
    setBrand(name);
  }, 6000);
}
function stopDemoCycle(){
  clearInterval(demoTimer);
  demoTimer = null;
}

// Pause demo while user types, resume after idle
function userIsTyping(){
  demoEnabled = false;
  demoBtn?.setAttribute('aria-pressed','false');
  stopDemoCycle();
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    demoEnabled = true;
    demoBtn?.setAttribute('aria-pressed','true');
    startDemoCycle();
  }, 8000); // resume 8s after last keystroke
}

brandInput?.addEventListener('input', userIsTyping);
brandInput?.addEventListener('focus', () => { demoEnabled = false; demoBtn?.setAttribute('aria-pressed','false'); stopDemoCycle(); });
brandInput?.addEventListener('blur', () => { demoEnabled = true; demoBtn?.setAttribute('aria-pressed','true'); startDemoCycle(); });

// Toggle button
demoBtn?.addEventListener('click', () => {
  demoEnabled = !(demoBtn.getAttribute('aria-pressed') === 'true');
  demoBtn.setAttribute('aria-pressed', String(demoEnabled));
  if(demoEnabled) startDemoCycle(); else stopDemoCycle();
});

// Kick off
document.addEventListener('DOMContentLoaded', () => {
  // Start with the first demo brand unless user types
  startDemoCycle();
});
