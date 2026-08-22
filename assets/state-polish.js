(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeStatePolishInstalled) return;
  window.__plushlifeStatePolishInstalled = true;

  const style = document.createElement("style");
  style.id = "plushlife-state-polish";
  style.textContent = `
    [role="status"]:not(#plushlife-resume-context):not(#plushlife-mascot-reaction),[role="alert"]{box-sizing:border-box;max-width:100%;overflow-wrap:anywhere;word-break:normal}
    [role="alert"]{border-radius:12px}
    button:disabled,[aria-disabled="true"]{cursor:not-allowed;opacity:.58}
    [aria-busy="true"]{cursor:progress}
    input::placeholder,textarea::placeholder{opacity:.72}
    img,svg,canvas,video{max-width:100%}
    @media(max-width:640px){
      [role="status"],[role="alert"]{max-width:100%;font-size:max(11px,inherit)}
      button,[role="button"],a,summary{max-width:100%;overflow-wrap:anywhere}
      input,textarea,select{max-width:100%;box-sizing:border-box}
    }
    @media(max-width:340px){
      [role="status"],[role="alert"]{padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}
      button,[role="button"],summary{white-space:normal}
    }
    @media(max-height:520px) and (orientation:landscape){
      [role="dialog"][aria-modal="true"]{padding-top:8px!important;padding-bottom:8px!important}
      [role="dialog"][aria-modal="true"]>[data-plushlife-dialog-panel="true"],[role="dialog"][aria-modal="true"]>div:first-child{max-height:calc(100dvh - 16px)!important}
    }
    @media(prefers-reduced-motion:reduce){[aria-busy="true"]{scroll-behavior:auto!important}}
    @media(forced-colors:active){[role="alert"],[role="status"]{border:1px solid CanvasText}button:disabled,[aria-disabled="true"]{opacity:1}}
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
