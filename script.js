(function(){
  const generateBtn = document.getElementById('generateBtn');
  const nameEl = document.getElementById('name');
  const companyEl = document.getElementById('company');
  const emailEl = document.getElementById('email');
  const systemEl = document.getElementById('system');
  const out = document.getElementById('output');
  const promptBox = document.getElementById('promptBox');

  const btnChatGPT = document.getElementById('copyOpenChatGPT');
  const btnGemini  = document.getElementById('copyOpenGemini');
  const btnGronk   = document.getElementById('copyOpenGronk');

  const templates = {
    jarvae: `# Jarvae Diamond Protocol – Client Activation
USER: {NAME}
COMPANY: {COMPANY}
EMAIL: {EMAIL}

[Paste this into a NEW ChatGPT conversation (or Gemini/Gronk), first message]`,
    grunt: `# Grunt AI System – Client Activation
USER: {NAME}
COMPANY: {COMPANY}
EMAIL: {EMAIL}

[Paste this into a NEW ChatGPT conversation (or Gemini/Gronk), first message]`,
    grok: `# Grok AI System – Client Activation
USER: {NAME}
COMPANY: {COMPANY}
EMAIL: {EMAIL}

[Paste this into a NEW ChatGPT conversation (or Gemini/Gronk), first message]`
  };

  function fill(tpl){
    return tpl
      .replace('{NAME}', nameEl.value || '')
      .replace('{COMPANY}', companyEl.value || '')
      .replace('{EMAIL}', emailEl.value || '');
  }

  function showOutput(){
    out.classList.remove('hidden');
    promptBox.scrollIntoView({behavior:'smooth'});
    promptBox.focus();
  }

  generateBtn.addEventListener('click', function(){
    const sys = systemEl.value;
    const tpl = templates[sys];
    promptBox.value = fill(tpl);
    showOutput();
  });

  async function copyToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){
      try{
        // Fallback
        promptBox.select();
        document.execCommand('copy');
        return true;
      }catch(_){
        return false;
      }
    }
  }

  function openApp(app){
    // Best-effort links (cannot deep-link directly into a compose box on all platforms)
    if(app === 'chatgpt'){
      window.open('https://chat.openai.com/', '_blank', 'noopener');
    }else if(app === 'gemini'){
      window.open('https://gemini.google.com/', '_blank', 'noopener');
    }else if(app === 'gronk'){
      // "Gronk" per request; using Grok homepage as best-effort
      window.open('https://grok.com/', '_blank', 'noopener');
    }
  }

  async function handleCombo(app, btn){
    btn.disabled = true;
    const ok = await copyToClipboard(promptBox.value);
    if(ok){
      const original = btn.textContent;
      btn.textContent = 'Copied! Opening...';
      openApp(app);
      setTimeout(()=>{ btn.textContent = original; btn.disabled = false; }, 1200);
    }else{
      btn.textContent = 'Copy failed – copy manually';
      openApp(app);
      setTimeout(()=>{ btn.textContent = 'Copy & Open ' + (app==='chatgpt'?'ChatGPT':app==='gemini'?'Gemini':'Gronk'); btn.disabled = false;}, 2000);
    }
  }

  btnChatGPT.addEventListener('click', ()=>handleCombo('chatgpt', btnChatGPT));
  btnGemini .addEventListener('click', ()=>handleCombo('gemini', btnGemini));
  btnGronk  .addEventListener('click', ()=>handleCombo('gronk', btnGronk));

  // --- URL param helpers for demos/QR flows ---
  function getParam(key){
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  }

  // Preselect system and prefill fields from URL params
  const sysParam = (getParam('system')||'').toLowerCase();
  if(['jarvae','grunt','grok'].includes(sysParam)){
    systemEl.value = sysParam;
  }
  const nameParam = getParam('name');
  const companyParam = getParam('company');
  const emailParam = getParam('email');
  if(nameParam) nameEl.value = nameParam;
  if(companyParam) companyEl.value = companyParam;
  if(emailParam) emailEl.value = emailParam;

  // Auto-generate prompt if requested (?autogen=1)
  const autogen = getParam('autogen');
  if(autogen === '1'){
    const sys = systemEl.value;
    const tpl = templates[sys];
    promptBox.value = fill(tpl);
    out.classList.remove('hidden');
    promptBox.focus();
  }

})();