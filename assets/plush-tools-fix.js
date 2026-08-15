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

    /* Baby Mode: keep the completed count and settings from turning into
       giant vertical pills when global/mobile button rules kick in. */
    .baby-today-simple section[aria-label="Little jobs"] details > summary {
      box-sizing: border-box !important;
      min-width: 42px !important;
      width: auto !important;
      height: 30px !important;
      min-height: 30px !important;
      max-height: 30px !important;
      padding: 4px 9px !important;
      border-radius: 999px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      white-space: nowrap !important;
      font-size: 11px !important;
    }
    .baby-today-simple section[aria-label="Little jobs"] button[title="Edit little jobs"],
    .baby-today-simple section[aria-label="Little jobs"] button[aria-label="Edit little jobs"] {
      box-sizing: border-box !important;
      width: 30px !important;
      min-width: 30px !important;
      max-width: 30px !important;
      height: 30px !important;
      min-height: 30px !important;
      max-height: 30px !important;
      padding: 0 !important;
      border-radius: 9px !important;
      display: inline-grid !important;
      place-items: center !important;
      line-height: 1 !important;
      font-size: 14px !important;
      flex: 0 0 30px !important;
    }

    /* PlushGuide belongs below the Profile header, not inside the title/Close row. */
    #plushlife-guide-entry {
      box-sizing: border-box !important;
      width: calc(100% - 24px) !important;
      margin: 8px 12px 10px !important;
      padding: 10px 12px !important;
      border-radius: 13px !important;
      min-height: 0 !important;
      display: grid !important;
      grid-template-columns: auto minmax(0,1fr) auto !important;
      align-items: center !important;
      column-gap: 8px !important;
      text-align: left !important;
      font-size: 12px !important;
      line-height: 1.2 !important;
    }
    #plushlife-guide-entry::before {
      content: "✨";
      font-size: 16px;
    }
    #plushlife-guide-entry::after {
      content: "›";
      font-size: 18px;
      color: #9b79aa;
    }
    #plushlife-guide-entry > small {
      grid-column: 2;
      margin: 2px 0 0 !important;
      font-size: 10.5px !important;
      line-height: 1.28 !important;
      font-weight: 600 !important;
      opacity: .72 !important;
    }
  `;
  document.head.appendChild(compactHomeStyle);

  function tidyGuideEntry() {
    const entry = document.getElementById("plushlife-guide-entry");
    if (!entry) return;

    // plush-guide.js originally inserts the entry before the first button in
    // the Profile header. On narrow phones that squeezes Profile + Close into
    // the same row and makes Close wrap. Move the guide below that row.
    const parent = entry.parentElement;
    if (!parent) return;
    const parentText = clean(parent.textContent);
    const hasClose = Array.from(parent.querySelectorAll("button,[role='button']")).some((node) => {
      if (node === entry) return false;
      const label = clean(node.getAttribute("aria-label") || node.textContent);
      return label === "close" || label.startsWith("close ") || label === "×";
    });
    if (hasClose && parentText.includes("profile") && parent.parentElement) {
      parent.insertAdjacentElement("afterend", entry);
    }
  }

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
  tidyGuideEntry();
  const launcherObserver = new MutationObserver(() => {
    removeGentleLauncher();
    tidyGuideEntry();
  });
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
