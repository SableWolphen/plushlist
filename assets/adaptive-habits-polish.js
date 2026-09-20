(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeAdaptiveHabitsPolishInstalled) return;
  window.__plushlifeAdaptiveHabitsPolishInstalled = true;

  const STATE_KEY = "plushlife:adaptive-habits-polish:v1";
  const GROWTH_KEY = "plushlife:growth-loop:v1";
  const QUIET_START_MINUTES = 21 * 60 + 30;
  const QUIET_END_MINUTES = 8 * 60;
  const CAPACITY_OPTIONS = [
    { pct: 100, mode: "full", icon: "☀️", label: "Full", detail: "Full version" },
    { pct: 60, mode: "soft", icon: "🌤️", label: "Soft", detail: "Gentler versions" },
    { pct: 30, mode: "tiny", icon: "🌱", label: "Tiny", detail: "Smallest useful version" },
    { pct: 10, mode: "tiny", icon: "🫶", label: "Essentials", detail: "Only what really matters", essentials: true },
  ];

  const SITUATION_TEMPLATES = {
    "rough-morning": {
      label: "Rough morning",
      tasks: ["Drink some water", "Take medication", "Eat something easy", "Wash face or brush teeth", "Choose one next step"],
    },
    "workday-reset": {
      label: "Workday reset",
      tasks: ["Check the one thing that matters most", "Drink some water", "Take a 5-minute reset", "Handle one small admin task", "Set up tomorrow's first step"],
    },
    "bare-minimum-cleaning": {
      label: "Bare-minimum cleaning",
      tasks: ["Throw away 5 pieces of trash", "Put away 3 things", "Clear one small surface", "Wash one dish", "Stop when the room feels a little easier"],
    },
    "sunday-reset": {
      label: "Sunday reset",
      tasks: ["Check the week ahead", "Pick one important priority", "Refill essentials", "Reset one small space", "Choose an easy Monday first step"],
    },
    "back-on-track": {
      label: "Back on track",
      tasks: ["Open PlushLife and check in", "Choose a Tiny or Soft day if needed", "Do one essential", "Do one useful next step", "Leave the rest for later"],
    },
  };

  function dateKey(date) {
    const value = date instanceof Date ? date : new Date(date || Date.now());
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function offsetDateKey(days) {
    const value = new Date();
    value.setHours(12, 0, 0, 0);
    value.setDate(value.getDate() + Number(days || 0));
    return dateKey(value);
  }

  function safeJson(key, fallback) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
      return parsed == null ? fallback : parsed;
    } catch (_error) {
      return fallback;
    }
  }

  function readState() {
    return safeJson(STATE_KEY, {});
  }

  function saveState(patch) {
    const next = { ...readState(), ...(patch || {}) };
    try { window.localStorage.setItem(STATE_KEY, JSON.stringify(next)); } catch (_error) {}
    return next;
  }

  function readGrowth() {
    return safeJson(GROWTH_KEY, {});
  }

  function saveGrowth(patch) {
    const next = { ...readGrowth(), ...(patch || {}) };
    try { window.localStorage.setItem(GROWTH_KEY, JSON.stringify(next)); } catch (_error) {}
    return next;
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function visible(node) {
    return Boolean(node && node.getClientRects && node.getClientRects().length);
  }

  function textButton(pattern, root) {
    const scope = root || document;
    return Array.from(scope.querySelectorAll("button,[role='button'],a")).find((node) => visible(node) && pattern.test(clean(node.textContent || node.getAttribute("aria-label"))));
  }

  function isSignedOut() {
    const email = document.querySelector('input[type="email"]');
    if (email && visible(email)) return true;
    return Array.from(document.querySelectorAll("button,a")).some((node) => visible(node) && /^(start free|start your list|send code|sign in)$/i.test(clean(node.textContent)));
  }

  function nurseryVisible() {
    return Boolean(document.querySelector(".baby-mode,.baby-arrival-ritual,.mamas-corner,[aria-label='Little space arrival']"));
  }

  function growthModeToday() {
    const growth = readGrowth();
    const today = dateKey(new Date());
    if (growth.lastChoiceDate === today && ["full", "soft", "tiny"].includes(growth.lastChoice)) return growth.lastChoice;
    return null;
  }

  function budgetForMode(mode) {
    if (mode === "tiny") return 30;
    if (mode === "soft") return 60;
    if (mode === "full") return 100;
    return null;
  }

  function todayBudget() {
    const today = dateKey(new Date());
    const state = readState();
    const stored = Number(state.capacityByDate?.[today]);
    if ([10, 30, 60, 100].includes(stored)) return stored;
    return budgetForMode(growthModeToday());
  }

  function capacityOption(pct) {
    return CAPACITY_OPTIONS.find((item) => item.pct === Number(pct)) || CAPACITY_OPTIONS[2];
  }

  function findDayModeButton(mode) {
    const patterns = {
      full: /(^|\s)full day(\s|$)|use full|make today full/i,
      soft: /(^|\s)soft day(\s|$)|start a soft day|use soft|make today softer|lighter routine/i,
      tiny: /(^|\s)tiny day(\s|$)|use tiny|make today tiny|minimal day/i,
    };
    return Array.from(document.querySelectorAll("button")).find((button) => visible(button) && patterns[mode].test(clean(button.textContent)));
  }

  function openExistingEssentials() {
    const essentials = textButton(/^(essentials only|tiny essentials|keep only essentials)$/i);
    if (essentials) {
      essentials.click();
      return true;
    }
    const rescue = textButton(/plushrescue|need the day to feel smaller/i);
    if (rescue) {
      rescue.click();
      window.setTimeout(() => {
        const inside = textButton(/tiny essentials|only essentials|smallest useful/i, document.getElementById("plushlife-gentle-panel") || document);
        if (inside) inside.click();
      }, 160);
      return true;
    }
    return false;
  }

  function reopenCapacityCheckIn() {
    document.querySelector('[data-plushlife-open-checkin="true"]')?.click();
  }

  function selectCapacity(pct, options) {
    const option = capacityOption(pct);
    const today = dateKey(new Date());
    const current = readState();
    saveState({
      capacityByDate: { ...(current.capacityByDate || {}), [today]: option.pct },
      lastCapacityDate: today,
      lastCapacity: option.pct,
    });

    const apply = () => {
      const checkInButton = document.querySelector(`[data-plushlife-day-type="${option.mode}"]`);
      const modeButton = checkInButton && visible(checkInButton) ? checkInButton : findDayModeButton(option.mode);
      if (!modeButton) return false;
      modeButton.click();
      if (option.essentials || options?.essentials) window.setTimeout(openExistingEssentials, 140);
      window.setTimeout(refresh, 180);
      return true;
    };

    if (apply()) return;
    reopenCapacityCheckIn();
    window.setTimeout(() => {
      if (!apply()) {
        showToast(`Pick ${option.label} from the day choices to finish changing today's plan.`);
      }
    }, 180);
  }

  function coachLine(pct) {
    const growth = readGrowth();
    const today = dateKey(new Date());
    if (growth.lastFeedbackDate === today && growth.lastFeedback === "too_much") return "🧸 That last step felt too big. Smaller is the right move, not a failure.";
    if (pct <= 10) return "🧸 Protect the essentials. Everything else is allowed to wait.";
    if (pct <= 30) return "🧸 Small still counts. Tiny is the habit doing its job on a hard day.";
    if (pct <= 60) return "🧸 Softer versions are still the habit. You do not have to earn Full.";
    return "🧸 Full does not mean perfect. One useful step at a time is enough.";
  }

  function installStyle() {
    if (document.getElementById("plushlife-adaptive-habits-style")) return;
    const style = document.createElement("style");
    style.id = "plushlife-adaptive-habits-style";
    style.textContent = `
      #plushlife-adaptive-capacity-card,#plushlife-tomorrow-setup,#plushlife-tomorrow-note,#plushlife-auto-shrink-suggestion{box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#5b4b6b}
      #plushlife-adaptive-capacity-card{margin:0 0 9px;padding:10px 11px;border:1px solid #ded0e7;border-radius:14px;background:linear-gradient(145deg,#fffafd,#f7fbfa);box-shadow:0 5px 16px rgba(83,53,98,.06)}
      .plushlife-capacity-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.plushlife-capacity-main{flex:1;min-width:160px}.plushlife-capacity-kicker{font-size:9px;letter-spacing:.12em;font-weight:900;color:#a65dc1}.plushlife-capacity-title{margin-top:2px;font-size:13px;font-weight:900}.plushlife-capacity-coach{margin-top:4px;font-size:10.5px;line-height:1.4;color:#7b6888}
      .plushlife-adaptive-btn{min-height:40px;padding:8px 9px;border:1px solid #dccbe5;border-radius:10px;background:#fff;color:#76558a;font:800 10.5px/1.2 system-ui,sans-serif;cursor:pointer}.plushlife-adaptive-btn.primary{background:#a65dc1;border-color:#a65dc1;color:#fff}.plushlife-adaptive-btn.soft{background:#f6eff9}.plushlife-adaptive-btn:focus-visible{outline:3px solid rgba(166,93,193,.24);outline-offset:2px}
      .plushlife-capacity-actions{display:flex;gap:5px;flex-wrap:wrap}.plushlife-capacity-pattern{margin-top:8px;padding-top:7px;border-top:1px solid #eadff0;display:flex;gap:7px;align-items:center;flex-wrap:wrap;font-size:10.5px;line-height:1.4;color:#75657f}.plushlife-capacity-pattern span{flex:1;min-width:170px}
      #plushlife-adaptive-intro{margin-top:8px;padding:7px 9px;border-radius:10px;background:#f8f2fb;border:1px solid #eadff0;color:#745f80;font:700 10px/1.42 system-ui,sans-serif}.plushlife-checkin-extra{margin-top:7px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.plushlife-checkin-extra button{min-height:40px;padding:7px 9px;border-radius:10px;border:1px solid #d8c5e3;background:#fff;color:#76558a;font-weight:900;cursor:pointer}.plushlife-checkin-extra small{font-size:9.5px;color:#806f89;line-height:1.35;flex:1;min-width:150px}
      #plushlife-tomorrow-setup,#plushlife-tomorrow-note{margin:0 0 9px;padding:10px 11px;border-radius:14px;border:1px solid #d8e7df;background:linear-gradient(145deg,#f5fbf8,#fffafd)}#plushlife-tomorrow-setup strong,#plushlife-tomorrow-note strong{font-size:11.5px}.plushlife-tomorrow-copy{margin-top:3px;font-size:10.5px;line-height:1.4;color:#6f7e77}.plushlife-tomorrow-row{display:flex;gap:6px;margin-top:7px}.plushlife-tomorrow-row input{flex:1;min-width:0;padding:8px 9px;border:1px solid #cde2d8;border-radius:9px;background:#fff;color:#4f6259}.plushlife-tomorrow-row button{min-height:40px;padding:7px 10px;border:0;border-radius:9px;background:#318c79;color:#fff;font-weight:900;cursor:pointer}
      #plushlife-auto-shrink-suggestion{margin-top:8px;padding:8px 9px;border:1px solid #e5d4ec;border-radius:11px;background:#fbf5fd;font-size:10.5px;line-height:1.4}.plushlife-shrink-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
      #plushlife-task-versions-tip,#plushlife-situation-templates{box-sizing:border-box;margin:8px 0;padding:9px 10px;border-radius:11px;border:1px solid #cfe8e1;background:#f4fbf8;color:#56736b;font:700 10.5px/1.45 system-ui,sans-serif}#plushlife-task-versions-tip strong,#plushlife-situation-templates strong{color:#318c79}.plushlife-template-grid{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.plushlife-template-grid button,#plushlife-suggest-versions{min-height:38px;padding:7px 8px;border-radius:9px;border:1px solid #c9e1d8;background:#fff;color:#397969;font-weight:900;font-size:10px;cursor:pointer}#plushlife-suggest-versions{width:100%;margin:7px 0 2px}
      #plushlife-adaptive-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147482960;width:min(430px,calc(100% - 24px));padding:12px 13px;border-radius:15px;background:#fffafd;border:1px solid #decce7;box-shadow:0 16px 48px rgba(54,34,65,.26);color:#5b4b6b;font:700 11px/1.42 system-ui,sans-serif}
      html[data-plushlife-color-mode="dark"] #plushlife-adaptive-capacity-card,html[data-plushlife-color-mode="dark"] #plushlife-tomorrow-setup,html[data-plushlife-color-mode="dark"] #plushlife-tomorrow-note,html[data-plushlife-color-mode="dark"] #plushlife-auto-shrink-suggestion,html[data-plushlife-color-mode="dark"] #plushlife-adaptive-toast{background:#281f31!important;border-color:#594563!important;color:#f3eaf6!important}html[data-plushlife-color-mode="dark"] .plushlife-capacity-coach,html[data-plushlife-color-mode="dark"] .plushlife-capacity-pattern,html[data-plushlife-color-mode="dark"] .plushlife-tomorrow-copy{color:#cbbdd1!important}html[data-plushlife-color-mode="dark"] .plushlife-adaptive-btn{background:#211a28!important;border-color:#594963!important;color:#eee5f2!important}html[data-plushlife-color-mode="dark"] #plushlife-adaptive-intro{background:#33263f!important;border-color:#594563!important;color:#dacde0!important}html[data-plushlife-color-mode="dark"] #plushlife-task-versions-tip,html[data-plushlife-color-mode="dark"] #plushlife-situation-templates{background:#24352f!important;border-color:#3f6257!important;color:#cce0d9!important}
      @media(max-width:410px){.plushlife-capacity-actions{width:100%}.plushlife-capacity-actions .plushlife-adaptive-btn{flex:1}.plushlife-tomorrow-row{flex-wrap:wrap}.plushlife-tomorrow-row button{width:100%}}
      @media(prefers-reduced-motion:reduce){#plushlife-adaptive-capacity-card *{scroll-behavior:auto!important}}
    `;
    document.head.appendChild(style);
  }

  function showToast(message) {
    document.getElementById("plushlife-adaptive-toast")?.remove();
    const toast = document.createElement("div");
    toast.id = "plushlife-adaptive-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 6000);
  }

  function enhanceGrowthCheckIn() {
    const card = document.getElementById("plushlife-growth-checkin");
    if (!card || !visible(card)) return;

    card.querySelectorAll(".plushlife-growth-choice[data-mode]").forEach((button) => {
      const mode = button.dataset.mode;
      if (button.dataset.plushlifeCapacityEnhanced === "true") return;
      button.dataset.plushlifeCapacityEnhanced = "true";
      const pct = mode === "full" ? 100 : mode === "soft" ? 60 : 30;
      const small = button.querySelector("small");
      if (small) small.textContent = `${pct}% · ${mode === "full" ? "full version" : mode === "soft" ? "gentler versions" : "smallest useful version"}`;
      button.addEventListener("click", () => {
        const current = readState();
        const today = dateKey(new Date());
        saveState({ capacityByDate: { ...(current.capacityByDate || {}), [today]: pct }, lastCapacity: pct, lastCapacityDate: today });
      });
    });

    if (!document.getElementById("plushlife-adaptive-intro")) {
      const intro = document.createElement("div");
      intro.id = "plushlife-adaptive-intro";
      intro.textContent = "Pick capacity → do one useful step → tell PlushLife if it felt too big. Full, Soft, and Tiny are different versions of the same habit—not pass/fail grades.";
      const choices = card.querySelector(".plushlife-growth-choices");
      if (choices) card.insertBefore(intro, choices);
    }

    if (!card.querySelector(".plushlife-checkin-extra")) {
      const extra = document.createElement("div");
      extra.className = "plushlife-checkin-extra";
      extra.innerHTML = '<button type="button">🫶 I only have ~10%</button><small>Keep only essentials and make the rest optional.</small>';
      extra.querySelector("button").addEventListener("click", () => selectCapacity(10, { essentials: true }));
      card.appendChild(extra);
    }
  }

  function manualGrowthSummary() {
    const choices = readGrowth().choicesByDate || {};
    const result = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = dateKey(date);
      if (choices[key]) result.push({ key, mode: choices[key] });
    }
    const counts = { full: 0, soft: 0, tiny: 0 };
    result.forEach(({ mode }) => { if (counts[mode] != null) counts[mode] += 1; });
    return { choices: result, counts, adapted: counts.soft + counts.tiny };
  }

  function patternSummary() {
    let summary = null;
    try { summary = window.PlushLifeGrowthLoop?.summary?.(); } catch (_error) {}
    if (!summary || !Array.isArray(summary.choices)) summary = manualGrowthSummary();
    if (summary.choices.length < 3) return "";
    if (summary.adapted > 0) return `You adapted ${summary.adapted} of ${summary.choices.length} check-ins this week instead of forcing the same plan.`;
    return `You chose Full on ${summary.choices.length} recent check-ins. PlushLife will keep watching for when a softer version helps.`;
  }

  function openPatterns() {
    const control = textButton(/plushgrowth|growth|progress|patterns/i);
    if (control) control.click();
    else window.location.hash = "progress";
  }

  function tooMuchCountLast7Days() {
    const now = Date.now();
    const cutoff = now - 7 * 86400000;
    return (readState().tooMuchSignals || []).filter((value) => Number(value) >= cutoff).length;
  }

  function renderShrinkSuggestion(card) {
    const today = dateKey(new Date());
    const state = readState();
    if (tooMuchCountLast7Days() < 2 || state.shrinkSuggestionDismissedDate === today || state.shrinkSuggestionAcceptedDate === today) return;
    if (document.getElementById("plushlife-auto-shrink-suggestion")) return;
    const box = document.createElement("div");
    box.id = "plushlife-auto-shrink-suggestion";
    box.innerHTML = '<strong>🌱 Smaller has helped more than once.</strong><div style="margin-top:3px">Want me to keep today Tiny? You can switch back whenever you want.</div><div class="plushlife-shrink-actions"><button type="button" class="plushlife-adaptive-btn primary">Keep today Tiny</button><button type="button" class="plushlife-adaptive-btn">Not now</button></div>';
    const buttons = box.querySelectorAll("button");
    buttons[0].addEventListener("click", () => {
      saveState({ shrinkSuggestionAcceptedDate: today });
      selectCapacity(30);
      box.remove();
    });
    buttons[1].addEventListener("click", () => {
      saveState({ shrinkSuggestionDismissedDate: today });
      box.remove();
    });
    card.appendChild(box);
  }

  async function scheduleGentleNudge() {
    const plugin = window.Capacitor?.Plugins?.LocalNotifications || window.LocalNotifications;
    if (!plugin?.schedule) {
      showToast("Gentle nudges are available in the Android app when notifications are enabled.");
      return;
    }
    try {
      let permission = null;
      if (plugin.checkPermissions) permission = await plugin.checkPermissions();
      const current = permission?.display || permission?.receive || permission?.notifications;
      if (current && current !== "granted") {
        if (!plugin.requestPermissions) throw new Error("Notification permission is not available.");
        permission = await plugin.requestPermissions();
        const granted = permission?.display || permission?.receive || permission?.notifications;
        if (granted !== "granted") {
          showToast("No problem — I won’t schedule a nudge without notification permission.");
          return;
        }
      }

      const pct = todayBudget() || 60;
      const energy = pct <= 30 ? "low" : pct <= 60 ? "okay" : "high";
      let body = pct <= 30 ? "No rush. One tiny step is enough when you're ready." : "A gentle nudge from PlushLife — your next step is waiting.";
      try {
        const plan = window.PlushLifePremiumSmart?.buildReminderPlan?.({ energy, style: "gentle", maxDaily: 1 });
        if (plan?.body) body = plan.body;
      } catch (_error) {}

      const at = new Date(Date.now() + 90 * 60000);
      const minutes = at.getHours() * 60 + at.getMinutes();
      if (minutes >= QUIET_START_MINUTES || minutes < QUIET_END_MINUTES) {
        if (minutes >= QUIET_START_MINUTES) at.setDate(at.getDate() + 1);
        at.setHours(8, 30, 0, 0);
      }
      const id = 730000000 + Number(dateKey(new Date()).replace(/-/g, ""));
      if (plugin.cancel) {
        try { await plugin.cancel({ notifications: [{ id }] }); } catch (_error) {}
      }
      await plugin.schedule({
        notifications: [{
          id,
          title: "A gentle PlushLife nudge",
          body,
          schedule: { at, allowWhileIdle: true },
          channelId: "plushlife-reminders",
          extra: { source: "adaptive-habits" },
        }],
      });
      saveState({ lastNudgeAt: at.toISOString() });
      const time = at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      showToast(`Okay 💜 I’ll gently nudge you around ${time}.`);
    } catch (_error) {
      showToast("I couldn’t schedule that nudge. You can check notification settings and try again.");
    }
  }

  function installCapacityCard() {
    if (isSignedOut()) return;
    const nextStep = document.getElementById("plushlife-smart-next-step");
    if (!nextStep || !visible(nextStep)) return;
    const pct = todayBudget();
    if (!pct) return;
    let card = document.getElementById("plushlife-adaptive-capacity-card");
    if (!card) {
      card = document.createElement("section");
      card.id = "plushlife-adaptive-capacity-card";
      card.setAttribute("aria-label", "Today's adaptive capacity");
      nextStep.parentNode?.insertBefore(card, nextStep);
    }
    const option = capacityOption(pct);
    const pattern = patternSummary();
    const growth = readGrowth();
    const renderKey = [pct, pattern, growth.lastFeedbackDate, growth.lastFeedback, tooMuchCountLast7Days()].join("|");
    if (card.dataset.renderKey === renderKey) {
      renderShrinkSuggestion(card);
      return;
    }
    card.dataset.renderKey = renderKey;
    card.innerHTML = `
      <div class="plushlife-capacity-top">
        <div class="plushlife-capacity-main"><div class="plushlife-capacity-kicker">TODAY'S CAPACITY</div><div class="plushlife-capacity-title">${option.icon} ${option.pct}% · ${option.label} <span style="font-size:10px;font-weight:700;color:#8a7895">— ${option.detail}</span></div><div class="plushlife-capacity-coach">${coachLine(pct)}</div></div>
        <div class="plushlife-capacity-actions"><button type="button" class="plushlife-adaptive-btn" data-action="change">Change</button><button type="button" class="plushlife-adaptive-btn soft" data-action="rescue">I can’t do today</button><button type="button" class="plushlife-adaptive-btn" data-action="nudge">🔔 Nudge me later</button></div>
      </div>
      ${pattern ? `<div class="plushlife-capacity-pattern"><span>💜 ${pattern}</span><button type="button" class="plushlife-adaptive-btn" data-action="patterns">See patterns</button><button type="button" class="plushlife-adaptive-btn" data-action="share">Share win</button></div>` : ""}
    `;
    card.querySelector('[data-action="change"]')?.addEventListener("click", reopenCapacityCheckIn);
    card.querySelector('[data-action="rescue"]')?.addEventListener("click", () => {
      selectCapacity(10, { essentials: true });
    });
    card.querySelector('[data-action="nudge"]')?.addEventListener("click", scheduleGentleNudge);
    card.querySelector('[data-action="patterns"]')?.addEventListener("click", openPatterns);
    card.querySelector('[data-action="share"]')?.addEventListener("click", () => {
      if (window.PlushLifeGrowthLoop?.showShareCard) window.PlushLifeGrowthLoop.showShareCard();
      else showToast("Your private-safe weekly share card will be ready after a few check-ins.");
    });
    renderShrinkSuggestion(card);
  }

  function installTomorrowNote() {
    if (isSignedOut()) return;
    const nextStep = document.getElementById("plushlife-smart-next-step");
    if (!nextStep || !visible(nextStep)) return;
    const today = dateKey(new Date());
    const state = readState();
    const priority = clean(state.tomorrowPriorities?.[today]);
    if (!priority || state.tomorrowDismissed?.[today]) {
      document.getElementById("plushlife-tomorrow-note")?.remove();
      return;
    }
    if (document.getElementById("plushlife-tomorrow-note")) return;
    const note = document.createElement("section");
    note.id = "plushlife-tomorrow-note";
    note.innerHTML = `<strong>🌅 Yesterday-you left you a starting point</strong><div class="plushlife-tomorrow-copy"></div><div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button type="button" class="plushlife-adaptive-btn primary">Keep this in mind</button><button type="button" class="plushlife-adaptive-btn">Dismiss</button></div>`;
    note.querySelector(".plushlife-tomorrow-copy").textContent = priority;
    const buttons = note.querySelectorAll("button");
    buttons[0].addEventListener("click", () => {
      note.remove();
      nextStep.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
    buttons[1].addEventListener("click", () => {
      const current = readState();
      saveState({ tomorrowDismissed: { ...(current.tomorrowDismissed || {}), [today]: true } });
      note.remove();
    });
    nextStep.parentNode?.insertBefore(note, nextStep);
  }

  function installTomorrowSetup() {
    if (isSignedOut()) return;
    const now = new Date();
    if (now.getHours() < 18) return;
    const nextStep = document.getElementById("plushlife-smart-next-step");
    if (!nextStep || !visible(nextStep)) return;
    const tomorrow = offsetDateKey(1);
    const existing = clean(readState().tomorrowPriorities?.[tomorrow]);
    let card = document.getElementById("plushlife-tomorrow-setup");
    if (card) return;
    card = document.createElement("section");
    card.id = "plushlife-tomorrow-setup";
    const anchor = document.getElementById("plushlife-adaptive-capacity-card") || nextStep;
    anchor.parentNode?.insertBefore(card, anchor.nextSibling);
    card.innerHTML = `<strong>🌙 20-second setup for tomorrow</strong><div class="plushlife-tomorrow-copy">What is one thing tomorrow-you would appreciate? This stays on this device.</div><div class="plushlife-tomorrow-row"><input maxlength="160" aria-label="One priority for tomorrow" placeholder="Example: Start with my water and medication"><button type="button">${existing ? "Update" : "Save"}</button></div>${existing ? '<div class="plushlife-tomorrow-copy" style="margin-top:6px">Saved: <span data-saved></span></div>' : ""}`;
    const input = card.querySelector("input");
    input.value = existing;
    const saved = card.querySelector("[data-saved]");
    if (saved) saved.textContent = existing;
    const save = () => {
      const value = clean(input.value).slice(0, 160);
      if (!value) return showToast("Give tomorrow-you one small starting point first.");
      const current = readState();
      saveState({ tomorrowPriorities: { ...(current.tomorrowPriorities || {}), [tomorrow]: value } });
      card.querySelector("button").textContent = "Update";
      let savedLine = card.querySelector("[data-saved]");
      if (!savedLine) {
        const line = document.createElement("div");
        line.className = "plushlife-tomorrow-copy";
        line.style.marginTop = "6px";
        line.innerHTML = 'Saved: <span data-saved></span>';
        card.appendChild(line);
        savedLine = line.querySelector("[data-saved]");
      }
      savedLine.textContent = value;
      showToast("Saved for tomorrow-you 💜");
    };
    card.querySelector("button")?.addEventListener("click", save);
    input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); save(); } });
  }

  function findTaskPanel() {
    const add = Array.from(document.querySelectorAll("button")).find((button) => visible(button) && /add this task/i.test(clean(button.textContent)));
    if (!add) return null;
    return add.closest('[role="dialog"]') || add.closest("aside") || add.parentElement?.parentElement?.parentElement || null;
  }

  function setControlledValue(input, value) {
    if (!input) return;
    const prototype = input.tagName === "TEXTAREA" ? window.HTMLTextAreaElement?.prototype : window.HTMLInputElement?.prototype;
    const setter = prototype && Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(input, value); else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function taskVersionSuggestions(name) {
    const raw = clean(name);
    const lower = raw.toLowerCase();
    if (!raw) return null;
    if (/medicat|medicine|prescription|insulin|dose|pill/.test(lower)) return { soft: raw, tiny: raw, note: "Medication stays exact—PlushLife will not suggest a smaller dose." };
    if (/workout|exercise|\bgym\b|strength|cardio/.test(lower)) return { soft: "Do a 10-minute version", tiny: "Stretch or move for 2 minutes" };
    if (/walk|steps|stroll/.test(lower)) return { soft: "Take a 10-minute walk", tiny: "Step outside for 2 minutes" };
    if (/shower|bathe|bath/.test(lower)) return { soft: "Take a quick shower", tiny: "Wash my face" };
    if (/clean|tidy|declutter|room|house/.test(lower)) return { soft: "Tidy one small area for 5 minutes", tiny: "Put away 3 things" };
    if (/dish|kitchen/.test(lower)) return { soft: "Do dishes for 5 minutes", tiny: "Wash one dish" };
    if (/read|book/.test(lower)) return { soft: "Read 5 pages", tiny: "Read 1 page" };
    if (/journal|write|reflection/.test(lower)) return { soft: "Write 3 lines", tiny: "Write 1 sentence" };
    if (/laundry|clothes/.test(lower)) return { soft: "Do one laundry step", tiny: "Put away 3 items" };
    if (/water|hydrate|drink/.test(lower)) return { soft: "Drink half a glass of water", tiny: "Take 3 sips" };
    if (/teeth|tooth|floss/.test(lower)) return { soft: "Brush for 1 minute", tiny: "Brush for 20 seconds" };
    if (/email|inbox|message/.test(lower)) return { soft: "Handle one important message", tiny: "Open the inbox and pick one message" };
    return { soft: `Start “${raw}” for 5 minutes`, tiny: `Do the first 2-minute step of “${raw}”` };
  }

  function installTaskVersionHelper(panel) {
    const more = Array.from(panel.querySelectorAll("button")).find((button) => /more options/i.test(clean(button.textContent)));
    if (more && !more.dataset.plushlifeAdaptiveLabel) {
      more.dataset.plushlifeAdaptiveLabel = "true";
      more.textContent = clean(more.textContent).replace(/More options.+?(?=[▸▾]?$)/i, "More options — Full / Soft / Tiny versions, schedule & habit type ");
    }
    if (more && !document.getElementById("plushlife-task-versions-tip")) {
      const tip = document.createElement("div");
      tip.id = "plushlife-task-versions-tip";
      tip.innerHTML = '<strong>✨ Signature habit setup</strong><br>Keep the task name as the Full version. Add Soft and Tiny versions so PlushLife can automatically meet you where you are that day.';
      more.parentNode?.insertBefore(tip, more);
    }

    const soft = panel.querySelector('input[aria-label="Soft task version"]');
    const tiny = panel.querySelector('input[aria-label="Tiny task version"]');
    if (!soft || !tiny || document.getElementById("plushlife-suggest-versions")) return;
    const button = document.createElement("button");
    button.id = "plushlife-suggest-versions";
    button.type = "button";
    button.textContent = "✨ Suggest Soft + Tiny versions";
    button.addEventListener("click", () => {
      const name = panel.querySelector('input[aria-label="New task name"]');
      const suggestion = taskVersionSuggestions(name?.value);
      if (!suggestion) return showToast("Give the task a name first, then I can suggest gentler versions.");
      if (!clean(soft.value)) setControlledValue(soft, suggestion.soft);
      if (!clean(tiny.value)) setControlledValue(tiny, suggestion.tiny);
      showToast(suggestion.note || "Suggested versions are ready to review. Nothing saves until you choose Add this task.");
    });
    soft.parentNode?.insertBefore(button, soft);
  }

  function fillSituationTemplate(panel, key) {
    const template = SITUATION_TEMPLATES[key];
    if (!template) return;
    const importToggle = Array.from(panel.querySelectorAll("button")).find((button) => /import a list of tasks/i.test(clean(button.textContent)));
    if (importToggle?.getAttribute("aria-expanded") === "false") importToggle.click();
    window.setTimeout(() => {
      const textarea = Array.from(panel.querySelectorAll("textarea")).find((node) => /drink water|one task per line/i.test(String(node.placeholder || ""))) || panel.querySelector("textarea");
      if (!textarea) return showToast("Open Import a list of tasks and try that template again.");
      setControlledValue(textarea, template.tasks.join("\n"));
      textarea.focus();
      textarea.scrollIntoView?.({ behavior: "smooth", block: "center" });
      showToast(`${template.label} is ready to review. Tap Import tasks when it looks right.`);
    }, 120);
  }

  function installSituationTemplates(panel) {
    if (document.getElementById("plushlife-situation-templates")) return;
    const importToggle = Array.from(panel.querySelectorAll("button")).find((button) => /import a list of tasks/i.test(clean(button.textContent)));
    if (!importToggle) return;
    const box = document.createElement("div");
    box.id = "plushlife-situation-templates";
    box.innerHTML = '<strong>⚡ Quick situations</strong><br>Prefill a small routine, review it, then import only if it fits.<div class="plushlife-template-grid"></div>';
    const grid = box.querySelector(".plushlife-template-grid");
    Object.entries(SITUATION_TEMPLATES).forEach(([key, template]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = template.label;
      button.addEventListener("click", () => fillSituationTemplate(panel, key));
      grid.appendChild(button);
    });
    importToggle.parentNode?.insertBefore(box, importToggle.nextSibling);
  }

  function enhanceTaskManager() {
    const panel = findTaskPanel();
    if (!panel || !visible(panel)) return;
    installTaskVersionHelper(panel);
    installSituationTemplates(panel);
  }

  function recordTooMuchClick(event) {
    const button = event.target?.closest?.("button");
    if (!button || !button.closest("#plushlife-growth-toast")) return;
    if (!/^too much$/i.test(clean(button.textContent))) return;
    const cutoff = Date.now() - 7 * 86400000;
    const current = readState();
    const signals = [...(current.tooMuchSignals || []).map(Number).filter((value) => value >= cutoff), Date.now()].slice(-12);
    saveState({ tooMuchSignals: signals });
    window.setTimeout(refresh, 220);
  }

  function captureCapacityClicks(event) {
    const button = event.target?.closest?.("[data-plushlife-day-type]");
    if (!button) return;
    const mode = button.getAttribute("data-plushlife-day-type");
    const pct = mode === "full" ? 100 : mode === "soft" ? 60 : mode === "tiny" ? 30 : mode === "recovery" ? 25 : 10;
    const today = dateKey(new Date());
    const current = readState();
    saveState({ capacityByDate: { ...(current.capacityByDate || {}), [today]: pct }, lastCapacity: pct, lastCapacityDate: today });
  }

  let running = false;
  function refresh() {
    if (running || document.hidden) return;
    running = true;
    try {
      installStyle();
      installTomorrowNote();
      installTomorrowSetup();
      enhanceTaskManager();
    } finally {
      running = false;
    }
  }

  document.addEventListener("click", recordTooMuchClick, true);
  document.addEventListener("click", captureCapacityClicks, true);
  window.addEventListener("focus", refresh);
  window.addEventListener("plushlife-smart-ready", refresh);
  window.addEventListener("plushlife:habit-coach-updated", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  window.setInterval(refresh, 1100);

  window.PlushLifeAdaptiveHabits = {
    refresh,
    selectCapacity,
    scheduleGentleNudge,
    taskVersionSuggestions,
    situationTemplates: SITUATION_TEMPLATES,
  };

  refresh();
})();
