(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGrowthLoopInstalled) return;
  window.__plushlifeGrowthLoopInstalled = true;

  const STORAGE_KEY = "plushlife:growth-loop:v1";
  const localDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const today = localDateKey();
  const readState = () => {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (_error) { return {}; }
  };
  const writeState = (patch) => {
    const current = readState();
    const next = { ...current, ...patch };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_error) {}
    return next;
  };
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const visible = (node) => !!(node && node.getClientRects && node.getClientRects().length);

  const style = document.createElement("style");
  style.id = "plushlife-growth-loop-styles";
  style.textContent = `
    #plushlife-growth-checkin{position:fixed;inset:0;z-index:130;display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));background:rgba(31,20,42,.55);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);font-family:system-ui,sans-serif}
    #plushlife-growth-checkin .plushlife-growth-checkin-card{position:relative;width:min(100%,440px);padding:18px;border-radius:22px;border:1px solid var(--plush-border,#ddcdea);background:var(--plush-surface,#fff9fd);box-shadow:0 24px 70px rgba(40,24,52,.34);color:var(--plush-text,#5b4b6b)}
    #plushlife-growth-checkin .plushlife-growth-checkin-close{position:absolute!important;top:10px!important;right:10px!important;width:40px!important;min-width:40px!important;max-width:40px!important;height:40px!important;min-height:40px!important;max-height:40px!important;padding:0!important;margin:0!important;display:grid!important;place-items:center!important;border:1px solid var(--plush-border-soft,#e6d8eb)!important;border-radius:12px!important;background:var(--plush-surface-2,#fff)!important;color:var(--plush-text,#5b4b6b)!important;box-shadow:none!important;font:700 23px/1 system-ui,sans-serif!important;transform:none!important}
    #plushlife-growth-checkin strong{display:block;padding-right:46px;font-size:19px;line-height:1.22}
    #plushlife-growth-checkin p{margin:7px 0 0;padding-right:28px;font-size:12px;line-height:1.48;color:var(--plush-copy,#7b6888)}
    .plushlife-growth-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}
    #plushlife-growth-checkin button.plushlife-growth-choice{min-height:82px!important;padding:10px 7px!important;border:1px solid var(--plush-border-soft,#dccbe5)!important;border-radius:15px!important;background:var(--plush-surface-2,#fff)!important;color:var(--plush-text,#62516f)!important;box-shadow:none!important;font:850 12px/1.28 system-ui,sans-serif!important;cursor:pointer!important;transform:none!important}
    #plushlife-growth-checkin button.plushlife-growth-choice:focus-visible{outline:3px solid color-mix(in srgb,var(--plush-accent,#b97bce) 35%,transparent)!important;outline-offset:2px!important}
    .plushlife-growth-choice span{display:block;font-size:24px;margin-bottom:4px}
    .plushlife-growth-choice small{font-size:9.7px;font-weight:700;opacity:.78}
    #plushlife-next-step-reason{margin:8px 0 0;padding:7px 9px;border-radius:10px;background:rgba(166,93,193,.08);color:#745c82;font:700 10.5px/1.4 system-ui,sans-serif}
    #plushlife-growth-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147482900;width:min(430px,calc(100% - 24px));padding:13px;border-radius:17px;background:#fff9fd;border:1px solid #decce7;box-shadow:0 18px 55px rgba(54,34,65,.28);font-family:system-ui,sans-serif;color:#5b4b6b}
    #plushlife-growth-toast .title{font-weight:900;font-size:13px}
    #plushlife-growth-toast .body{margin-top:3px;font-size:11.5px;line-height:1.4;color:#7b6888}
    #plushlife-growth-toast .actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
    #plushlife-growth-toast button{min-height:42px;padding:8px 10px;border-radius:11px;border:1px solid #dac8e4;background:#fff;color:#76558a;font:800 11px system-ui,sans-serif;cursor:pointer}
    #plushlife-growth-toast button.primary{border-color:#a65dc1;background:#a65dc1;color:#fff}
    #plushlife-share-win{position:fixed;inset:0;z-index:2147482950;display:grid;place-items:center;padding:18px;background:rgba(43,29,52,.46);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-family:system-ui,sans-serif}
    .plushlife-share-card{width:min(420px,calc(100vw - 28px));padding:22px;border-radius:24px;border:1px solid #e1cde9;background:radial-gradient(circle at 92% 8%,#f9dff3 0,transparent 33%),radial-gradient(circle at 6% 94%,#dff5ec 0,transparent 36%),linear-gradient(150deg,#fffafd,#f9f5ff);box-shadow:0 24px 72px rgba(42,26,52,.34);color:#594766;box-sizing:border-box}
    .plushlife-share-kicker{font-size:9.5px;letter-spacing:.14em;font-weight:900;color:#9b55b7}
    .plushlife-share-card h2{margin:8px 0 4px;font-size:24px;line-height:1.15}
    .plushlife-share-card p{margin:0;color:#7b6888;font-size:12px;line-height:1.45}
    .plushlife-share-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:15px}
    .plushlife-share-stat{padding:10px 7px;border-radius:13px;background:rgba(255,255,255,.78);border:1px solid #eadff0;text-align:center}
    .plushlife-share-stat strong{display:block;font-size:18px}.plushlife-share-stat span{display:block;margin-top:2px;font-size:9.5px;color:#806f89;font-weight:800}
    .plushlife-share-actions{display:flex;gap:7px;margin-top:15px;flex-wrap:wrap}
    .plushlife-share-actions button{flex:1;min-width:100px;min-height:44px;border-radius:12px;border:1px solid #d9c5e3;background:#fff;color:#76558a;font-weight:900;cursor:pointer}.plushlife-share-actions button.primary{background:#a65dc1;color:#fff;border-color:#a65dc1}
    [data-plushlife-growth-pulse="true"]{animation:plushlife-growth-pulse 1.4s ease 2}
    @keyframes plushlife-growth-pulse{0%,100%{box-shadow:0 0 0 0 rgba(166,93,193,0)}50%{box-shadow:0 0 0 5px rgba(166,93,193,.18)}}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-toast{background:#251d2c!important;border-color:#56425f!important;color:#f3eaf6!important}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-toast .body{color:#c8b9ce!important}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-toast button{background:#1f1926!important;border-color:#57475f!important;color:#eee5f2!important}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-toast button.primary{background:#9460aa!important;color:#fff!important}
    html[data-plushlife-color-mode="dark"] #plushlife-next-step-reason{background:#33263f!important;color:#d9c9df!important}
    html[data-plushlife-color-mode="dark"] .plushlife-share-card{background:radial-gradient(circle at 92% 8%,#513451 0,transparent 34%),radial-gradient(circle at 6% 94%,#29453d 0,transparent 36%),linear-gradient(150deg,#352747,#281e39);border-color:#715584;color:#f5edf8}
    html[data-plushlife-color-mode="dark"] .plushlife-share-card p{color:#d6c8dc}html[data-plushlife-color-mode="dark"] .plushlife-share-stat{background:#30243e;border-color:#604b70}html[data-plushlife-color-mode="dark"] .plushlife-share-stat span{color:#cdbed4}html[data-plushlife-color-mode="dark"] .plushlife-share-actions button{background:#30243e;border-color:#604b70;color:#eee5f2}
    @media(max-width:380px){#plushlife-growth-checkin .plushlife-growth-checkin-card{padding:16px}.plushlife-growth-choices{grid-template-columns:1fr}#plushlife-growth-checkin button.plushlife-growth-choice{min-height:58px!important}.plushlife-share-stats{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){[data-plushlife-growth-pulse="true"]{animation:none!important}.plushlife-growth-choice{transition:none!important}}
  `;
  document.head.appendChild(style);

  function signedOut() {
    const email = document.querySelector('input[type="email"]');
    if (email && visible(email)) return true;
    return [...document.querySelectorAll("button")].some((button) => visible(button) && /^(start free|start your list|send code)$/i.test(clean(button.textContent)));
  }

  function todayHost() {
    const nextStep = document.getElementById("plushlife-smart-next-step");
    if (!nextStep || !visible(nextStep)) return null;
    return nextStep.closest("[data-plushlife-home-stack]") || nextStep.parentElement;
  }

  function findDayModeButton(mode) {
    const patterns = {
      full: /(^|\s)full day(\s|$)|use full|make today full/i,
      soft: /(^|\s)soft day(\s|$)|start a soft day|use soft|make today softer|lighter routine/i,
      tiny: /(^|\s)tiny day(\s|$)|use tiny|make today tiny|minimal day/i,
    };
    return [...document.querySelectorAll("button")].find((button) => visible(button) && patterns[mode].test(clean(button.textContent)));
  }

  function pulseNextStep() {
    const card = document.getElementById("plushlife-smart-next-step");
    if (!card) return;
    card.dataset.plushlifeGrowthPulse = "true";
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => { delete card.dataset.plushlifeGrowthPulse; }, 3200);
  }

  function choiceHistoryWith(mode) {
    const current = readState();
    return { ...(current.choicesByDate || {}), [today]: mode };
  }

  function closeCapacityPicker(markPrompt = true) {
    const modal = document.getElementById("plushlife-growth-checkin");
    modal?.remove();
    if (markPrompt) writeState({ promptShownDate: today });
  }

  function otherDialogOpen() {
    return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some((node) => visible(node) && node.id !== "plushlife-growth-checkin");
  }

  function chooseDay(mode) {
    const button = findDayModeButton(mode);
    if (button) button.click();
    const seenDates = Array.from(new Set([...(readState().seenDates || []), today])).slice(-30);
    writeState({
      seenDates,
      choicesByDate: choiceHistoryWith(mode),
      lastChoice: mode,
      lastChoiceDate: today,
      onboardingDate: readState().onboardingDate || today,
      checkInDate: today,
    });
    closeCapacityPicker(false);
    window.setTimeout(() => { installNextStepReason(true); pulseNextStep(); }, 120);
  }

  function openCapacityPicker(force = false) {
    if (signedOut() || document.getElementById("plushlife-growth-checkin")) return false;
    if (!force && otherDialogOpen()) return false;
    const current = readState();
    if (!force && (current.checkInDate === today || current.promptShownDate === today)) return false;

    const seenDates = Array.isArray(current.seenDates) ? current.seenDates : [];
    const isEarlyUse = seenDates.length < 3;
    const overlay = document.createElement("div");
    overlay.id = "plushlife-growth-checkin";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "plushlife-growth-checkin-title");
    overlay.innerHTML = `<div class="plushlife-growth-checkin-card"><button type="button" class="plushlife-growth-checkin-close" aria-label="Not now">×</button><strong id="plushlife-growth-checkin-title">${isEarlyUse ? "How much room do you have today?" : "What kind of day is this?"}</strong><p>${isEarlyUse ? "Pick the amount of capacity you actually have. PlushLife will shape today around it." : "Choose what feels realistic right now. You can change it later in Settings."}</p><div class="plushlife-growth-choices"><button type="button" class="plushlife-growth-choice" data-mode="full"><span>☀️</span>Full<br><small>I've got some room</small></button><button type="button" class="plushlife-growth-choice" data-mode="soft"><span>🌤️</span>Soft<br><small>Keep it gentle</small></button><button type="button" class="plushlife-growth-choice" data-mode="tiny"><span>🌱</span>Tiny<br><small>Bare minimum is enough</small></button></div></div>`;
    document.body.appendChild(overlay);
    writeState({ promptShownDate: today });

    overlay.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => chooseDay(button.dataset.mode)));
    overlay.querySelector(".plushlife-growth-checkin-close")?.addEventListener("click", () => closeCapacityPicker(true));
    overlay.addEventListener("click", (event) => { if (event.target === overlay) closeCapacityPicker(true); });
    overlay.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCapacityPicker(true); });
    window.requestAnimationFrame(() => overlay.querySelector("[data-mode]")?.focus());
    return true;
  }

  function installCheckIn() {
    if (!todayHost()) return;
    openCapacityPicker(false);
  }

  function nextStepReasonText() {
    const state = readState();
    const mode = state.lastChoiceDate === today ? state.lastChoice : null;
    if (mode === "tiny") return "Why this: You chose Tiny, so PlushLife is keeping the next step small and useful.";
    if (mode === "soft") return "Why this: You chose Soft, so PlushLife is favoring something gentler and easier to start.";
    if (mode === "full") return "Why this: You chose Full, so PlushLife can use more of today’s routine while still picking one step at a time.";
    return "Why this: PlushLife weighs your day type, energy, timing, and what looks manageable right now.";
  }

  function installNextStepReason(force) {
    const card = document.getElementById("plushlife-smart-next-step");
    if (!card || !visible(card)) return;
    let reason = document.getElementById("plushlife-next-step-reason");
    if (!reason) {
      reason = document.createElement("div");
      reason.id = "plushlife-next-step-reason";
      reason.setAttribute("role", "note");
      card.appendChild(reason);
    }
    const next = nextStepReasonText();
    if (force || reason.textContent !== next) reason.textContent = next;
  }

  function removeToast() {
    document.getElementById("plushlife-growth-toast")?.remove();
  }

  function recentChoices(days = 7) {
    const choices = readState().choicesByDate || {};
    const result = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = localDateKey(date);
      if (choices[key]) result.push({ key, mode: choices[key] });
    }
    return result;
  }

  function shareSummary() {
    const choices = recentChoices(7);
    const counts = { full: 0, soft: 0, tiny: 0 };
    choices.forEach(({ mode }) => { if (counts[mode] != null) counts[mode] += 1; });
    return { choices, counts, adapted: counts.soft + counts.tiny };
  }

  function closeShareCard() {
    document.getElementById("plushlife-share-win")?.remove();
  }

  async function shareWin() {
    const summary = shareSummary();
    const text = summary.choices.length
      ? `My PlushLife week: ${summary.counts.full} Full, ${summary.counts.soft} Soft, ${summary.counts.tiny} Tiny day${summary.choices.length === 1 ? "" : "s"}. I adapted instead of giving up. 💜`
      : "I showed up for myself today with PlushLife 💜 Small still counts.";
    try {
      if (navigator.share) await navigator.share({ title: "My PlushLife win", text });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast("Copied 💜", "Your privacy-safe win is ready to paste. No task names or private check-in details were included.", [{ label: "Done", primary: true, action: removeToast }]);
      }
    } catch (_error) {}
  }

  function showShareCard() {
    closeShareCard();
    const summary = shareSummary();
    const overlay = document.createElement("div");
    overlay.id = "plushlife-share-win";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Share a PlushLife win");
    overlay.innerHTML = `<div class="plushlife-share-card"><div class="plushlife-share-kicker">MY PLUSHLIFE WEEK</div><h2>Small still counts. 💜</h2><p>I adapted the plan to fit the days I actually had. No streak score, no private task names.</p><div class="plushlife-share-stats"><div class="plushlife-share-stat"><strong>${summary.counts.full}</strong><span>☀️ FULL</span></div><div class="plushlife-share-stat"><strong>${summary.counts.soft}</strong><span>🌤️ SOFT</span></div><div class="plushlife-share-stat"><strong>${summary.counts.tiny}</strong><span>🌱 TINY</span></div></div><div class="plushlife-share-actions"><button type="button" data-share>Share</button><button type="button" class="primary" data-close>Done</button></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("[data-share]")?.addEventListener("click", shareWin);
    overlay.querySelector("[data-close]")?.addEventListener("click", closeShareCard);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) closeShareCard(); });
    overlay.addEventListener("keydown", (event) => { if (event.key === "Escape") closeShareCard(); });
    window.requestAnimationFrame(() => overlay.querySelector("[data-share]")?.focus());
  }

  function makeNextEasier() {
    const easier = [...document.querySelectorAll("button")].find((button) => visible(button) && /make easier/i.test(clean(button.textContent)));
    if (easier) easier.click();
    else {
      const tiny = findDayModeButton("tiny");
      if (tiny) tiny.click();
    }
    writeState({ lastChoice: "tiny", lastChoiceDate: today, choicesByDate: choiceHistoryWith("tiny") });
    removeToast();
    window.setTimeout(() => { installNextStepReason(true); pulseNextStep(); }, 120);
  }

  function showToast(title, body, actions) {
    removeToast();
    const toast = document.createElement("div");
    toast.id = "plushlife-growth-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `<div class="title"></div><div class="body"></div><div class="actions"></div>`;
    toast.querySelector(".title").textContent = title;
    toast.querySelector(".body").textContent = body;
    const actionsHost = toast.querySelector(".actions");
    (actions || []).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      if (item.primary) button.className = "primary";
      button.addEventListener("click", item.action);
      actionsHost.appendChild(button);
    });
    document.body.appendChild(toast);
    window.setTimeout(() => { if (toast.isConnected) toast.remove(); }, 14000);
  }

  function celebrationCopy(count) {
    const mode = readState().lastChoiceDate === today ? readState().lastChoice : null;
    if (count === 1 && mode === "tiny") return ["Tiny win, still a win 🌱", "You picked a smaller day and still showed up. That is exactly what Tiny is for."];
    if (count === 1 && mode === "soft") return ["Soft day success 🌤️", "Gentler did not mean giving up. You made something doable and did it."];
    if (count === 1 && mode === "full") return ["You’re moving ☀️", "One useful thing is done. You do not have to finish the whole day at once."];
    const messages = [
      ["Another one tucked in 💜", "A little more care is done. You can keep going or let this be enough."],
      ["That helped today ✨", "You turned one more intention into something real."],
      ["Still counts 🧸", "Progress can be quiet. This one belongs to you too."],
    ];
    return messages[(Math.max(2, count) - 2) % messages.length];
  }

  function recordCompletionSignal() {
    const current = readState();
    const counts = { ...(current.completionCountByDate || {}) };
    counts[today] = Number(counts[today] || 0) + 1;
    const count = counts[today];
    writeState({
      completionCountByDate: counts,
      successDate: today,
      firstSuccessEver: current.firstSuccessEver || new Date().toISOString(),
    });

    const [title, body] = celebrationCopy(count);
    if (count === 1) {
      showToast(title, `${body} Did that step feel manageable?`, [
        { label: "Yep", primary: true, action: () => { writeState({ lastFeedback: "manageable", lastFeedbackDate: today }); showToast("Nice.", "I’ll keep aiming for steps that feel doable.", [{ label: "Share this win", action: showShareCard }, { label: "Done", primary: true, action: removeToast }]); } },
        { label: "Too much", action: () => { writeState({ lastFeedback: "too_much", lastFeedbackDate: today }); showToast("Got you.", "I can make the next step smaller without erasing today’s progress.", [{ label: "Make next one Tiny", primary: true, action: makeNextEasier }, { label: "Not now", action: removeToast }]); } },
      ]);
      return;
    }
    if (count <= 3) showToast(title, body, [{ label: "Share week", action: showShareCard }, { label: "Done", primary: true, action: removeToast }]);
  }

  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button || button.closest("#plushlife-growth-checkin,#plushlife-growth-toast,#plushlife-share-win")) return;
    const text = clean(button.textContent);
    if (/^✓\s*done$/i.test(text) || /^done$/i.test(text)) window.setTimeout(recordCompletionSignal, 160);
  }, true);

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (input?.matches?.('input[type="checkbox"]') && input.checked) window.setTimeout(recordCompletionSignal, 160);
  }, true);

  let scheduled = false;
  const refresh = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      installCheckIn();
      installNextStepReason(false);
    });
  };
  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });
  window.PlushLifeGrowthLoop = { refresh, showShareCard, shareWin, recentChoices, summary: shareSummary, openCapacityPicker: () => openCapacityPicker(true), closeCapacityPicker };
  refresh();
})();
