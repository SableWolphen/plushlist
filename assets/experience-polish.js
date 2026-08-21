(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeExperiencePolishInstalled) return;
  window.__plushlifeExperiencePolishInstalled = true;

  const LOOP_KEY = "plushlife:local-product-loop:v1";
  const COMPLETION_EVENT = "plushlife:task-completion-feedback";
  const CARD_SELECTOR = "section,details,[role='tablist']";
  let mascotTimer = null;

  function safeRead() {
    try { return JSON.parse(window.localStorage.getItem(LOOP_KEY) || "{}") || {}; }
    catch (_error) { return {}; }
  }

  function safeWrite(next) {
    try { window.localStorage.setItem(LOOP_KEY, JSON.stringify(next)); }
    catch (_error) {}
  }

  function recordVisit() {
    const state = safeRead();
    const today = new Date().toISOString().slice(0, 10);
    const previousDay = String(state.lastVisitDay || "");
    const visits = Number(state.visits || 0) + (previousDay === today ? 0 : 1);
    safeWrite({
      ...state,
      visits,
      lastVisitDay: today,
      lastVisitAt: new Date().toISOString(),
    });
  }

  function recordCompletion(detail) {
    const state = safeRead();
    safeWrite({
      ...state,
      completions: Number(state.completions || 0) + (detail?.completed === false ? 0 : 1),
      lastCompletionAt: new Date().toISOString(),
      lastCompletionLabel: String(detail?.label || "").slice(0, 160),
    });
  }

  function ensureMascotToast() {
    let toast = document.getElementById("plushlife-mascot-reaction");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.id = "plushlife-mascot-reaction";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = '<span class="plushlife-mascot-reaction__face" aria-hidden="true">🧸</span><span class="plushlife-mascot-reaction__copy"></span>';
    document.body.appendChild(toast);
    return toast;
  }

  function showMascotReaction(detail) {
    if (detail?.completed === false) return;
    const state = safeRead();
    const count = Math.max(1, Number(state.completions || 0));
    const messages = [
      "That counts. 💜",
      "One caring thing, tucked in.",
      "Nice. You made today a little lighter.",
      "PlushLife noticed that one. ✨",
    ];
    const message = messages[(count - 1) % messages.length];
    const toast = ensureMascotToast();
    const copy = toast.querySelector(".plushlife-mascot-reaction__copy");
    if (copy) copy.textContent = message;
    toast.classList.add("is-visible");
    if (mascotTimer) window.clearTimeout(mascotTimer);
    mascotTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function findProgressCalendarCard() {
    const labels = Array.from(document.querySelectorAll("div"));
    const heading = labels.find((node) => node.children.length === 0 && /PROGRESS CALENDAR/i.test(node.textContent || ""));
    if (!heading) return null;
    let card = heading.parentElement;
    while (card && card !== document.body) {
      const calendarButtons = card.querySelectorAll("button[aria-label]");
      if (calendarButtons.length >= 20) return card;
      card = card.parentElement;
    }
    return null;
  }

  function dayMemoryText(button) {
    const label = String(button?.getAttribute("aria-label") || "").trim();
    const title = String(button?.getAttribute("title") || "").trim();
    const raw = title || label.replace(/^\d+:\s*/, "");
    if (!raw || /^\d+$/.test(raw)) return "No check-in or completion detail saved for this day yet.";
    return raw;
  }

  function updateDayMemory(button) {
    const card = findProgressCalendarCard();
    if (!card || !button) return;
    let memory = card.querySelector("[data-plushlife-day-memory='true']");
    if (!memory) {
      memory = document.createElement("div");
      memory.dataset.plushlifeDayMemory = "true";
      memory.innerHTML = '<div class="plushlife-day-memory__label">💭 DAY MEMORY</div><div class="plushlife-day-memory__text"></div>';
      card.appendChild(memory);
    }
    const number = String(button.textContent || "").match(/\d{1,2}/)?.[0] || "This day";
    const text = memory.querySelector(".plushlife-day-memory__text");
    if (text) text.textContent = `${number}: ${dayMemoryText(button)}`;
  }

  function installCalendarMemory() {
    const card = findProgressCalendarCard();
    if (!card || card.dataset.plushlifeDayMemoryBound === "true") return;
    card.dataset.plushlifeDayMemoryBound = "true";
    card.addEventListener("click", function (event) {
      const button = event.target?.closest?.("button[aria-label]");
      if (!button || !card.contains(button)) return;
      const aria = String(button.getAttribute("aria-label") || "");
      if (!/^\d+(?::|$)/.test(aria)) return;
      updateDayMemory(button);
    });
    const selected = Array.from(card.querySelectorAll("button[aria-label]")).find((button) => {
      const style = window.getComputedStyle(button);
      return /^\d+(?::|$)/.test(button.getAttribute("aria-label") || "") && (style.borderTopWidth === "2px" || button.getAttribute("aria-current") === "date");
    });
    if (selected) updateDayMemory(selected);
  }

  function decorateCards() {
    document.querySelectorAll(CARD_SELECTOR).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.closest(".baby-mode")) return;
      if (node.dataset.plushlifePolishedCard === "true") return;
      const style = window.getComputedStyle(node);
      const radius = parseFloat(style.borderTopLeftRadius || "0") || 0;
      const bg = style.backgroundColor;
      if (radius < 8 || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") return;
      node.dataset.plushlifePolishedCard = "true";
    });
  }

  function schedulePolish() {
    window.requestAnimationFrame(function () {
      installCalendarMemory();
      decorateCards();
    });
  }

  const style = document.createElement("style");
  style.id = "plushlife-experience-polish";
  style.textContent = `
    :root {
      --plush-card-radius:16px;
      --plush-control-radius:11px;
      --plush-focus:#9f55bd;
      --plush-card-shadow:0 6px 20px rgba(90,58,108,.07);
    }
    [data-plushlife-polished-card="true"] {
      border-radius:var(--plush-card-radius) !important;
      box-shadow:var(--plush-card-shadow) !important;
    }
    button,[role="button"],[role="tab"],summary,input,select,textarea {
      -webkit-tap-highlight-color:transparent;
    }
    button:focus-visible,[role="button"]:focus-visible,[role="tab"]:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible {
      outline:3px solid color-mix(in srgb,var(--plush-focus) 58%,transparent) !important;
      outline-offset:2px !important;
    }
    [data-plushlife-day-memory="true"] {
      margin-top:10px;
      padding:9px 10px;
      border:1px solid rgba(166,93,193,.22);
      border-radius:12px;
      background:linear-gradient(145deg,rgba(251,243,254,.78),rgba(247,252,250,.82));
      color:#675573;
    }
    .plushlife-day-memory__label { font-size:9.5px;letter-spacing:.12em;font-weight:900;color:#8e4eaa; }
    .plushlife-day-memory__text { margin-top:3px;font-size:10.8px;line-height:1.4; }
    #plushlife-mascot-reaction {
      position:fixed;
      left:50%;
      bottom:max(18px,calc(env(safe-area-inset-bottom) + 12px));
      z-index:5000;
      display:flex;
      align-items:center;
      gap:8px;
      max-width:min(88vw,360px);
      padding:9px 12px 9px 9px;
      border:1px solid rgba(166,93,193,.28);
      border-radius:999px;
      background:rgba(255,250,253,.96);
      box-shadow:0 12px 34px rgba(64,38,75,.22);
      color:#5b4b6b;
      font:800 11.5px/1.25 system-ui,sans-serif;
      transform:translate(-50%,18px) scale(.96);
      opacity:0;
      pointer-events:none;
      transition:opacity .18s ease,transform .18s ease;
      backdrop-filter:blur(12px);
    }
    #plushlife-mascot-reaction.is-visible { opacity:1;transform:translate(-50%,0) scale(1); }
    .plushlife-mascot-reaction__face {
      width:32px;height:32px;display:grid;place-items:center;flex:0 0 32px;border-radius:50%;background:#f2def8;font-size:18px;
    }
    html[data-plushlife-color-mode="dark"] #plushlife-mascot-reaction {
      background:rgba(42,31,59,.96);border-color:#705487;color:#f8effb;
    }
    html[data-plushlife-color-mode="dark"] .plushlife-mascot-reaction__face { background:#563d6b; }
    html[data-plushlife-color-mode="dark"] [data-plushlife-day-memory="true"] {
      background:linear-gradient(145deg,#302448,#251d3b);border-color:#654b7b;color:#eee5f3;
    }
    html[data-plushlife-color-mode="dark"] .plushlife-day-memory__label { color:#e9a4ee; }
    @media (max-width:640px) {
      [role="dialog"][aria-modal="true"] { place-items:end center !important;padding:0 !important; }
      [role="dialog"][aria-modal="true"] > div:first-child {
        width:100% !important;
        max-width:100% !important;
        max-height:min(88dvh,760px) !important;
        border-radius:22px 22px 0 0 !important;
        margin:0 !important;
        overscroll-behavior:contain;
      }
    }
    @media (pointer:coarse) {
      button,[role="button"],[role="tab"],summary { min-height:44px; }
    }
    @media (prefers-reduced-motion:reduce) {
      *,*::before,*::after { scroll-behavior:auto !important;animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important; }
    }
    @media (forced-colors:active) {
      button,[role="button"],[role="tab"],summary,input,select,textarea { border:1px solid ButtonText !important; }
      [data-plushlife-polished-card="true"] { border:1px solid CanvasText !important;box-shadow:none !important; }
    }
  `;
  document.head.appendChild(style);

  recordVisit();
  window.addEventListener(COMPLETION_EVENT, function (event) {
    recordCompletion(event.detail || {});
    showMascotReaction(event.detail || {});
  });

  const observer = new MutationObserver(schedulePolish);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedulePolish, { once:true });
  else schedulePolish();

  window.PlushLifeExperiencePolish = {
    getLocalLoopSnapshot: safeRead,
    refresh: schedulePolish,
  };
})();
