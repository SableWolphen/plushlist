(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeCheckinThemeInstalled) return;
  window.__plushlifeCheckinThemeInstalled = true;

  const STYLE_ID = "plushlife-checkin-theme-styles";
  const MOODS = new Set(["Happy", "Calm", "Okay", "Tired", "Stressed", "Anxious", "Sad", "Angry", "Lonely", "Overwhelmed", "Numb", "Sick"]);
  const PLANS = new Set(["Full", "Soft", "Tiny", "Recovery", "Rest"]);

  const css = `
  [data-plush-checkin-overlay="true"]{
    background:rgba(24,13,39,.64)!important;
    backdrop-filter:blur(15px) saturate(.9)!important;
    -webkit-backdrop-filter:blur(15px) saturate(.9)!important;
    padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom))!important;
    align-items:center!important;
  }
  [data-plush-checkin-card="true"]{
    --pc-bg:linear-gradient(155deg,#fffdfd 0%,#fff8fb 54%,#faf8ff 100%);
    --pc-panel:rgba(255,255,255,.86);
    --pc-panel-strong:#fff;
    --pc-text:#542258;
    --pc-copy:#7a6a8f;
    --pc-label:#a72c98;
    --pc-border:#ddc8ed;
    --pc-border-strong:#f08ad9;
    --pc-accent:#e54ecf;
    --pc-accent2:#9f70ee;
    --pc-glow:rgba(229,78,207,.28);
    --pc-shadow:rgba(77,40,94,.24);
    width:min(calc(100vw - 28px),600px)!important;
    max-height:min(91dvh,900px)!important;
    box-sizing:border-box!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    padding:27px 25px 24px!important;
    border-radius:34px!important;
    border:1.5px solid var(--pc-border-strong)!important;
    background:var(--pc-bg)!important;
    color:var(--pc-text)!important;
    box-shadow:0 28px 90px var(--pc-shadow),inset 0 1px 0 rgba(255,255,255,.78)!important;
    position:relative!important;
    isolation:isolate;
    scrollbar-width:none;
  }
  [data-plush-checkin-card="true"]::-webkit-scrollbar{display:none}
  [data-plush-checkin-card="true"]:before{
    content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;
    background:
      radial-gradient(circle at 86% 7%,rgba(255,151,226,.24),transparent 19%),
      radial-gradient(circle at 12% 96%,rgba(183,151,255,.13),transparent 22%);
  }
  [data-plush-checkin-card="true"][data-plush-checkin-scheme="dark"]{
    --pc-bg:linear-gradient(155deg,#35254b 0%,#251936 48%,#171226 100%);
    --pc-panel:rgba(32,25,50,.72);
    --pc-panel-strong:rgba(38,28,57,.96);
    --pc-text:#fff5ff;
    --pc-copy:#ded5eb;
    --pc-label:#f1a4e9;
    --pc-border:#66517f;
    --pc-border-strong:#8154bd;
    --pc-accent:#f37be9;
    --pc-accent2:#a77bff;
    --pc-glow:rgba(240,92,225,.34);
    --pc-shadow:rgba(3,0,14,.62);
    box-shadow:0 34px 100px rgba(2,0,12,.64),0 0 32px rgba(143,82,209,.18),inset 0 1px 0 rgba(255,255,255,.07)!important;
  }
  [data-plush-checkin-card="true"][data-plush-checkin-scheme="dark"]:before{
    background:
      radial-gradient(circle at 86% 7%,rgba(229,112,220,.20),transparent 20%),
      radial-gradient(circle at 8% 96%,rgba(128,91,210,.16),transparent 24%);
  }

  [data-plush-checkin-header="true"]{
    display:block!important;position:relative!important;min-height:168px!important;padding:0!important;
  }
  [data-plush-checkin-header-copy="true"]{padding-right:112px!important}
  [data-plush-checkin-header="true"]:after{
    content:"🧸";position:absolute;right:46px;top:65px;width:94px;height:78px;display:grid;place-items:center;
    font-size:58px;line-height:1;filter:drop-shadow(0 10px 14px rgba(72,40,89,.24));z-index:0;
    border-radius:50% 50% 42% 42%;
    background:radial-gradient(ellipse at 50% 84%,rgba(196,157,236,.48),rgba(238,187,232,.16) 64%,transparent 66%);
  }
  [data-plush-checkin-header="true"]:before{
    content:"✦  ♥";position:absolute;right:24px;top:42px;color:#ff8ed7;font-size:17px;letter-spacing:18px;opacity:.88;z-index:1;
    text-shadow:0 0 12px rgba(255,130,222,.45);
  }
  [data-plush-checkin-eyebrow="true"]{
    color:var(--pc-label)!important;font-size:13px!important;letter-spacing:.17em!important;font-weight:950!important;
    text-shadow:0 0 14px var(--pc-glow)!important;
  }
  #checkin-popup-title{
    margin-top:7px!important;color:var(--pc-text)!important;font-family:"Baloo 2",ui-rounded,system-ui,sans-serif!important;
    font-size:clamp(27px,6.7vw,37px)!important;line-height:1.06!important;letter-spacing:-.035em!important;font-weight:900!important;
    max-width:420px!important;
  }
  [data-plush-checkin-subtitle="true"]{
    margin-top:10px!important;color:var(--pc-copy)!important;font-size:14.5px!important;line-height:1.48!important;max-width:430px!important;
  }
  [data-plush-checkin-comfort="true"]{
    position:relative!important;z-index:2!important;width:calc(100% + 112px)!important;box-sizing:border-box!important;
    min-height:58px!important;margin-top:22px!important;padding:13px 48px 13px 17px!important;border-radius:20px!important;
    border:1px solid var(--pc-border)!important;background:var(--pc-panel)!important;color:var(--pc-text)!important;
    display:flex!important;align-items:center!important;font-size:14.5px!important;font-weight:900!important;
    box-shadow:0 9px 22px rgba(62,39,82,.08)!important;
  }
  [data-plush-checkin-comfort="true"]:after{
    content:"›";position:absolute;right:18px;top:50%;transform:translateY(-54%);font-size:29px;line-height:1;color:var(--pc-text);font-weight:500;
  }
  [data-plush-checkin-close="true"]{
    position:absolute!important;right:0!important;top:0!important;z-index:5!important;width:55px!important;height:55px!important;padding:0!important;
    display:grid!important;place-items:center!important;border-radius:20px!important;border:1px solid var(--pc-border)!important;
    background:var(--pc-panel-strong)!important;color:var(--pc-text)!important;font-size:25px!important;line-height:1!important;
    box-shadow:0 10px 26px rgba(51,30,70,.14)!important;
  }

  [data-plush-checkin-section-row="true"]{margin-top:20px!important;gap:10px!important}
  [data-plush-checkin-section-title="true"]{
    color:var(--pc-label)!important;font-size:12.5px!important;letter-spacing:.14em!important;font-weight:950!important;
  }
  [data-plush-checkin-more="true"]{
    min-height:42px!important;padding:8px 15px!important;border-radius:999px!important;border:1px solid var(--pc-border)!important;
    background:var(--pc-panel)!important;color:var(--pc-text)!important;font-size:12.5px!important;font-weight:900!important;
    box-shadow:none!important;
  }
  [data-plush-checkin-more="true"]:after{content:"  ›";font-size:18px;vertical-align:-1px}

  [data-plush-checkin-mood-grid="true"],
  [data-plush-checkin-plan-grid="true"]{
    display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;margin-top:10px!important;
  }
  [data-plush-checkin-choice="true"]{
    min-width:0!important;min-height:96px!important;padding:13px 6px!important;border-radius:19px!important;
    border:1px solid var(--pc-border)!important;background:var(--pc-panel)!important;color:var(--pc-text)!important;
    box-shadow:0 7px 18px rgba(49,31,65,.055)!important;text-align:center!important;
    transition:transform .14s ease,border-color .14s ease,background .14s ease,box-shadow .14s ease!important;
  }
  [data-plush-checkin-choice="true"]>div:first-child{font-size:31px!important;line-height:1.05!important}
  [data-plush-checkin-choice="true"]>div:last-child{margin-top:6px!important;color:var(--pc-text)!important;font-size:13.5px!important;font-weight:900!important;line-height:1.15!important}
  [data-plush-checkin-choice="true"][aria-pressed="true"]{
    border:2px solid var(--pc-accent)!important;
    background:linear-gradient(145deg,color-mix(in srgb,var(--pc-accent) 18%,var(--pc-panel)),color-mix(in srgb,var(--pc-accent2) 10%,var(--pc-panel)))!important;
    box-shadow:0 0 0 3px color-mix(in srgb,var(--pc-accent) 13%,transparent),0 9px 28px var(--pc-glow)!important;
    transform:translateY(-1px)!important;
  }

  [data-plush-checkin-guess="true"]{display:none!important}
  [data-plush-checkin-plan-heading="true"]{margin-top:24px!important}
  [data-plush-checkin-plan-copy="true"]{
    margin-top:7px!important;color:var(--pc-copy)!important;font-size:13.5px!important;line-height:1.48!important;
  }
  [data-plush-checkin-plan="true"]{min-height:104px!important;position:relative!important}
  [data-plush-checkin-plan="true"]>div:first-child{font-size:31px!important}
  [data-plush-checkin-plan="true"][aria-pressed="true"]:after{
    content:"✓";position:absolute;right:9px;top:9px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;
    background:var(--pc-accent);color:#fff;font:950 14px/1 system-ui,sans-serif;box-shadow:0 4px 12px var(--pc-glow);
  }

  [data-plush-checkin-customize="true"]{
    width:100%!important;min-height:62px!important;margin-top:18px!important;padding:12px 18px!important;border-radius:20px!important;
    border:1px solid var(--pc-border)!important;background:var(--pc-panel)!important;color:var(--pc-text)!important;
    font-size:13.5px!important;font-weight:900!important;box-shadow:0 8px 20px rgba(50,30,68,.05)!important;text-align:center!important;
  }
  [data-plush-checkin-customize="true"]:before{content:"⚙  ";font-size:20px;vertical-align:-2px}

  [data-plush-checkin-cta="true"]{
    width:100%!important;min-height:68px!important;margin-top:22px!important;padding:13px 22px!important;border-radius:999px!important;
    border:1px solid #f17ade!important;background:linear-gradient(90deg,#ffd5f6 0%,#efa3ec 48%,#dda1ff 100%)!important;
    color:#33153f!important;font-size:17px!important;font-weight:950!important;letter-spacing:-.01em!important;
    box-shadow:0 14px 34px rgba(220,86,202,.28),inset 0 1px 0 rgba(255,255,255,.82)!important;
  }
  [data-plush-checkin-cta="true"]:after{content:"  ›";font-size:26px;vertical-align:-2px}
  [data-plush-checkin-cta="true"]:disabled{opacity:.78!important;filter:saturate(.82)!important;cursor:not-allowed!important}
  [data-plush-checkin-card="true"][data-plush-checkin-scheme="dark"] [data-plush-checkin-cta="true"]{
    box-shadow:0 14px 36px rgba(236,95,224,.36),0 0 28px rgba(219,91,238,.16)!important;
  }
  [data-plush-checkin-card="true"] button:focus-visible{outline:3px solid var(--pc-accent)!important;outline-offset:3px!important}
  [data-plush-checkin-card="true"] button:not(:disabled):active{transform:scale(.985)}

  @media(max-width:480px){
    [data-plush-checkin-card="true"]{width:calc(100vw - 24px)!important;padding:24px 20px 21px!important;border-radius:31px!important;max-height:92dvh!important}
    [data-plush-checkin-header="true"]{min-height:159px!important}
    [data-plush-checkin-header-copy="true"]{padding-right:91px!important}
    [data-plush-checkin-header="true"]:after{right:39px;top:66px;width:78px;height:64px;font-size:48px}
    [data-plush-checkin-header="true"]:before{right:13px;top:43px;font-size:14px;letter-spacing:15px}
    [data-plush-checkin-comfort="true"]{width:calc(100% + 91px)!important;min-height:55px!important;padding:11px 42px 11px 14px!important;margin-top:18px!important}
    [data-plush-checkin-close="true"]{width:50px!important;height:50px!important;border-radius:18px!important}
    #checkin-popup-title{font-size:29px!important;max-width:330px!important}
    [data-plush-checkin-subtitle="true"]{font-size:13.5px!important}
    [data-plush-checkin-choice="true"]{min-height:88px!important;border-radius:17px!important}
    [data-plush-checkin-choice="true"]>div:first-child{font-size:28px!important}
    [data-plush-checkin-choice="true"]>div:last-child{font-size:12.5px!important}
    [data-plush-checkin-plan="true"]{min-height:94px!important}
    [data-plush-checkin-cta="true"]{min-height:63px!important;font-size:16px!important}
  }
  @media(max-width:370px){
    [data-plush-checkin-card="true"]{padding-left:15px!important;padding-right:15px!important}
    #checkin-popup-title{font-size:26px!important}
    [data-plush-checkin-mood-grid="true"],[data-plush-checkin-plan-grid="true"]{gap:7px!important}
    [data-plush-checkin-choice="true"]{min-height:82px!important;padding-left:3px!important;padding-right:3px!important}
  }
  `;

  function installStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement("style");style.id=STYLE_ID;document.head.appendChild(style)}
    style.textContent=css;
  }
  function clean(value){return String(value||"").replace(/\s+/g," ").trim()}
  function detectScheme(){
    return "light";
  }
  function tagLeaf(root,regex,attr){
    const node=[...root.querySelectorAll("div,p,span")].find((item)=>!item.children.length&&regex.test(clean(item.textContent)));
    if(node) node.setAttribute(attr,"true");
    return node;
  }
  function polishDialog(){
    const title=document.getElementById("checkin-popup-title");
    if(!title) return;
    const overlay=title.closest('div[role="dialog"]');
    const card=overlay?.firstElementChild||title.parentElement?.parentElement?.parentElement;
    if(!overlay||!card) return;
    overlay.dataset.plushCheckinOverlay="true";
    card.dataset.plushCheckinCard="true";
    card.dataset.plushCheckinScheme=detectScheme();

    const header=title.parentElement?.parentElement;
    if(header){
      header.dataset.plushCheckinHeader="true";
      if(title.parentElement) title.parentElement.dataset.plushCheckinHeaderCopy="true";
      const eyebrow=[...header.querySelectorAll("div")].find((node)=>/CHECK-IN$/i.test(clean(node.textContent))&&!node.children.length);
      if(eyebrow) eyebrow.dataset.plushCheckinEyebrow="true";
      const subtitle=title.nextElementSibling;
      if(subtitle&&/pick one feeling|how are you/i.test(clean(subtitle.textContent))) subtitle.dataset.plushCheckinSubtitle="true";
      const comfort=[...header.querySelectorAll("div")].find((node)=>/^🧸\s*Is .+ nearby\?/i.test(clean(node.textContent)));
      if(comfort) comfort.dataset.plushCheckinComfort="true";
      const close=header.querySelector('button[aria-label="Close"]');
      if(close) close.dataset.plushCheckinClose="true";
    }

    const feelingTitle=tagLeaf(card,/^(TELL .+ YOUR FEELING|HOW DO YOU FEEL\?)$/i,"data-plush-checkin-section-title");
    if(feelingTitle?.parentElement) feelingTitle.parentElement.dataset.plushCheckinSectionRow="true";
    const planTitle=tagLeaf(card,/^CHOOSE TODAY'S PLAN$/i,"data-plush-checkin-section-title");
    if(planTitle) planTitle.dataset.plushCheckinPlanHeading="true";
    const planCopy=[...card.querySelectorAll("div")].find((node)=>!node.children.length&&/Pick the size of day you actually have/i.test(clean(node.textContent)));
    if(planCopy) planCopy.dataset.plushCheckinPlanCopy="true";

    [...card.querySelectorAll("button")].forEach((button)=>{
      const text=clean(button.textContent).replace(/[⌃⌄]/g,"").trim();
      if(/^(More feelings|Fewer)$/i.test(text)) button.dataset.plushCheckinMore="true";
      if(MOODS.has(text)) button.dataset.plushCheckinChoice="true";
      if(PLANS.has(text)){button.dataset.plushCheckinChoice="true";button.dataset.plushCheckinPlan="true"}
      if(/^(Customize today · optional|Hide extra options)/i.test(text)) button.dataset.plushCheckinCustomize="true";
      if(/^(Choose the closest feeling|All done for now|Looks good)/i.test(text)) button.dataset.plushCheckinCta="true";
    });
    const moodButtons=[...card.querySelectorAll('button[data-plush-checkin-choice="true"]')].filter((b)=>MOODS.has(clean(b.textContent)));
    if(moodButtons.length) moodButtons[0].parentElement.dataset.plushCheckinMoodGrid="true";
    const planButtons=[...card.querySelectorAll('button[data-plush-checkin-plan="true"]')];
    if(planButtons.length) planButtons[0].parentElement.dataset.plushCheckinPlanGrid="true";
    const guess=[...card.querySelectorAll("div")].find((node)=>/gentle guess/i.test(clean(node.textContent)));
    if(guess?.parentElement) guess.parentElement.dataset.plushCheckinGuess="true";

    try{
      const statusBar=window.Capacitor?.Plugins?.StatusBar;
      statusBar?.setStyle?.({style:card.dataset.plushCheckinScheme==="dark"?"LIGHT":"DARK"}).catch?.(()=>{});
    }catch(_){}
  }

  installStyle();
  let queued=false;
  const queue=()=>{
    if(queued) return;queued=true;
    requestAnimationFrame(()=>{queued=false;polishDialog()});
  };
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","aria-pressed","data-plushlife-color-mode"]});
  window.addEventListener("storage",queue);
  document.addEventListener("click",queue,true);
  queue();
})();
