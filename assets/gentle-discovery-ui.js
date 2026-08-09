(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleDiscoveryUiInstalled) return;
  window.__plushlifeGentleDiscoveryUiInstalled = true;

  const STORAGE_KEY = "plushlife-rescue-v6";
  const TODAY = new Date().toISOString().slice(0, 10);
  const state = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { return {}; } })();
  const saveState = (patch) => { Object.assign(state, patch); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} };
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);
  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-gentle-launcher{display:none;position:fixed;right:10px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2147483000;border:0;border-radius:999px;padding:10px 12px;background:linear-gradient(135deg,#b75acb,#6f8de8);color:#fff;font:800 12px system-ui,sans-serif;box-shadow:0 8px 26px #6b3e7a55;cursor:pointer}
    #plushlife-gentle-panel{position:fixed;inset:0;z-index:2147483001;background:#32243b99;display:grid;place-items:end center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));font-family:system-ui,sans-serif}
    #plushlife-gentle-card{width:min(520px,100%);max-height:84vh;overflow:auto;border-radius:24px;background:#fff8fc;border:1px solid #ead7ef;box-shadow:0 20px 70px #26152f66;padding:18px;color:#5b4b6b}
    .plushlife-gentle-action{width:100%;border:1px solid #dec5e8;border-radius:16px;background:#fff;padding:13px 14px;margin-top:9px;text-align:left;color:#5b4b6b;cursor:pointer;font:700 14px system-ui,sans-serif}
    .plushlife-gentle-action small{display:block;margin-top:4px;font-weight:500;opacity:.76}
    .plushlife-gentle-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#806d8d}
    .plushlife-gentle-note{margin-top:12px;padding:11px;border-radius:14px;background:#f3e9f7;font-size:12px;line-height:1.45}
    .plushlife-energy-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 4px}
    .plushlife-energy{border:1px solid #dec5e8;border-radius:14px;background:#fff;padding:10px;color:#5b4b6b;font:700 13px system-ui,sans-serif;cursor:pointer}
    [data-plushlife-rescue-hidden="true"],[data-plushlife-home-overflow="true"]{display:none!important}
    [data-plushlife-rescue-focus="true"]{outline:3px solid #8f79d8!important;outline-offset:3px;border-radius:14px}
    [data-plushlife-tiny-step]::after{content:attr(data-plushlife-tiny-step);display:block;margin-top:7px;padding:7px 9px;border-radius:10px;background:#f4ecf8;color:#6b5676;font:700 11px system-ui,sans-serif}
    body.plushlife-rescue-view #plushlife-gentle-launcher{background:linear-gradient(135deg,#4c8fe8,#56b7a2)}
    #plushlife-home-more{width:100%;margin:8px 0 2px;padding:10px 12px;border:1px solid #e2cceb;border-radius:14px;background:#fff8fc;color:#6b5676;font:800 13px system-ui,sans-serif;cursor:pointer}
    [data-plushlife-thunderstorm-active="true"]{box-shadow:0 0 0 3px #9f87c955!important}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "plushlife-gentle-launcher";
  launcher.type = "button";
  launcher.textContent = state.mode ? "🌿 Rescue active" : "🧸 PlushRescue";
  document.body.appendChild(launcher);

  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; };

  function isLandingOrSignedOut() {
    const emailInput = document.querySelector('input[type="email"]');
    const landingButton = [...document.querySelectorAll("button")].some((button) => {
      if (!visible(button)) return false;
      const text = cleanText(button.textContent).toLowerCase();
      return text === "start free" || text === "start your list" || text === "send code";
    });
    return !!(emailInput && visible(emailInput)) || landingButton;
  }

  function syncLauncherVisibility() {
    const hide = isLandingOrSignedOut();
    launcher.style.display = hide ? "none" : "block";
    launcher.setAttribute("aria-hidden", hide ? "true" : "false");
    if (hide) closePanel();
  }

  const taskRows = () => {
    const rows = [];
    document.querySelectorAll('input[type="checkbox"],[role="checkbox"],button[aria-pressed]').forEach((control) => {
      if (!visible(control)) return;
      const row = control.closest("li,article,[data-task-key],[class*='task-row'],[class*='task-card']") || control.parentElement;
      if (row && !rows.includes(row) && !row.closest("#plushlife-gentle-panel")) rows.push(row);
    });
    return rows;
  };

  const taskLabel = (row) => cleanText(row && row.textContent).slice(0, 90);
  const tinyStepFor = (label) => {
    const lower = label.toLowerCase();
    if (/clean|tidy|organize|laundry/.test(lower)) return "PlushTinyStep: put away one thing.";
    if (/exercise|workout|walk|gym|stretch/.test(lower)) return "PlushTinyStep: move for two minutes.";
    if (/email|message|reply|call/.test(lower)) return "PlushTinyStep: open the first message.";
    if (/study|read|homework|learn/.test(lower)) return "PlushTinyStep: do two focused minutes.";
    if (/cook|meal|eat|food/.test(lower)) return "PlushTinyStep: prepare one simple part.";
    return "PlushTinyStep: do the smallest visible part.";
  };

  const clearPresentation = () => {
    document.querySelectorAll('[data-plushlife-rescue-hidden="true"]').forEach((row) => delete row.dataset.plushlifeRescueHidden);
    document.querySelectorAll('[data-plushlife-rescue-focus="true"]').forEach((row) => delete row.dataset.plushlifeRescueFocus);
    document.querySelectorAll('[data-plushlife-tiny-step]').forEach((row) => delete row.dataset.plushlifeTinyStep);
  };

  const restore = () => {
    clearPresentation();
    document.body.classList.remove("plushlife-rescue-view", "plushlife-pressure-paused");
    saveState({ mode: null, pressureDate: null, reentry: false });
    launcher.textContent = "🧸 PlushRescue";
  };

  const showOnly = (count, focusFirst, useTinySteps) => {
    const rows = taskRows();
    if (!rows.length) return 0;
    rows.forEach((row, index) => {
      if (index < count) delete row.dataset.plushlifeRescueHidden;
      else row.dataset.plushlifeRescueHidden = "true";
      delete row.dataset.plushlifeRescueFocus;
      delete row.dataset.plushlifeTinyStep;
      if (index < count && useTinySteps) row.dataset.plushlifeTinyStep = tinyStepFor(taskLabel(row));
    });
    if (focusFirst) {
      rows[0].dataset.plushlifeRescueFocus = "true";
      rows[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    document.body.classList.add("plushlife-rescue-view");
    launcher.textContent = "🌿 Rescue active";
    return rows.length;
  };

  const applyEnergy = (energy) => {
    saveState({ energy, energyDate: TODAY });
    const plan = ({ empty: [1, true, true], low: [2, false, true], okay: [3, false, false], ready: [5, false, false] })[energy] || [2, false, true];
    const count = showOnly(plan[0], plan[1], plan[2]);
    if (count) saveState({ mode: energy === "empty" ? "next" : "smaller", reentry: true });
    return count;
  };

  function openPanel() {
    if (panel || isLandingOrSignedOut()) return;
    const returning = state.reentry && state.mode;
    panel = document.createElement("div");
    panel.id = "plushlife-gentle-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.innerHTML = `<div id="plushlife-gentle-card"><div style="display:flex;gap:12px"><div style="flex:1"><strong>PLUSHRESCUE</strong><h2 style="margin:5px 0">${returning ? "Welcome back. Your day stayed safe." : "Need the day to feel smaller?"}</h2><p style="margin:0 0 8px;line-height:1.45">PlushRescue changes what your day asks of you. Your Daily Reflection only records how you feel.</p></div><button class="plushlife-gentle-close" type="button" aria-label="Close PlushRescue">×</button></div><div class="plushlife-energy-grid"><button class="plushlife-energy" data-energy="empty">🫧 Empty</button><button class="plushlife-energy" data-energy="low">🌙 Low</button><button class="plushlife-energy" data-energy="okay">🌿 Okay</button><button class="plushlife-energy" data-energy="ready">✨ Ready</button></div><button class="plushlife-gentle-action" data-action="smaller">🌿 Make today smaller<small>Show only a few caring steps.</small></button><button class="plushlife-gentle-action" data-action="next">✨ Give me one next step<small>Put one doable task front and center.</small></button><button class="plushlife-gentle-action" data-action="pause">🌙 Pause the pressure<small>Soften reminders and streak pressure for today.</small></button><button class="plushlife-gentle-action" data-action="restore">↩️ Back to my full day<small>Restore everything exactly as it was.</small></button><div class="plushlife-gentle-note">One caring step is enough.</div></div>`;
    document.body.appendChild(panel);
    const note = (text) => { const node = panel && panel.querySelector(".plushlife-gentle-note"); if (node) node.textContent = text; };
    const finish = (text) => { note(text); window.setTimeout(closePanel, 700); };
    panel.querySelector(".plushlife-gentle-close").addEventListener("click", closePanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closePanel(); });
    panel.querySelectorAll("[data-energy]").forEach((button) => button.addEventListener("click", () => {
      const count = applyEnergy(button.dataset.energy);
      if (!count) return note("Open Home where your tasks are visible, then choose again.");
      finish(`Your day now fits ${button.textContent.trim().toLowerCase()} energy.`);
    }));
    panel.querySelector('[data-action="smaller"]').addEventListener("click", () => {
      const count = showOnly(state.energy === "empty" ? 1 : 3, false, state.energy === "empty" || state.energy === "low");
      if (!count) return note("Open Home where your tasks are visible, then try again.");
      saveState({ mode: "smaller", reentry: true }); finish("Today is smaller now.");
    });
    panel.querySelector('[data-action="next"]').addEventListener("click", () => {
      const count = showOnly(1, true, true);
      if (!count) return note("Open Home where your tasks are visible, then try again.");
      saveState({ mode: "next", reentry: true }); finish("One PlushTinyStep is ready.");
    });
    panel.querySelector('[data-action="pause"]').addEventListener("click", () => {
      document.body.classList.add("plushlife-pressure-paused");
      saveState({ mode: "pause", pressureDate: TODAY, reentry: true });
      launcher.textContent = "🌿 Rescue active";
      finish("Pressure is softened for today.");
    });
    panel.querySelector('[data-action="restore"]').addEventListener("click", () => { restore(); finish("Your full day is back."); });
  }

  launcher.addEventListener("click", openPanel);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanel(); });

  let thunder = null;
  function stopThunderstorm() {
    if (!thunder) return;
    const { audio, button } = thunder;
    try { audio.pause(); } catch (_) {}
    try { audio.currentTime = 0; } catch (_) {}
    thunder = null;
    if (button) delete button.dataset.plushlifeThunderstormActive;
    document.querySelectorAll('[data-plushlife-thunderstorm-active="true"]').forEach((node) => delete node.dataset.plushlifeThunderstormActive);
  }

  function startThunderstorm(button) {
    stopThunderstorm();
    const audio = new Audio("./assets/thunderstorm.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.48;
    thunder = { audio, button };
    button.dataset.plushlifeThunderstormActive = "true";
    audio.play().catch(() => {
      if (thunder && thunder.audio === audio) stopThunderstorm();
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target && event.target.closest && event.target.closest("button");
    if (!button) return;
    if (button.dataset.plushlifeSoundscapeId) {
      stopThunderstorm();
      return;
    }
    const text = cleanText(button.textContent).toLowerCase();
    if (text === "rain" || text === "thunderstorm") {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      if (thunder && thunder.button === button) stopThunderstorm(); else startThunderstorm(button);
    } else if (thunder && /ocean|white noise|calm tone/.test(text)) stopThunderstorm();
  }, true);

  function polishInterface() {
    syncLauncherVisibility();
    if (isLandingOrSignedOut()) return;

    document.querySelectorAll("button,span,div,h1,h2,h3,p").forEach((node) => {
      if (node.children.length) return;
      const text = cleanText(node.textContent);
      if (text === "Rain") node.textContent = "Thunderstorm";
      if (/^Today['’]s check-in$/i.test(text)) node.textContent = "Daily reflection";
      if (/^Day calendar$/i.test(text) || /^Day view$/i.test(text)) {
        const control = node.closest("button,[role='button'],a") || node;
        control.style.display = "none";
        control.setAttribute("aria-hidden", "true");
      }
    });

    document.querySelectorAll("button").forEach((button) => {
      const text = cleanText(button.textContent);
      if (/^(show|view|see) all( my)? tasks$/i.test(text) && visible(button) && !button.dataset.plushlifeAutoOpened) {
        button.dataset.plushlifeAutoOpened = "true";
        button.click();
      }
    });

    const rows = taskRows().filter((row) => !row.closest('[role="dialog"],#plushlife-gentle-panel'));
    const pageText = cleanText(document.body.innerText).toLowerCase();
    const inTaskManager = /manage tasks|task list|add a task|import tasks/.test(pageText);
    const existing = document.getElementById("plushlife-home-more");
    if (inTaskManager || state.mode || rows.length <= 6) {
      rows.forEach((row) => delete row.dataset.plushlifeHomeOverflow);
      if (existing) existing.remove();
      return;
    }
    rows.forEach((row, index) => { if (index >= 6) row.dataset.plushlifeHomeOverflow = "true"; else delete row.dataset.plushlifeHomeOverflow; });
    if (!existing && rows[5] && rows[5].parentElement) {
      const more = document.createElement("button");
      more.id = "plushlife-home-more";
      more.type = "button";
      more.textContent = `Show ${rows.length - 6} more tasks`;
      more.addEventListener("click", () => {
        rows.forEach((row) => delete row.dataset.plushlifeHomeOverflow);
        more.remove();
      });
      rows[5].insertAdjacentElement("afterend", more);
    }
  }

  if (state.pressureDate && state.pressureDate !== TODAY) restore();
  else if (state.mode === "smaller") setTimeout(() => showOnly(state.energy === "empty" ? 1 : 3, false, state.energy === "empty" || state.energy === "low"), 400);
  else if (state.mode === "next") setTimeout(() => showOnly(1, true, true), 400);
  else if (state.mode === "pause") document.body.classList.add("plushlife-pressure-paused");

  syncLauncherVisibility();
  polishInterface();
  window.setInterval(polishInterface, 1200);
  window.addEventListener("pagehide", stopThunderstorm);
})();
