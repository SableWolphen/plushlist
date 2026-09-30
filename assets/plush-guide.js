(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const GUIDE_ID = "plushlife-feature-guide";
  const ENTRY_ID = "plushlife-guide-entry";
  const TOUR_ID = "plushlife-guide-tour";

  document.getElementById(GUIDE_ID)?.remove();
  document.getElementById(TOUR_ID)?.remove();
  document.getElementById(ENTRY_ID)?.remove();
  window.__plushlifeGuideInstalled = true;

  const FEATURES = {
    rescue: { icon:"🧸", name:"PlushRescue", dashboard:"today", summary:"Make today smaller, choose one next step, or soften pressure.", what:"PlushRescue helps when the full day feels like too much. It makes the next step feel smaller without deleting your original tasks.", when:"Use it when you feel stuck, overloaded, behind, or need a gentler version of today.", openLabels:["plushrescue","rescue"], tour:[
      { title:"This is PlushRescue", text:"This space is for making the next step feel smaller. Nothing here erases your original tasks.", labels:["plushrescue","rescue active"], fallback:"dashboard-tab-today" },
      { title:"Choose what would help", text:"Pick the option that matches your capacity right now. PlushRescue is meant to reduce pressure, not add another obligation.", labels:["make today smaller","give me one next step","pause the pressure"] }
    ]},
    focus: { icon:"🎯", name:"PlushFocus", dashboard:"today", summary:"See one clear task without the rest of the day crowding you.", what:"PlushFocus keeps the rest of the list out of the way and puts one useful next task in front of you.", when:"Use it when seeing everything at once makes it harder to start.", openLabels:["plushfocus","focus"], tour:[
      { title:"One thing at a time", text:"PlushFocus intentionally keeps the rest of the list out of the way so you can concentrate on the next useful step.", labels:["plushfocus","focus mode","focus"], fallback:"dashboard-tab-today" },
      { title:"You stay in control", text:"Finish, skip, or leave Focus whenever you need. Your underlying task list stays intact.", labels:["next","done","complete","exit"] }
    ]},
    calendar: { icon:"📅", name:"PlushCalendar", dashboard:"week", summary:"See Month, Week, and Day views.", what:"PlushCalendar lets you look ahead at routines and tasks by date instead of only seeing today.", when:"Use it to understand what is coming up, spot busy days, or review a week or month.", tour:[
      { title:"Your calendar view", text:"This is where scheduled PlushLife items are organized by date.", labels:["plushcalendar","calendar"], fallback:"dashboard-tab-week" },
      { title:"Month", text:"Month view gives you the big picture and helps you spot patterns across several weeks.", labels:["month"] },
      { title:"Week", text:"Week view is useful for planning the next few days without seeing an entire month at once.", labels:["week"] },
      { title:"Day", text:"Day view zooms in on one date so you can see exactly what belongs there.", labels:["day"] }
    ]},
    progress: { icon:"📈", name:"PlushProgress", dashboard:"progress", summary:"Review trends, consistency, and what is helping.", what:"PlushProgress turns completed routines into a gentle history of consistency and patterns. It is for noticing progress, not grading yourself.", when:"Use it when you want to see what has been working over time.", tour:[
      { title:"Your progress, not a score", text:"This area summarizes what you have actually done over time. A lower day is information, not a failure.", labels:["plushprogress","progress"], fallback:"dashboard-tab-progress" },
      { title:"Look for patterns", text:"Use the trends and consistency views to notice routines that are sticking and days that may need more support.", labels:["trends","consistency","history"] }
    ]},
    calm: { icon:"🌙", name:"PlushCalm", dashboard:"care", summary:"Open grounding, sound, breathing, and gentle-care tools.", what:"PlushCalm collects short calming and grounding tools in one place.", when:"Use it when you want a breathing exercise, grounding prompt, comforting sound, or another low-pressure care tool.", openLabels:["plushcalm","calm"], tour:[
      { title:"PlushCalm", text:"Choose the kind of support that fits the moment. You do not have to complete every tool.", labels:["plushcalm","calm"], fallback:"dashboard-tab-care" },
      { title:"Pick a care tool", text:"Breathing, grounding, sounds, and other gentle tools can be opened individually whenever they are useful.", labels:["breathing","grounding","sounds","comfort"] }
    ]},
    journal: { icon:"📖", name:"PlushJournal", dashboard:"today", summary:"Write a private reflection or return to today’s prompt.", what:"PlushJournal gives you a private prompt and space to write.", when:"Use it when you want to capture what happened or reflect on how you feel.", tour:[
      { title:"Today’s prompt", text:"The prompt is simply a starting point. You can answer it in your own words.", labels:["today's prompt","today’s prompt","plushjournal"], fallback:"dashboard-tab-today" },
      { title:"Your private entry", text:"This is your writing space. Saving an entry does not turn it into a task or share it with other users.", labels:["you wrote","journal","reflection"] }
    ]},
    paths: { icon:"🌿", name:"PlushPaths", dashboard:"care", summary:"Open guided routines and care paths.", what:"PlushPaths are guided, multi-step experiences that help you work through a routine or care goal over time.", when:"Use one when you want more guidance than a single task.", openLabels:["plushpaths","paths"], tour:[
      { title:"Choose a PlushPath", text:"Each path tells you what it is for before you begin.", labels:["plushpaths","paths"], fallback:"dashboard-tab-care" },
      { title:"Continue at your pace", text:"Start or continue a path when you are ready. Your progress is saved.", labels:["start","continue","resume"] }
    ]},
    tasks: { icon:"✅", name:"Change My Tasks", dashboard:"today", summary:"Add, edit, pause, schedule, or clean up routines.", what:"This is the control center for your PlushList.", when:"Use it whenever your real life changes and the list needs to change with you.", openLabels:["change my tasks","manage tasks","edit tasks"], tour:[
      { title:"Your task controls", text:"This area changes the structure of your list. Nothing is changed just by opening it.", labels:["change my tasks","manage tasks","edit tasks"], fallback:"dashboard-tab-today" },
      { title:"Add or edit", text:"Create something new or edit an existing routine when it needs to change.", labels:["add","edit","new task","add a task"] },
      { title:"Pause or schedule", text:"Pause a routine temporarily or adjust when it appears instead of deleting it.", labels:["pause","schedule","resume"] }
    ]},
    guardian: { icon:"🤝", name:"PlushGuardian", profile:true, summary:"Open the support connection and privacy controls.", what:"PlushGuardian is the optional support connection area.", when:"Use it to review or change a support connection, permissions, or privacy choices.", openLabels:["add a guardian","plushguardian","guardian"], tour:[
      { title:"PlushGuardian", text:"Guardian support is optional. This area is where the connection and its boundaries are managed.", labels:["add a guardian","plushguardian","guardian"] },
      { title:"Privacy stays visible", text:"Review the connection and privacy controls here before changing anything. PlushGuide itself never changes these settings.", labels:["privacy","connection","permission","my guardians"] }
    ]},
    safety: { icon:"🛟", name:"PlushSafety", profile:true, summary:"Find safety resources and account protections.", what:"PlushSafety gathers safety resources so they are easier to find when you need them.", when:"Use it when you want to review the safety resources available inside PlushLife.", openLabels:["plushsafety","safety"], tour:[
      { title:"PlushSafety", text:"This area gathers safety information and account protections in one place.", labels:["plushsafety","safety"] },
      { title:"Choose the resource you need", text:"The guide only points things out. It will never automatically contact anyone, change an account setting, or trigger a safety action.", labels:["crisis & support resources","resources","privacy"] }
    ]}
  };

  const SECTIONS = [
    ["MAKE TODAY FIT", ["rescue", "focus"]],
    ["PLAN & SEE PROGRESS", ["calendar", "progress"]],
    ["CARE FOR YOURSELF", ["calm", "journal", "paths", "tasks"]],
    ["SUPPORT & SAFETY", ["guardian", "safety"]]
  ];

  const style = document.createElement("style");
  style.textContent = `
    #${ENTRY_ID}{width:100%;margin:10px 0 2px;border:1px solid #dec5e8;border-radius:16px;background:linear-gradient(135deg,#fff8fc,#f2edff);padding:13px 14px;text-align:left;color:#5b4b6b;font:800 14px system-ui,sans-serif;cursor:pointer}
    #${ENTRY_ID} small{display:block;margin-top:4px;font-weight:500;line-height:1.35;opacity:.78}
    #${GUIDE_ID}{position:fixed;inset:0;z-index:2147483200;background:#32243b99;display:grid;place-items:end center;padding:16px 14px calc(16px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #${GUIDE_ID} .pg-card{width:min(540px,100%);max-height:86vh;overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    #${GUIDE_ID} .pg-head{display:flex;gap:12px;align-items:flex-start} #${GUIDE_ID} .pg-head>div{flex:1}
    #${GUIDE_ID} h2{margin:4px 0 5px;font-size:22px} #${GUIDE_ID} p{margin:0;line-height:1.45}
    #${GUIDE_ID} .pg-close{border:0;background:transparent;color:#806d8d;font-size:25px;cursor:pointer;min-width:44px;min-height:44px}
    #${GUIDE_ID} .pg-section{margin-top:16px} #${GUIDE_ID} .pg-section-title{font-size:11px;font-weight:900;letter-spacing:.08em;color:#8a6b98;margin-bottom:7px}
    #${GUIDE_ID} .pg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:start}
    #${GUIDE_ID} .pg-item{border:1px solid #dec5e8;border-radius:15px;background:#fff;overflow:hidden}
    #${GUIDE_ID} .pg-action{width:100%;border:0;background:#fff;padding:11px;text-align:left;color:#5b4b6b;cursor:pointer;font:800 13px system-ui,sans-serif}
    #${GUIDE_ID} .pg-action small{display:block;margin-top:3px;font-weight:500;line-height:1.3;opacity:.75}
    #${GUIDE_ID} .pg-action .pg-chevron{float:right;font-size:12px;opacity:.65}
    #${GUIDE_ID} .pg-details{display:none;border-top:1px solid #eee0f2;padding:0 11px 12px;font-size:12.5px;line-height:1.42;color:#6e6078;background:#fffdfd}
    #${GUIDE_ID} .pg-details.open{display:block} #${GUIDE_ID} .pg-details strong{display:block;color:#5b4b6b;margin:10px 0 2px}
    #${GUIDE_ID} .pg-show{width:100%;margin-top:11px;border:0;border-radius:12px;background:#8f63a4;color:#fff;padding:10px 12px;font:800 12.5px system-ui,sans-serif;cursor:pointer}
    #${GUIDE_ID} .pg-note{margin-top:14px;padding:10px 11px;border-radius:13px;background:#f2e9f7;font-size:12px;line-height:1.4}
    #${TOUR_ID}{position:fixed;inset:0;z-index:2147483300;pointer-events:none;font-family:system-ui,sans-serif}
    #${TOUR_ID} .pgt-backdrop{position:absolute;inset:0;background:#271b3066;pointer-events:auto}
    #${TOUR_ID} .pgt-backdrop.has-spotlight{background:transparent}
    #${TOUR_ID} .pgt-spotlight{position:fixed;display:none;pointer-events:none;border:3px solid #f0b7ef;border-radius:14px;box-shadow:0 0 0 9999px #271b3066}
    #${TOUR_ID} .pgt-tip{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(420px,calc(100% - 28px));border-radius:18px;background:#fff8fc;border:1px solid #dfc8e8;box-shadow:0 18px 55px #24152d66;padding:14px;color:#5b4b6b;pointer-events:auto}
    #${TOUR_ID} .pgt-tip[data-position="top"]{top:calc(18px + env(safe-area-inset-top));bottom:auto}
    #${TOUR_ID} .pgt-eyebrow{font-size:11px;font-weight:900;letter-spacing:.08em;color:#9b69aa;margin-bottom:4px}
    #${TOUR_ID} .pgt-title{font-size:17px;font-weight:900;margin-bottom:5px} #${TOUR_ID} .pgt-text{font-size:13px;line-height:1.45;color:#6f6278}
    #${TOUR_ID} .pgt-arrow{font-size:22px;text-align:center;height:24px;color:#9b69aa;line-height:24px;visibility:hidden}
    #${TOUR_ID} .pgt-controls{display:flex;align-items:center;gap:8px;margin-top:12px}
    #${TOUR_ID} .pgt-controls button{border:1px solid #ddc8e6;border-radius:11px;background:#fff;color:#5b4b6b;padding:9px 12px;font-weight:800;cursor:pointer}
    #${TOUR_ID} .pgt-controls .pgt-next{margin-left:auto;background:#8f63a4;color:#fff;border-color:#8f63a4}
    #${TOUR_ID} .pgt-count{font-size:11px;font-weight:800;opacity:.65}
    @media(max-width:390px){#${GUIDE_ID} .pg-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const clean = (value) => String(value || "").replace(/\s+/g," ").trim().toLowerCase();
  const semantic = (value) => clean(value).replace(/^[^a-z0-9]+/i, "").trim();
  const visible = (node) => !!(node && node.isConnected && node.getClientRects && node.getClientRects().length && getComputedStyle(node).visibility !== "hidden" && getComputedStyle(node).display !== "none");
  const isGuideUi = (node) => !!(node && node.closest && (node.closest(`#${GUIDE_ID}`) || node.closest(`#${TOUR_ID}`) || node.closest(`#${ENTRY_ID}`)));
  const labelText = (node) => semantic(node && (node.getAttribute("aria-label") || node.getAttribute("title") || node.textContent));
  const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const textMatches = (text, label) => text === label || text.startsWith(label + " ") || (label.length >= 5 && text.includes(label));

  function looksLikeProfilePanel(node) {
    if (!visible(node)) return false;
    const text = clean(node.textContent);
    return text.includes("settings") && text.includes("feedback") && text.includes("profile");
  }
  function profilePanel() { return Array.from(document.querySelectorAll('[role="dialog"],aside,[class*="panel"],[class*="modal"]')).find(looksLikeProfilePanel) || null; }

  function exactClickable(labels, scope) {
    const wanted = (labels || []).map(semantic).filter(Boolean);
    const root = scope || document;
    return Array.from(root.querySelectorAll('button,a,[role="button"],[role="tab"]')).find((node) => {
      if (!visible(node) || isGuideUi(node)) return false;
      const text = labelText(node);
      return wanted.some((label) => textMatches(text, label));
    }) || null;
  }

  function closeProfileIfNeeded() {
    const profile = profilePanel();
    if (!profile) return false;
    const close = Array.from(profile.querySelectorAll('button,[role="button"]')).find((node) => ["close","close profile"].includes(labelText(node)));
    if (close) { close.click(); return true; }
    return false;
  }

  async function openDashboard(id) {
    if (!id) return true;
    const tab = document.getElementById(`dashboard-tab-${id}`);
    if (!tab || !visible(tab)) return false;
    if (tab.getAttribute("aria-selected") !== "true") tab.click();
    for (let i=0;i<10;i+=1) {
      await nextPaint();
      const current = document.getElementById(`dashboard-tab-${id}`);
      if (current && current.getAttribute("aria-selected") === "true") return true;
      await sleep(12);
    }
    return document.getElementById(`dashboard-tab-${id}`)?.getAttribute("aria-selected") === "true";
  }

  function findTarget(labels, fallbackId) {
    const wanted = (labels || []).map(semantic).filter(Boolean);
    const candidates = document.querySelectorAll('h1,h2,h3,h4,[role="heading"],button,a,[role="button"],[role="tab"],label');
    for (const node of candidates) {
      if (!visible(node) || isGuideUi(node)) continue;
      const text = labelText(node);
      if (wanted.some((label) => textMatches(text, label))) return node;
    }
    const fallback = fallbackId ? document.getElementById(fallbackId) : null;
    return visible(fallback) ? fallback : null;
  }

  async function waitForTarget(labels, fallbackId, attempts=8) {
    for (let i=0;i<attempts;i+=1) {
      const target = findTarget(labels, null);
      if (target) return target;
      await nextPaint();
      if (i > 2) await sleep(18);
    }
    return findTarget(labels, fallbackId);
  }

  function closeTour() { document.getElementById(TOUR_ID)?.remove(); }

  async function positionSpotlight(tour, target) {
    if (!tour || !target || !visible(target)) return false;
    let rect = target.getBoundingClientRect();
    if (rect.bottom<=0 || rect.top>=window.innerHeight || rect.right<=0 || rect.left>=window.innerWidth) {
      target.scrollIntoView({behavior:"auto",block:"center",inline:"nearest"});
      await nextPaint(); rect = target.getBoundingClientRect();
    }
    if (!Number.isFinite(rect.top) || rect.width<16 || rect.height<16 || rect.bottom<=0 || rect.top>=window.innerHeight || rect.right<=0 || rect.left>=window.innerWidth) return false;
    const spotlight=tour.querySelector(".pgt-spotlight"), backdrop=tour.querySelector(".pgt-backdrop"), tip=tour.querySelector(".pgt-tip"), arrow=tour.querySelector(".pgt-arrow");
    const pad=8, top=Math.max(4,rect.top-pad), left=Math.max(4,rect.left-pad), width=Math.min(window.innerWidth-left-4,rect.width+pad*2), height=Math.min(window.innerHeight-top-4,rect.height+pad*2);
    if (width<24 || height<24) return false;
    Object.assign(spotlight.style,{top:`${top}px`,left:`${left}px`,width:`${width}px`,height:`${height}px`,display:"block"});
    backdrop.classList.add("has-spotlight");
    const low=rect.top+rect.height/2>window.innerHeight*.52; tip.dataset.position=low?"top":"bottom"; arrow.textContent=low?"↓":"↑"; arrow.style.visibility="visible"; return true;
  }

  async function renderTourStep(featureKey,index) {
    closeTour(); const feature=FEATURES[featureKey]; if(!feature)return;
    const safeIndex=Math.max(0,Math.min(index,feature.tour.length-1)), step=feature.tour[safeIndex];
    const tour=document.createElement("div"); tour.id=TOUR_ID; tour.setAttribute("role","dialog"); tour.setAttribute("aria-modal","true"); tour.setAttribute("aria-label",`${feature.name} guide`);
    tour.innerHTML=`<div class="pgt-backdrop" aria-hidden="true"></div><div class="pgt-spotlight" aria-hidden="true"></div><div class="pgt-tip" data-position="bottom"><div class="pgt-eyebrow">${feature.icon} ${feature.name.toUpperCase()} · STEP ${safeIndex+1} OF ${feature.tour.length}</div><div class="pgt-arrow">↑</div><div class="pgt-title">${step.title}</div><div class="pgt-text">${step.text}</div><div class="pgt-controls"><button type="button" class="pgt-close">Close</button>${safeIndex>0?'<button type="button" class="pgt-prev">Back</button>':''}<span class="pgt-count">${safeIndex+1}/${feature.tour.length}</span><button type="button" class="pgt-next">${safeIndex===feature.tour.length-1?"Done":"Next"}</button></div></div>`;
    document.body.appendChild(tour); tour.querySelector(".pgt-close").addEventListener("click",closeTour); tour.querySelector(".pgt-backdrop").addEventListener("click",closeTour);
    const prev=tour.querySelector(".pgt-prev"); if(prev)prev.addEventListener("click",()=>renderTourStep(featureKey,safeIndex-1));
    tour.querySelector(".pgt-next").addEventListener("click",()=>safeIndex===feature.tour.length-1?closeTour():renderTourStep(featureKey,safeIndex+1));
    const fallback=step.fallback || (safeIndex===0 && feature.dashboard ? `dashboard-tab-${feature.dashboard}` : null);
    const target=await waitForTarget(step.labels,fallback); if(target)await positionSpotlight(tour,target);
  }

  function closeGuide(){window.dispatchEvent(new CustomEvent("plushlife:guide-close"));document.getElementById(GUIDE_ID)?.remove();}

  async function route(featureKey) {
    const feature=FEATURES[featureKey]; if(!feature)return; closeGuide(); closeTour();
    if(feature.profile){
      const panel=profilePanel(); const button=exactClickable(feature.openLabels,panel||document); if(button){button.click(); await nextPaint(); await sleep(20);} await renderTourStep(featureKey,0); return;
    }
    closeProfileIfNeeded(); await nextPaint();
    if(!(await openDashboard(feature.dashboard))) return;
    if(feature.openLabels?.length){ const button=exactClickable(feature.openLabels); if(button && !button.id?.startsWith("dashboard-tab-")){button.click(); await nextPaint(); await sleep(20);} }
    await renderTourStep(featureKey,0);
  }

  function itemMarkup(key){const f=FEATURES[key];return `<div class="pg-item" data-feature="${key}"><button class="pg-action" type="button" aria-expanded="false">${f.icon} ${f.name}<span class="pg-chevron">⌄</span><small>${f.summary}</small></button><div class="pg-details"><strong>What it does</strong>${f.what}<strong>When it can help</strong>${f.when}<button class="pg-show" type="button">Show me →</button></div></div>`;}

  function openGuide(){
    if(document.getElementById(GUIDE_ID))return; closeTour(); const guide=document.createElement("div"); guide.id=GUIDE_ID; guide.setAttribute("role","dialog"); guide.setAttribute("aria-modal","true"); guide.setAttribute("aria-label","PlushGuide");
    guide.innerHTML=`<div class="pg-card"><div class="pg-head"><div><strong>PLUSHGUIDE</strong><h2>Everything you already have, in one place</h2><p>Tap a feature to learn what it does. Nothing opens until you choose <strong>Show me</strong>, and the walkthrough only points things out—it never changes your data.</p></div><button class="pg-close" type="button" aria-label="Close PlushGuide">×</button></div><div id="plushlife-cozy-guide-suggestion"></div>${SECTIONS.map(([title,keys])=>`<div class="pg-section"><div class="pg-section-title">${title}</div><div class="pg-grid">${keys.map(itemMarkup).join("")}</div></div>`).join("")}<div class="pg-note">PlushGuide does not create new data or change existing data. Guided tours never complete tasks. It only navigates to and points out features already built into PlushLife.</div></div>`;
    document.body.appendChild(guide); window.dispatchEvent(new CustomEvent("plushlife:guide-open")); guide.querySelector(".pg-close").addEventListener("click",closeGuide); guide.addEventListener("click",e=>{if(e.target===guide)closeGuide();});
    guide.querySelectorAll(".pg-item").forEach(item=>{const key=item.dataset.feature,action=item.querySelector(".pg-action"),details=item.querySelector(".pg-details"); action.addEventListener("click",()=>{const opening=action.getAttribute("aria-expanded")!=="true"; guide.querySelectorAll('.pg-action[aria-expanded="true"]').forEach(other=>{other.setAttribute("aria-expanded","false");other.parentElement.querySelector(".pg-details").classList.remove("open");}); action.setAttribute("aria-expanded",opening?"true":"false"); details.classList.toggle("open",opening);}); item.querySelector(".pg-show").addEventListener("click",e=>{e.stopPropagation();route(key);});});
  }

  function installEntry(){if(document.getElementById(ENTRY_ID))return; const profile=profilePanel(); if(!profile)return; const entry=document.createElement("button"); entry.id=ENTRY_ID; entry.type="button"; entry.innerHTML='✨ PlushGuide<small>Learn what PlushRescue, PlushProgress, PlushJournal, PlushGuardian, and the rest of PlushLife actually do.</small>'; entry.addEventListener("click",openGuide); const first=profile.querySelector('button,a,[role="button"]'); if(first&&first.parentElement)first.parentElement.insertBefore(entry,first); else profile.prepend(entry);}

  const observer=new MutationObserver(installEntry); observer.observe(document.documentElement,{childList:true,subtree:true}); document.addEventListener("keydown",e=>{if(e.key!=="Escape")return; if(document.getElementById(TOUR_ID))closeTour(); else closeGuide();}); installEntry();
})();
