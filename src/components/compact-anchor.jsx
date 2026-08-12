// Today used to render <HabitCoach {...props}> with a large expandable toolbox.
// Keep the same habit-coach storage/history contract here while showing only
// the one daily control that belongs on Today: the Anchor Habit.
const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const MAX_HISTORY_DAYS = 60;

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {};
    return {
      ...parsed,
      version: 1,
      anchors: parsed.anchors || {},
      goals: parsed.goals || {},
      meta: parsed.meta || {},
      experiments: parsed.experiments || [],
      paths: parsed.paths || {},
      reviews: parsed.reviews || {},
      history: parsed.history || {},
      recovery: parsed.recovery || {},
    };
  } catch (_error) {
    return { version: 1, anchors: {}, goals: {}, meta: {}, experiments: [], paths: {}, reviews: {}, history: {}, recovery: {} };
  }
}

function writeState(state) {
  const next = { ...state, version: 1, updated_at: new Date().toISOString() };
  try { localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(next)); } catch (_error) {}
  try { window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated")); } catch (_error) {}
  return next;
}

function habitId(row) {
  return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
}

function habitLabel(row) {
  return String(row?.label || row?.sourceTask?.label || row?.sourceTask?.name || "Habit");
}

function dateKey(value) {
  return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10);
}

function pruneHistory(history = {}) {
  const cutoff = new Date();
  cutoff.setHours(12, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - MAX_HISTORY_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return Object.fromEntries(Object.entries(history).filter(([date]) => date >= cutoffKey));
}

function observationFor(rows, viewDone) {
  const result = {};
  for (const row of rows || []) {
    if (!row || row.isBonus) continue;
    const id = habitId(row);
    if (!id) continue;
    result[id] = {
      id,
      label: habitLabel(row),
      done: !!viewDone?.[row.key],
      essential: !!(row?.isEssential || row?.essential || row?.sourceTask?.essential || row?.sourceTask?.is_essential),
    };
  }
  return result;
}

const buttonStyle = {
  minHeight: 44,
  padding: "8px 11px",
  borderRadius: 10,
  border: "1px solid #DCC9E8",
  background: "white",
  color: "#6B5A7D",
  fontWeight: 850,
  fontSize: 11.5,
  cursor: "pointer",
};

export function CompactAnchor({ open, rows = [], viewDone = {}, period, toggle }) {
  const date = dateKey(period?.date);
  const [state, setState] = React.useState(() => readState());
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const currentRows = (rows || []).filter((row) => !row?.isBonus);
  const anchorId = state.anchors?.[date] || "";
  const anchorRow = currentRows.find((row) => habitId(row) === anchorId) || null;

  React.useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    return () => {
      window.removeEventListener("plushlife:habit-coach-hydrated", refresh);
      window.removeEventListener("plushlife:habit-coach-updated", refresh);
    };
  }, []);

  React.useEffect(() => {
    if (!open || !date) return;
    const latest = readState();
    const observation = observationFor(currentRows, viewDone);
    const previous = latest.history?.[date] || {};
    if (JSON.stringify(previous) === JSON.stringify(observation)) return;
    const next = writeState({ ...latest, history: pruneHistory({ ...(latest.history || {}), [date]: observation }) });
    setState(next);
  }, [open, date, rows, viewDone]);

  if (!open) return null;

  const chooseAnchor = (id) => {
    const latest = readState();
    setState(writeState({ ...latest, anchors: { ...(latest.anchors || {}), [date]: id } }));
    setPickerOpen(false);
  };

  return (
    <section style={{ marginBottom: 12, padding: "12px 13px", borderRadius: 16, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.82)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span aria-hidden="true" style={{ fontSize: 18 }}>🎯</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#A65DC1" }}>TODAY'S ANCHOR</div>
          <div style={{ marginTop: 2, fontSize: 13.5, lineHeight: 1.35, fontWeight: 900, color: "#4F405C" }}>{anchorRow ? habitLabel(anchorRow) : "Choose one habit that matters most"}</div>
        </div>
        {anchorRow && !viewDone?.[anchorRow.key] && <button type="button" onClick={() => toggle?.(anchorRow.key)} style={{ ...buttonStyle, border: 0, background: "#A65DC1", color: "white", flexShrink: 0 }}>✓ Done</button>}
        {anchorRow && viewDone?.[anchorRow.key] && <span style={{ fontSize: 11, color: "#318C79", fontWeight: 900, flexShrink: 0 }}>✓ Done</span>}
      </div>
      <button type="button" onClick={() => setPickerOpen((value) => !value)} aria-expanded={pickerOpen} style={{ ...buttonStyle, marginTop: 8, minHeight: 40, padding: "7px 10px" }}>{anchorRow ? "Change anchor" : "Choose anchor"}</button>
      {pickerOpen && <div style={{ display: "grid", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #EEE3F2" }}>
        {currentRows.slice(0, 14).map((row) => <button key={habitId(row)} type="button" onClick={() => chooseAnchor(habitId(row))} style={{ ...buttonStyle, textAlign: "left", background: habitId(row) === anchorId ? "#FAF0FD" : "white" }}>{viewDone?.[row.key] ? "✓ " : ""}{habitLabel(row)}</button>)}
        {!currentRows.length && <div style={{ fontSize: 11.5, color: "#8C6B9E" }}>Add a habit first, then you can choose an anchor.</div>}
      </div>}
    </section>
  );
}
