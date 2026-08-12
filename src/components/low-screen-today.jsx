const HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function readHabitState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; } catch (_error) { return {}; }
}

function habitId(row) {
  return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
}

function dateKey(value) {
  return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10);
}

function buttonStyle(active = false) {
  return {
    padding: "8px 10px",
    borderRadius: 10,
    border: active ? "2px solid #A65DC1" : "1px solid #DCC9E8",
    background: active ? "#FAF0FD" : "white",
    color: "#6B5A7D",
    fontWeight: 850,
    fontSize: 11.5,
    cursor: "pointer",
  };
}

export function LowScreenToday({ open, rows = [], viewDone = {}, recentlyCompletedKeys = [], period, toggle, nextStepTask, selectDayType, goToDashboard }) {
  if (!open) return null;

  const state = readHabitState();
  const date = dateKey(period?.date);
  const anchorId = state.anchors?.[date];
  const anchor = rows.find((row) => habitId(row) === anchorId);
  const recentSet = new Set(recentlyCompletedKeys || []);
  const justCompleted = rows.find((row) => !row.isBonus && !!viewDone[row.key] && recentSet.has(row.key));
  const next = justCompleted || (anchor && !viewDone?.[anchor.key] ? anchor : null) || nextStepTask || rows.find((row) => !row.isBonus && !viewDone?.[row.key]);
  const nextIsDone = !!(next && viewDone?.[next.key]);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone[row.key] && !recentSet.has(row.key));

  return (
    <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
      <section style={{ padding: 18, borderRadius: 20, background: "linear-gradient(145deg,#FFF9FD,#F4FBFF)", border: "1px solid #E3C9EC", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>🌿 LOW SCREEN TIME</div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#806B8D" }}>Open → know what matters → do it → leave.</div>
        <div style={{ marginTop: 14, fontSize: 20, fontWeight: 900, color: nextIsDone ? "#A081AD" : "#4F405C", textDecoration: nextIsDone ? "line-through" : "none" }}>{next ? (next.label || "Habit") : "You’re done for now."}</div>
        {next && (
          <button type="button" onClick={() => toggle?.(next.key)} style={{ ...buttonStyle(true), marginTop: 14, padding: "11px 18px", border: 0, background: nextIsDone ? "#B67AC8" : "#A65DC1", color: "white" }}>
            {nextIsDone ? "✓ Done — tap to undo" : "✓ Done"}
          </button>
        )}
        <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", marginTop: 10 }}>
          <button type="button" onClick={() => selectDayType?.("soft")} style={buttonStyle(false)}>🌼 Make today softer</button>
          <button type="button" onClick={() => goToDashboard?.("progress")} style={buttonStyle(false)}>📊 Review</button>
        </div>
      </section>

      {completed.length > 0 && (
        <details style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.72)" }}>
          <summary style={{ cursor: "pointer", color: "#8C6B9E", fontWeight: 900, fontSize: 12 }}>✓ Completed today ({completed.length})</summary>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {completed.map((row) => (
              <button key={row.key} type="button" onClick={() => toggle?.(row.key)} style={{ ...buttonStyle(false), textAlign: "left", color: "#A081AD", textDecoration: "line-through" }}>{row.label || "Habit"}</button>
            ))}
          </div>
        </details>
      )}

      <button type="button" onClick={() => {
        try {
          const current = readHabitState();
          const retention = current?.meta?.__retention || {};
          const nextState = { ...current, meta: { ...(current.meta || {}), __retention: { ...retention, lowScreen: false, updated_at: new Date().toISOString() } } };
          localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(nextState));
          window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated"));
        } catch (_error) {}
      }} style={buttonStyle(false)}>Show full Today</button>
    </div>
  );
}
