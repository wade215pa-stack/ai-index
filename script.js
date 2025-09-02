// Helpers
const $ = (q, ctx=document) => ctx.querySelector(q);
const $$ = (q, ctx=document) => Array.from(ctx.querySelectorAll(q));

const state = { tts:false, reduceMotion:false, highContrast:false, ageGroup:'adult', crisisShown:false };

// Audio
const aBgm = $('#bgm'); const aVoice = $('#voice'); const aClick = $('#click');

// UI
const startBtn = $('#start'); const gate = $('.gate'); const form = $('#form'); const statusEl = $('#status');
const needHelp = $('#need-help'); const crisis = $('#crisis'); const closeCrisis = $('#closeCrisis'); const copyHelp = $('#copyHelp');
const tContrast = $('#toggle-contrast'); const tTts = $('#toggle-tts'); const tMotion = $('#toggle-motion'); const demoBtn = $('#toggle-demo');

// Biz visibility
const bizRadios = $$('input[name="hasBiz"]'); const bizBlock = $('#bizBlock');

// Localize helpers
const openFinder = $('#openFinder'); const localBlock = $('#localBlock'); const localDesc = $('#localDesc');
const selState = $('#state'); const selCity = $('#city');

function playClick(){ try{ aClick.currentTime=0; aClick.play(); }catch(e){} }
function speak(line){ if(!state.tts) return; try{ aVoice.currentTime=0; aVoice.play(); }catch(e){} }

function applyAgeGroup(age){
  let group='adult'; const n=Number(age);
  if(!isNaN(n)){ if(n<18) group='teen'; else if(n>=55) group='senior'; }
  document.body.classList.remove('age-teen','age-adult','age-senior');
  document.body.classList.add(`age-${group}`); state.ageGroup=group;
  if(group==='senior'){ document.body.classList.add('reduce-motion'); tMotion.setAttribute('aria-pressed','true'); state.reduceMotion=true; }
}

// Crisis modal
function showCrisis(){ if(state.crisisShown) return; crisis.classList.remove('hidden'); crisis.setAttribute('aria-hidden','false');
  $('#crisisTitle').focus({preventScroll:true}); state.crisisShown=true; statusEl.textContent='Help resources shown.'; }
copyHelp?.addEventListener('click', async () => {
  const text = ['US: Call/Text 988 (Suicide & Crisis Lifeline).','Immediate danger: 911.','US/CA Text: HOME to 741741.','Outside US: findahelpline.com / IASP directory.'].join('\n');
  try{ await navigator.clipboard.writeText(text); copyHelp.textContent='Copied ✅'; setTimeout(()=>copyHelp.textContent='Copy numbers',2000);}catch(e){}
});
closeCrisis?.addEventListener('click', ()=>{ crisis.classList.add('hidden'); crisis.setAttribute('aria-hidden','true'); state.crisisShown=false; });
needHelp?.addEventListener('click', ()=>{ updateLocalHelplines(); showCrisis(); });

// Toggles
tContrast?.addEventListener('click', ()=>{ const p=tContrast.getAttribute('aria-pressed')==='true'; tContrast.setAttribute('aria-pressed', String(!p));
  document.body.classList.toggle('high-contrast', !p); state.highContrast=!p; });
tTts?.addEventListener('click', ()=>{ const p=tTts.getAttribute('aria-pressed')==='true'; tTts.setAttribute('aria-pressed', String(!p)); state.tts=!p; if(state.tts) speak('Voice guidance enabled.'); });
tMotion?.addEventListener('click', ()=>{ const p=tMotion.getAttribute('aria-pressed')==='true'; tMotion.setAttribute('aria-pressed', String(!p));
  document.body.classList.toggle('reduce-motion', !p); state.reduceMotion=!p; if(!document.body.classList.contains('reduce-motion')) initMatrixRain(); });

// Start -> reveal form
startBtn?.addEventListener('click', ()=>{
  playClick(); const name=$('#name').value.trim(); const age=$('#age').value.trim();
  if(!name || !age){ statusEl.textContent='Please enter your name and age to continue.'; return; }
  applyAgeGroup(age); gate.classList.add('hidden'); form.classList.remove('hidden'); statusEl.textContent=`Welcome${name?', '+name:''}.`;
  try{ aBgm.volume=0.5; aBgm.loop=true; aBgm.play(); }catch(e){}
});

// Biz toggle
bizRadios.forEach(r=>r.addEventListener('change', e=>{ if(e.target.value==='Yes') bizBlock.classList.remove('hidden'); else bizBlock.classList.add('hidden'); }));

// Wellbeing trigger
$$('input[name="mood"]').forEach(r=>r.addEventListener('change', e=>{
  const v=e.target.value; if(v==='Crisis') showCrisis();
  if(v==='Struggling') statusEl.textContent='Thanks for sharing. Tap “Need help now?” if you want support.';
}));

// Keyword watch
['styleText','name'].forEach(id=>{
  const el=document.getElementById(id); if(!el) return;
  el.addEventListener('input', e=>{
    const v=(e.target.value||'').toLowerCase();
    const HARM=['suicide','suicidal','kill myself','end my life','self harm','self-harm','hurt myself','harm myself','i want to die','i dont want to live','cut myself','overdose'];
    if(HARM.some(k=>v.includes(k))) showCrisis();
  });
});

// Submit
form?.addEventListener('submit', e=>{
  e.preventDefault(); playClick();
  const goals=$$('input[name="goals"]:checked'); if(goals.length>3){ statusEl.textContent='Please select at most 3 goals.'; return; }
  const data=new FormData(form); const payload={};
  data.forEach((val,key)=>{ if(payload[key]){ Array.isArray(payload[key])?payload[key].push(val):payload[key]=[payload[key],val]; } else payload[key]=val; });
  console.log('Form payload:', payload); statusEl.textContent='Thanks! Preferences saved locally.'; speak('Form submitted. Thank you.');
  try{ localStorage.setItem('ai-index-onboarding', JSON.stringify(payload)); }catch(e){}
});

// Local helpline description
function mkFinderUrl(){ return 'https://findahelpline.com/us'; }
function updateLocalHelplines(){
  const st=selState?.value||''; const ct=selCity?.value||'';
  if(!st || st==='Select state'){ localBlock?.classList.add('hidden'); return; }
  const parts=[]; if(ct && ct!=='Select city' && ct!=='Other') parts.push(ct); if(st && st!=='Other') parts.push(st);
  const place=parts.join(', ');
  const desc=place?`Dial 211 for local services in ${place}. You can also use the directory below.`:`Dial 211 for local services in your state. You can also use the directory below.`;
  if(localDesc) localDesc.textContent=desc; localBlock?.classList.remove('hidden');
}
openFinder?.addEventListener('click', ()=>{ window.open(mkFinderUrl(), '_blank', 'noopener,noreferrer'); });
['change','input'].forEach(evt=>{ selState?.addEventListener(evt, updateLocalHelplines); selCity?.addEventListener(evt, updateLocalHelplines); });

// ==== 4D Matrix Rain ====
function initMatrixRain(){
  const cont=document.getElementById('matrixRain'); if(!cont) return;
  cont.innerHTML='';
  const layers=[{cls:'layer-1',count:26,dur:[14,20]},{cls:'layer-2',count:22,dur:[10,14]},{cls:'layer-3',count:18,dur:[7,11]}];
  const glyphsJDP=(window.currentGlyphs && window.currentGlyphs.length ? window.currentGlyphs : 'JDPJDP◇◇◆◆△▽◬◭◮◈0123456789JDPJDP');
  const glyphs=glyphsJDP;
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function pick(s){ return s[Math.floor(Math.random()*s.length)]; }
  layers.forEach(layer=>{
    const layerEl=document.createElement('div'); layerEl.className=layer.cls; cont.appendChild(layerEl);
    for(let i=0;i<layer.count;i++){
      const div=document.createElement('div');
      const red=Math.random()<0.25; div.className=red?'stream accent-red':'stream';
      const len=Math.floor(rand(18,40)); let str=''; for(let j=0;j<len;j++){ str+=pick(glyphs)+'\n'; }
      div.textContent=str; const x=rand(0,100); div.style.left=x+'vw';
      const dur=rand(layer.dur[0],layer.dur[1]); const anim=layer.cls==='layer-3'?'fallFast':(layer.cls==='layer-2'?'fallMed':'fallSlow');
      div.style.animation=anim+' '+dur+'s linear infinite'; div.style.animationDelay=(-rand(0,dur))+'s';
      layerEl.appendChild(div);
    }
  });
}
document.addEventListener('DOMContentLoaded', initMatrixRain);

// === Brand-to-glyph live engine ===
let DEFAULT_GLYPHS='JDPJDP◇◇◆◆△▽◬◭◮◈0123456789JDPJDP';
window.currentGlyphs=DEFAULT_GLYPHS;
function makeGlyphsFromName(name){ const clean=(name||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(!clean) return DEFAULT_GLYPHS; return (clean.repeat(30)+'0123456789◇◆△▽').slice(0,500); }
function updateGlyphsFromBrand(){ const el=document.getElementById('brandName'); if(!el) return; const val=el.value||''; window.currentGlyphs=makeGlyphsFromName(val); initMatrixRain(); }
const brandEl=document.getElementById('brandName'); brandEl?.addEventListener('input', updateGlyphsFromBrand);
document.addEventListener('DOMContentLoaded', updateGlyphsFromBrand);

// ==== Demo Mode: cycle when idle ====
const brandInput=document.getElementById('brandName');
let demoEnabled=true, demoTimer=null, demoIndex=0, typingTimeout=null;
const DEMO_BRANDS=['JDP',"Ethel\'s Bakery",'Your Brand','Philly Sound','Matrix Media'];
function setBrand(name){ if(!brandInput) return; brandInput.value=name; updateGlyphsFromBrand(); }
function startDemoCycle(){ clearInterval(demoTimer); demoTimer=setInterval(()=>{
  if(!demoEnabled) return; if(brandInput && brandInput.value.trim().length>0) return;
  const name=DEMO_BRANDS[demoIndex%DEMO_BRANDS.length]; demoIndex++; setBrand(name);
}, 6000);}
function stopDemoCycle(){ clearInterval(demoTimer); demoTimer=null; }
function userIsTyping(){ demoEnabled=false; demoBtn?.setAttribute('aria-pressed','false'); stopDemoCycle();
  clearTimeout(typingTimeout); typingTimeout=setTimeout(()=>{ demoEnabled=true; demoBtn?.setAttribute('aria-pressed','true'); startDemoCycle(); }, 8000); }
brandInput?.addEventListener('input', userIsTyping);
brandInput?.addEventListener('focus', ()=>{ demoEnabled=false; demoBtn?.setAttribute('aria-pressed','false'); stopDemoCycle(); });
brandInput?.addEventListener('blur',  ()=>{ demoEnabled=true;  demoBtn?.setAttribute('aria-pressed','true'); startDemoCycle(); });
demoBtn?.addEventListener('click', ()=>{ demoEnabled = !(demoBtn.getAttribute('aria-pressed')==='true'); demoBtn.setAttribute('aria-pressed', String(demoEnabled)); if(demoEnabled) startDemoCycle(); else stopDemoCycle(); });
document.addEventListener('DOMContentLoaded', startDemoCycle);
