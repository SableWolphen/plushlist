(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeStatePolishInstalled) return;
  window.__plushlifeStatePolishInstalled = true;

  const style = document.createElement("style");
  style.id = "plushlife-state-polish";
  style.textContent = `
    [role="status"]:not(#plushlife-resume-context):not(#plushlife-mascot-reaction),[role="alert"]{box-sizing:border-box;max-width:100%;overflow-wrap:anywhere}
    [role="alert"]{border-radius:12px}
    button:disabled,[aria-disabled="true"]{cursor:not-allowed;opacity:.58}
    [aria-busy="true"]{cursor:progress}
    input::placeholder,textarea::placeholder{opacity:.72}
    @media(max-width:640px){[role="status"],[role="alert"]{font-size:max(11px,inherit)}}
    @media(forced-colors:active){[role="alert"],[role="status"]{border:1px solid CanvasText}}
  `;
  document.head.appendChild(style);

  function markStates(root) {
    const scope = root?.querySelectorAll ? root : document;
    scope.querySelectorAll('[role="status"],[role="alert"],[aria-busy="true"]').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.dataset.plushlifeState = node.getAttribute("role") || "busy";
    });
  }
  markStates(document);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => { if (node.nodeType === 1) markStates(node); }));
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
