(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeGentleRewardInstalled) return;
  window.__plushlifeGentleRewardInstalled = true;

  const EVENT = "plushlife:task-completion-feedback";
  let timer = null;
  const style = document.createElement("style");
  style.id = "plushlife-gentle-reward-style";
  style.textContent = `
    body::after{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 34%,rgba(231,200,242,.18),transparent 42%),linear-gradient(180deg,rgba(248,232,252,.07),rgba(221,243,234,.07));transition:opacity .55s ease}
    body.plushlife-soft-reward::after{opacity:1}
    body.plushlife-soft-reward [data-plushlife-polished-card="true"]{transition:box-shadow .55s ease,transform .55s ease;box-shadow:0 8px 24px rgba(118,83,135,.09)!important}
    html[data-plushlife-color-mode="dark"] body::after{background:radial-gradient(circle at 50% 34%,rgba(179,115,197,.12),transparent 42%),linear-gradient(180deg,rgba(91,62,112,.05),rgba(67,103,92,.04))}
    @media(prefers-reduced-motion:reduce){body::after,[data-plushlife-polished-card="true"]{transition:none!important}}
  `;
  document.head.appendChild(style);

  window.addEventListener(EVENT, (event) => {
    if (event.detail?.completed === false) return;
    document.body.classList.add("plushlife-soft-reward");
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => document.body.classList.remove("plushlife-soft-reward"), 2200);
  });
})();
