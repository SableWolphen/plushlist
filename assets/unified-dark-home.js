(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeUnifiedDarkHomeInstalled) return;
  window.__plushlifeUnifiedDarkHomeInstalled = true;

  const style = document.createElement("style");
  style.id = "plushlife-unified-dark-home";
  style.textContent = `
    html[data-plushlife-color-mode="dark"]{
      --plush-bg:#17121f;
      --plush-surface:#21192a;
      --plush-surface-2:#2a2034;
      --plush-surface-3:#32253f;
      --plush-border:#493957;
      --plush-border-soft:#3b2d47;
      --plush-text:#f7eff9;
      --plush-copy:#cdbfd3;
      --plush-muted:#aa99b2;
      --plush-accent:#d47ad8;
      --plush-accent-2:#9870c9;
      --plush-pink:#f07ab4;
    }

    html[data-plushlife-color-mode="dark"] body,
    html[data-plushlife-color-mode="dark"] #root{background:var(--plush-bg)!important}

    html[data-plushlife-color-mode="dark"] [data-plushlife-home-stack]{gap:14px!important;overflow:visible!important}
    html[data-plushlife-color-mode="dark"] [data-plushlife-home-stack] > *{margin:0!important}

    html[data-plushlife-color-mode="dark"] #plushlife-growth-checkin,
    html[data-plushlife-color-mode="dark"] #plushlife-adaptive-capacity-card{
      background:var(--plush-surface)!important;
      border:1px solid var(--plush-border)!important;
      border-radius:20px!important;
      box-shadow:none!important;
      color:var(--plush-text)!important;
      padding:16px!important;
      margin:0!important;
    }
    html[data-plushlife-color-mode="dark"] #plushlife-growth-checkin strong,
    html[data-plushlife-color-mode="dark"] #plushlife-adaptive-capacity-card strong,
    html[data-plushlife-color-mode="dark"] .plushlife-capacity-title{color:var(--plush-text)!important}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-checkin p,
    html[data-plushlife-color-mode="dark"] .plushlife-capacity-coach,
    html[data-plushlife-color-mode="dark"] .plushlife-capacity-pattern{color:var(--plush-copy)!important}

    html[data-plushlife-color-mode="dark"] .plushlife-growth-choices{gap:9px!important;margin-top:12px!important}
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice,
    html[data-plushlife-color-mode="dark"] .plushlife-adaptive-btn{
      background:var(--plush-surface-2)!important;
      border:1px solid var(--plush-border)!important;
      color:var(--plush-text)!important;
      border-radius:15px!important;
      box-shadow:none!important;
    }
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice{min-height:78px!important;font-size:13px!important}
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice span{font-size:25px!important;margin-bottom:5px!important}
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice small{color:var(--plush-copy)!important;font-size:10.5px!important}
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice:focus-visible,
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice:hover{
      border-color:var(--plush-accent)!important;
      box-shadow:0 0 0 3px rgba(212,122,216,.12)!important;
      transform:none!important;
    }

    html[data-plushlife-color-mode="dark"] #plushlife-adaptive-intro,
    html[data-plushlife-color-mode="dark"] #plushlife-next-step-reason{
      background:var(--plush-surface-3)!important;
      border:0!important;
      color:var(--plush-copy)!important;
      border-radius:13px!important;
      box-shadow:none!important;
    }
    html[data-plushlife-color-mode="dark"] #plushlife-adaptive-intro{padding:9px 11px!important;margin-top:10px!important}

    html[data-plushlife-color-mode="dark"] #plushlife-smart-next-step{
      background:linear-gradient(145deg,#2b1e2b,#251b31)!important;
      border:1px solid rgba(240,122,180,.58)!important;
      border-radius:20px!important;
      box-shadow:0 10px 28px rgba(8,3,12,.18)!important;
      padding:16px!important;
    }
    html[data-plushlife-color-mode="dark"] #plushlife-smart-next-step button{
      border-radius:13px!important;
      box-shadow:none!important;
    }

    html[data-plushlife-color-mode="dark"] [data-plushlife-home-stack] [role="tablist"]{
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      gap:7px!important;
      padding:0!important;
    }
    html[data-plushlife-color-mode="dark"] [data-plushlife-home-stack] [role="tablist"] [role="tab"]{
      min-height:54px!important;
      background:var(--plush-surface)!important;
      border:1px solid var(--plush-border-soft)!important;
      color:var(--plush-copy)!important;
      border-radius:15px!important;
      box-shadow:none!important;
    }
    html[data-plushlife-color-mode="dark"] [data-plushlife-home-stack] [role="tablist"] [role="tab"][aria-selected="true"]{
      background:var(--plush-surface-2)!important;
      border-color:var(--plush-accent)!important;
      color:var(--plush-text)!important;
      box-shadow:0 0 0 2px rgba(212,122,216,.10)!important;
    }

    html[data-plushlife-color-mode="dark"] #plushlife-resume-context{
      top:auto!important;
      bottom:max(14px,calc(env(safe-area-inset-bottom) + 10px))!important;
      width:min(calc(100vw - 24px),520px)!important;
      padding:10px!important;
      border-radius:18px!important;
      background:rgba(33,25,42,.96)!important;
      border:1px solid var(--plush-border)!important;
      box-shadow:0 14px 40px rgba(0,0,0,.34)!important;
      backdrop-filter:blur(14px)!important;
    }
    html[data-plushlife-color-mode="dark"] #plushlife-resume-context .plushlife-resume-copy strong{font-size:12px!important;color:var(--plush-text)!important}
    html[data-plushlife-color-mode="dark"] #plushlife-resume-context .plushlife-resume-copy span{color:var(--plush-copy)!important}
    html[data-plushlife-color-mode="dark"] #plushlife-resume-context button{
      background:var(--plush-surface-2)!important;
      color:var(--plush-text)!important;
      border-color:var(--plush-border)!important;
    }
    html:has([data-plush-checkin-overlay="true"]) #plushlife-resume-context{display:none!important}

    html[data-plushlife-color-mode="dark"] [data-plush-checkin-card="true"]{
      --pc-bg:linear-gradient(155deg,#2d203d 0%,#21182e 50%,#17121f 100%)!important;
      --pc-panel:rgba(45,34,58,.84)!important;
      --pc-panel-strong:#342641!important;
      --pc-text:#fff7ff!important;
      --pc-copy:#d5c8dc!important;
      --pc-label:#ef9be4!important;
      --pc-border:#5b456b!important;
      --pc-border-strong:#8b5dc0!important;
      --pc-accent:#ef7ce3!important;
      --pc-accent2:#a576dd!important;
      --pc-glow:rgba(239,124,227,.28)!important;
      box-shadow:0 28px 86px rgba(0,0,0,.52)!important;
    }

    html[data-plushlife-color-mode="dark"] [data-plush-checkin-choice="true"],
    html[data-plushlife-color-mode="dark"] [data-plush-checkin-comfort="true"],
    html[data-plushlife-color-mode="dark"] [data-plush-checkin-customize="true"]{
      background:#2a2035!important;
      border-color:#584568!important;
      box-shadow:none!important;
    }
    html[data-plushlife-color-mode="dark"] [data-plush-checkin-choice="true"][aria-pressed="true"]{
      background:linear-gradient(145deg,#5b2f62,#39264d)!important;
      border-color:#ef7ce3!important;
      box-shadow:0 0 0 3px rgba(239,124,227,.10),0 8px 22px rgba(239,124,227,.14)!important;
    }

    @media(max-width:520px){
      html[data-plushlife-color-mode="dark"] #plushlife-resume-context{grid-template-columns:minmax(0,1fr) auto!important}
      html[data-plushlife-color-mode="dark"] [data-plushlife-home-stack]{gap:12px!important}
      html[data-plushlife-color-mode="dark"] #plushlife-growth-checkin,
      html[data-plushlife-color-mode="dark"] #plushlife-adaptive-capacity-card,
      html[data-plushlife-color-mode="dark"] #plushlife-smart-next-step{padding:14px!important;border-radius:18px!important}
    }
  `;
  document.head.appendChild(style);

  function sync() {
    const modalOpen = !!document.querySelector('[data-plush-checkin-overlay="true"]');
    document.documentElement.toggleAttribute("data-plushlife-checkin-open", modalOpen);
    const resume = document.getElementById("plushlife-resume-context");
    if (resume) resume.setAttribute("aria-hidden", modalOpen ? "true" : "false");
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sync(); });
  };
  const observer = new MutationObserver(queue);
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:["style","class","aria-hidden"] });
  document.addEventListener("click", queue, true);
  queue();
})();
