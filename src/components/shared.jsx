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

export function ToolPanel({ title, onClose, children, inline = false, hideClose = false }) {
  // onClose is a fresh arrow function on every parent render, so it can't be
  // in the effect's deps — that would toggle document.body.style.overflow
  // off and back on every time something inside the panel triggers a
  // re-render (e.g. tapping a button), which on Android WebView can wedge
  // the in-progress scroll/touch gesture until the app is restarted.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (inline) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [inline]);

  return (
    <div
      role={inline ? "region" : "dialog"}
      aria-modal={inline ? undefined : "true"}
      aria-label={title}
      onMouseDown={(event) => {
        if (!inline && event.target === event.currentTarget) onClose();
      }}
      style={inline ? { margin: "0 0 18px" } : {
        position: "fixed", inset: 0, zIndex: 2000,
        padding: "max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))",
        display: "grid", placeItems: "center", background: "rgba(55,38,64,.48)", backdropFilter: "blur(5px)",
      }}
    >
      <div
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
        <div style={{
          position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 12, padding: "13px 15px", background: "rgba(255,249,253,.96)", borderBottom: "1px solid #E8D5EF",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#5B4B6B" }}>{title}</div>
          {!hideClose && <button type="button" onClick={onClose} aria-label={`Close ${title}`} style={{
            minWidth: 44, minHeight: 38, padding: "7px 11px", borderRadius: 11, border: "1px solid #D9C5E2",
            background: "white", color: "#7A598C", fontWeight: 900, cursor: "pointer",
          }}>{inline ? "Back to tracker" : "Close"}</button>}
        </div>
        <div style={{ padding: "14px" }}>{children}</div>
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
