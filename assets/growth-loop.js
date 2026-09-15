(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGrowthLoopInstalled) return;
  window.__plushlifeGrowthLoopInstalled = true;

  const STORAGE_KEY = "plushlife:growth-loop:v1";
  const today = new Date().toISOString().slice(0, 10);
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
    #plushlife-growth-checkin{margin:0 0 8px;padding:13px;border-radius:16px;border:1px solid #ddcdea;background:linear-gradient(145deg,#fff9fd,#f4fbf8);box-shadow:0 7px 22px rgba(83,53,98,.08);font-family:system-ui,sans-serif;color:#5b4b6b}
    #plushlife-growth-checkin strong{display:block;font-size:15px;line-height:1.25}
    #plushlife-growth-checkin p{margin:5px 0 0;font-size:11.5px;line-height:1.45;color:#7b6888}
    .plushlife-growth-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}
    .plushlife-growth-choice{min-height:52px;border:1px solid #dccbe5;border-radius:13px;background:#fff;color:#62516f;padding:7px 6px;font:800 11px/1.25 system-ui,sans-serif;cursor:pointer}
    .plushlife-growth-choice span{display:block;font-size:17px;margin-bottom:2px}
    #plushlife-growth-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147482900;width:min(430px,calc(100% - 24px));padding:13px;border-radius:17px;background:#fff9fd;border:1px solid #decce7;box-shadow:0 18px 55px rgba(54,34,65,.28);font-family:system-ui,sans-serif;color:#5b4b6b}
    #plushlife-growth-toast .title{font-weight:900;font-size:13px}
    #plushlife-growth-toast .body{margin-top:3px;font-size:11.5px;line-height:1.4;color:#7b6888}
    #plushlife-growth-toast .actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
    #plushlife-growth-toast button{min-height:42px;padding:8px 10px;border-radius:11px;border:1px solid #dac8e4;background:#fff;color:#76558a;font:800 11px system-ui,sans-serif;cursor:pointer}
    #plushlife-growth-toast button.primary{border-color:#a65dc1;background:#a65dc1;color:#fff}
    [data-plushlife-growth-pulse="true"]{animation:plushlife-growth-pulse 1.4s ease 2}
    @keyframes plushlife-growth-pulse{0%,100%{box-shadow:0 0 0 0 rgba(166,93,193,0)}50%{box-shadow:0 0 0 5px rgba(166,93,193,.18)}}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-checkin,html[data-plushlife-color-mode="dark"] #plushlife-growth-toast{background:#251d2c!important;border-color:#56425f!important;color:#f3eaf6!important}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-checkin p,html[data-plushlife-color-mode="dark"] #plushlife-growth-toast .body{color:#c8b9ce!important}
    html[data-plushlife-color-mode="dark"] .plushlife-growth-choice,html[data-plushlife-color-mode="dark"] #plushlife-growth-toast button{background:#1f1926!important;border-color:#57475f!important;color:#eee5f2!important}
    html[data-plushlife-color-mode="dark"] #plushlife-growth-toast button.primary{background:#9460aa!important;color:#fff!important}
    @media(max-width:380px){.plushlife-growth-choices{grid-template-columns:1fr}.plushlife-growth-choice{min-height:46px}}
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

  function chooseDay(mode) {
    const button = findDayModeButton(mode);
    if (button) button.click();
    const seenDates = Array.from(new Set([...(readState().seenDates || []), today])).slice(-14);
    writeState({ seenDates, lastChoice: mode, lastChoiceDate: today, onboardingDate: today });
    document.getElementById("plushlife-growth-checkin")?.remove();
    window.setTimeout(pulseNextStep, 120);
  }

  function installCheckIn() {
    if (signedOut()) return;
    const host = todayHost();
    if (!host || document.getElementById("plushlife-growth-checkin")) return;
    const current = readState();
    const seenDates = Array.isArray(current.seenDates) ? current.seenDates : [];
    const isEarlyUse = seenDates.length < 3;
    if (!isEarlyUse || current.onboardingDate === today) return;

    const card = document.createElement("section");
    card.id = "plushlife-growth-checkin";
    card.setAttribute("aria-label", "Choose how much capacity you have today");
    card.innerHTML = `<strong>How much room do you have today?</strong><p>PlushLife works with the energy you have, not against it. Pick a size and I’ll point you to one useful next step.</p><div class="plushlife-growth-choices"><button type="button" class="plushlife-growth-choice" data-mode="full"><span>☀️</span>Full<br><small>I've got some room</small></button><button type="button" class="plushlife-growth-choice" data-mode="soft"><span>🌤️</span>Soft<br><small>Keep it gentle</small></button><button type="button" class="plushlife-growth-choice" data-mode="tiny"><span>🌱</span>Tiny<br><small>Bare minimum is enough</small></button></div>`;
    card.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => chooseDay(button.dataset.mode)));
    host.insertBefore(card, host.firstChild);
  }

  function removeToast() {
    document.getElementById("plushlife-growth-toast")?.remove();
  }

  async function shareWin() {
    const text = "I showed up for myself today with PlushLife 💜 Small still counts.";
    try {
      if (navigator.share) await navigator.share({ title: "A small PlushLife win", text });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast("Copied 💜", "Your win is ready to paste anywhere you want.", [{ label: "Done", primary: true, action: removeToast }]);
      }
    } catch (_error) {}
  }

  function makeNextEasier() {
    const easier = [...document.querySelectorAll("button")].find((button) => visible(button) && /make easier/i.test(clean(button.textContent)));
    if (easier) easier.click();
    else {
      const tiny = findDayModeButton("tiny");
      if (tiny) tiny.click();
    }
    removeToast();
    window.setTimeout(pulseNextStep, 120);
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

  function firstSuccess() {
    const current = readState();
    if (current.successDate === today) return;
    writeState({ successDate: today, firstSuccessEver: current.firstSuccessEver || new Date().toISOString() });
    showToast("That counts 💜", "You showed up. No perfect streak required. Did that step feel manageable?", [
      { label: "Yep", primary: true, action: () => { writeState({ lastFeedback: "manageable", lastFeedbackDate: today }); showToast("Nice.", "I’ll keep aiming for steps that feel doable.", [{ label: "Share this win", action: shareWin }, { label: "Done", primary: true, action: removeToast }]); } },
      { label: "Too much", action: () => { writeState({ lastFeedback: "too_much", lastFeedbackDate: today }); showToast("Got you.", "I can make the next step smaller without erasing today’s progress.", [{ label: "Make next one Tiny", primary: true, action: makeNextEasier }, { label: "Not now", action: removeToast }]); } },
    ]);
  }

  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.("button");
    if (!button || button.closest("#plushlife-growth-checkin,#plushlife-growth-toast")) return;
    const text = clean(button.textContent);
    if (/^✓\s*done$/i.test(text) || /^done$/i.test(text)) window.setTimeout(firstSuccess, 160);
  }, true);

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (input?.matches?.('input[type="checkbox"]') && input.checked) window.setTimeout(firstSuccess, 160);
  }, true);

  let scheduled = false;
  const refresh = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      installCheckIn();
    });
  };
  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });
  refresh();
})();
