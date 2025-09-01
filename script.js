(()=>{
  const VERSION='1.5.0'; const NS='jarvae_wizard_v'+VERSION.replace(/\./g,'_');
  const $=(id)=>document.getElementById(id); const on=(sel,evt,fn)=>document.querySelectorAll(sel).forEach(el=>el.addEventListener(evt,fn));

  // Elements
  const splash=$('splash'), splashStart=$('splashStart'), trialEmailEl=$('trialEmail');
  const retro=$('retroLoop'), genSfx=$('genSfx'), startSfx=$('startSfx'), introVoice=$('introVoice'), outroVoice=$('outroVoice');
  const audioToggle=$('audioToggle');

  // === Audio helpers ===
  function fadeAudio(audio, targetVol, duration=800){
    if(!audio) return;
    const startVol = isNaN(audio.volume)?0.25:audio.volume;
    const steps = 20, dt = duration/steps;
    let i=0; const iv=setInterval(()=>{ i++; audio.volume = startVol + (targetVol - startVol) * (i/steps); if(i>=steps) clearInterval(iv); }, dt);
  }
  audioToggle&&audioToggle.addEventListener('click', ()=>{
    const muted = !(retro?.muted===false);
    [retro, genSfx, startSfx, introVoice, outroVoice].forEach(a=>{ if(a){ a.muted = muted; }});
    audioToggle.textContent = muted ? '🔇' : '🔊';
  });

  // Splash start → start audio + save email
  splashStart && splashStart.addEventListener('click', ()=>{
    try{ startSfx?.play().catch(()=>{});}catch(_){}
    try{
      if(retro){ retro.volume=0.22; retro.play().catch(()=>{}); }
      if(introVoice){ introVoice.currentTime=0; introVoice.play().catch(()=>{}); }
    }catch(_){}
    if (trialEmailEl && trialEmailEl.value) { try { localStorage.setItem(NS+'_trial_email', trialEmailEl.value.trim()); } catch(_){ } }
    splash?.classList.add('hidden');
  });

  // === Trial system (rotating unlock + Cash App) ===
  const OP_EMAIL='Wade215pa@gmail.com';
// === JDP Secure Unlock Patch (drop-in) ===
// Place this BLOCK right AFTER: const OP_EMAIL = 'Wade215pa@gmail.com';

// --- 1) Salted SHA-256 (no plain code stored) ---
const UNLOCK_HASH = (function(){
  // SHA-256 of 'JDP|05546719|v1.5.0' split in chunks to avoid string scans
  const p1='d1cf34817a309dfaa61c', p2='fb34f5dadca9ba42ab37';
  const p3='45665e98c64d3164e6d6', p4='1678';
  return p1+p2+p3+p4;
})();
const SALT_PREFIX = 'JDP|';      // rotate if you want (must match generator)
const SALT_SUFFIX = '|v1.5.0';   // rotate when you bump major build

async function sha256Hex(msg){
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// --- 2) Brute-force throttle (local only) ---
const FAIL_KEY = NS+'_unlock_fails';
function getFails(){
  try{ return JSON.parse(localStorage.getItem(FAIL_KEY)||'{"n":0,"t":0}'); }catch(_){ return {n:0,t:0}; }
}
function setFails(x){
  try{ localStorage.setItem(FAIL_KEY, JSON.stringify(x)); }catch(_){}
}
function canAttempt(){
  const f = getFails();
  const now = Date.now();
  // lock 15 minutes after 5 failed tries
  if(f.n >= 5 && now - f.t < 15*60*1000) return false;
  return true;
}
function recordFail(){
  const f = getFails(); f.n += 1; f.t = Date.now(); setFails(f);
}
function resetFails(){ setFails({n:0,t:0}); }

// --- 3) Replace your existing tryActivate() with the one below ---
// Find the old function and replace it entirely.
async function tryActivate(){
  if(!canAttempt()){ alert('Too many attempts — try again in ~15 minutes.'); return; }
  const key = (trialKey && trialKey.value || '').trim();
  let t = getTrial();

  // Built-in extension codes remain
  if(/^JDP-EXTEND-(\d+)$/.test(key)){
    const extra = parseInt(RegExp.$1,10);
    t.expires = (t.expires||Date.now()) + extra*86400000;
    setTrial(t); updateBadge(); closeTrial(); resetFails();
    alert(`Extended ${extra} days.`); return;
  }

  // Only check numeric codes 6–10 digits to avoid hashing junk
  if(/^\d{6,10}$/.test(key)){
    const calc = await sha256Hex(SALT_PREFIX + key + SALT_SUFFIX);
    if(calc === UNLOCK_HASH){
      t.expires = Date.now() + 365*86400000; // 1 year
      setTrial(t); updateBadge(); closeTrial(); resetFails();
      alert('Unlocked for 1 year.'); return;
    }
  }

  recordFail();
  alert('Invalid code. Request a fresh activation code from the operator.');
}

// Wire the button again if needed
trialActivate && trialActivate.addEventListener('click', ()=>{ tryActivate(); });

  /* removed plain code */
  const CASH_TAG='$Briscoe888', CASH_AMOUNT='50', CASH_NOTE='Jarvae Full Access';

  const TRK=NS+'_trial'; const BADGE=$('trialBadge'); const trialModal=$('trialModal'); const trialClose=$('trialClose'); const trialActivate=$('trialActivate'); const trialKey=$('trialKey');
  const btnCash=$('trialCash'), btnIPaid=$('trialIPaid');
  function getTrial(){ try{ return JSON.parse(localStorage.getItem(TRK)||'{}'); }catch(_){ return {}; } }
  function setTrial(obj){ try{ localStorage.setItem(TRK, JSON.stringify(obj)); }catch(_){ } }
  function startTrialIfNeeded(){ const t=getTrial(); if(!t.start){ const now=Date.now(); t.start=now; t.expires= now + 30*86400000; setTrial(t); } }
  function daysLeft(){ const t=getTrial(); if(!t.expires) return 30; return Math.max(0, Math.ceil((t.expires - Date.now())/86400000)); }
  function updateBadge(){ const left=daysLeft(); if(BADGE) BADGE.textContent=`Trial: ${left} day${left===1?'':'s'} left`; }
  function expired(){ return daysLeft()<=0; }
  function gateIfExpired(){ if(!expired()) return true; trialModal && trialModal.setAttribute('aria-hidden','false'); return false; }
  function closeTrial(){ trialModal && trialModal.setAttribute('aria-hidden','true'); }
  function tryActivate(){ const key=(trialKey && trialKey.value || '').trim(); let t=getTrial();
    if(/^\d{6,10}$/.test(key) && key===CURRENT_UNLOCK_CODE){ t.expires=Date.now()+365*86400000; setTrial(t); updateBadge(); closeTrial(); alert('Unlocked for 1 year.'); return; }
    if(/^JDP-EXTEND-(\d+)$/.test(key)){ const extra=parseInt(RegExp.$1,10); t.expires=(t.expires||Date.now())+extra*86400000; setTrial(t); updateBadge(); closeTrial(); alert(`Extended ${extra} days.`); return; }
    alert('Invalid code. Request a fresh activation code from the operator.');
  }
  trialClose&&trialClose.addEventListener('click', closeTrial);
  trialActivate&&trialActivate.addEventListener('click', tryActivate);
  // Cash App link
  function openCashApp(){
    const tag=CASH_TAG.replace(/^\$/,''); if(!tag){ alert('Operator has not set a Cash App $cashtag yet.'); return; }
    let url=`https://cash.app/$${tag}`; const params=[];
    if(CASH_AMOUNT) params.push('amount='+encodeURIComponent(CASH_AMOUNT));
    if(CASH_NOTE) params.push('note='+encodeURIComponent(CASH_NOTE));
    if(params.length) url+='?'+params.join('&'); window.open(url,'_blank','noopener');
  }
  btnCash&&btnCash.addEventListener('click', openCashApp);
  btnIPaid&&btnIPaid.addEventListener('click', ()=>{
    const splashEmail = localStorage.getItem(NS+'_trial_email')||'';
    const mail = 'mailto:'+encodeURIComponent(OP_EMAIL)
      +'?subject='+encodeURIComponent('Jarvae Full Access — Payment Sent')
      +'&body='+encodeURIComponent(`Hi,\\n\\nI sent the $${CASH_AMOUNT} via Cash App (${CASH_TAG}). Please send my activation code.\\nSplash Email: ${splashEmail||'(not provided)'}\\n\\nThanks!`);
    window.location.href = mail;
  });
  startTrialIfNeeded(); updateBadge();

  // === Wizard (minimal) ===
  const steps=Array.from(document.querySelectorAll('.step')); const bar=document.getElementById('progressBar'); let ix=0;
  function show(i){ const c=Math.max(0,Math.min(i,steps.length-1)); steps.forEach((s,k)=> s.classList.toggle('show', k===c)); if(bar) bar.style.width=((c+1)/steps.length*100)+'%'; ix=c; }
  on('.next','click', ()=>show(ix+1)); on('.back','click', ()=>show(ix-1)); on('.skip-step','click', ()=>show(ix+1)); show(0);

  // === Generate: play SFX, then outro with music duck ===
  const generateBtn=$('generateBtn'), output=$('output');
  function canGenerate(){ return gateIfExpired(); }
  generateBtn && generateBtn.addEventListener('click', ()=>{
    if(!canGenerate()) return;
    try{ if(genSfx){ genSfx.currentTime=0; genSfx.play().catch(()=>{});} }catch(_){}
    setTimeout(()=>{
      try{
        if(retro) fadeAudio(retro, 0.12, 700);
        if(outroVoice){
          outroVoice.currentTime=0;
          outroVoice.play().catch(()=>{});
          outroVoice.onended = ()=>{ if(retro) fadeAudio(retro, 0.22, 900); };
        }
      }catch(_){}
    }, 420);
    if(output) output.value = "JARVAE DIAMOND PROTOCOL — demo prompt (replace with generator)";
  });
})();
// === Matrix Rain Background ===
(function(){
  const canvas = document.getElementById('matrixCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, columns, drops, fontSize, chars;

  // Character set (mix of katakana + numbers + symbols)
  const RAIN_THEME='religious';
  const CHARSETS={
    classic:'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789:・.=*+-<>|{}',
    religious:'✝†✟☸佛◇◆△▽✧✦✩✪✫✬✭✮✯✰'
  };
  chars = CHARSETS[RAIN_THEME] || CHARSETS.classic;

  function resize(){
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(window.innerWidth * ratio);
    H = canvas.height = Math.floor(window.innerHeight * ratio);

    // Font size scales with DPI to keep density constant
    fontSize = Math.max(12 * ratio, 10);
    columns = Math.floor(W / (fontSize * 0.9));
    drops = Array(columns).fill(0).map(()=> Math.floor(Math.random()*H/fontSize));
    ctx.font = `${fontSize}px monospace`;
  }
  resize(); window.addEventListener('resize', resize);

  let last = 0;
  function draw(ts){
    const dt = ts - last; last = ts;

    // Faint fade to black (trail effect)
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,W,H);

    // Draw characters
    for(let i=0;i<columns;i++){
      const x = i * fontSize * 0.9;
      const y = drops[i] * fontSize;
      const ch = chars.charAt(Math.floor(Math.random()*chars.length));

      // Bright head + trailing fade
      ctx.fillStyle = 'rgba(0,255,136,0.85)';
      ctx.fillText(ch, x, y);
      ctx.fillStyle = 'rgba(0,255,136,0.2)';
      ctx.fillText(ch, x, y - fontSize);

      // Move drop
      if(y > H && Math.random() > 0.975) drops[i] = 0;
      else drops[i]++;
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // Respect reduced-motion users
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function handleMotion(e){
    if(e.matches){
      // Stop animation, show static gradient
      canvas.style.display = 'none';
      document.body.style.background = '#000';
    }else{
      canvas.style.display = 'block';
    }
  }
  mq.addEventListener && mq.addEventListener('change', handleMotion);
  handleMotion(mq);
})();