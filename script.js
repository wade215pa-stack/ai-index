(function(){
  const form = document.getElementById('jarvaeForm');
  const generateBtn = document.getElementById('generateBtn');
  const out = document.getElementById('output');
  const promptBox = document.getElementById('promptBox');

  const nameEl = document.getElementById('name');
  const companyEl = document.getElementById('company');
  const roleEl = document.getElementById('role');
  const ageEl = document.getElementById('age');
  const goalEl = document.getElementById('goal');
  const blockerEl = document.getElementById('blocker');
  const styleEl = document.getElementById('style');
  const industryEl = document.getElementById('industry');
  const timelineEl = document.getElementById('timeline');
  const successEl = document.getElementById('success');
  const emailEl = document.getElementById('email');

  const btnChatGPT = document.getElementById('copyOpenChatGPT');
  const btnGemini  = document.getElementById('copyOpenGemini');
  const btnGronk   = document.getElementById('copyOpenGronk');

  function val(el){ return (el && el.value || '').trim(); }

  function buildPrompt(){
    return `# JARVAE DIAMOND PROTOCOL — CLIENT ACTIVATION
CLIENT: ${val(nameEl)}
COMPANY: ${val(companyEl)}
ROLE: ${val(roleEl)}
AGE GROUP: ${val(ageEl)}
EMAIL: ${val(emailEl)}

OBJECTIVE: ${val(goalEl)}
BLOCKER: ${val(blockerEl)}
STYLE: ${val(styleEl)}
INDUSTRY: ${val(industryEl)}
TIMELINE: ${val(timelineEl)}
SUCCESS CRITERIA: ${val(successEl)}

[Paste this into a NEW conversation. Jarvae operates with Diamond Protocol rules (clarity, constraints, completeness, compliance, consistency), and delivers structured output with fallback + self-check.]`;
  }

  function guardAge(){
    const age = val(ageEl);
    if(!age){ alert('Please select an age group.'); return false; }
    if(age === '13-17'){
      alert('Ages 13–17: Proceed only with guardian consent.'); return true;
    }
    if(age === '18+'){ return true; }
    return false;
  }

  function showOutput(){ out.classList.remove('hidden'); promptBox.scrollIntoView({behavior:'smooth'}); promptBox.focus(); }

  async function copyToClipboard(text){
    try{ await navigator.clipboard.writeText(text); return true; }
    catch(e){
      try{ promptBox.select(); document.execCommand('copy'); return true; } catch(_){ return false; }
    }
  }

  function openApp(app){
    if(app==='chatgpt') window.open('https://chat.openai.com/','_blank','noopener');
    else if(app==='gemini') window.open('https://gemini.google.com/','_blank','noopener');
    else if(app==='gronk') window.open('https://grok.com/','_blank','noopener');
  }

  async function handleCombo(app, btn){
    btn.disabled = true;
    const ok = await copyToClipboard(promptBox.value);
    const original = btn.textContent;
    if(ok){ btn.textContent='Copied! Opening...'; openApp(app); }
    else { btn.textContent='Copy failed – copy manually'; openApp(app); }
    setTimeout(()=>{ btn.textContent=original; btn.disabled=false; }, 1400);
  }

  generateBtn.addEventListener('click', function(){
    if(!guardAge()) return;
    promptBox.value = buildPrompt();
    showOutput();
  });

  btnChatGPT.addEventListener('click', ()=>handleCombo('chatgpt', btnChatGPT));
  btnGemini .addEventListener('click', ()=>handleCombo('gemini', btnGemini));
  btnGronk  .addEventListener('click', ()=>handleCombo('gronk', btnGronk));

  // URL params
  function getParam(k){ const u=new URL(window.location.href); return u.searchParams.get(k); }
  const pre = {name:getParam('name'),company:getParam('company'),role:getParam('role'),age:getParam('age'),
               goal:getParam('goal'),blocker:getParam('blocker'),style:getParam('style'),industry:getParam('industry'),
               timeline:getParam('timeline'),success:getParam('success'),email:getParam('email')};
  if(pre.name) nameEl.value=pre.name;
  if(pre.company) companyEl.value=pre.company;
  if(pre.role) roleEl.value=pre.role;
  if(pre.age && ['13-17','18+'].includes(pre.age)) ageEl.value=pre.age;
  if(pre.goal) goalEl.value=pre.goal;
  if(pre.blocker) blockerEl.value=pre.blocker;
  if(pre.style) styleEl.value=pre.style;
  if(pre.industry) industryEl.value=pre.industry;
  if(pre.timeline) timelineEl.value=pre.timeline;
  if(pre.success) successEl.value=pre.success;
  if(pre.email) emailEl.value=pre.email;
  if(getParam('autogen')==='1'){ if(guardAge()){ promptBox.value=buildPrompt(); showOutput(); } }

  // --- Splash Intro Logic ---
  const splash = document.getElementById('splash');
  const splashText = document.getElementById('splashText');
  const skipIntro = document.getElementById('skipIntro');
  const mainLayout = document.querySelector('main.layout');

  const lines = [
    "Initializing Jarvae Diamond Protocol...",
    "Scanning user channel... OK",
    "Authenticating node... OK",
    "Establishing neural link... OK",
    "Welcome to Jarvae AI."
  ];

  function typeLines(ls, target, cb){
    let i = 0;
    function typeLine() {
      if (i >= ls.length) { cb && cb(); return; }
      const line = ls[i] + "\n";
      let j = 0;
      const interval = setInterval(()=>{
        target.textContent += line[j] || "";
        j++;
        if(j > line.length){
          clearInterval(interval);
          i++;
          setTimeout(typeLine, 180);
        }
      }, 18);
    }
    typeLine();
  }

  function endSplash(){
    // Fade out splash (0.5s), fade in main
    splash.classList.add('hide');
    setTimeout(()=>{
      splash.remove();
      mainLayout.classList.add('show');
    }, 520);
  }

  // Run splash for ~3 seconds with typing animation, then transition
  function runSplash(){
    splash.classList.add('show');
    typeLines(lines, splashText, ()=>{
      setTimeout(endSplash, 1200); // brief hold after typing
    });
    // Safety timeout: ensure we exit around 3s–4s even if typing takes longer
    setTimeout(()=>{ if(document.body.contains(splash)) endSplash(); }, 4000);
  }

  // Skip button
  skipIntro.addEventListener('click', endSplash);

  // If URL has ?skip=1, bypass splash for rapid demos
  const url = new URL(window.location.href);
  if(url.searchParams.get('skip') === '1'){
    mainLayout.classList.add('show');
    splash.remove();
  }else{
    runSplash();
  }

})();