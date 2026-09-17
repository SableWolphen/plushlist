(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeNurseryLayoutUnifierInstalled) return;
  window.__plushlifeNurseryLayoutUnifierInstalled = true;

  function installStyle() {
    if (document.getElementById("plushlife-nursery-layout-unifier-style")) return;
    const style = document.createElement("style");
    style.id = "plushlife-nursery-layout-unifier-style";
    style.textContent = `
      /* Nursery is a theme, not a separate layout. Keep the shared shell geometry. */
      #main-content.baby-mode { font-size: 100% !important; }
      #main-content.baby-mode .baby-shell {
        padding: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #main-content.baby-mode button { min-height: auto; }
      #main-content.baby-mode input,
      #main-content.baby-mode select,
      #main-content.baby-mode textarea { min-height: auto; }
      #main-content.baby-mode .nursery-nook,
      #main-content.baby-mode .baby-arrival-ritual,
      #main-content.baby-mode [data-nursery-layout-only="true"] { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function normalizeNavLabel(root) {
    const scope = root || document;
    scope.querySelectorAll(".plushlife-dashboard-tab, [role='tab']").forEach((tab) => {
      if (!tab.closest("#main-content.baby-mode")) return;
      const text = String(tab.textContent || "").replace(/\s+/g, " ").trim();
      if (!/^☀️?\s*Nursery$/i.test(text) && text !== "Nursery") return;
      Array.from(tab.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && /Nursery/i.test(node.nodeValue || "")) {
          node.nodeValue = String(node.nodeValue || "").replace(/Nursery/gi, "PlushHome");
        }
      });
      if (/Nursery/i.test(tab.getAttribute("aria-label") || "")) {
        tab.setAttribute("aria-label", String(tab.getAttribute("aria-label")).replace(/Nursery/gi, "PlushHome"));
      }
    });
  }

  function hideNurseryOnlyControls(root) {
    const scope = root || document;
    scope.querySelectorAll("#main-content.baby-mode button").forEach((button) => {
      const text = String(button.textContent || "").replace(/\s+/g, " ").trim();
      if (!/(show|hide) nursery greeting/i.test(text)) return;
      button.style.setProperty("display", "none", "important");
      const wrapper = button.parentElement;
      if (wrapper && wrapper.children.length === 1) wrapper.style.setProperty("display", "none", "important");
    });
  }

  function refresh(root) {
    installStyle();
    if (!document.querySelector("#main-content.baby-mode")) return;
    normalizeNavLabel(root);
    hideNurseryOnlyControls(root);
  }

  let scheduled = false;
  const scheduleRefresh = (root) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refresh(root || document);
    });
  };

  const observer = new MutationObserver((records) => {
    const root = records.length === 1 && records[0].target?.nodeType === 1 ? records[0].target : document;
    scheduleRefresh(root);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("focus", () => scheduleRefresh(document));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleRefresh(document); });

  window.PlushLifeNurseryLayoutUnifier = { refresh: () => refresh(document) };
  refresh(document);
})();
