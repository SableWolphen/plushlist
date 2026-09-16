(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  function luminance(color) {
    if (!color || color === "transparent") return null;
    const n = String(color).match(/[\d.]+/g);
    if (!n || n.length < 3) return null;
    if (n.length >= 4 && Number(n[3]) === 0) return null;
    const channels = n.slice(0, 3).map(Number).map((c) => c / 255).map((c) => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4));
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  }
  function isDark() {
    const candidates = [document.body, document.documentElement, document.getElementById("root")].filter(Boolean);
    const values = candidates.map((node) => luminance(getComputedStyle(node).backgroundColor)).filter((value) => value !== null);
    if (values.some((value) => value < .22)) return true;
    return !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  }
  function sync() {
    const card = document.querySelector('[data-plush-checkin-card="true"]');
    if (!card) return;
    card.dataset.plushCheckinScheme = isDark() ? "dark" : "light";
    try {
      const statusBar = window.Capacitor?.Plugins?.StatusBar;
      statusBar?.setStyle?.({ style: isDark() ? "LIGHT" : "DARK" }).catch?.(() => {});
    } catch (_) {}
  }
  const observer = new MutationObserver(() => requestAnimationFrame(sync));
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change", sync);
  document.addEventListener("click", () => requestAnimationFrame(sync), true);
  requestAnimationFrame(sync);
})();
