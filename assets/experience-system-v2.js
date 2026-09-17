(function(){
  if(typeof window==='undefined'||typeof document==='undefined')return;
  if(window.__plushlifeExperienceSystemV2Installed)return;
  window.__plushlifeExperienceSystemV2Installed=true;

  const STATE_KEY='plushlife:experience-system:v2';
  const GROWTH_KEY='plushlife:growth-loop:v1';
  const THEME_LABELS=['Soft Plush Theme','Soft Light','Twilight Theme','Meadow Theme'];
  const calmWords=/\b(tiny|recovery|rest|anxious|overwhelmed|sad|tired)\b/i;
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(_){return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};

  function recordVisit(){
    const s=read(STATE_KEY,{});const day=new Date().toISOString().slice(0,10);
    if(s.lastDay===day)return s;
    const next={...s,lastDay:day,visits:Number(s.visits||0)+1};write(STATE_KEY,next);return next;
  }

  function isCalmMoment(){
    const growth=read(GROWTH_KEY,{});const today=new Date().toISOString().slice(0,10);
    if(growth.lastChoiceDate===today&&['tiny','recovery','rest'].includes(growth.lastChoice))return true;
    const pressed=[...document.querySelectorAll('[aria-pressed="true"], [aria-selected="true"]')].map(n=>clean(n.textContent)).join(' ');
    return calmWords.test(pressed);
  }

  function markPriorities(){
    const home=document.querySelector('[data-plushlife-home-stack]');if(!home)return;
    [...home.children].forEach((node,i)=>{if(!(node instanceof HTMLElement))return;node.dataset.plushlifeHomeItem='true';node.dataset.plushlifePriority='3';
      if(node.id==='plushlife-smart-next-step'||node.querySelector?.('#plushlife-smart-next-step'))node.dataset.plushlifePriority='1';
      else if(node.id==='plushlife-growth-checkin'||node.id==='plushlife-adaptive-capacity-card'||node.querySelector?.('#plushlife-growth-checkin,#plushlife-adaptive-capacity-card'))node.dataset.plushlifePriority='2';
      else if(node.matches?.('[role="tablist"]')||node.querySelector?.('[role="tablist"]'))node.dataset.plushlifePriority='2';
      if(i>5&&node.dataset.plushlifePriority==='3')node.dataset.plushlifeSecondary='true';
    });
  }

  function collapseCompleted(){
    document.querySelectorAll('section[aria-label]').forEach(section=>{
      const label=clean(section.getAttribute('aria-label'));
      if(!/completed/i.test(label)||section.dataset.plushlifeCompletedEnhanced==='true')return;
      section.dataset.plushlifeCompletedEnhanced='true';section.dataset.plushlifeCollapsed='true';
      const top=section.firstElementChild;if(!top)return;
      const btn=document.createElement('button');btn.type='button';btn.className='plushlife-completed-toggle';btn.textContent='Show';btn.setAttribute('aria-expanded','false');
      btn.addEventListener('click',()=>{const collapsed=section.dataset.plushlifeCollapsed!=='false';section.dataset.plushlifeCollapsed=collapsed?'false':'true';btn.textContent=collapsed?'Hide':'Show';btn.setAttribute('aria-expanded',collapsed?'true':'false')});
      top.appendChild(btn);
    });
  }

  function progressiveDisclosure(){
    const experienced=Number(read(STATE_KEY,{}).visits||0)>=5;document.documentElement.toggleAttribute('data-plushlife-experienced',experienced);
    ['plushlife-adaptive-intro','plushlife-next-step-reason'].forEach(id=>{
      const el=document.getElementById(id);if(!el||el.dataset.plushlifeDisclosure==='true')return;el.dataset.plushlifeDisclosure='true';
      if(!experienced)return;
      const btn=document.createElement('button');btn.type='button';btn.className='plushlife-context-toggle';btn.textContent='Why this?';btn.setAttribute('aria-expanded','false');
      el.hidden=true;btn.addEventListener('click',()=>{el.hidden=!el.hidden;btn.textContent=el.hidden?'Why this?':'Hide explanation';btn.setAttribute('aria-expanded',el.hidden?'false':'true')});
      el.insertAdjacentElement('beforebegin',btn);
    });
  }

  function themePreviews(){
    [...document.querySelectorAll('button')].forEach(btn=>{
      const label=clean(btn.textContent);const theme=THEME_LABELS.find(t=>label.includes(t));if(!theme||btn.dataset.plushlifeThemePreview==='true')return;
      btn.dataset.plushlifeThemePreview='true';
      const swatch=document.createElement('span');swatch.className='plushlife-theme-preview';swatch.dataset.theme=theme.toLowerCase().replace(/\s+/g,'-');
      swatch.innerHTML='<i></i><i></i><i></i>';btn.prepend(swatch);
    });
  }

  function coordinateOverlays(){
    const modal=!!document.querySelector('[role="dialog"][aria-modal="true"],[data-plush-checkin-overlay="true"]');
    document.body.classList.toggle('plushlife-one-overlay',modal);
    ['plushlife-resume-context','plushlife-growth-toast','plushlife-adaptive-toast','plushlife-mascot-reaction'].forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute('aria-hidden',modal?'true':'false')});
  }

  function enhanceEmptyNextStep(){
    const home=document.querySelector('[data-plushlife-home-stack]');if(!home)return;
    const next=document.getElementById('plushlife-smart-next-step');
    let empty=document.getElementById('plushlife-calm-empty-state');
    if(next){empty?.remove();return}
    const taskLike=[...home.querySelectorAll('button')].some(b=>/done|complete|start|next|task|habit/i.test(clean(b.textContent)));
    if(taskLike||empty)return;
    empty=document.createElement('section');empty.id='plushlife-calm-empty-state';empty.innerHTML='<div class="plushlife-empty-icon">🧸</div><strong>You’re clear for now.</strong><span>Nothing needs your attention this second. You can rest here or choose something gentle.</span>';
    home.prepend(empty);
  }

  function sync(){
    markPriorities();collapseCompleted();progressiveDisclosure();themePreviews();coordinateOverlays();enhanceEmptyNextStep();
    document.documentElement.toggleAttribute('data-plushlife-calm',isCalmMoment());
  }

  const style=document.createElement('style');style.id='plushlife-experience-system-v2';style.textContent=`
    :root{--plush-space-1:6px;--plush-space-2:10px;--plush-space-3:14px;--plush-space-4:18px;--plush-radius-sm:12px;--plush-radius-md:16px;--plush-radius-lg:20px}
    [data-plushlife-home-stack]{gap:var(--plush-space-3)!important}
    [data-plushlife-home-item="true"]{transition:opacity .18s ease,transform .18s ease}
    #plushlife-smart-next-step{position:relative!important;isolation:isolate}
    #plushlife-smart-next-step:before{content:"";position:absolute;left:0;top:18%;bottom:18%;width:3px;border-radius:999px;background:var(--plush-accent);opacity:.9}
    .plushlife-context-toggle,.plushlife-completed-toggle{min-height:36px!important;border:0!important;background:transparent!important;color:var(--plush-accent)!important;font:900 10.5px/1 system-ui,sans-serif!important;padding:5px 7px!important;border-radius:999px!important;box-shadow:none!important}
    section[aria-label][data-plushlife-completed-enhanced="true"]{background:color-mix(in srgb,var(--plush-surface) 72%,transparent)!important;border-color:var(--plush-border-soft)!important;box-shadow:none!important;opacity:.86}
    section[aria-label][data-plushlife-completed-enhanced="true"][data-plushlife-collapsed="true"]> :not(:first-child){display:none!important}
    section[aria-label][data-plushlife-completed-enhanced="true"] .plushlife-completed-toggle{margin-left:auto}
    #plushlife-calm-empty-state{display:grid;justify-items:center;text-align:center;gap:5px;padding:22px 18px;border:1px dashed var(--plush-border);border-radius:var(--plush-radius-lg);background:color-mix(in srgb,var(--plush-surface) 86%,transparent);color:var(--plush-text)}
    #plushlife-calm-empty-state strong{font-size:14px}#plushlife-calm-empty-state span{max-width:320px;color:var(--plush-copy);font-size:11.5px;line-height:1.45}.plushlife-empty-icon{font-size:28px}
    body.plushlife-one-overlay #plushlife-resume-context,body.plushlife-one-overlay #plushlife-growth-toast,body.plushlife-one-overlay #plushlife-adaptive-toast,body.plushlife-one-overlay #plushlife-mascot-reaction{display:none!important}
    html[data-plushlife-calm] [data-plushlife-home-stack]{gap:10px!important}
    html[data-plushlife-calm] [data-plushlife-secondary="true"]{opacity:.38!important;filter:saturate(.72)}
    html[data-plushlife-calm] #plushlife-smart-next-step{transform:scale(1.01);box-shadow:0 10px 28px color-mix(in srgb,var(--plush-accent) 13%,transparent)!important}
    html[data-plushlife-calm] #plushlife-adaptive-intro,html[data-plushlife-calm] #plushlife-next-step-reason{font-size:10.5px!important}
    .plushlife-theme-preview{width:100%;height:38px;margin:0 0 7px;display:flex;align-items:end;gap:4px;padding:5px;border-radius:10px;background:var(--plush-next);border:1px solid var(--plush-border);box-sizing:border-box}
    .plushlife-theme-preview i{display:block;flex:1;border-radius:5px;background:var(--plush-surface-2);border:1px solid var(--plush-border-soft)}.plushlife-theme-preview i:nth-child(1){height:75%}.plushlife-theme-preview i:nth-child(2){height:100%;background:var(--plush-selected)}.plushlife-theme-preview i:nth-child(3){height:58%}
    button[data-plushlife-theme-preview="true"]{display:flex!important;flex-direction:column!important;align-items:stretch!important;text-align:center!important;min-height:86px!important}
    @media(pointer:coarse){button,[role="button"],[role="tab"],summary{min-height:44px}}
    @media(max-width:520px){[data-plushlife-home-stack]{gap:12px!important}.plushlife-theme-preview{height:34px}}
    @media(prefers-reduced-motion:reduce){[data-plushlife-home-item="true"],#plushlife-smart-next-step{transition:none!important;transform:none!important}}
  `;document.head.appendChild(style);

  recordVisit();
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})};
  const observer=new MutationObserver(queue);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','class','style']});
  document.addEventListener('click',queue,true);window.addEventListener('storage',queue);window.addEventListener('plushlife:task-completion-feedback',()=>setTimeout(queue,80));
  queue();
})();
