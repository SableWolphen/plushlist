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

    [data-plushlife-task-card] {
      margin-bottom: 9px !important;
      padding: 11px 12px !important;
      border-radius: 14px !important;
      box-shadow: none !important;
    }
    [data-plushlife-task-card="list-picker"] {
      border-width: 1px !important;
    }
    [data-plushlife-task-card="list-picker"] [data-plushlife-day-grid] {
      gap: 5px !important;
      margin-top: 8px !important;
    }
    [data-plushlife-task-card="list-picker"] [data-plushlife-day-grid] button {
      min-height: 38px !important;
      padding: 6px 4px !important;
      border-radius: 10px !important;
    }
    [data-plushlife-task-card="starter-pack"] [data-plushlife-starter-intro] {
      display: none !important;
    }
    [data-plushlife-task-card="starter-pack"] label {
      margin-top: 6px !important;
    }
    [data-plushlife-task-card="starter-pack"] select {
      min-height: 40px !important;
      margin-top: 4px !important;
      padding: 7px 9px !important;
    }
    [data-plushlife-task-card="starter-pack"] [data-plushlife-pack-preview] {
      margin-top: 7px !important;
      padding: 8px 9px !important;
      border-radius: 10px !important;
    }
    [data-plushlife-task-card="starter-pack"] [data-plushlife-pack-preview] > div:last-child {
      margin-top: 4px !important;
      gap: 2px !important;
    }
    [data-plushlife-task-card="starter-pack"] [data-plushlife-pack-add] {
      min-height: 38px !important;
      margin-top: 7px !important;
      padding: 7px 11px !important;
    }
    [data-plushlife-task-card="import"] {
      padding: 0 !important;
      overflow: hidden !important;
    }
    [data-plushlife-task-card="import"] > button:first-child {
      min-height: 42px !important;
      padding: 9px 11px !important;
    }
    [data-plushlife-task-card="add-task"] {
      padding-top: 11px !important;
    }
    [data-plushlife-task-card] input,
    [data-plushlife-task-card] select,
    [data-plushlife-task-card] textarea {
      font-size: 16px !important;
    }
  `;
  document.head.appendChild(compactHomeStyle);

  function markTaskManager() {
    const panels = Array.from(document.querySelectorAll('[role="dialog"], aside, [class*="panel"], [class*="modal"], body > div'));
    const panel = panels.find((node) => visible(node) && clean(node.textContent).includes("change my tasks") && clean(node.textContent).includes("step 1 · choose a list"));
    if (!panel) return;

    const divs = Array.from(panel.querySelectorAll("div"));
    const exactCard = (phrase) => divs.find((node) => clean(node.firstElementChild?.textContent || "") === clean(phrase));

    const listHeading = Array.from(panel.querySelectorAll("div")).find((node) => clean(node.textContent) === "step 1 · choose a list");
    const listCard = listHeading?.parentElement;
    if (listCard) {
      listCard.dataset.plushlifeTaskCard = "list-picker";
      const grid = Array.from(listCard.querySelectorAll("div")).find((node) => node.querySelectorAll(":scope > button").length >= 7);
      if (grid) grid.dataset.plushlifeDayGrid = "true";
    }

    const starterHeading = Array.from(panel.querySelectorAll("div")).find((node) => clean(node.textContent).startsWith("starter packs ·"));
    const starterCard = starterHeading?.parentElement;
    if (starterCard) {
      starterCard.dataset.plushlifeTaskCard = "starter-pack";
      const intro = starterHeading.nextElementSibling;
      if (intro) intro.dataset.plushlifeStarterIntro = "true";
      const preview = Array.from(starterCard.querySelectorAll("div")).find((node) => clean(node.textContent).startsWith("this will add") || clean(node.textContent).startsWith("you already have every task"));
      if (preview?.parentElement) preview.parentElement.dataset.plushlifePackPreview = "true";
      const addButton = Array.from(starterCard.querySelectorAll("button")).find((node) => clean(node.textContent).startsWith("add "));
      if (addButton) addButton.dataset.plushlifePackAdd = "true";
    }

    const importButton = Array.from(panel.querySelectorAll("button")).find((node) => clean(node.textContent).includes("import a list of tasks"));
    const importCard = importButton?.parentElement;
    if (importCard) importCard.dataset.plushlifeTaskCard = "import";

    const addHeading = Array.from(panel.querySelectorAll("div")).find((node) => clean(node.textContent) === "step 2 · add a task");
    const addCard = addHeading?.parentElement;
    if (addCard) addCard.dataset.plushlifeTaskCard = "add-task";
  }

  markTaskManager();
  const taskManagerObserver = new MutationObserver(markTaskManager);
  taskManagerObserver.observe(document.documentElement, { childList: true, subtree: true });

  function removeGentleLauncher() {
    const launcher = document.getElementById("plushlife-gentle-launcher");
    if (!launcher) return;
    launcher.setAttribute("aria-hidden", "true");
    launcher.tabIndex = -1;
    launcher.remove();
  }

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
