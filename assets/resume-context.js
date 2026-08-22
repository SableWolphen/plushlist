(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeResumeContextInstalled) return;
  window.__plushlifeResumeContextInstalled = true;

  const KEY = "plushlife:resume-context:v1";
  const SESSION_KEY = "plushlife:resume-context-shown:v1";
  const NAV_LABELS = /^(today|tasks|care|plushcare|growth|plushgrowth|calendar|profile|settings)$/i;

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (_error) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (_error) {}
  }
  function cleanLabel(node) {
    return String(node?.getAttribute?.("aria-label") || node?.textContent || "").replace(/\s+/g, " ").trim().replace(/[›⌄⌃]+$/g, "").trim();
  }
  function isMeaningfulNav(node) {
    if (!node) return false;
    const label = cleanLabel(node);
    return NAV_LABELS.test(label) || /plushgrowth|plushcare/i.test(label);
  }
  function findTarget(label) {
    const nodes = Array.from(document.querySelectorAll("button,[role='tab'],a"));
    const normalized = String(label || "").toLowerCase();
    return nodes.find((node) => cleanLabel(node).toLowerCase() === normalized && node.getClientRects?.().length) ||
      nodes.find((node) => cleanLabel(node).toLowerCase().includes(normalized) && node.getClientRects?.().length);
  }

  document.addEventListener("click", (event) => {
    const node = event.target?.closest?.("button,[role='tab'],a");
    if (!isMeaningfulNav(node)) return;
    const label = cleanLabel(node);
    write({ label, at: new Date().toISOString() });
  }, true);

  function showResume() {
    const saved = read();
    if (!saved?.label) return;
    try { if (sessionStorage.getItem(SESSION_KEY) === "1") return; } catch (_error) {}
    const age = Date.now() - new Date(saved.at || 0).getTime();
    if (!Number.isFinite(age) || age < 45000 || age > 7 * 86400000) return;
    const target = findTarget(saved.label);
    if (!target) return;

    const current = target.getAttribute("aria-selected") === "true" || target.getAttribute("aria-current") === "page";
    if (current) return;

    const chip = document.createElement("div");
    chip.id = "plushlife-resume-context";
    chip.setAttribute("role", "status");
    chip.innerHTML = `<span>↺ Continue where you left off?</span><button type="button" data-resume>Open ${saved.label}</button><button type="button" data-dismiss aria-label="Dismiss continue prompt">×</button>`;
    document.body.appendChild(chip);
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (_error) {}
    chip.querySelector("[data-resume]")?.addEventListener("click", () => { chip.remove(); target.click(); });
    chip.querySelector("[data-dismiss]")?.addEventListener("click", () => chip.remove());
  }

  const style = document.createElement("style");
  style.textContent = `
    #plushlife-resume-context{position:fixed;left:50%;top:max(14px,calc(env(safe-area-inset-top) + 8px));z-index:2147481500;display:flex;align-items:center;gap:7px;max-width:calc(100vw - 24px);padding:7px 8px 7px 10px;border:1px solid #dfd0e7;border-radius:999px;background:rgba(255,250,253,.96);box-shadow:0 10px 30px rgba(55,35,65,.17);transform:translateX(-50%);font:800 10.5px/1.2 system-ui,sans-serif;color:#6f5b7a;backdrop-filter:blur(10px)}
    #plushlife-resume-context button{min-height:36px;border-radius:999px;border:1px solid #dcc7e7;background:white;color:#795487;font-weight:900;padding:6px 9px;cursor:pointer;white-space:nowrap}#plushlife-resume-context [data-dismiss]{width:36px;padding:0;font-size:18px}
    html[data-plushlife-color-mode="dark"] #plushlife-resume-context{background:rgba(42,31,59,.97);border-color:#6b537b;color:#eee5f3}html[data-plushlife-color-mode="dark"] #plushlife-resume-context button{background:#382a49;border-color:#6b537b;color:#f2e5f6}
    @media(max-width:420px){#plushlife-resume-context span{display:none}}
  `;
  document.head.appendChild(style);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => window.setTimeout(showResume, 700), { once:true });
  else window.setTimeout(showResume, 700);
})();
