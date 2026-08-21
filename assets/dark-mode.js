(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeDarkModeInstalled) return;
  window.__plushlifeDarkModeInstalled = true;

  const STORAGE_KEY = "plushlife:appearance-mode:v1";
  const VALID_MODES = new Set(["system", "light", "dark"]);
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  let requestedMode = readMode();
  let applying = false;
  let scheduled = false;

  function readMode() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY) || "system";
      return VALID_MODES.has(value) ? value : "system";
    } catch (_error) {
      return "system";
    }
  }

  function saveMode(mode) {
    requestedMode = VALID_MODES.has(mode) ? mode : "system";
    try { window.localStorage.setItem(STORAGE_KEY, requestedMode); } catch (_error) {}
    applyMode();
    refreshSettingsControl();
  }

  function effectiveMode() {
    if (requestedMode === "system") return media && media.matches ? "dark" : "light";
    return requestedMode;
  }

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

  function saturation(rgb) {
    if (!rgb) return 0;
    const max = Math.max(rgb.r, rgb.g, rgb.b), min = Math.min(rgb.r, rgb.g, rgb.b);
    return max === 0 ? 0 : (max - min) / max;
  }

  const DARK_CLASSES = ["plushlife-dark-surface", "plushlife-dark-text", "plushlife-dark-border", "plushlife-dark-gradient", "plushlife-dark-control"];

  function clearClasses(root) {
    const nodes = root && root.querySelectorAll ? [root, ...root.querySelectorAll(".plushlife-dark-surface,.plushlife-dark-text,.plushlife-dark-border,.plushlife-dark-gradient,.plushlife-dark-control")] : [];
    nodes.forEach((node) => DARK_CLASSES.forEach((className) => node.classList && node.classList.remove(className)));
  }

  function classifyNode(node) {
    if (!(node instanceof Element) || node.closest("#plushlife-color-mode-control")) return;
    // Nursery owns a complete light/night palette. The generic luminance
    // classifier flattened its illustrated cards into identical dark blocks.
    if (node.closest(".baby-mode")) {
      DARK_CLASSES.forEach((className) => node.classList.remove(className));
      return;
    }
    if (["SCRIPT", "STYLE", "LINK", "META", "IMG", "VIDEO", "AUDIO", "CANVAS", "SVG", "PATH"].includes(node.tagName)) return;
    DARK_CLASSES.forEach((className) => node.classList.remove(className));
    const style = window.getComputedStyle(node);
    const background = parseRgb(style.backgroundColor);
    const foreground = parseRgb(style.color);
    const border = parseRgb(style.borderTopColor);
    const backgroundLum = background && background.a > 0.05 ? luminance(background) : 0;
    const foregroundLum = foreground ? luminance(foreground) : 1;
    const borderLum = border ? luminance(border) : 0;

    if (["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName)) node.classList.add("plushlife-dark-control");
    if (background && background.a > 0.05 && backgroundLum > 0.64) node.classList.add("plushlife-dark-surface");
    if (style.backgroundImage && style.backgroundImage !== "none" && !["BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(node.tagName) && (!background || background.a < 0.1 || backgroundLum > 0.56)) node.classList.add("plushlife-dark-gradient");
    if (foreground && foreground.a > 0.2 && foregroundLum < 0.48 && saturation(foreground) < 0.72) node.classList.add("plushlife-dark-text");
    if (border && border.a > 0.08 && borderLum > 0.58) node.classList.add("plushlife-dark-border");
  }

  function classifyTree(root) {
    if (effectiveMode() !== "dark") return;
    applying = true;
    try {
      if (root instanceof Element) classifyNode(root);
      if (root && root.querySelectorAll) root.querySelectorAll("*").forEach(classifyNode);
    } finally {
      applying = false;
    }
  }

  function updateNativeChrome(mode) {
    const StatusBar = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
    if (StatusBar && typeof StatusBar.setStyle === "function") StatusBar.setStyle({ style: mode === "dark" ? "LIGHT" : "DARK" }).catch(function () {});
  }

  function applyMode() {
    const mode = effectiveMode();
    document.documentElement.dataset.plushlifeColorMode = mode;
    document.documentElement.dataset.plushlifeColorModePreference = requestedMode;
    document.documentElement.style.colorScheme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#17131d" : "#b75acb");
    updateNativeChrome(mode);
    if (mode === "dark") classifyTree(document.getElementById("root") || document.body);
    else clearClasses(document.getElementById("root") || document.body);
  }

  function makeChoice(mode, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.mode = mode;
    button.textContent = label;
    button.style.cssText = "min-height:44px;flex:1;padding:8px 9px;border-radius:10px;border:1px solid #d9cbe0;background:#fff;color:#665474;font:800 12px system-ui,sans-serif;cursor:pointer";
    button.addEventListener("click", function () { saveMode(mode); });
    return button;
  }

  function refreshSettingsControl() {
    const existing = document.getElementById("plushlife-color-mode-control");
    if (existing) {
      existing.querySelectorAll("button[data-mode]").forEach((button) => {
        const selected = button.dataset.mode === requestedMode;
        button.setAttribute("aria-pressed", selected ? "true" : "false");
        button.style.border = selected ? "2px solid #9660AF" : "1px solid #d9cbe0";
        button.style.background = selected ? "#f7eefa" : "#fff";
      });
      const current = existing.querySelector("[data-current-mode]");
      if (current) current.textContent = `Currently ${effectiveMode()}${requestedMode === "system" ? " from your device" : ""}.`;
    }
  }

  function installSettingsControl() {
    if (document.getElementById("plushlife-color-mode-control")) return;
    const search = document.querySelector('input[aria-label="Search settings"]');
    if (!search) return;
    const host = search.parentElement && search.parentElement.parentElement;
    if (!host || !host.parentElement) return;
    const card = document.createElement("section");
    card.id = "plushlife-color-mode-control";
    card.setAttribute("aria-label", "Appearance mode");
    card.style.cssText = "margin:0 0 12px;padding:13px 14px;border:1px solid #e8dceb;border-radius:16px;background:rgba(255,255,255,.88);box-shadow:0 4px 16px rgba(74,48,84,.05)";
    const title = document.createElement("div");
    title.textContent = "🌙 Light & dark mode";
    title.style.cssText = "font:900 14px system-ui,sans-serif;color:#5b4b6b";
    const description = document.createElement("div");
    description.textContent = "Follow your device automatically, or choose the appearance you want.";
    description.style.cssText = "margin-top:3px;font:500 11.5px/1.45 system-ui,sans-serif;color:#8a7895";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:7px;margin-top:9px";
    row.append(makeChoice("system", "System"), makeChoice("light", "Light"), makeChoice("dark", "Dark"));
    const current = document.createElement("div");
    current.dataset.currentMode = "true";
    current.style.cssText = "margin-top:7px;font:700 10.5px/1.4 system-ui,sans-serif;color:#8a7895";
    card.append(title, description, row, current);
    host.insertAdjacentElement("afterend", card);
    refreshSettingsControl();
  }

  const css = document.createElement("style");
  css.id = "plushlife-dark-mode-styles";
  css.textContent = `
    html[data-plushlife-color-mode="dark"], html[data-plushlife-color-mode="dark"] body { background:#17131d !important; color-scheme:dark !important; }
    html[data-plushlife-color-mode="dark"] #root { background:#17131d !important; }
    html[data-plushlife-color-mode="dark"] #root:has(.baby-mode) { background:#241a35 !important; }
    html[data-plushlife-color-mode="dark"] .plushlife-dark-surface { background-color:#241e2b !important; }
    html[data-plushlife-color-mode="dark"] .plushlife-dark-gradient { background-image:linear-gradient(145deg,#27202f,#1b1722) !important; }
    html[data-plushlife-color-mode="dark"] .plushlife-dark-text { color:#eee7f2 !important; }
    html[data-plushlife-color-mode="dark"] .plushlife-dark-border { border-color:#504359 !important; }
    html[data-plushlife-color-mode="dark"] .plushlife-dark-control { background:#201a27 !important;color:#f2ebf5 !important;border-color:#57485f !important; }
    html[data-plushlife-color-mode="dark"] input::placeholder, html[data-plushlife-color-mode="dark"] textarea::placeholder { color:#a99daf !important;opacity:1; }
    html[data-plushlife-color-mode="dark"] #plushlife-color-mode-control { background:#241e2b !important;border-color:#504359 !important; }
    html[data-plushlife-color-mode="dark"] #plushlife-color-mode-control > div { color:#eee7f2 !important; }
    html[data-plushlife-color-mode="dark"] #plushlife-color-mode-control button { background:#201a27 !important;color:#eee7f2 !important;border-color:#57485f !important; }
    html[data-plushlife-color-mode="dark"] a { color:#bda8ff; }
    html[data-plushlife-color-mode="dark"] ::selection { background:#76548a;color:#fff; }
  `;
  document.head.appendChild(css);

  const observer = new MutationObserver(function (mutations) {
    if (applying) return;
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        installSettingsControl();
        if (effectiveMode() === "dark") {
          mutations.forEach((mutation) => mutation.addedNodes && mutation.addedNodes.forEach((node) => classifyTree(node)));
        }
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (media) {
    const onSystemChange = function () { if (requestedMode === "system") applyMode(); };
    if (typeof media.addEventListener === "function") media.addEventListener("change", onSystemChange);
    else if (typeof media.addListener === "function") media.addListener(onSystemChange);
  }
  window.addEventListener("storage", function (event) { if (event.key === STORAGE_KEY) { requestedMode = readMode(); applyMode(); refreshSettingsControl(); } });

  window.PlushLifeColorMode = {
    getPreference: function () { return requestedMode; },
    getEffectiveMode: effectiveMode,
    setMode: saveMode,
  };

  applyMode();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installSettingsControl, { once: true });
  else installSettingsControl();
})();
