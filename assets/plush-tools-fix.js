(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeToolsFixInstalled) return;
  window.__plushlifeToolsFixInstalled = true;

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);

  const compactHomeStyle = document.createElement("style");
  compactHomeStyle.textContent = `
    [data-plushlife-compact-card="plushweek"] {
      padding: 6px 10px !important;
      margin-bottom: 7px !important;
      border-radius: 12px !important;
    }
    [data-plushlife-compact-hit-target="plushweek-edit"] {
      position: relative !important;
      min-height: 28px !important;
      margin: -2px -4px -2px 0 !important;
      padding: 4px 8px !important;
      line-height: 1.1 !important;
    }
    [data-plushlife-compact-hit-target="plushweek-edit"]::before {
      content: "";
      position: absolute;
      inset: -8px -6px;
    }
  `;
  document.head.appendChild(compactHomeStyle);

  function removeGentleLauncher() {
    const launcher = document.getElementById("plushlife-gentle-launcher");
    if (!launcher) return;
    launcher.setAttribute("aria-hidden", "true");
    launcher.tabIndex = -1;
    launcher.remove();
  }

  // PlushRescue stays available through the app's care/tools surfaces; the
  // floating launcher duplicated that entry point and obscured page content.
  removeGentleLauncher();
  const launcherObserver = new MutationObserver(removeGentleLauncher);
  launcherObserver.observe(document.documentElement, { childList: true, subtree: true });

  function closeToolsPanel(panel) {
    if (!panel) return;
    const close = Array.from(panel.querySelectorAll("button,[role='button']")).find((node) => {
      const label = clean(node.getAttribute("aria-label") || node.textContent);
      return label === "close" || label.includes("close plush") || label === "×";
    });
    if (close) close.click();
    else panel.remove();
  }

  function restoreFullDay() {
    document.querySelectorAll('[data-plushlife-rescue-hidden="true"]').forEach((row) => delete row.dataset.plushlifeRescueHidden);
    document.querySelectorAll('[data-plushlife-rescue-focus="true"]').forEach((row) => delete row.dataset.plushlifeRescueFocus);
    document.querySelectorAll('[data-plushlife-tiny-step]').forEach((row) => delete row.dataset.plushlifeTinyStep);
    document.body.classList.remove("plushlife-rescue-view", "plushlife-pressure-paused");

    try {
      const key = "plushlife-rescue-v4";
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      state.mode = null;
      state.pressureDate = null;
      state.reentry = false;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (_error) {}

    const launcher = document.getElementById("plushlife-gentle-launcher");
    if (launcher) launcher.textContent = "🧸 PlushRescue";
    document.dispatchEvent(new CustomEvent("plushlife-rescue-restored"));
  }

  function clickOutsidePanel(panel, labels) {
    const wanted = labels.map(clean);
    const nodes = Array.from(document.querySelectorAll('button,a,[role="button"]')).filter((node) => visible(node) && !panel.contains(node));
    const match = nodes.find((node) => {
      const label = clean(node.textContent || node.getAttribute("aria-label") || node.getAttribute("title"));
      return wanted.some((wantedLabel) => label === wantedLabel || label.includes(wantedLabel));
    });
    if (!match) return false;
    match.click();
    return true;
  }

  function isPlushToolsPanel(panel) {
    const text = clean(panel && panel.textContent);
    return text.includes("plush tools") && text.includes("what would help right now") && text.includes("plushinsights");
  }

  document.addEventListener("click", (event) => {
    const button = event.target && event.target.closest && event.target.closest("button,[role='button']");
    if (!button) return;
    const panel = button.closest('[role="dialog"],aside,[class*="modal"],[class*="panel"]');
    if (!panel || !isPlushToolsPanel(panel)) return;

    const label = clean(button.textContent || button.getAttribute("aria-label"));
    if (!label) return;

    if (label.includes("add all my tasks") || label.includes("return to my full day")) {
      event.preventDefault();
      event.stopPropagation();
      restoreFullDay();
      closeToolsPanel(panel);
      return;
    }

    if (label.includes("refresh rescue view")) {
      event.preventDefault();
      event.stopPropagation();
      closeToolsPanel(panel);
      window.setTimeout(() => {
        const launcher = document.getElementById("plushlife-gentle-launcher");
        if (launcher) launcher.click();
        else clickOutsidePanel(panel, ["plushrescue", "rescue active"]);
      }, 80);
      return;
    }

    if (label.includes("open plushprogress")) {
      event.preventDefault();
      event.stopPropagation();
      closeToolsPanel(panel);
      window.setTimeout(() => clickOutsidePanel(panel, ["progress", "plushprogress"]), 80);
    }
  }, true);
})();
