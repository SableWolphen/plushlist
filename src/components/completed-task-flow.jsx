const COMPLETED_LINGER_MS = 2600;

export function useCompletedTaskFlow(toggle, viewDone = {}) {
  const [lingerKeys, setLingerKeys] = React.useState([]);
  const timersRef = React.useRef(new Map());

  React.useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const unifiedToggle = React.useCallback((key, ...args) => {
    const wasDone = !!viewDone?.[key];
    const oldTimer = timersRef.current.get(key);
    if (oldTimer) window.clearTimeout(oldTimer);

    if (wasDone) {
      setLingerKeys((keys) => keys.filter((item) => item !== key));
      timersRef.current.delete(key);
    } else {
      setLingerKeys((keys) => keys.includes(key) ? keys : [...keys, key]);
      const timer = window.setTimeout(() => {
        setLingerKeys((keys) => keys.filter((item) => item !== key));
        timersRef.current.delete(key);
      }, COMPLETED_LINGER_MS);
      timersRef.current.set(key, timer);
    }

    return toggle?.(key, ...args);
  }, [toggle, viewDone]);

  return { unifiedToggle, lingerKeys };
}

export function CompletedTaskArea({ rows = [], viewDone = {}, lingerKeys = [], toggle, title = "Completed today", compact = false }) {
  const lingering = new Set(lingerKeys || []);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key] && !lingering.has(row.key));
  if (!completed.length) return null;

  return (
    <section aria-label={title} style={{ marginTop: compact ? 8 : 12, padding: compact ? 10 : 12, borderRadius: 14, border: "1px solid #E4D9E9", background: "rgba(255,255,255,.72)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#8D7898" }}>✓ {title.toUpperCase()}</div>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {completed.map((task) => (
          <button key={task.key} type="button" onClick={() => toggle?.(task.key)} aria-label={`Mark ${task.label} incomplete`} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center", padding: compact ? "8px 9px" : "9px 10px", borderRadius: 11, border: "1px solid #E7DDEB", background: "#FCF9FD", color: "#927F9C", textAlign: "left", cursor: "pointer" }}>
            <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#9B78AA", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>✓</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.35, fontWeight: 800, textDecoration: "line-through" }}>{task.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export const COMPLETED_TASK_LINGER_MS = COMPLETED_LINGER_MS;
