(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeCheckinComfortPromptInstalled) return;
  window.__plushlifeCheckinComfortPromptInstalled = true;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function syncComfortPrompt() {
    const title = document.getElementById("checkin-popup-title");
    if (!title || !/How does my little self feel\?/i.test(clean(title.textContent))) return;

    const headerCopy = title.parentElement;
    if (!headerCopy) return;

    const existing = [...headerCopy.querySelectorAll("div")].find((node) => /^🧸\s*Is .+ nearby\?/i.test(clean(node.textContent)));
    if (existing) {
      existing.dataset.plushCheckinComfort = "true";
      existing.setAttribute("aria-label", "Comfort or safety item check");
      return;
    }

    const prompt = document.createElement("div");
    prompt.dataset.plushCheckinComfort = "true";
    prompt.dataset.plushCheckinComfortFallback = "true";
    prompt.setAttribute("aria-label", "Comfort or safety item check");
    prompt.textContent = "🧸 Is your comfort item nearby?";
    prompt.style.cssText = "margin-top:6px;padding:6px 8px;border-radius:9px;background:#FFF8E8;color:#806536;font-size:10.5px;font-weight:800";

    const subtitle = title.nextElementSibling;
    if (subtitle) subtitle.insertAdjacentElement("afterend", prompt);
    else title.insertAdjacentElement("afterend", prompt);
  }

  let queued = false;
  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      syncComfortPrompt();
    });
  }

  const observer = new MutationObserver(queueSync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", queueSync, true);
  queueSync();
})();
