// In-page utilities keep keyboard focus in the content slot without a modal trap.
export function useInlinePageFocus(activePage, onClose) {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    if (!activePage) return undefined;
    const previous = document.activeElement;
    const closePage = event => {
      const modalOpen = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(panel=>panel.getClientRects().length>0);
      if (modalOpen) return;
      if (event.type === "keydown" && (event.key !== "Escape" || event.defaultPrevented)) return;
      event.preventDefault();
      closeRef.current?.();
    };
    document.addEventListener("keydown", closePage);
    document.addEventListener("plushlife:back-request", closePage);
    const frame = window.requestAnimationFrame(() => {
      const selector = activePage === "checkin" ? '[aria-labelledby="checkin-popup-title"]'
        : activePage === "updates" ? '.pl-calm-updates'
        : activePage === "settings" ? '[data-plush-panel="Settings"]'
        : '[data-plush-panel="PlushJournal"]';
      const panel = document.querySelector(selector);
      if (panel) { panel.setAttribute("tabindex", "-1"); panel.focus({preventScroll:true}); document.getElementById?.("main-content")?.scrollTo?.({top:0}); window.scrollTo?.({top:0,left:0,behavior:"instant"}); }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", closePage);
      document.removeEventListener("plushlife:back-request", closePage);
      if (previous?.isConnected && !previous.closest?.("[hidden]")) previous.focus?.({preventScroll:true});
    };
  }, [activePage]);
}
