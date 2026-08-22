(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeWeeklyReflectionWindowInstalled) return;
  window.__plushlifeWeeklyReflectionWindowInstalled = true;

  const STORAGE_PREFIX = "plushlife:weekly-reflection-ready:v1";
  const LOOP_KEY = "plushlife:local-product-loop:v1";
  let checkTimer = null;
  let shownThisSession = false;

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function mondayOfWeek(date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    const day = copy.getDay();
    const delta = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + delta);
    return copy;
  }

  function reflectionWeekKey(now) {
    const currentMonday = mondayOfWeek(now);
    if (now.getDay() === 0) {
      // Sunday evening closes the week that started six days ago.
      return localDateKey(currentMonday);
    }
    const previousMonday = new Date(currentMonday);
    previousMonday.setDate(previousMonday.getDate() - 7);
    return localDateKey(previousMonday);
  }

  function inReflectionWindow(now) {
    const day = now.getDay();
    if (day === 0) return now.getHours() >= 18;
    return day === 1 || day === 2;
  }

  function hasEnoughHistory() {
    try {
      const loop = JSON.parse(window.localStorage.getItem(LOOP_KEY) || "null");
      if (!loop) return false;
      return Number(loop.visits || 0) >= 3 || Number(loop.completions || 0) >= 3;
    } catch (_error) {
      return false;
    }
  }

  function storageKey(now) {
    return `${STORAGE_PREFIX}:${reflectionWeekKey(now)}`;
  }

  function alreadySurfaced(now) {
    try { return window.localStorage.getItem(storageKey(now)) === "shown"; }
    catch (_error) { return shownThisSession; }
  }

  function markSurfaced(now) {
    shownThisSession = true;
    try { window.localStorage.setItem(storageKey(now), "shown"); }
    catch (_error) {}
  }

  function findGrowthControl() {
    const candidates = Array.from(document.querySelectorAll("button,[role='tab'],a"));
    return candidates.find((node) => /plushgrowth/i.test(String(node.textContent || ""))) ||
      candidates.find((node) => /growth/i.test(String(node.textContent || "")));
  }

  function closeModal(modal) {
    if (modal?.isConnected) modal.remove();
  }

  function openGrowth(modal) {
    const growth = findGrowthControl();
    closeModal(modal);
    if (growth) {
      growth.click();
      return;
    }
    window.location.hash = "growth";
  }

  function showWeeklyReflection(now) {
    if (document.getElementById("plushlife-weekly-reflection-ready")) return;
    const modal = document.createElement("div");
    modal.id = "plushlife-weekly-reflection-ready";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "plushlife-weekly-reflection-title");
    modal.innerHTML = `
      <div class="plushlife-weekly-reflection-card">
        <button type="button" class="plushlife-weekly-reflection-close" aria-label="Close weekly reflection">×</button>
        <div class="plushlife-weekly-reflection-icon" aria-hidden="true">💜</div>
        <div class="plushlife-weekly-reflection-kicker">YOUR WEEK IS READY</div>
        <h2 id="plushlife-weekly-reflection-title">See what last week taught PlushLife</h2>
        <p>A quick look at what helped, what felt harder, and the patterns worth carrying forward. No catching up needed.</p>
        <button type="button" class="plushlife-weekly-reflection-open">See my week</button>
        <button type="button" class="plushlife-weekly-reflection-later">Not now</button>
      </div>`;
    document.body.appendChild(modal);
    markSurfaced(now);

    const close = () => closeModal(modal);
    modal.querySelector(".plushlife-weekly-reflection-close")?.addEventListener("click", close);
    modal.querySelector(".plushlife-weekly-reflection-later")?.addEventListener("click", close);
    modal.querySelector(".plushlife-weekly-reflection-open")?.addEventListener("click", () => openGrowth(modal));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    modal.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    window.requestAnimationFrame(() => modal.querySelector(".plushlife-weekly-reflection-open")?.focus());
  }

  function maybeShow() {
    if (shownThisSession) return;
    const now = new Date();
    if (!inReflectionWindow(now) || alreadySurfaced(now) || !hasEnoughHistory()) return;
    if (!findGrowthControl()) return;
    showWeeklyReflection(now);
  }

  const style = document.createElement("style");
  style.id = "plushlife-weekly-reflection-style";
  style.textContent = `
    #plushlife-weekly-reflection-ready {
      position:fixed;inset:0;z-index:2147482500;display:grid;place-items:center;
      padding:max(18px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));
      background:rgba(45,31,55,.42);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
      box-sizing:border-box;
    }
    .plushlife-weekly-reflection-card {
      position:relative;box-sizing:border-box;width:min(92vw,430px);max-height:min(80dvh,620px);overflow:auto;
      padding:24px 20px 18px;border:1px solid #e3caed;border-radius:22px;
      background:linear-gradient(150deg,#fffafd,#f8f2ff 72%,#f3fbf8);color:#594766;
      box-shadow:0 24px 70px rgba(35,20,45,.30);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;
    }
    .plushlife-weekly-reflection-close {position:absolute;right:10px;top:10px;width:44px;height:44px;border:1px solid #dfcbe8;border-radius:13px;background:#fff;color:#805296;font-size:27px;line-height:1;cursor:pointer;}
    .plushlife-weekly-reflection-icon {font-size:30px;line-height:1;margin-bottom:8px;}
    .plushlife-weekly-reflection-kicker {font-size:10px;letter-spacing:.14em;font-weight:900;color:#9b55b7;}
    .plushlife-weekly-reflection-card h2 {margin:7px auto 0;max-width:330px;font-size:22px;line-height:1.18;color:#594266;}
    .plushlife-weekly-reflection-card p {margin:10px auto 0;max-width:350px;font-size:13px;line-height:1.5;color:#76667e;}
    .plushlife-weekly-reflection-open,.plushlife-weekly-reflection-later {width:100%;min-height:46px;border-radius:12px;font-weight:900;cursor:pointer;}
    .plushlife-weekly-reflection-open {margin-top:16px;border:0;background:#a65dc1;color:white;}
    .plushlife-weekly-reflection-later {margin-top:7px;border:1px solid #dfcbe8;background:transparent;color:#805f90;}
    html[data-plushlife-color-mode="dark"] .plushlife-weekly-reflection-card {background:linear-gradient(150deg,#352747,#281e39 72%,#24343a);border-color:#715584;color:#f5edf8;}
    html[data-plushlife-color-mode="dark"] .plushlife-weekly-reflection-card h2 {color:#fff7ff;}
    html[data-plushlife-color-mode="dark"] .plushlife-weekly-reflection-card p {color:#d8cadf;}
    html[data-plushlife-color-mode="dark"] .plushlife-weekly-reflection-close {background:#413052;border-color:#715584;color:#f2c7ff;}
    html[data-plushlife-color-mode="dark"] .plushlife-weekly-reflection-later {border-color:#715584;color:#e7d6ed;}
    @media (max-width:420px) {
      .plushlife-weekly-reflection-card {width:calc(100vw - 28px);padding:22px 16px 16px;border-radius:20px;}
      .plushlife-weekly-reflection-card h2 {font-size:20px;}
    }
    @media (prefers-reduced-motion:reduce) { #plushlife-weekly-reflection-ready * {scroll-behavior:auto!important;transition:none!important;} }
  `;
  document.head.appendChild(style);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", maybeShow, { once:true });
  else maybeShow();

  const observer = new MutationObserver(() => {
    if (checkTimer) window.clearTimeout(checkTimer);
    checkTimer = window.setTimeout(maybeShow, 160);
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });

  window.PlushLifeWeeklyReflection = {
    check: maybeShow,
    inWindow: inReflectionWindow,
    weekKey: reflectionWeekKey,
  };
})();
