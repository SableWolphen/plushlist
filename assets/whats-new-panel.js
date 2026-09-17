(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeWhatsNewInstalled) return;
  window.__plushlifeWhatsNewInstalled = true;

  const VERSION = "2026-09-17-v2";
  const SEEN_KEY = "plushlife:whats-new-seen:" + VERSION;
  const PANEL_ID = "plushlife-whats-new";

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

  function seen() {
    try { return localStorage.getItem(SEEN_KEY) === "1"; } catch (_) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch (_) {}
  }
  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  function cardHtml() {
    const rows = latest.map(([icon,title,body], index) => `
      <div class="plushlife-whats-new__item${index < 3 ? " is-featured" : ""}">
        <span class="plushlife-whats-new__icon" aria-hidden="true">${esc(icon)}</span>
        <span><strong>${esc(title)}</strong><small>${esc(body)}</small></span>
      </div>`).join("");
    const oldRows = previous.map(([title,body]) => `
      <div class="plushlife-whats-new__old"><strong>${esc(title)}</strong><span>${esc(body)}</span></div>`).join("");
    return `
      <section id="${PANEL_ID}" data-plushlife-secondary-section="true" aria-label="What's new in PlushLife">
        <button type="button" class="plushlife-whats-new__summary" aria-expanded="${seen() ? "false" : "true"}">
          <span class="plushlife-whats-new__spark" aria-hidden="true">✨</span>
          <span class="plushlife-whats-new__heading"><strong>What's new in PlushLife</strong><small>September 17 update</small></span>
          <span class="plushlife-whats-new__chev" aria-hidden="true">⌄</span>
        </button>
        <div class="plushlife-whats-new__body" ${seen() ? "hidden" : ""}>
          <div class="plushlife-whats-new__intro">A cleaner, calmer PlushLife — with the same routines and progress underneath.</div>
          <div class="plushlife-whats-new__grid">${rows}</div>
          <details class="plushlife-whats-new__previous">
            <summary>Previous updates</summary>
            <div class="plushlife-whats-new__previous-body">${oldRows}</div>
          </details>
          <button type="button" class="plushlife-whats-new__done">Got it</button>
        </div>
      </section>`;
  }

  function bind(panel) {
    if (!panel || panel.dataset.bound === "true") return;
    panel.dataset.bound = "true";
    const summary = panel.querySelector(".plushlife-whats-new__summary");
    const body = panel.querySelector(".plushlife-whats-new__body");
    const done = panel.querySelector(".plushlife-whats-new__done");
    summary?.addEventListener("click", () => {
      const open = body?.hasAttribute("hidden");
      if (!body) return;
      if (open) body.removeAttribute("hidden"); else body.setAttribute("hidden", "");
      summary.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) markSeen();
    });
    done?.addEventListener("click", () => {
      markSeen();
      body?.setAttribute("hidden", "");
      summary?.setAttribute("aria-expanded", "false");
    });
  }

  function installPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) { bind(panel); return; }
    const stack = document.querySelector("[data-plushlife-home-stack]");
    if (!stack) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = cardHtml().trim();
    panel = wrap.firstElementChild;
    if (!panel) return;

    const nextStep = stack.querySelector("#plushlife-smart-next-step");
    const anchor = nextStep?.parentElement === stack ? nextStep : null;
    if (anchor?.nextSibling) stack.insertBefore(panel, anchor.nextSibling);
    else if (anchor) stack.appendChild(panel);
    else stack.prepend(panel);
    bind(panel);
  }

  const style = document.createElement("style");
  style.id = "plushlife-whats-new-style";
  style.textContent = `
    #${PANEL_ID}{
      margin:0!important;border:1px solid var(--plush-border,#e7d5ec)!important;border-radius:18px!important;
      background:var(--plush-surface,#fff)!important;color:var(--plush-text,#50365a)!important;
      overflow:hidden!important;box-shadow:none!important;
    }
    .plushlife-whats-new__summary{width:100%;display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;padding:12px 13px;border:0;background:transparent;color:inherit;cursor:pointer}
    .plushlife-whats-new__spark{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--plush-accent,#c77dd6) 14%,var(--plush-surface-2,#fff));font-size:18px}
    .plushlife-whats-new__heading strong{display:block;font-size:13.5px;line-height:1.25}.plushlife-whats-new__heading small{display:block;margin-top:2px;color:var(--plush-copy,#786681);font-size:10.5px;font-weight:700}
    .plushlife-whats-new__chev{font-size:18px;color:var(--plush-muted,#9988a1);transition:transform .16s ease}.plushlife-whats-new__summary[aria-expanded="true"] .plushlife-whats-new__chev{transform:rotate(180deg)}
    .plushlife-whats-new__body{padding:0 13px 13px}.plushlife-whats-new__body[hidden]{display:none!important}
    .plushlife-whats-new__intro{padding:9px 10px;border-radius:12px;background:var(--plush-surface-3,#f8eef9);color:var(--plush-copy,#786681);font-size:11.5px;line-height:1.45}
    .plushlife-whats-new__grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .plushlife-whats-new__item{display:grid;grid-template-columns:27px minmax(0,1fr);gap:8px;align-items:start;padding:10px;border:1px solid var(--plush-border-soft,#efe3f2);border-radius:13px;background:var(--plush-surface-2,#fff)}
    .plushlife-whats-new__item.is-featured{border-color:color-mix(in srgb,var(--plush-accent,#c77dd6) 38%,var(--plush-border-soft,#efe3f2))}
    .plushlife-whats-new__icon{font-size:18px;line-height:1.2}.plushlife-whats-new__item strong{display:block;font-size:11.5px;line-height:1.3}.plushlife-whats-new__item small{display:block;margin-top:3px;color:var(--plush-copy,#786681);font-size:10.2px;line-height:1.38}
    .plushlife-whats-new__previous{margin-top:10px;border-top:1px solid var(--plush-border-soft,#efe3f2);padding-top:8px}.plushlife-whats-new__previous>summary{cursor:pointer;color:var(--plush-copy,#786681);font-size:10.8px;font-weight:900}
    .plushlife-whats-new__previous-body{display:grid;gap:7px;margin-top:8px}.plushlife-whats-new__old{padding:8px 9px;border-radius:10px;background:var(--plush-surface-3,#f8eef9)}.plushlife-whats-new__old strong{display:block;font-size:10.7px}.plushlife-whats-new__old span{display:block;margin-top:2px;color:var(--plush-copy,#786681);font-size:9.8px;line-height:1.35}
    .plushlife-whats-new__done{width:100%;min-height:44px;margin-top:10px;border:0;border-radius:12px;background:var(--plush-accent,#c77dd6);color:white;font-weight:900;cursor:pointer}
    html[data-plushlife-calm-home="true"] #${PANEL_ID}{display:none!important}
    body.plushlife-modal-open #${PANEL_ID},html[data-plushlife-checkin-open] #${PANEL_ID}{pointer-events:none}
    @media(max-width:480px){.plushlife-whats-new__grid{grid-template-columns:1fr}.plushlife-whats-new__summary{padding:11px 12px}.plushlife-whats-new__body{padding:0 12px 12px}}
    @media(prefers-reduced-motion:reduce){.plushlife-whats-new__chev{transition:none}}
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
  queue();
})();
