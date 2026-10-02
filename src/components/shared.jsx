// Shared UI primitives used across many screens — the first real
// components moved out of the monolithic app-source script (module
// split phase 5 — see docs/module-split-plan.md).
//
// These read from window.PlushLifeXxx globals (set by assets/*.js, which
// load as plain <script> tags before this bundle runs) rather than
// import()-ing those files directly — importing would make esbuild bundle
// their entire content a second time, duplicating what the separate
// <script> tags already loaded.
const { useEffect } = React;

// Mobile safety rules live with the shared UI layer so every dashboard/tool
// inherits the same protections without each panel having to remember them.
if (typeof document !== "undefined" && !document.getElementById("plushlife-mobile-ux-safety")) {
  const style = document.createElement("style");
  style.id = "plushlife-mobile-ux-safety";
  style.textContent = `
    html, body, #root { max-width: 100%; overflow-x: clip; }
    img, svg, video, canvas { max-width: 100%; }
    button, input, select, textarea { min-width: 0; max-width: 100%; }
    button, [role="button"], [role="tab"], summary { overflow-wrap: anywhere; touch-action: manipulation; }
    @media (pointer: coarse) {
      button, [role="button"], [role="tab"], summary { min-height: 44px; }
    }
    @media (max-width: 380px) {
      input, select, textarea { font-size: 16px !important; }
      [role="tablist"] { gap: 4px !important; }
      [role="tab"] { padding-left: 4px !important; padding-right: 4px !important; }
    }
    .pl-tool-backdrop{background:rgba(68,43,78,.40)!important;backdrop-filter:blur(9px) saturate(1.05)!important;-webkit-backdrop-filter:blur(9px) saturate(1.05)!important}
    .pl-tool-panel{position:relative;background:linear-gradient(155deg,#FFFDFE 0%,#FFF7FC 48%,#F5F0FF 100%)!important;border:1px solid rgba(226,201,234,.92)!important;box-shadow:0 24px 70px rgba(71,42,88,.28),inset 0 1px 0 rgba(255,255,255,.95)!important}
    .pl-tool-panel:before{content:"";position:absolute;inset:0 0 auto auto;width:130px;height:130px;border-radius:0 22px 0 100%;background:radial-gradient(circle at 65% 25%,rgba(255,192,228,.28),rgba(219,206,255,.13) 55%,transparent 73%);pointer-events:none}
    .pl-tool-header{background:linear-gradient(145deg,rgba(255,252,254,.96),rgba(248,241,255,.92))!important;border-bottom:1px solid rgba(230,209,236,.88)!important}
    .pl-tool-title{font-size:15.5px!important;color:#563B63!important;letter-spacing:-.01em}
    .pl-tool-close{border-radius:999px!important;border-color:#E3CDE9!important;background:linear-gradient(145deg,#FFFDFE,#F8F0FF)!important;color:#81548F!important;box-shadow:0 4px 12px rgba(92,59,110,.06)}
    .pl-tool-body{position:relative}
    .pl-tool-body>div>section,.pl-tool-body>section{border-radius:20px}
    .pl-tool-body button{transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}
    .pl-tool-body button:active{transform:scale(.985)}
    .pl-tool-body input,.pl-tool-body select,.pl-tool-body textarea{border-color:#E3D3E8!important;background:linear-gradient(145deg,#FFFDFE,#FFFAFD)!important;color:#5C4967!important;box-shadow:inset 0 1px 2px rgba(90,57,105,.035)!important}
    .pl-tool-body summary{border-radius:14px}
    .pl-tool-body ::selection{background:#EED8F4;color:#543760}
    .pl-tool-panel::-webkit-scrollbar{width:8px}.pl-tool-panel::-webkit-scrollbar-thumb{background:#E0C9E7;border-radius:999px;border:2px solid #FFF7FC}.pl-tool-panel::-webkit-scrollbar-track{background:transparent}

    /* PlushLife visual language: soft, playful, compact, and consistent. */
    .pl-tool-panel{
      --pl-ink:#5B4666;--pl-muted:#89748F;--pl-accent:#B95CC8;--pl-accent-2:#E178BD;
      --pl-line:#E7D5EC;--pl-soft:#FFF8FC;--pl-lilac:#F5EFFF;--pl-mint:#F3FBF7;
      --pl-shadow:0 8px 24px rgba(94,58,111,.07);
    }
    .pl-tool-header:after{
      content:"✦";margin-left:auto;margin-right:4px;color:#D68BD9;font-size:12px;
      filter:drop-shadow(0 2px 4px rgba(194,101,199,.14));
    }
    .pl-tool-title{display:flex!important;align-items:center!important;gap:6px!important}
    .pl-tool-body :is(h1,h2,h3){color:#563B63}
    .pl-tool-body :is(p,small){color:var(--pl-muted)}
    .pl-tool-body :is(button,[role="button"]){-webkit-tap-highlight-color:transparent}
    .pl-tool-body :is(button,[role="button"]):not(:disabled):hover{filter:brightness(1.015);box-shadow:0 6px 16px rgba(102,62,119,.07)}
    .pl-tool-body :is(input,select,textarea):focus{outline:0!important;border-color:#C982D4!important;box-shadow:0 0 0 3px rgba(194,105,207,.10)!important}
    .pl-tool-body [role="tablist"]{box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
    .pl-tool-body [role="tab"][aria-selected="true"]{box-shadow:0 5px 14px rgba(155,79,180,.09)!important}
    .pl-tool-body details[open]>summary{color:#74417F!important}

    /* Older utility screens inherit the same cozy card treatment without changing their behavior. */
    [aria-label="🌷 Add & organize"] .pl-tool-body>div>div,
    [aria-label="🧸 Plush & Keepsakes"] .pl-tool-body>div>div,
    [aria-label="Guardian"] .pl-tool-body>div>div,
    [aria-label="My Guardians"] .pl-tool-body>div>div{
      border-color:var(--pl-line)!important;
      box-shadow:var(--pl-shadow)!important;
    }
    [aria-label="🌷 Add & organize"] .pl-tool-body>div>div{
      border-radius:18px!important;
    }
    [aria-label="🧸 Plush & Keepsakes"] .pl-tool-body>div>div{
      border-radius:20px!important;
    }

    [aria-label="🌷 Add & organize"] .pl-tool-body button[aria-pressed="true"],
    [aria-label="🧸 Plush & Keepsakes"] .pl-tool-body button[aria-pressed="true"],
    [aria-label="Settings"] .pl-tool-body button[aria-pressed="true"]{
      border-color:#C779D3!important;background:linear-gradient(145deg,#FFF3FB,#F1E9FF)!important;color:#74417F!important;
    }

    @keyframes plSoftPop{0%{transform:scale(.96)}70%{transform:scale(1.025)}100%{transform:scale(1)}}
    @keyframes plTinyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
    .pl-tool-body button:focus-visible{outline:2px solid #D99AE1!important;outline-offset:2px}
    .pl-tool-body button[aria-pressed="true"],.pl-tool-body [role="tab"][aria-selected="true"]{animation:plSoftPop .2s ease-out}
    @media(max-width:520px){.pl-tool-backdrop{padding:8px 7px max(8px,env(safe-area-inset-bottom))!important}.pl-tool-panel{border-radius:22px!important;max-height:calc(100dvh - 16px)!important}.pl-tool-header{padding:11px 12px!important}.pl-tool-body{padding:11px!important}}
  `;
  document.head.appendChild(style);
}

class PanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    try {
      window.dispatchEvent(new CustomEvent("plushlife:panel-error", {
        detail: {
          panel: this.props.label || "Panel",
          message: String(error?.message || error || "Unknown panel error"),
          componentStack: String(info?.componentStack || "").slice(0, 1800),
        },
      }));
    } catch (_error) {}
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ margin: "12px 0", padding: 14, borderRadius: 14, border: "1px solid #E9C7D0", background: "#FFF5F7", color: "#704D58" }}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>This section hit a snag.</div>
        <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.5 }}>Your saved data was not changed. Close this panel and try opening it again.</div>
        <button type="button" onClick={() => this.setState({ failed: false })} style={{ marginTop: 9, minHeight: 44, padding: "8px 12px", borderRadius: 10, border: "1px solid #D9A7B4", background: "white", color: "#7C4D5B", fontWeight: 900, cursor: "pointer" }}>Try this section again</button>
      </div>
    );
  }
}

export function SafePanelRegion({ label, children }) {
  return <PanelErrorBoundary label={label}>{children}</PanelErrorBoundary>;
}

export function ToolPanel({ title, displayTitle, onClose, children, inline = false, hideClose = false }) {
  const onCloseRef = React.useRef(onClose);
  const panelRef = React.useRef(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (inline) return undefined;
    const previousActive = document.activeElement;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      const firstFocusable = panelRef.current?.querySelector?.("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
      firstFocusable?.focus?.({ preventScroll: true });
    }, 0);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      if (previousActive && typeof previousActive.focus === "function") {
        window.setTimeout(() => previousActive.focus({ preventScroll: true }), 0);
      }
    };
  }, [inline]);

  return (
    <div
      role={inline ? "region" : "dialog"}
      aria-modal={inline ? undefined : "true"}
      aria-label={title}
      data-plush-panel={title}
      onMouseDown={(event) => {
        if (!inline && event.target === event.currentTarget) onClose();
      }}
      className={inline ? "pl-inline-tool" : "pl-tool-backdrop"}
      style={inline ? { margin: "0 0 18px" } : {
        position: "fixed", inset: 0, zIndex: 2000,
        padding: "max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))",
        display: "grid", placeItems: "center", background: "rgba(55,38,64,.48)", backdropFilter: "blur(5px)",
      }}
    >
      <div
        ref={panelRef}
        className="pl-tool-panel"
        onMouseDown={(event) => event.stopPropagation()}
        style={inline ? {
          width: "100%", borderRadius: 22, background: "#FFF9FD", border: "1px solid #E8D5EF",
          boxShadow: "0 10px 28px rgba(62,35,75,.12)",
        } : {
          width: "min(760px,100%)", maxHeight: "calc(100dvh - 24px)", overflowY: "auto",
          borderRadius: 22, background: "#FFF9FD", border: "1px solid #E8D5EF",
          boxShadow: "0 24px 70px rgba(62,35,75,.34)", overscrollBehavior: "contain",
        }}
      >
        <div className="pl-tool-header" style={{
          position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 12, padding: "13px 15px", background: "rgba(255,249,253,.96)", borderBottom: "1px solid #E8D5EF",
          backdropFilter: "blur(8px)",
        }}>
          <div className="pl-tool-title" style={{ minWidth: 0, fontSize: 15, fontWeight: 900, color: "#5B4B6B" }}>{displayTitle || title}</div>
          {!hideClose && <button type="button" className="pl-tool-close" onClick={onClose} aria-label={`Close ${title}`} style={{
            minWidth: 58, minHeight: 44, padding: "7px 11px", borderRadius: 11, border: "1px solid #D9C5E2",
            background: "white", color: "#7A598C", fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, overflowWrap: "normal",
          }}>{inline ? "Back to tracker" : "Close"}</button>}
        </div>
        <div className="pl-tool-body" style={{ padding: "14px" }}><PanelErrorBoundary label={title}>{children}</PanelErrorBoundary></div>
      </div>
    </div>
  );
}

export const HabitTypeIcon = React.memo(function HabitTypeIcon({ task }) {
  const { habitTypeForTask } = window.PlushLifeSchedule;
  const habitType = habitTypeForTask(task);
  if (habitType === "regular") return null;
  return (
    <span aria-hidden="true" title={habitType === "build" ? "Building this habit" : "Reducing this habit"} style={{ marginRight: 5 }}>
      {habitType === "build" ? "🌱" : "🍂"}
    </span>
  );
});

// Promise-based replacement for window.confirm(). Call `ask({ title, message,
// confirmLabel, cancelLabel, danger })` from any async event handler and
// `await` the boolean result. Renders one app-styled, accessible dialog.
export function useConfirmation() {
  const [request, setRequest] = React.useState(null);
  const resolverRef = React.useRef(null);
  const cancelButtonRef = React.useRef(null);

  const ask = React.useCallback(({ title, message, confirmLabel = "Continue", cancelLabel = "Never mind", danger = false }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest({ title, message, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const answer = React.useCallback((value) => {
    setRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve(value);
  }, []);

  React.useEffect(() => {
    if (!request) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") answer(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    window.setTimeout(() => cancelButtonRef.current?.focus?.({ preventScroll: true }), 0);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [request, answer]);

  const dialog = request ? (
    <div role="dialog" aria-modal="true" aria-labelledby="plushlife-confirm-title" aria-describedby="plushlife-confirm-message" onMouseDown={(event) => { if (event.target === event.currentTarget) answer(false); }} style={{ position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", padding: 18, background: "rgba(45,32,56,.45)", backdropFilter: "blur(4px)" }}>
      <div style={{ position: "relative", width: "min(100%, 390px)", padding: 20, borderRadius: 22, background: "#FFFDFE", border: "1px solid #E3C9EC", boxShadow: "0 24px 70px rgba(45,32,56,.25)" }}>
        <button type="button" aria-label="Close" onClick={() => answer(false)} style={{ position: "absolute", top: 10, right: 10, width: 44, height: 44, borderRadius: 999, border: "1px solid #E3C9EC", background: "white", color: "#76558A", fontSize: 20, fontWeight: 900, cursor: "pointer" }}>×</button>
        <div id="plushlife-confirm-title" style={{ paddingRight: 48, fontSize: 19, fontWeight: 900, color: "#5B3D70" }}>{request.title}</div>
        <div id="plushlife-confirm-message" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#6B5A7D", whiteSpace: "pre-wrap" }}>{request.message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button ref={cancelButtonRef} type="button" onClick={() => answer(false)} style={{ minHeight: 44, padding: "8px 14px", borderRadius: 10, border: "1px solid #D8C8E2", background: "white", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>{request.cancelLabel}</button>
          <button type="button" onClick={() => answer(true)} style={{ minHeight: 44, padding: "8px 14px", borderRadius: 10, border: 0, background: request.danger ? "#C45D74" : "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>{request.confirmLabel}</button>
        </div>
      </div>
    </div>
  ) : null;

  return [ask, dialog];
}
