const $ = (q, c=document) => c.querySelector(q);
const $$ = (q, c=document) => Array.from(c.querySelectorAll(q));

const aBgm = $('#bgm');
const aVoice = $('#voice');
const aClick = $('#click');

const startBtn = $('#start');
const gate = $('.gate');
const form = $('#form');
const statusEl = $('#status');
const audience = $('#audienceType');
const artistBlock = $('#artistBlock');
const businessBlock = $('#businessBlock');

// === Audience blocks toggle ===
function updateAudienceBlocks() {
  const v = audience?.value || '';
  artistBlock?.classList.toggle('hidden', v !== 'Artist');
  businessBlock?.classList.toggle('hidden', !(v === 'Business' || v === 'Nonprofit'));
}
audience?.addEventListener('change', updateAudienceBlocks);

// === Age adaptation ===
function applyAgeGroup(age) {
  const n = Number(age);
  let g = 'adult';
  if(!isNaN(n)) {
    if(n < 18) g = 'teen';
    else if(n >= 55) g = 'senior';
  }
  document.body.classList.remove('age-teen','age-adult','age-senior');
  document.body.classList.add('age-'+g);
}

// === Matrix rain ===
function initMatrixRain() {
  const cont = document.getElementById('matrixRain');
  if(!cont) return;
  cont.innerHTML = '';
  const N = 80, glyphs = 'JDP0123456789◇◆△▽';
  for(let i=0;i<N;i++){
    const d = document.createElement('div');
    d.className = 'stream';
    const len = 20 + Math.floor(Math.random()*30);
    d.textContent = Array.from({length:len},()=>glyphs[Math.floor(Math.random()*glyphs.length)]).join('\n');
    d.style.left = (Math.random()*100)+'vw';
    d.style.top = (-20 - Math.random()*100) + 'vh';
    const dur = 8 + Math.random()*12;
    d.style.animationDuration = dur+'s';
    d.style.fontSize = (12 + Math.random()*16)+'px';
    cont.appendChild(d);
  }
}
initMatrixRain();

// === Splash / Preloader ===
const splash = document.getElementById('splash');
const splashStart = document.getElementById('splashStart');
const splashBar = document.getElementById('splashBar');
const splashHint = document.getElementById('splashHint');

const PRELOAD_ASSETS = [
  'assets/logo_jdp_ghost.webp','assets/logo_jdp_ghost.png',
  'assets/retro_intro.m4a','assets/retro_intro.mp3',
  'assets/intro_voice.m4a','assets/intro_voice.mp3',
  'assets/start_click.m4a','assets/start_click.mp3',
  'assets/matrix_generate.m4a','assets/matrix_generate.mp3'
];

function preload(){
  let done=0,total=PRELOAD_ASSETS.length;
  function bump(){
    done++;
    const pct = Math.round((done/total)*100);
    if(splashBar) splashBar.style.width = pct+'%';
    if(pct>=100){
      splashHint.textContent = 'Ready';
      splashStart.removeAttribute('disabled');
    }
  }
  return Promise.all(PRELOAD_ASSETS.map(url=>new Promise(resolve=>{
    let el;
    if(/\.(png|webp|jpg|jpeg|gif|svg)$/i.test(url)){
      el=new Image(); el.onload=resolve; el.onerror=resolve; el.src=url;
    } else {
      el=new Audio(); el.oncanplaythrough=resolve; el.onerror=resolve; el.src=url; el.load();
    }
  }).then(bump)));
}
document.addEventListener('DOMContentLoaded', ()=>{ preload(); });

// Splash Start
splashStart?.addEventListener('click', ()=>{
  try{ aClick.currentTime=0; aClick.play(); }catch(e){}
  try{ aBgm.volume=.5; aBgm.play(); }catch(e){}
  try{ aVoice.currentTime=0; aVoice.play(); }catch(e){}
  splash.classList.add('hidden');
});

// === Gate Start ===
startBtn?.addEventListener('click', ()=>{
  const name=$('#name').value.trim();
  const age=$('#age').value.trim();
  if(!name||!age){
    statusEl.textContent='Please enter your name and age to continue.';
    return;
  }
  applyAgeGroup(age);
  gate.classList.add('hidden');
  form.classList.remove('hidden');
  statusEl.textContent='Welcome'+(name?', '+name:'')+'.';
  try{ aBgm.volume=.5; aBgm.play(); }catch(e){}
});

// === Crisis Modal ===
const crisis=$('#crisis');
const needHelp=$('#need-help');
const closeCrisis=$('#closeCrisis');
function showCrisis(){
  crisis?.classList.remove('hidden');
  crisis?.setAttribute('aria-hidden','false');
}
needHelp?.addEventListener('click', showCrisis);
closeCrisis?.addEventListener('click', ()=>crisis?.classList.add('hidden'));

// === AI Picker ===
const aiPicker = document.getElementById('aiPicker');
const copyStatus = document.getElementById('copystatus');

function buildPrompt(){
  const d=new FormData(form);
  const getAll=(k)=>Array.isArray(d.getAll(k))?d.getAll(k).filter(Boolean):[];
  const payload={
    name:d.get('name')||'',
    age:d.get('age')||'',
    city:d.get('city')||'',
    state:d.get('state')||'',
    brand:d.get('brandName')||d.get('company')||'',
    audienceType:d.get('audienceType')||'',
    disciplines:getAll('disciplines').join(', '),
    industries:getAll('industry').join(', '),
    goals:getAll('goals').join(', '),
    socials:getAll('social').join(', '),
    xp:d.get('xp')||'',
    website:d.get('website')||'',
    contact:d.get('contact')||'',
    budget:d.get('budget')||'',
    timeline:d.get('timeline')||'',
  };
  return `User profile:
- Name: ${payload.name} (age ${payload.age})
- Location: ${payload.city}, ${payload.state}
- Brand/Company: ${payload.brand}
- Audience type: ${payload.audienceType}
- Disciplines/Roles: ${payload.disciplines || 'n/a'}
- Industry: ${payload.industries || 'n/a'}
- Experience: ${payload.xp}
- Goals (top): ${payload.goals || 'n/a'}
- Social platforms: ${payload.socials || 'n/a'}
- Website: ${payload.website || 'n/a'}
- Preferred contact: ${payload.contact || 'n/a'}
- Budget: ${payload.budget || 'n/a'}
- Timeline: ${payload.timeline || 'n/a'}

Deliverables:
1) A short positioning statement tailored to their details.
2) Three high-impact moves they should do this week.
3) One growth experiment with hypothesis + simple metrics.
4) One brand-voice sample caption in their style for a platform you pick.`;
}

async function copyPromptToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    copyStatus&&(copyStatus.textContent='Prompt copied ✅');
  }catch(e){
    copyStatus&&(copyStatus.textContent='Could not auto-copy. Copy manually.');
  }
}

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const goalsChecked=Array.from(document.querySelectorAll('input[name="goals"]:checked'));
  if(goalsChecked.length>3){
    statusEl.textContent='Please select at most 3 goals.';
    return;
  }
  const prompt=buildPrompt();
  await copyPromptToClipboard(prompt);
  aiPicker?.classList.remove('hidden');
  aiPicker.scrollIntoView({behavior:'smooth',block:'center'});
  statusEl.textContent='Your prompt is ready. Choose an AI.';
});

function openAI(which){
  let url='https://chat.openai.com/';
  if(which==='gemini') url='https://gemini.google.com/';
  if(which==='grok')   url='https://x.ai/';
  window.open(url,'_blank','noopener,noreferrer');
}
aiPicker?.addEventListener('click', async (e)=>{
  const btn=e.target.closest('button[data-ai]');
  if(!btn) return;
  await copyPromptToClipboard(buildPrompt());
  openAI(btn.dataset.ai);
});
