(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeWhatsNewInstalled) return;
  window.__plushlifeWhatsNewInstalled = true;

  const VERSION = "2026-09-17-v3";
  const COUNT_KEY = "plushlife:whats-new-count:" + VERSION;
  const SESSION_KEY = "plushlife:whats-new-session:" + VERSION;
  const PANEL_ID = "plushlife-whats-new";
  const MAX_SHOWS = 3;

  const latest = [
    ["🧸", "Check-in feels like PlushLife now", "Cleaner spacing, stronger selected states, theme-aware colors, and your own saved comfort item in the safety prompt."],
    ["🎨", "Every theme has its own personality", "Soft Plush, Soft Light, Twilight, and Meadow now each keep distinct light and dark palettes."],
    ["🌙", "Today gets quieter when you need less", "Tiny, Recovery, Rest, tired, anxious, and overwhelmed moments can automatically reduce visual noise."],
    ["✨", "Less stuff fights for your attention", "Check-ins, comeback prompts, mascot reactions, and floating controls now coordinate instead of stacking."],
    ["✓", "Finished tasks get out of the way", "Completed tasks settle into a quieter Completed Today area while staying easy to undo."],
    ["🎯", "Next Step is easier to spot", "Repeated helper text can quiet down, touch targets are more consistent, and the most useful next action gets clearer priority."],
  ];

  const previous = [
    ["Full, Soft, and Tiny now shape your day", "Your plan can use gentler task versions and a rough energy budget so it fits the capacity you actually have."],
    ["Next Step got smarter", "Next Step weighs your capacity, task size, timing, and what has worked for you before."],
    ["Coming back does not mean catching up", "Return and recovery flows help you restart gently instead of turning missed days into debt."],
    ["Weekly progress celebrates adapting", "Weekly reflections can recognize when choosing a softer plan was the right call."],
  ];

  function readCount() {
    try { return Math.max(0, Number(localStorage.getItem(COUNT_KEY)) || 0); }
    catch (_) { return MAX_SHOWS; }
  }
  function sessionShown() {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (_) { return false; }
  }
  function markShown() {
    try {
      const next = Math.min(MAX_SHOWS, readCount() + 1);
      localStorage.setItem(COUNT_KEY, String(next));
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (_) {}
  }
  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  function modalHtml() {
    const rows = latest.map(([icon,title,body], index) => `
      <div class="plushlife-whats-new__item${index < 3 ? " is-featured" : ""}">
        <span class="plushlife-whats-new__icon" aria-hidden="true">${esc(icon)}</span>
        <span><strong>${esc(title)}</strong><small>${esc(body)}</small></span>
      </div>`).join("");
    const oldRows = previous.map(([title,body]) => `
      <div class="plushlife-whats-new__old"><strong>${esc(title)}</strong><span>${esc(body)}</span></div>`).join("");

    return `
      <div id="${PANEL_ID}" class="plushlife-whats-new__backdrop" role="presentation">
        <section class="plushlife-whats-new__modal" role="dialog" aria-modal="true" aria-labelledby="plushlife-whats-new-title">
          <button type="button" class="plushlife-whats-new__close" aria-label="Close what's new">×</button>
          <div class="plushlife-whats-new__header">
            <span class="plushlife-whats-new__spark" aria-hidden="true">✨</span>
            <span class="plushlife-whats-new__heading">
              <strong id="plushlife-whats-new-title">What's new in PlushLife</strong>
              <small>September 17 update</small>
            </span>
          </div>
          <div class="plushlife-whats-new__intro">A cleaner, calmer PlushLife — with the same routines and progress underneath.</div>
          <div class="plushlife-whats-new__grid">${rows}</div>
          <details class="plushlife-whats-new__previous">
            <summary>Previous updates</summary>
            <div class="plushlife-whats-new__previous-body">${oldRows}</div>
          </details>
          <button type="button" class="plushlife-whats-new__done">Got it</button>
        </section>
      </div>`;
  }

  function closeModal(panel) {
    if (!panel) return;
    panel.classList.add("is-closing");
    window.setTimeout(() => panel.remove(), 140);
  }

  function bind(panel) {
    if (!panel || panel.dataset.bound === "true") return;
    panel.dataset.bound = "true";
    const modal = panel.querySelector(".plushlife-whats-new__modal");
    const done = panel.querySelector(".plushlife-whats-new__done");
    const close = panel.querySelector(".plushlife-whats-new__close");

    done?.addEventListener("click", () => closeModal(panel));
    close?.addEventListener("click", () => closeModal(panel));
    panel.addEventListener("click", (event) => {
      if (event.target === panel) closeModal(panel);
    });
    document.addEventListener("keydown", function onKey(event) {
      if (event.key !== "Escape" || !document.getElementById(PANEL_ID)) return;
      document.removeEventListener("keydown", onKey);
      closeModal(panel);
    });
    window.setTimeout(() => close?.focus(), 20);
  }

  function shouldWait() {
    return Boolean(
      document.querySelector("#checkin-popup-title") ||
      document.querySelector('[role="dialog"][aria-modal="true"]') ||
      document.documentElement.hasAttribute("data-plushlife-checkin-open")
    );
  }

  function installPanel() {
    if (document.getElementById(PANEL_ID)) return;
    if (readCount() >= MAX_SHOWS || sessionShown() || shouldWait()) return;
    const home = document.querySelector("[data-plushlife-home-stack]");
    if (!home) return;

    const wrap = document.createElement("div");
    wrap.innerHTML = modalHtml().trim();
    const panel = wrap.firstElementChild;
    if (!panel) return;

    document.body.appendChild(panel);
    markShown();
    bind(panel);
  }

  const style = document.createElement("style");
  style.id = "plushlife-whats-new-style";
  style.textContent = `
    .plushlife-whats-new__backdrop{
      position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));
      background:rgba(24,15,34,.58);backdrop-filter:blur(10px);animation:plushWhatsNewFade .16s ease-out;
    }
    .plushlife-whats-new__backdrop.is-closing{opacity:0;transition:opacity .14s ease}
    .plushlife-whats-new__modal{
      position:relative;width:min(100%,520px);max-height:min(82vh,760px);overflow:auto;padding:18px;
      border:1px solid var(--plush-border,#e7d5ec);border-radius:24px;background:var(--plush-surface,#fff);color:var(--plush-text,#50365a);
      box-shadow:0 24px 80px rgba(24,15,34,.35);animation:plushWhatsNewPop .18s ease-out;
    }
    .plushlife-whats-new__close{
      position:absolute;top:12px;right:12px;width:44px;height:44px;border:1px solid var(--plush-border-soft,#efe3f2);border-radius:14px;
      background:var(--plush-surface-2,#fff);color:var(--plush-text,#50365a);font-size:26px;line-height:1;cursor:pointer;
    }
    .plushlife-whats-new__header{display:grid;grid-template-columns:44px minmax(0,1fr);gap:11px;align-items:center;padding-right:52px}
    .plushlife-whats-new__spark{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--plush-accent,#c77dd6) 14%,var(--plush-surface-2,#fff));font-size:21px}
    .plushlife-whats-new__heading strong{display:block;font-size:18px;line-height:1.2}.plushlife-whats-new__heading small{display:block;margin-top:3px;color:var(--plush-copy,#786681);font-size:12px;font-weight:800}
    .plushlife-whats-new__intro{margin-top:14px;padding:10px 11px;border-radius:13px;background:var(--plush-surface-3,#f8eef9);color:var(--plush-copy,#786681);font-size:12px;line-height:1.45}
    .plushlife-whats-new__grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}
    .plushlife-whats-new__item{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:start;padding:11px;border:1px solid var(--plush-border-soft,#efe3f2);border-radius:14px;background:var(--plush-surface-2,#fff)}
    .plushlife-whats-new__item.is-featured{border-color:color-mix(in srgb,var(--plush-accent,#c77dd6) 38%,var(--plush-border-soft,#efe3f2))}
    .plushlife-whats-new__icon{font-size:19px;line-height:1.2}.plushlife-whats-new__item strong{display:block;font-size:12px;line-height:1.3}.plushlife-whats-new__item small{display:block;margin-top:3px;color:var(--plush-copy,#786681);font-size:10.4px;line-height:1.4}
    .plushlife-whats-new__previous{margin-top:11px;border-top:1px solid var(--plush-border-soft,#efe3f2);padding-top:9px}.plushlife-whats-new__previous>summary{cursor:pointer;color:var(--plush-copy,#786681);font-size:11px;font-weight:900}
    .plushlife-whats-new__previous-body{display:grid;gap:7px;margin-top:8px}.plushlife-whats-new__old{padding:8px 9px;border-radius:10px;background:var(--plush-surface-3,#f8eef9)}.plushlife-whats-new__old strong{display:block;font-size:10.8px}.plushlife-whats-new__old span{display:block;margin-top:2px;color:var(--plush-copy,#786681);font-size:9.9px;line-height:1.35}
    .plushlife-whats-new__done{width:100%;min-height:48px;margin-top:12px;border:0;border-radius:13px;background:var(--plush-accent,#c77dd6);color:white;font-weight:900;font-size:13px;cursor:pointer}
    @keyframes plushWhatsNewFade{from{opacity:0}to{opacity:1}} @keyframes plushWhatsNewPop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
    @media(max-width:480px){.plushlife-whats-new__grid{grid-template-columns:1fr}.plushlife-whats-new__modal{padding:16px;border-radius:22px;max-height:84vh}.plushlife-whats-new__heading strong{font-size:16px}}
    @media(prefers-reduced-motion:reduce){.plushlife-whats-new__backdrop,.plushlife-whats-new__modal{animation:none}.plushlife-whats-new__backdrop.is-closing{transition:none}}
  `;
  document.head.appendChild(style);

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; installPanel(); });
  }
  new MutationObserver(queue).observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener("click", queue, true);
  window.addEventListener("focus", queue);
  queue();
})();