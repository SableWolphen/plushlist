(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeWhatsNewInstalled) return;
  window.__plushlifeWhatsNewInstalled = true;

  const VERSION = "2026-09-17-v4";
  const COUNT_KEY = "plushlife:whats-new-count:" + VERSION;
  const SESSION_KEY = "plushlife:whats-new-session:" + VERSION;
  const PANEL_ID = "plushlife-whats-new";
  const MAX_SHOWS = 3;

  const featured = [
    ["🧸", "A better check-in", "Cleaner, theme-aware, and personalized with your saved comfort item."],
    ["🎨", "Themes feel like themselves", "Soft Plush, Soft Light, Twilight, and Meadow keep distinct palettes."],
    ["🌙", "A calmer Today", "Tiny, Recovery, Rest, tired, anxious, and overwhelmed moments can reduce visual noise."]
  ];

  const more = [
    ["✨", "Less stacking", "Check-ins, comeback prompts, mascot reactions, and floating controls coordinate better."],
    ["✓", "Completed tasks quiet down", "Finished tasks move into Completed Today while staying easy to undo."],
    ["🎯", "Next Step stands out", "Less helper clutter, steadier touch targets, and clearer action priority."]
  ];

  const previous = [
    ["Full, Soft, and Tiny shape your day", "Your plan can use gentler task versions and a rough energy budget."],
    ["Smarter Next Step", "Next Step weighs capacity, task size, timing, and what has worked before."],
    ["Gentler comeback flow", "Returning does not turn missed days into catch-up debt."],
    ["Adaptive weekly progress", "Weekly reflections can recognize when choosing a softer plan was the right call."]
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
      localStorage.setItem(COUNT_KEY, String(Math.min(MAX_SHOWS, readCount() + 1)));
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (_) {}
  }
  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function rowHtml([icon, title, body]) {
    return `
      <div class="plushlife-whats-new__row">
        <span class="plushlife-whats-new__icon" aria-hidden="true">${esc(icon)}</span>
        <span class="plushlife-whats-new__copy"><strong>${esc(title)}</strong><small>${esc(body)}</small></span>
      </div>`;
  }
  function oldHtml([title, body]) {
    return `<div class="plushlife-whats-new__old"><strong>${esc(title)}</strong><span>${esc(body)}</span></div>`;
  }

  function modalHtml() {
    return `
      <div id="${PANEL_ID}" class="plushlife-whats-new__backdrop" role="presentation">
        <section class="plushlife-whats-new__modal" role="dialog" aria-modal="true" aria-labelledby="plushlife-whats-new-title">
          <header class="plushlife-whats-new__header">
            <span class="plushlife-whats-new__spark" aria-hidden="true">✨</span>
            <span class="plushlife-whats-new__heading">
              <strong id="plushlife-whats-new-title">What's new</strong>
              <small>September 17 · PlushLife</small>
            </span>
            <button type="button" class="plushlife-whats-new__close" aria-label="Close what's new">×</button>
          </header>

          <div class="plushlife-whats-new__scroll">
            <p class="plushlife-whats-new__intro">A cleaner, calmer PlushLife without changing your routines or progress.</p>
            <div class="plushlife-whats-new__featured">${featured.map(rowHtml).join("")}</div>

            <details class="plushlife-whats-new__details">
              <summary>More improvements <span aria-hidden="true">⌄</span></summary>
              <div class="plushlife-whats-new__more">${more.map(rowHtml).join("")}</div>
            </details>

            <details class="plushlife-whats-new__details plushlife-whats-new__previous">
              <summary>Previous updates <span aria-hidden="true">⌄</span></summary>
              <div class="plushlife-whats-new__previous-body">${previous.map(oldHtml).join("")}</div>
            </details>
          </div>

          <footer class="plushlife-whats-new__footer">
            <button type="button" class="plushlife-whats-new__done">Got it</button>
          </footer>
        </section>
      </div>`;
  }

  function closeModal(panel) {
    if (!panel) return;
    panel.classList.add("is-closing");
    window.setTimeout(() => panel.remove(), 130);
  }

  function bind(panel) {
    if (!panel || panel.dataset.bound === "true") return;
    panel.dataset.bound = "true";
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
    if (!document.querySelector("[data-plushlife-home-stack]")) return;

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
    #${PANEL_ID}.plushlife-whats-new__backdrop{
      position:fixed!important;inset:0!important;z-index:140!important;display:grid!important;place-items:center!important;
      padding:max(16px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom))!important;
      background:rgba(20,13,30,.62)!important;backdrop-filter:blur(10px)!important;
      animation:plushWhatsNewFade .15s ease-out!important;
    }
    #${PANEL_ID}.is-closing{opacity:0!important;transition:opacity .13s ease!important}
    #${PANEL_ID} .plushlife-whats-new__modal{
      position:relative!important;width:min(100%,470px)!important;max-height:min(78vh,650px)!important;
      display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;overflow:hidden!important;
      padding:0!important;border:1px solid var(--plush-border,#e7d5ec)!important;border-radius:22px!important;
      background:var(--plush-surface,#fff)!important;color:var(--plush-text,#50365a)!important;
      box-shadow:0 26px 80px rgba(20,13,30,.38)!important;animation:plushWhatsNewPop .16s ease-out!important;
    }
    #${PANEL_ID} .plushlife-whats-new__header{
      display:grid!important;grid-template-columns:40px minmax(0,1fr) 38px!important;gap:10px!important;align-items:center!important;
      min-height:68px!important;padding:12px 12px 12px 14px!important;border-bottom:1px solid var(--plush-border-soft,#efe3f2)!important;
      background:color-mix(in srgb,var(--plush-surface,#fff) 94%,var(--plush-accent,#c77dd6) 6%)!important;
    }
    #${PANEL_ID} .plushlife-whats-new__spark{
      width:40px!important;height:40px!important;display:grid!important;place-items:center!important;border-radius:13px!important;
      background:color-mix(in srgb,var(--plush-accent,#c77dd6) 15%,var(--plush-surface-2,#fff))!important;font-size:20px!important;
    }
    #${PANEL_ID} .plushlife-whats-new__heading{display:block!important;min-width:0!important}
    #${PANEL_ID} .plushlife-whats-new__heading strong{display:block!important;font-size:17px!important;line-height:1.18!important;font-weight:900!important}
    #${PANEL_ID} .plushlife-whats-new__heading small{display:block!important;margin-top:2px!important;color:var(--plush-copy,#786681)!important;font-size:10.8px!important;font-weight:750!important}
    #${PANEL_ID} button.plushlife-whats-new__close{
      position:static!important;display:grid!important;place-items:center!important;width:38px!important;min-width:38px!important;max-width:38px!important;
      height:38px!important;min-height:38px!important;max-height:38px!important;margin:0!important;padding:0!important;
      border:1px solid var(--plush-border-soft,#efe3f2)!important;border-radius:12px!important;
      background:var(--plush-surface-2,#fff)!important;color:var(--plush-text,#50365a)!important;
      box-shadow:none!important;font:700 24px/1 system-ui,sans-serif!important;letter-spacing:0!important;cursor:pointer!important;
      transform:none!important;
    }
    #${PANEL_ID} .plushlife-whats-new__scroll{
      overflow:auto!important;overscroll-behavior:contain!important;padding:14px!important;
    }
    #${PANEL_ID} .plushlife-whats-new__intro{
      margin:0 0 11px!important;padding:0!important;color:var(--plush-copy,#786681)!important;font-size:11.5px!important;line-height:1.45!important;
    }
    #${PANEL_ID} .plushlife-whats-new__featured{
      display:grid!important;gap:0!important;border:1px solid var(--plush-border-soft,#efe3f2)!important;border-radius:16px!important;
      overflow:hidden!important;background:var(--plush-surface-2,#fff)!important;
    }
    #${PANEL_ID} .plushlife-whats-new__row{
      display:grid!important;grid-template-columns:30px minmax(0,1fr)!important;gap:9px!important;align-items:start!important;
      padding:11px 12px!important;border:0!important;border-bottom:1px solid var(--plush-border-soft,#efe3f2)!important;
      border-radius:0!important;background:transparent!important;box-shadow:none!important;
    }
    #${PANEL_ID} .plushlife-whats-new__row:last-child{border-bottom:0!important}
    #${PANEL_ID} .plushlife-whats-new__icon{font-size:18px!important;line-height:1.25!important}
    #${PANEL_ID} .plushlife-whats-new__copy strong{display:block!important;font-size:11.8px!important;line-height:1.3!important;font-weight:900!important}
    #${PANEL_ID} .plushlife-whats-new__copy small{display:block!important;margin-top:2px!important;color:var(--plush-copy,#786681)!important;font-size:10.2px!important;line-height:1.38!important}
    #${PANEL_ID} .plushlife-whats-new__details{
      margin:10px 0 0!important;padding:0!important;border:1px solid var(--plush-border-soft,#efe3f2)!important;border-radius:13px!important;
      background:var(--plush-surface-2,#fff)!important;overflow:hidden!important;
    }
    #${PANEL_ID} .plushlife-whats-new__details>summary{
      min-height:44px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;
      padding:9px 11px!important;cursor:pointer!important;list-style:none!important;color:var(--plush-copy,#786681)!important;
      font-size:10.8px!important;font-weight:900!important;
    }
    #${PANEL_ID} .plushlife-whats-new__details>summary::-webkit-details-marker{display:none!important}
    #${PANEL_ID} .plushlife-whats-new__details[open]>summary span{transform:rotate(180deg)!important}
    #${PANEL_ID} .plushlife-whats-new__more{border-top:1px solid var(--plush-border-soft,#efe3f2)!important}
    #${PANEL_ID} .plushlife-whats-new__previous-body{display:grid!important;gap:6px!important;padding:8px!important;border-top:1px solid var(--plush-border-soft,#efe3f2)!important}
    #${PANEL_ID} .plushlife-whats-new__old{padding:8px 9px!important;border-radius:9px!important;background:var(--plush-surface-3,#f8eef9)!important}
    #${PANEL_ID} .plushlife-whats-new__old strong{display:block!important;font-size:10.5px!important}
    #${PANEL_ID} .plushlife-whats-new__old span{display:block!important;margin-top:2px!important;color:var(--plush-copy,#786681)!important;font-size:9.6px!important;line-height:1.35!important}
    #${PANEL_ID} .plushlife-whats-new__footer{
      padding:10px 14px 12px!important;border-top:1px solid var(--plush-border-soft,#efe3f2)!important;background:var(--plush-surface,#fff)!important;
    }
    #${PANEL_ID} button.plushlife-whats-new__done{
      display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:46px!important;min-height:46px!important;max-height:46px!important;
      margin:0!important;padding:0 16px!important;border:0!important;border-radius:13px!important;
      background:var(--plush-accent,#c77dd6)!important;color:#fff!important;box-shadow:none!important;
      font-size:12.5px!important;font-weight:900!important;line-height:1!important;cursor:pointer!important;transform:none!important;
    }
    @keyframes plushWhatsNewFade{from{opacity:0}to{opacity:1}}
    @keyframes plushWhatsNewPop{from{opacity:0;transform:translateY(6px) scale(.99)}to{opacity:1;transform:none}}
    @media(max-width:480px){
      #${PANEL_ID} .plushlife-whats-new__modal{max-height:76vh!important;border-radius:20px!important}
      #${PANEL_ID} .plushlife-whats-new__header{min-height:64px!important;padding:10px 10px 10px 12px!important}
      #${PANEL_ID} .plushlife-whats-new__scroll{padding:12px!important}
    }
    @media(prefers-reduced-motion:reduce){
      #${PANEL_ID}.plushlife-whats-new__backdrop,#${PANEL_ID} .plushlife-whats-new__modal{animation:none!important}
      #${PANEL_ID}.is-closing{transition:none!important}
    }
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