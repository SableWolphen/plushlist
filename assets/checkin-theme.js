(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeCheckinThemeInstalled) return;
  window.__plushlifeCheckinThemeInstalled = true;

  const STYLE_ID = "plushlife-checkin-theme-styles";
  const MOODS = new Set(["Happy", "Calm", "Okay", "Tired", "Stressed", "Anxious", "Sad", "Angry", "Lonely", "Overwhelmed", "Numb", "Sick"]);
  const PLANS = new Set(["Full", "Soft", "Tiny", "Recovery", "Rest"]);

  const css = `
  /* PlushLife check-in — theme-safe polished treatment */
  [data-plush-checkin-overlay="true"] {
    background: rgba(26, 15, 42, .62) !important;
    backdrop-filter: blur(14px) saturate(.92) !important;
    -webkit-backdrop-filter: blur(14px) saturate(.92) !important;
    padding: max(18px, env(safe-area-inset-top)) 14px max(18px, env(safe-area-inset-bottom)) !important;
  }
  [data-plush-checkin-card="true"] {
    --pc-bg: linear-gradient(160deg,#fffafd 0%,#fff7fb 50%,#f7f4ff 100%);
    --pc-panel: rgba(255,255,255,.78);
    --pc-panel-strong: rgba(255,255,255,.94);
    --pc-text: #4c234f;
    --pc-copy: #765f84;
    --pc-label: #b33aaa;
    --pc-border: rgba(180,126,214,.38);
    --pc-border-strong: #e061d5;
    --pc-accent: #d747c9;
    --pc-accent-2: #8b5be6;
    --pc-glow: rgba(221,76,206,.24);
    --pc-shadow: rgba(83,43,103,.24);
    width: min(100%, 580px) !important;
    max-height: min(90vh, 860px) !important;
    box-sizing: border-box !important;
    padding: 24px 22px 22px !important;
    border-radius: 32px !important;
    background: var(--pc-bg) !important;
    border: 1.5px solid var(--pc-border-strong) !important;
    color: var(--pc-text) !important;
    box-shadow: 0 26px 90px var(--pc-shadow), inset 0 1px 0 rgba(255,255,255,.75) !important;
    scrollbar-width: thin;
    scrollbar-color: var(--pc-border-strong) transparent;
    position: relative !important;
    overflow-x: hidden !important;
  }
  [data-plush-checkin-card="true"]::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    background: radial-gradient(circle at 86% 7%, rgba(239,131,222,.18), transparent 23%), radial-gradient(circle at 7% 94%, rgba(133,113,236,.10), transparent 25%);
  }
  [data-plush-checkin-card="true"][data-plush-checkin-scheme="dark"] {
    --pc-bg: linear-gradient(150deg,#35254b 0%,#251936 46%,#171226 100%);
    --pc-panel: rgba(44,31,63,.76);
    --pc-panel-strong: rgba(48,34,69,.94);
    --pc-text: #fff5ff;
    --pc-copy: #ddd2ec;
    --pc-label: #f1a8ec;
    --pc-border: rgba(165,131,221,.46);
    --pc-border-strong: #8f66cf;
    --pc-accent: #f37be9;
    --pc-accent-2: #a378ff;
    --pc-glow: rgba(241,99,231,.31);
    --pc-shadow: rgba(4,0,16,.56);
    border-color: #7954b3 !important;
    box-shadow: 0 30px 100px rgba(2,0,13,.64), 0 0 34px rgba(162,85,223,.16), inset 0 1px 0 rgba(255,255,255,.08) !important;
  }
  [data-plush-checkin-header="true"] { position: relative !important; padding-right: 104px !important; min-height: 124px; }
  [data-plush-checkin-header="true"]::after {
    content: "🧸";
    position: absolute;
    right: 12px;
    bottom: 5px;
    width: 84px;
    height: 68px;
    display: grid;
    place-items: center;
    font-size: 52px;
    line-height: 1;
    filter: drop-shadow(0 8px 11px rgba(76,40,82,.18));
    border-radius: 50% 50% 44% 44%;
    background: radial-gradient(ellipse at 50% 82%, rgba(205,166,241,.48), rgba(237,194,236,.18) 63%, transparent 65%);
  }
  [data-plush-checkin-eyebrow="true"] {
    color: var(--pc-label) !important;
    font-size: 12px !important;
    letter-spacing: .16em !important;
    font-weight: 950 !important;
    text-shadow: 0 0 14px var(--pc-glow);
  }
  #checkin-popup-title {
    color: var(--pc-text) !important;
    font-size: clamp(24px, 6.5vw, 34px) !important;
    line-height: 1.08 !important;
    margin-top: 7px !important;
    letter-spacing: -.025em !important;
    font-family: "Baloo 2", ui-rounded, system-ui, sans-serif !important;
    font-weight: 900 !important;
  }
  [data-plush-checkin-subtitle="true"] { color: var(--pc-copy) !important; font-size: 14px !important; line-height: 1.48 !important; margin-top: 8px !important; max-width: 430px; }
  [data-plush-checkin-comfort="true"] {
    color: var(--pc-text) !important;
    background: var(--pc-panel) !important;
    border: 1px solid var(--pc-border) !important;
    border-radius: 18px !important;
    min-height: 52px !important;
    margin-top: 15px !important;
    padding: 10px 16px !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    display: flex !important;
    align-items: center !important;
    box-shadow: 0 8px 22px rgba(72,47,91,.08) !important;
  }
  [data-plush-checkin-close="true"] {
    width: 50px !important;
    height: 50px !important;
    display: grid !important;
    place-items: center !important;
    padding: 0 !important;
    border-radius: 17px !important;
    border: 1px solid var(--pc-border) !important;
    background: var(--pc-panel-strong) !important;
    color: var(--pc-text) !important;
    font-size: 24px !important;
    line-height: 1 !important;
    box-shadow: 0 9px 24px rgba(58,35,80,.12) !important;
    position: relative !important;
    z-index: 3 !important;
  }
  [data-plush-checkin-section-title="true"] {
    color: var(--pc-label) !important;
    font-size: 12px !important;
    letter-spacing: .13em !important;
    font-weight: 950 !important;
  }
  [data-plush-checkin-more="true"] {
    color: var(--pc-text) !important;
    background: var(--pc-panel) !important;
    border: 1px solid var(--pc-border) !important;
    border-radius: 999px !important;
    padding: 8px 13px !important;
    font-size: 12px !important;
    font-weight: 900 !important;
  }
  [data-plush-checkin-mood-grid="true"], [data-plush-checkin-plan-grid="true"] { gap: 9px !important; margin-top: 10px !important; }
  [data-plush-checkin-choice="true"] {
    min-height: 86px !important;
    padding: 12px 7px !important;
    border-radius: 18px !important;
    border: 1px solid var(--pc-border) !important;
    background: var(--pc-panel) !important;
    color: var(--pc-text) !important;
    box-shadow: 0 8px 20px rgba(51,34,68,.06) !important;
    transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease !important;
  }
  [data-plush-checkin-choice="true"] > div:first-child { font-size: 28px !important; line-height: 1 !important; }
  [data-plush-checkin-choice="true"] > div:last-child { color: var(--pc-text) !important; font-size: 13px !important; font-weight: 900 !important; margin-top: 5px !important; }
  [data-plush-checkin-choice="true"][aria-pressed="true"] {
    border: 2px solid var(--pc-accent) !important;
    background: linear-gradient(145deg, color-mix(in srgb, var(--pc-accent) 16%, transparent), color-mix(in srgb, var(--pc-accent-2) 10%, var(--pc-panel))) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--pc-accent) 13%, transparent), 0 8px 26px var(--pc-glow) !important;
    transform: translateY(-1px) !important;
  }
  [data-plush-checkin-plan="true"] { min-height: 92px !important; position: relative !important; }
  [data-plush-checkin-plan="true"][aria-pressed="true"]::after {
    content: "✓";
    position: absolute;
    top: 8px;
    right: 9px;
    width: 23px;
    height: 23px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--pc-accent);
    color: #fff;
    font: 950 14px/1 system-ui,sans-serif;
    box-shadow: 0 4px 12px var(--pc-glow);
  }
  [data-plush-checkin-plan-copy="true"] { color: var(--pc-copy) !important; font-size: 13px !important; line-height: 1.45 !important; margin-top: 6px !important; }
  [data-plush-checkin-guess="true"] { background: color-mix(in srgb, var(--pc-accent-2) 8%, var(--pc-panel)) !important; color: var(--pc-copy) !important; border: 1px solid var(--pc-border) !important; border-radius: 14px !important; }
  [data-plush-checkin-customize="true"] {
    min-height: 56px !important;
    border-radius: 18px !important;
    border: 1px solid var(--pc-border) !important;
    background: var(--pc-panel) !important;
    color: var(--pc-text) !important;
    font-size: 13px !important;
    font-weight: 900 !important;
    box-shadow: 0 8px 22px rgba(53,31,73,.06) !important;
  }
  [data-plush-checkin-cta="true"] {
    min-height: 62px !important;
    border-radius: 999px !important;
    border: 1px solid color-mix(in srgb, var(--pc-accent) 70%, #fff) !important;
    background: linear-gradient(90deg,#ffcff5 0%,#ef8fe7 56%,#d99cff 100%) !important;
    color: #3b1747 !important;
    font-size: 16px !important;
    font-weight: 950 !important;
    letter-spacing: -.01em !important;
    box-shadow: 0 12px 32px rgba(222,88,205,.28), inset 0 1px 0 rgba(255,255,255,.8) !important;
  }
  [data-plush-checkin-cta="true"]:disabled {
    opacity: .52 !important;
    filter: saturate(.55) !important;
    cursor: not-allowed !important;
  }
  [data-plush-checkin-card="true"][data-plush-checkin-scheme="dark"] [data-plush-checkin-cta="true"] { color:#291132 !important; box-shadow:0 12px 34px rgba(235,98,224,.34),0 0 26px rgba(221,96,241,.17)!important; }
  [data-plush-checkin-card="true"] button:focus-visible { outline: 3px solid var(--pc-accent) !important; outline-offset: 3px !important; }
  [data-plush-checkin-card="true"] button:not(:disabled):active { transform: scale(.985); }
  @media (max-width: 480px) {
    [data-plush-checkin-card="true"] { padding: 21px 18px 20px !important; border-radius: 28px !important; }
    [data-plush-checkin-header="true"] { padding-right: 82px !important; min-height: 112px; }
    [data-plush-checkin-header="true"]::after { width: 70px; height: 58px; font-size: 44px; right: 2px; }
    #checkin-popup-title { font-size: 27px !important; }
    [data-plush-checkin-choice="true"] { min-height: 80px !important; }
  }
  @media (max-width: 370px) {
    [data-plush-checkin-card="true"] { padding-left: 14px !important; padding-right: 14px !important; }
    #checkin-popup-title { font-size: 24px !important; }
    [data-plush-checkin-header="true"] { padding-right: 66px !important; }
  }
  `;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
  function relativeLuminance(rgb) {
    const parts = String(rgb || "").match(/[\d.]+/g);
    if (!parts || parts.length < 3) return 1;
    const [r,g,b] = parts.slice(0,3).map(Number).map((c) => c / 255).map((c) => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4));
    return .2126*r + .7152*g + .0722*b;
  }
  function detectScheme() {
    const root = document.querySelector("#root") || document.body;
    const body = getComputedStyle(document.body);
    const rootStyle = getComputedStyle(root);
    const lum = Math.min(relativeLuminance(body.backgroundColor), relativeLuminance(rootStyle.backgroundColor));
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) || lum < .22 ? "dark" : "light";
  }

  function tagTextElement(root, regex, attr) {
    const node = [...root.querySelectorAll("div,p,span")].find((item) => !item.children.length && regex.test(clean(item.textContent)));
    if (node) node.setAttribute(attr, "true");
    return node;
  }

  function polishDialog() {
    const title = document.getElementById("checkin-popup-title");
    if (!title) return;
    const card = title.closest('div[role="dialog"] > div') || title.parentElement?.parentElement?.parentElement;
    const overlay = title.closest('div[role="dialog"]');
    if (!card || !overlay) return;

    overlay.dataset.plushCheckinOverlay = "true";
    card.dataset.plushCheckinCard = "true";
    card.dataset.plushCheckinScheme = detectScheme();

    const header = title.parentElement?.parentElement;
    if (header) header.dataset.plushCheckinHeader = "true";
    const eyebrow = header && [...header.querySelectorAll("div")].find((node) => /CHECK-IN$/i.test(clean(node.textContent)) && !node.children.length);
    if (eyebrow) eyebrow.dataset.plushCheckinEyebrow = "true";
    const subtitle = title.nextElementSibling;
    if (subtitle && /pick one feeling|how are you/i.test(clean(subtitle.textContent))) subtitle.dataset.plushCheckinSubtitle = "true";
    const comfort = header && [...header.querySelectorAll("div")].find((node) => /^🧸\s*Is .+ nearby\?/i.test(clean(node.textContent)));
    if (comfort) comfort.dataset.plushCheckinComfort = "true";
    const close = header && header.querySelector('button[aria-label="Close"]');
    if (close) close.dataset.plushCheckinClose = "true";

    tagTextElement(card, /^(TELL .+ YOUR FEELING|HOW DO YOU FEEL\?)$/i, "data-plush-checkin-section-title");
    tagTextElement(card, /^CHOOSE TODAY'S PLAN$/i, "data-plush-checkin-section-title");
    const planCopy = [...card.querySelectorAll("div")].find((node) => !node.children.length && /Pick the size of day you actually have/i.test(clean(node.textContent)));
    if (planCopy) planCopy.dataset.plushCheckinPlanCopy = "true";

    [...card.querySelectorAll("button")].forEach((button) => {
      const text = clean(button.textContent).replace(/[⌃⌄]/g, "").trim();
      if (/^(More feelings|Fewer)$/i.test(text)) button.dataset.plushCheckinMore = "true";
      if (MOODS.has(text)) button.dataset.plushCheckinChoice = "true";
      if (PLANS.has(text)) {
        button.dataset.plushCheckinChoice = "true";
        button.dataset.plushCheckinPlan = "true";
      }
      if (/^(Customize today · optional|Hide extra options)/i.test(text)) button.dataset.plushCheckinCustomize = "true";
      if (/^(Choose the closest feeling|All done for now|Looks good)/i.test(text)) button.dataset.plushCheckinCta = "true";
    });

    const moodButtons = [...card.querySelectorAll('button[data-plush-checkin-choice="true"]')].filter((b) => MOODS.has(clean(b.textContent)));
    if (moodButtons.length) moodButtons[0].parentElement.dataset.plushCheckinMoodGrid = "true";
    const planButtons = [...card.querySelectorAll('button[data-plush-checkin-plan="true"]')];
    if (planButtons.length) planButtons[0].parentElement.dataset.plushCheckinPlanGrid = "true";

    const guess = [...card.querySelectorAll("div")].find((node) => !node.children.length && /gentle guess/i.test(clean(node.textContent)));
    if (guess?.parentElement) guess.parentElement.dataset.plushCheckinGuess = "true";

    try {
      const statusBar = window.Capacitor?.Plugins?.StatusBar;
      if (statusBar?.setStyle) statusBar.setStyle({ style: card.dataset.plushCheckinScheme === "dark" ? "LIGHT" : "DARK" }).catch(() => {});
    } catch (_) {}
  }

  installStyle();
  let queued = false;
  const queuePolish = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; polishDialog(); });
  };
  const observer = new MutationObserver(queuePolish);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "aria-pressed"] });
  window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change", queuePolish);
  document.addEventListener("click", queuePolish, true);
  queuePolish();
})();
