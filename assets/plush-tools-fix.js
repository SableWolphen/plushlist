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
      background: linear-gradient(145deg,#fffafd,#f8fbff) !important;
    }
    [data-plushlife-task-card="list-picker"] [data-plushlife-day-grid] {
      gap: 6px !important;
      margin-top: 8px !important;
    }
    [data-plushlife-task-card="list-picker"] [data-plushlife-day-grid] button {
      min-height: 38px !important;
      padding: 6px 4px !important;
      border-radius: 11px !important;
      box-shadow: 0 3px 10px rgba(118,85,138,.05) !important;
    }
    [data-plushlife-task-card="starter-pack"] {
      background: linear-gradient(145deg,#f7fcfa,#fbfffd) !important;
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
      background: rgba(255,255,255,.76) !important;
    }
    [data-plushlife-task-card="import"] > button:first-child {
      min-height: 42px !important;
      padding: 9px 11px !important;
    }
    [data-plushlife-task-card="add-task"] {
      padding-top: 11px !important;
    }
    [data-plushlife-task-card="add-task"] > button:last-of-type {
      min-height: 42px !important;
    }
    [data-plushlife-task-card] input,
    [data-plushlife-task-card] select,
    [data-plushlife-task-card] textarea {
      font-size: 16px !important;
    }

    [data-plushlife-natural-schedule] {
      display: none !important;
      margin-top: 6px !important;
    }
    [data-plushlife-natural-schedule][data-open="true"] {
      display: block !important;
    }
    [data-plushlife-natural-toggle] {
      width: 100% !important;
      min-height: 40px !important;
      margin-top: 8px !important;
      padding: 8px 10px !important;
      border-radius: 10px !important;
      border: 1px solid #cfe3f7 !important;
      background: #f8fbff !important;
      color: #527aa4 !important;
      font-weight: 800 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
    }

    [data-plushlife-task-card="task-list"] {
      padding: 11px !important;
      background: linear-gradient(145deg,#fbfffd,#fffafd) !important;
    }
    [data-plushlife-task-card="task-list"] > input {
      margin-top: 7px !important;
      min-height: 40px !important;
      padding: 8px 10px !important;
    }
    [data-plushlife-drag-help] {
      padding: 6px 9px !important;
      border-radius: 9px !important;
      font-size: 10.5px !important;
      background: #f2faf7 !important;
      border-color: #d8ebe5 !important;
      color: #4c8377 !important;
    }
    [data-plushlife-section-card] {
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      border-radius: 0 !important;
    }
    [data-plushlife-section-card] > div:first-child {
      margin: 7px 2px 5px !important;
    }
    [data-plushlife-section-card] [data-plushlife-task-row-container] {
      gap: 0 !important;
      border: 1px solid #e8deec !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      background: rgba(255,255,255,.82) !important;
    }
    [data-plushlife-task-row] {
      min-height: 48px !important;
      padding: 7px 8px !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: rgba(255,255,255,.82) !important;
      flex-wrap: nowrap !important;
      gap: 7px !important;
      box-shadow: none !important;
    }
    [data-plushlife-task-row] + [data-plushlife-task-row] {
      border-top: 1px solid #f0e8f2 !important;
    }
    [data-plushlife-task-row] > button[aria-label^="Reorder"] {
      width: 24px !important;
      min-width: 24px !important;
      height: 36px !important;
      min-height: 36px !important;
      border: 0 !important;
      background: transparent !important;
      color: #aa96b4 !important;
      font-size: 15px !important;
    }
    [data-plushlife-task-row] > div {
      flex: 1 1 auto !important;
    }
    [data-plushlife-task-row] > div > div:first-child {
      font-size: 11.8px !important;
      line-height: 1.25 !important;
    }
    [data-plushlife-task-row] > div > div:nth-child(2) {
      font-size: 9.8px !important;
      margin-top: 1px !important;
    }
    [data-plushlife-task-row] > button[data-plushlife-edit] {
      padding: 5px 7px !important;
      border: 0 !important;
      background: transparent !important;
      color: #9b59b6 !important;
      font-size: 10.5px !important;
    }
    [data-plushlife-task-row] > select[data-plushlife-more-action],
    [data-plushlife-task-row] > button[data-plushlife-more-action] {
      display: none !important;
    }
    [data-plushlife-task-row][data-more-open="true"] {
      flex-wrap: wrap !important;
      background: #fffdfd !important;
    }
    [data-plushlife-task-row][data-more-open="true"] > select[data-plushlife-more-action],
    [data-plushlife-task-row][data-more-open="true"] > button[data-plushlife-more-action] {
      display: inline-flex !important;
      min-height: 34px !important;
      padding: 5px 8px !important;
      font-size: 10px !important;
    }
    [data-plushlife-more-toggle] {
      flex: 0 0 auto !important;
      width: 34px !important;
      min-width: 34px !important;
      height: 34px !important;
      padding: 0 !important;
      border-radius: 9px !important;
      border: 1px solid #e8deec !important;
      background: #faf7fc !important;
      color: #76558a !important;
      font-size: 18px !important;
      line-height: 1 !important;
      cursor: pointer !important;
    }

    .baby-today-simple {
      gap: 7px !important;
    }
    .baby-today-simple section[aria-label="Little jobs"] {
      border-radius: 15px !important;
      overflow: hidden !important;
    }
    .baby-today-simple section[aria-label="Little jobs"] > div:first-child {
      padding: 9px 11px 7px !important;
    }
    .baby-today-simple section[aria-label="Little jobs"] details > summary,
    .baby-today-simple section[aria-label="Little jobs"] button[aria-label="Edit little jobs"] {
      min-width: 34px !important;
      width: auto !important;
      height: 34px !important;
      min-height: 34px !important;
      padding: 5px 8px !important;
      border-radius: 10px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .baby-today-simple section[aria-label="Little jobs"] button[aria-label="Edit little jobs"] {
      width: 34px !important;
      padding: 0 !important;
    }
    .baby-today-simple section[aria-label="Little jobs"] button:not([aria-label="Edit little jobs"]) {
      min-height: 38px !important;
    }
    .baby-today-simple > button {
      min-height: 38px !important;
      border-radius: 12px !important;
    }

    @media (max-width: 520px) {
      [data-plushlife-task-card] { padding: 10px !important; }
      [data-plushlife-task-card="starter-pack"] [data-plushlife-pack-preview] { font-size: 11px !important; }
      [data-plushlife-task-row] { min-height: 46px !important; }
    }
  `;
  document.head.appendChild(compactHomeStyle);

  function markTaskManager() {
    const panels = Array.from(document.querySelectorAll('[role="dialog"], aside, [class*="panel"], [class*="modal"], body > div'));
    const panel = panels.find((node) => visible(node) && clean(node.textContent).includes("change my tasks") && clean(node.textContent).includes("step 1 · choose a list"));
    if (!panel) return;

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
    if (addCard) {
      addCard.dataset.plushlifeTaskCard = "add-task";
      const scheduleLabel = Array.from(addCard.querySelectorAll("label")).find((node) => clean(node.textContent).startsWith("say when it should happen"));
      const scheduleBox = scheduleLabel?.parentElement;
      if (scheduleBox) {
        scheduleBox.dataset.plushlifeNaturalSchedule = "true";
        if (!scheduleBox.dataset.open) scheduleBox.dataset.open = "false";
        if (!addCard.querySelector("[data-plushlife-natural-toggle]")) {
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.dataset.plushlifeNaturalToggle = "true";
          toggle.innerHTML = '<span>🕒 Say when it should happen <small style="font-weight:600">· Optional</small></span><span>⌄</span>';
          toggle.addEventListener("click", () => {
            const open = scheduleBox.dataset.open === "true";
            scheduleBox.dataset.open = open ? "false" : "true";
            toggle.lastElementChild.textContent = open ? "⌄" : "⌃";
          });
          scheduleBox.parentElement.insertBefore(toggle, scheduleBox);
        }
      }
    }

    const step3Heading = Array.from(panel.querySelectorAll("div")).find((node) => clean(node.textContent).startsWith("step 3 · edit or delete"));
    const step3Card = step3Heading?.parentElement;
    if (step3Card) {
      step3Card.dataset.plushlifeTaskCard = "task-list";
      const dragHelp = Array.from(step3Card.querySelectorAll("div")).find((node) => clean(node.textContent).startsWith("↕️ drag the") || clean(node.textContent).startsWith("drag the"));
      if (dragHelp) dragHelp.dataset.plushlifeDragHelp = "true";
      step3Card.querySelectorAll("section[data-plushlife-task-drop-section]").forEach((section) => {
        section.dataset.plushlifeSectionCard = "true";
      });
      step3Card.querySelectorAll("[data-plushlife-task-drop-key]").forEach((row) => {
        row.dataset.plushlifeTaskRow = "true";
        const buttons = Array.from(row.querySelectorAll(":scope > button"));
        const edit = buttons.find((button) => clean(button.getAttribute("aria-label")).startsWith("edit "));
        if (edit) edit.dataset.plushlifeEdit = "true";
        Array.from(row.querySelectorAll(":scope > select")).forEach((select) => { select.dataset.plushlifeMoreAction = "true"; });
        buttons.forEach((button) => {
          const label = clean(button.getAttribute("aria-label"));
          if (label.startsWith("pause ") || label.startsWith("resume ") || label.startsWith("archive ") || label.startsWith("delete ")) button.dataset.plushlifeMoreAction = "true";
        });
        if (!row.querySelector("[data-plushlife-more-toggle]")) {
          const more = document.createElement("button");
          more.type = "button";
          more.dataset.plushlifeMoreToggle = "true";
          more.setAttribute("aria-label", "More task actions");
          more.textContent = "⋯";
          more.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const isOpen = row.dataset.moreOpen === "true";
            step3Card.querySelectorAll('[data-plushlife-task-row][data-more-open="true"]').forEach((other) => { if (other !== row) other.dataset.moreOpen = "false"; });
            row.dataset.moreOpen = isOpen ? "false" : "true";
          });
          row.appendChild(more);
        }
      });
    }
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
