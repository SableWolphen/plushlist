(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeUnifiedHomeInstalled) return;
  window.__plushlifeUnifiedHomeInstalled = true;

  const STORAGE_KEY = "plushlife:unified-home-theme:v1";
  const THEMES = {
    soft: {
      label: "Soft Plush Theme",
      light: { bg:"#FFF6FB", surface:"#FFFBFD", surface2:"#FFFFFF", surface3:"#F8EEF9", border:"#E7D5EC", borderSoft:"#EFE3F2", text:"#50365A", copy:"#786681", muted:"#9988A1", accent:"#C77DD6", accent2:"#A77BE2", next:"linear-gradient(145deg,#FFF4FA,#FBF1FF)", selected:"linear-gradient(145deg,#F7DFF5,#F0E3FF)" },
      dark:  { bg:"#17121F", surface:"#21192A", surface2:"#2A2034", surface3:"#32253F", border:"#493957", borderSoft:"#3B2D47", text:"#F7EFF9", copy:"#CDBFD3", muted:"#AA99B2", accent:"#D47AD8", accent2:"#9870C9", next:"linear-gradient(145deg,#2B1E2B,#251B31)", selected:"linear-gradient(145deg,#5B2F62,#39264D)" }
    },
    "soft-light": {
      label: "Soft Light",
      light: { bg:"#FFF8FB", surface:"#FFFDFE", surface2:"#FFFFFF", surface3:"#F7F1F6", border:"#E8DDE7", borderSoft:"#F0E8EF", text:"#594B60", copy:"#7D7084", muted:"#A093A6", accent:"#B999C7", accent2:"#D9B7C8", next:"linear-gradient(145deg,#FFFDFE,#F7F4FB)", selected:"linear-gradient(145deg,#F2E8F5,#FAEEF4)" },
      dark:  { bg:"#18161B", surface:"#242027", surface2:"#2C2730", surface3:"#353039", border:"#4D4652", borderSoft:"#3D3742", text:"#F4F0F5", copy:"#CBC2CD", muted:"#A89EAC", accent:"#C3A3CF", accent2:"#D5B6C6", next:"linear-gradient(145deg,#2B252D,#252128)", selected:"linear-gradient(145deg,#4A3A50,#3A313F)" }
    },
    twilight: {
      label: "Twilight Theme",
      light: { bg:"#E5DFFF", surface:"#F7F4FF", surface2:"#FFFFFF", surface3:"#EEE9FF", border:"#C8BCEC", borderSoft:"#D9D0F4", text:"#43365F", copy:"#665A80", muted:"#85799B", accent:"#6950B6", accent2:"#7FADE8", next:"linear-gradient(145deg,#F0EBFF,#E9F0FF)", selected:"linear-gradient(145deg,#DCD2FF,#DCEAFF)" },
      dark:  { bg:"#121426", surface:"#1A1D34", surface2:"#232744", surface3:"#2A2F50", border:"#424A76", borderSoft:"#343A61", text:"#F1F2FF", copy:"#C4C8E8", muted:"#9CA4CD", accent:"#9B86F0", accent2:"#73A8E9", next:"linear-gradient(145deg,#211C3C,#172642)", selected:"linear-gradient(145deg,#493E7A,#2F4F77)" }
    },
    meadow: {
      label: "Meadow Theme",
      light: { bg:"#E2F6E6", surface:"#F8FFF9", surface2:"#FFFFFF", surface3:"#EAF7EE", border:"#BEDDC8", borderSoft:"#D2E8D8", text:"#294D3B", copy:"#547262", muted:"#789487", accent:"#328660", accent2:"#75C7C1", next:"linear-gradient(145deg,#F1FBF4,#ECFAF8)", selected:"linear-gradient(145deg,#D8F0E0,#D9F3F0)" },
      dark:  { bg:"#101A17", surface:"#18231F", surface2:"#20302A", surface3:"#263A32", border:"#3A5A4D", borderSoft:"#2E493F", text:"#EEF9F3", copy:"#BED8CA", muted:"#91B1A1", accent:"#66C394", accent2:"#66C7BE", next:"linear-gradient(145deg,#1B3028,#17322F)", selected:"linear-gradient(145deg,#285941,#23514F)" }
    }
  };

  function clean(v){ return String(v || "").replace(/\s+/g," ").trim(); }
  function saveTheme(id){ try { localStorage.setItem(STORAGE_KEY,id); } catch (_) {} }
  function savedTheme(){ try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (_) { return ""; } }

  function inferTheme(){
    const pressed = [...document.querySelectorAll('button[aria-pressed="true"]')].map((b)=>clean(b.textContent));
    for (const [id, theme] of Object.entries(THEMES)) if (pressed.some((t)=>t.includes(theme.label))) return id;
    const html = [...document.querySelectorAll('[style]')].map((n)=>String(n.getAttribute('style')||'').toUpperCase()).join(' ');
    if (html.includes('#6950B6') || html.includes('#DDD4FF') || html.includes('#9784E6')) return 'twilight';
    if (html.includes('#328660') || html.includes('#D9F2DE') || html.includes('#77C98B')) return 'meadow';
    if (html.includes('#B999C7') || html.includes('#FFF8FB')) return 'soft-light';
    if (html.includes('#C77DD6') || html.includes('#FFF6FB')) return 'soft';
    return savedTheme() || 'soft';
  }

  function applyPalette(){
    const id = inferTheme();
    const mode = document.documentElement.dataset.plushlifeColorMode === 'dark' ? 'dark' : 'light';
    const p = THEMES[id]?.[mode] || THEMES.soft[mode];
    const root = document.documentElement;
    root.dataset.plushlifeHomeTheme = id;
    saveTheme(id);
    const vars = {
      '--plush-bg':p.bg,'--plush-surface':p.surface,'--plush-surface-2':p.surface2,'--plush-surface-3':p.surface3,
      '--plush-border':p.border,'--plush-border-soft':p.borderSoft,'--plush-text':p.text,'--plush-copy':p.copy,
      '--plush-muted':p.muted,'--plush-accent':p.accent,'--plush-accent-2':p.accent2,'--plush-next':p.next,'--plush-selected':p.selected
    };
    Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));
  }

  const style = document.createElement('style');
  style.id = 'plushlife-unified-home';
  style.textContent = `
    [data-plushlife-home-stack]{gap:14px!important;overflow:visible!important}
    [data-plushlife-home-stack]>*{margin:0!important}
    #plushlife-growth-checkin,#plushlife-adaptive-capacity-card{background:var(--plush-surface)!important;border:1px solid var(--plush-border)!important;border-radius:20px!important;box-shadow:none!important;color:var(--plush-text)!important;padding:16px!important;margin:0!important}
    #plushlife-growth-checkin strong,#plushlife-adaptive-capacity-card strong,.plushlife-capacity-title{color:var(--plush-text)!important}
    #plushlife-growth-checkin p,.plushlife-capacity-coach,.plushlife-capacity-pattern{color:var(--plush-copy)!important}
    .plushlife-growth-choices{gap:9px!important;margin-top:12px!important}
    .plushlife-growth-choice,.plushlife-adaptive-btn{background:var(--plush-surface-2)!important;border:1px solid var(--plush-border)!important;color:var(--plush-text)!important;border-radius:15px!important;box-shadow:none!important}
    .plushlife-growth-choice{min-height:78px!important;font-size:13px!important}.plushlife-growth-choice span{font-size:25px!important;margin-bottom:5px!important}.plushlife-growth-choice small{color:var(--plush-copy)!important;font-size:10.5px!important}
    .plushlife-growth-choice:hover,.plushlife-growth-choice:focus-visible{border-color:var(--plush-accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--plush-accent) 14%,transparent)!important;transform:none!important}
    #plushlife-adaptive-intro,#plushlife-next-step-reason{background:var(--plush-surface-3)!important;border:0!important;color:var(--plush-copy)!important;border-radius:13px!important;box-shadow:none!important}
    #plushlife-adaptive-intro{padding:9px 11px!important;margin-top:10px!important}
    #plushlife-smart-next-step{background:var(--plush-next)!important;border:1px solid color-mix(in srgb,var(--plush-accent) 60%,var(--plush-border))!important;border-radius:20px!important;box-shadow:0 10px 28px color-mix(in srgb,var(--plush-bg) 28%,transparent)!important;padding:16px!important}
    #plushlife-smart-next-step button{border-radius:13px!important;box-shadow:none!important}
    [data-plushlife-home-stack] [role="tablist"]{background:transparent!important;border:0!important;box-shadow:none!important;gap:7px!important;padding:0!important}
    [data-plushlife-home-stack] [role="tablist"] [role="tab"]{min-height:54px!important;background:var(--plush-surface)!important;border:1px solid var(--plush-border-soft)!important;color:var(--plush-copy)!important;border-radius:15px!important;box-shadow:none!important}
    [data-plushlife-home-stack] [role="tablist"] [role="tab"][aria-selected="true"]{background:var(--plush-surface-2)!important;border-color:var(--plush-accent)!important;color:var(--plush-text)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--plush-accent) 12%,transparent)!important}
    #plushlife-resume-context{top:auto!important;bottom:max(14px,calc(env(safe-area-inset-bottom) + 10px))!important;width:min(calc(100vw - 24px),520px)!important;padding:10px!important;border-radius:18px!important;background:color-mix(in srgb,var(--plush-surface) 94%,transparent)!important;border:1px solid var(--plush-border)!important;box-shadow:0 14px 40px color-mix(in srgb,var(--plush-bg) 45%,transparent)!important;backdrop-filter:blur(14px)!important}
    #plushlife-resume-context .plushlife-resume-copy strong{font-size:12px!important;color:var(--plush-text)!important}#plushlife-resume-context .plushlife-resume-copy span{color:var(--plush-copy)!important}#plushlife-resume-context button{background:var(--plush-surface-2)!important;color:var(--plush-text)!important;border-color:var(--plush-border)!important}
    html:has([data-plush-checkin-overlay="true"]) #plushlife-resume-context{display:none!important}
    [data-plush-checkin-card="true"]{--pc-bg:linear-gradient(155deg,var(--plush-surface-2),var(--plush-surface),var(--plush-bg))!important;--pc-panel:var(--plush-surface-2)!important;--pc-panel-strong:var(--plush-surface-3)!important;--pc-text:var(--plush-text)!important;--pc-copy:var(--plush-copy)!important;--pc-label:var(--plush-accent)!important;--pc-border:var(--plush-border)!important;--pc-border-strong:var(--plush-accent)!important;--pc-accent:var(--plush-accent)!important;--pc-accent2:var(--plush-accent-2)!important;--pc-glow:color-mix(in srgb,var(--plush-accent) 28%,transparent)!important}
    [data-plush-checkin-choice="true"],[data-plush-checkin-comfort="true"],[data-plush-checkin-customize="true"]{background:var(--plush-surface-2)!important;border-color:var(--plush-border)!important;box-shadow:none!important}
    [data-plush-checkin-choice="true"][aria-pressed="true"]{background:var(--plush-selected)!important;border-color:var(--plush-accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--plush-accent) 12%,transparent),0 8px 22px color-mix(in srgb,var(--plush-accent) 16%,transparent)!important}
    @media(max-width:520px){[data-plushlife-home-stack]{gap:12px!important}#plushlife-growth-checkin,#plushlife-adaptive-capacity-card,#plushlife-smart-next-step{padding:14px!important;border-radius:18px!important}}
  `;
  document.head.appendChild(style);

  function sync(){
    applyPalette();
    const modalOpen = !!document.querySelector('[data-plush-checkin-overlay="true"]');
    document.documentElement.toggleAttribute('data-plushlife-checkin-open',modalOpen);
    const resume = document.getElementById('plushlife-resume-context');
    if (resume) resume.setAttribute('aria-hidden',modalOpen ? 'true':'false');
  }

  document.addEventListener('click',(event)=>{
    const btn = event.target?.closest?.('button');
    if (!btn) return;
    const text = clean(btn.textContent);
    for (const [id, theme] of Object.entries(THEMES)) if (text.includes(theme.label)) { saveTheme(id); setTimeout(sync,0); break; }
  },true);

  let queued=false;
  const queue=()=>{ if(queued)return; queued=true; requestAnimationFrame(()=>{queued=false;sync();}); };
  const observer=new MutationObserver(queue);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','aria-hidden','aria-pressed']});
  window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change',queue);
  queue();
})();
