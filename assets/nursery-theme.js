(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeNurseryThemeInstalled) return;
  window.__plushlifeNurseryThemeInstalled = true;

  const DARK_SURFACE = "nursery-auto-surface";
  const DARK_TEXT = "nursery-auto-text";
  const DARK_BORDER = "nursery-auto-border";
  const decorated = new Set([DARK_SURFACE, DARK_TEXT, DARK_BORDER]);
  let scheduled = false;
  let classifying = false;

  function parseRgb(value) {
    const match = String(value || "").match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\)/i);
    if (!match) return null;
    return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] == null ? 1 : Number(match[4]) };
  }

  function luminance(rgb) {
    if (!rgb) return 0;
    const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function isDarkMode() {
    return document.documentElement.dataset.plushlifeColorMode === "dark";
  }

  function clearNode(node) {
    if (!(node instanceof Element)) return;
    decorated.forEach((name) => node.classList.remove(name));
  }

  function classifyNode(node) {
    if (!(node instanceof Element) || !node.closest(".baby-mode")) return;
    clearNode(node);
    if (!isDarkMode()) return;
    if (["SCRIPT", "STYLE", "LINK", "META", "IMG", "VIDEO", "AUDIO", "CANVAS", "SVG", "PATH"].includes(node.tagName)) return;
    const style = window.getComputedStyle(node);
    const background = parseRgb(style.backgroundColor);
    const foreground = parseRgb(style.color);
    const border = parseRgb(style.borderTopColor);
    if (background && background.a > 0.08 && luminance(background) > 0.46) node.classList.add(DARK_SURFACE);
    if (foreground && foreground.a > 0.2 && luminance(foreground) < 0.48) node.classList.add(DARK_TEXT);
    if (border && border.a > 0.08 && luminance(border) > 0.48) node.classList.add(DARK_BORDER);
  }

  function classifyNursery() {
    const nursery = document.querySelector(".baby-mode");
    if (!nursery) return;
    classifying = true;
    try {
      classifyNode(nursery);
      nursery.querySelectorAll("*").forEach(classifyNode);
    } finally {
      classifying = false;
    }
  }

  function scheduleClassify() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      classifyNursery();
    });
  }

  const style = document.createElement("style");
  style.id = "plushlife-nursery-theme-v2";
  style.textContent = `
    .baby-mode {
      --nursery-bg:#fff7fb;
      --nursery-card:rgba(255,255,255,.88);
      --nursery-card-2:#fffafd;
      --nursery-card-soft:#fbf1ff;
      --nursery-border:#ead7ef;
      --nursery-divider:#f1e7f3;
      --nursery-text:#4f3e59;
      --nursery-muted:#806d8c;
      --nursery-accent:#a553bd;
      --nursery-accent-soft:#f1d9f7;
      --nursery-shadow:0 10px 28px rgba(118,72,140,.10);
      min-height:100vh !important;
      box-sizing:border-box !important;
      padding-top:max(34px,calc(env(safe-area-inset-top) + 12px)) !important;
      padding-left:max(10px,env(safe-area-inset-left)) !important;
      padding-right:max(10px,env(safe-area-inset-right)) !important;
      background:
        radial-gradient(circle at 8% 5%,rgba(255,203,229,.55) 0%,transparent 28%),
        radial-gradient(circle at 92% 7%,rgba(202,234,255,.55) 0%,transparent 30%),
        linear-gradient(180deg,#fff9fc 0%,#fbf6ff 48%,#f7fbff 100%) !important;
      color:var(--nursery-text) !important;
    }
    .baby-mode .baby-shell { background:transparent !important; box-shadow:none !important; }
    .baby-mode section,
    .baby-mode details,
    .baby-mode [role="tablist"],
    .baby-mode [role="tabpanel"] {
      border-color:var(--nursery-border) !important;
      box-shadow:var(--nursery-shadow) !important;
    }
    .baby-mode section,
    .baby-mode details { border-radius:20px !important; }
    .baby-mode [role="tablist"] { border-radius:18px !important; }
    .baby-mode button { word-break:normal !important; overflow-wrap:normal !important; }
    .baby-mode button[aria-selected="true"],
    .baby-mode button[aria-pressed="true"] {
      background:linear-gradient(145deg,#f4dcfb,#e7c8f4) !important;
      color:#6c397c !important;
      border-color:#bd76cf !important;
      box-shadow:0 5px 16px rgba(165,83,189,.14) !important;
    }
    .baby-mode footer,
    .baby-mode [data-plushlife-footer] { opacity:.76 !important; font-size:12px !important; }

    html[data-plushlife-color-mode="dark"] .baby-mode {
      --nursery-bg:#171329;
      --nursery-card:rgba(38,29,62,.94);
      --nursery-card-2:#2c2146;
      --nursery-card-soft:#241b3a;
      --nursery-border:#684f83;
      --nursery-divider:#49375e;
      --nursery-text:#f8effb;
      --nursery-muted:#c9b8d2;
      --nursery-accent:#efa3eb;
      --nursery-accent-soft:#5b3c70;
      --nursery-shadow:0 14px 34px rgba(6,4,18,.32);
      background:
        radial-gradient(circle at 7% 4%,rgba(194,93,192,.22) 0%,transparent 28%),
        radial-gradient(circle at 94% 6%,rgba(91,109,198,.22) 0%,transparent 30%),
        radial-gradient(circle at 84% 82%,rgba(119,80,170,.13) 0%,transparent 27%),
        linear-gradient(180deg,#211630 0%,#1c1730 48%,#151327 100%) !important;
      color:var(--nursery-text) !important;
    }
    html[data-plushlife-color-mode="dark"] #root:has(.baby-mode) { background:#151327 !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .baby-shell { background:transparent !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-nook {
      background:linear-gradient(145deg,#3a2850,#2a2447 52%,#21354d) !important;
      border-color:#76568f !important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 16px 38px rgba(7,4,18,.34) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-panel,
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-tabs,
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-week,
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-jobs,
    html[data-plushlife-color-mode="dark"] .baby-mode .nursery-schedule,
    html[data-plushlife-color-mode="dark"] .baby-mode section,
    html[data-plushlife-color-mode="dark"] .baby-mode details,
    html[data-plushlife-color-mode="dark"] .baby-mode [role="tablist"],
    html[data-plushlife-color-mode="dark"] .baby-mode [role="tabpanel"],
    html[data-plushlife-color-mode="dark"] .baby-mode .${DARK_SURFACE} {
      background:linear-gradient(145deg,rgba(48,36,72,.96),rgba(35,28,57,.96)) !important;
      color:var(--nursery-text) !important;
      border-color:var(--nursery-border) !important;
      box-shadow:var(--nursery-shadow) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .${DARK_TEXT},
    html[data-plushlife-color-mode="dark"] .baby-mode section p,
    html[data-plushlife-color-mode="dark"] .baby-mode section span:not([aria-hidden="true"]),
    html[data-plushlife-color-mode="dark"] .baby-mode details p,
    html[data-plushlife-color-mode="dark"] .baby-mode details span:not([aria-hidden="true"]) {
      color:var(--nursery-text) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .${DARK_BORDER} { border-color:var(--nursery-border) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode section > div,
    html[data-plushlife-color-mode="dark"] .baby-mode details > div { border-color:var(--nursery-divider) !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode h1,
    html[data-plushlife-color-mode="dark"] .baby-mode h2,
    html[data-plushlife-color-mode="dark"] .baby-mode h3,
    html[data-plushlife-color-mode="dark"] .baby-mode [style*="font-weight: 900"] {
      color:#f5c3f1 !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode button {
      background:#34274d !important;
      color:#f8effb !important;
      border-color:#6e5687 !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode button[aria-selected="true"],
    html[data-plushlife-color-mode="dark"] .baby-mode button[aria-pressed="true"] {
      background:linear-gradient(145deg,#70478a,#5b3a75) !important;
      color:#fff7ff !important;
      border-color:#d282df !important;
      box-shadow:0 0 0 1px rgba(242,163,235,.18),0 7px 20px rgba(8,4,20,.28) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode input,
    html[data-plushlife-color-mode="dark"] .baby-mode textarea,
    html[data-plushlife-color-mode="dark"] .baby-mode select {
      background:#251c3a !important;
      color:#f8effb !important;
      border-color:#644d7d !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode progress { accent-color:#ba6bd0 !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode a { color:#e9a4ee !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode footer { color:#c9b8d2 !important; opacity:.72 !important; }
    html[data-plushlife-color-mode="dark"] .baby-mode button {
      white-space:normal;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode button[aria-label*="Edit"],
    html[data-plushlife-color-mode="dark"] .baby-mode button[title*="Edit"] {
      min-width:64px !important;
      white-space:nowrap !important;
    }
    /* Launch polish: explicit app landmarks keep the broad compatibility
       palette above from flattening every surface into the same purple card. */
    .plushlife-app-column { width:100%; box-sizing:border-box; }
    .plushlife-dashboard-tabs { padding:4px; border:1px solid var(--nursery-border,#ead7ef); border-radius:17px; background:rgba(255,255,255,.5); }
    .plushlife-dashboard-tab { box-shadow:none !important; }
    .plushlife-today-tabs { position:sticky; top:max(8px,env(safe-area-inset-top)); z-index:8; backdrop-filter:blur(12px); }
    .plushlife-task-row { transition:border-color .16s ease,background-color .16s ease,transform .16s ease; }

    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-dashboard-tabs,
    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-today-tabs {
      background:rgba(24,18,39,.9) !important;
      border-color:#59456f !important;
      box-shadow:0 8px 24px rgba(5,3,15,.2) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-dashboard-tab:not([aria-selected="true"]),
    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-today-tabs button:not([aria-selected="true"]) {
      background:transparent !important;
      border-color:transparent !important;
      color:#c9b8d2 !important;
      box-shadow:none !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-task-card {
      background:rgba(35,27,55,.82) !important;
      border-color:#59466e !important;
      box-shadow:0 12px 30px rgba(5,3,15,.24) !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-task-row {
      background:#2c2241 !important;
      border-color:#49395c !important;
      box-shadow:none !important;
    }
    html[data-plushlife-color-mode="dark"] .baby-mode .plushlife-task-row:focus-within {
      border-color:#d282df !important;
    }
    @media(min-width:900px) {
      .plushlife-app-column { max-width:640px !important; }
      .plushlife-dashboard-tab { min-height:56px !important; }
    }
    @media(max-width:520px) {
      .baby-mode { padding-left:max(8px,env(safe-area-inset-left)) !important; padding-right:max(8px,env(safe-area-inset-right)) !important; }
      .baby-mode .baby-shell { padding:6px !important; border-radius:24px !important; }
      .plushlife-app-header { align-items:flex-start !important; }
      .plushlife-dashboard-tabs { gap:3px !important; padding:3px; }
      .plushlife-dashboard-tab { min-height:50px !important; padding:6px 2px !important; }
      .plushlife-task-card { padding:10px !important; border-radius:14px !important; }
      .plushlife-task-row > div:first-child { min-height:46px !important; padding:5px 6px !important; }
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(function () {
    if (classifying) return;
    scheduleClassify();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  new MutationObserver(function (mutations) {
    if (mutations.some((mutation) => mutation.attributeName === "data-plushlife-color-mode")) scheduleClassify();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-plushlife-color-mode"] });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleClassify, { once: true });
  else scheduleClassify();
})();
