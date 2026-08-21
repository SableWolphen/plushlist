const COMPLETED_LINGER_MS = 4200;
const COMPLETION_EVENT = "plushlife:task-completion-feedback";
const LazyRatingMoment = React.lazy(() => import("./rating-moment.jsx").then((module) => ({ default: module.RatingMoment })));

function giveCompletionFeedback(label, completed) {
  try {
    if (navigator?.vibrate) navigator.vibrate(completed ? [28, 28, 42] : 24);
  } catch (_error) {}
  try {
    window.dispatchEvent(new CustomEvent(COMPLETION_EVENT, {
      detail: { label, completed, at: Date.now() },
    }));
  } catch (_error) {}
}

export function useCompletedTaskFlow(toggle, viewDone = {}, rows = []) {
  const [lingerKeys, setLingerKeys] = React.useState([]);
  const [announcement, setAnnouncement] = React.useState("");
  const timersRef = React.useRef(new Map());

  React.useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const unifiedToggle = React.useCallback((key, ...args) => {
    const wasDone = !!viewDone?.[key];
    const label = rows.find((row) => row.key === key)?.label || "Task";
    const oldTimer = timersRef.current.get(key);
    if (oldTimer) window.clearTimeout(oldTimer);

    if (wasDone) {
      setLingerKeys((keys) => keys.filter((item) => item !== key));
      timersRef.current.delete(key);
      setAnnouncement(`${label} marked incomplete.`);
      giveCompletionFeedback(label, false);
    } else {
      setLingerKeys((keys) => keys.includes(key) ? keys : [...keys, key]);
      setAnnouncement(`${label} completed. Undo is available for a few seconds.`);
      giveCompletionFeedback(label, true);
      const timer = window.setTimeout(() => {
        setLingerKeys((keys) => keys.filter((item) => item !== key));
        timersRef.current.delete(key);
        setAnnouncement(`${label} moved to Completed Today.`);
      }, COMPLETED_LINGER_MS);
      timersRef.current.set(key, timer);
    }

    return toggle?.(key, ...args);
  }, [toggle, viewDone, rows]);

  return { unifiedToggle, lingerKeys, announcement };
}

export function CompletedTaskArea({ rows = [], viewDone = {}, lingerKeys = [], toggle, title = "Completed today", compact = false }) {
  const lingering = new Set(lingerKeys || []);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key] && !lingering.has(row.key));
  if (!completed.length) return null;

  return (
    <section aria-label={title} style={{ marginTop: compact ? 8 : 12, padding: compact ? 10 : 12, borderRadius: 14, border: "1px solid #E4D9E9", background: "rgba(255,255,255,.72)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#8D7898" }}>✓ {title.toUpperCase()}</div>
        <div style={{ fontSize: 9.5, color: "#A08EAA" }}>Tap any item to undo</div>
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {completed.map((task) => (
          <button key={task.key} type="button" onClick={() => toggle?.(task.key)} aria-label={`Undo completion for ${task.label}`} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "24px minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: compact ? "8px 9px" : "9px 10px", borderRadius: 11, border: "1px solid #E7DDEB", background: "#FCF9FD", color: "#927F9C", textAlign: "left", cursor: "pointer" }}>
            <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#9B78AA", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>✓</span>
            <span style={{ minWidth: 0, fontSize: 12.5, lineHeight: 1.35, fontWeight: 800, textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis" }}>{task.label}</span>
            <span aria-hidden="true" style={{ fontSize: 10.5, fontWeight: 900, color: "#8D7898" }}>Undo</span>
          </button>
        ))}
      </div>
      {completed.length >= 3 && <React.Suspense fallback={null}><LazyRatingMoment completedCount={completed.length} /></React.Suspense>}
    </section>
  );
}

export const COMPLETED_TASK_LINGER_MS = COMPLETED_LINGER_MS;
export const TASK_COMPLETION_FEEDBACK_EVENT = COMPLETION_EVENT;
