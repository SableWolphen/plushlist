// Today used to render <HabitCoach {...props}> with a large expandable toolbox.
// Keep the same habit-coach storage/history contract here while showing only
// one intentional habit users want to work on: their persistent Focus Habit.
const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const MAX_HISTORY_DAYS = 60;
const OPEN_FOCUS_PICKER_EVENT = "plushlife:open-focus-habit-picker";

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

function isHabitRow(row) {
  return row && !row.isBonus && String(row.habitType || "regular") !== "regular";
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
  const habitRows = currentRows.filter(isHabitRow);
  const focusId = String(state.meta?.focus_habit_id || "");
  const focusRow = habitRows.find((row) => habitId(row) === focusId) || null;
  const focusLabel = focusRow ? habitLabel(focusRow) : String(state.meta?.focus_habit_label || "");

  React.useEffect(() => {
    const refresh = () => setState(readState());
    const openPicker = () => setPickerOpen(true);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener(OPEN_FOCUS_PICKER_EVENT, openPicker);
    return () => {
      window.removeEventListener("plushlife:habit-coach-hydrated", refresh);
      window.removeEventListener("plushlife:habit-coach-updated", refresh);
      window.removeEventListener(OPEN_FOCUS_PICKER_EVENT, openPicker);
    };
  }, []);

  React.useEffect(() => {
    if (!open || !date) return;
    const latest = readState();
    const observation = observationFor(currentRows, viewDone);
    const previous = latest.history?.[date] || {};
    let next = latest;
    let changed = JSON.stringify(previous) !== JSON.stringify(observation);
    if (changed) next = { ...next, history: pruneHistory({ ...(next.history || {}), [date]: observation }) };

    let persistentFocusId = String(next.meta?.focus_habit_id || "");
    let persistentFocusRow = habitRows.find((row) => habitId(row) === persistentFocusId) || null;

    // One-time gentle migration: if an existing daily Anchor points to a real
    // habit, keep that choice as the new persistent Focus Habit.
    if (!persistentFocusId) {
      const legacyAnchorId = String(next.anchors?.[date] || "");
      const legacyHabit = habitRows.find((row) => habitId(row) === legacyAnchorId) || null;
      if (legacyHabit) {
        persistentFocusId = habitId(legacyHabit);
        persistentFocusRow = legacyHabit;
        next = {
          ...next,
          meta: {
            ...(next.meta || {}),
            focus_habit_id: persistentFocusId,
            focus_habit_label: habitLabel(legacyHabit),
            focus_habit_selected_at: new Date().toISOString(),
          },
        };
        changed = true;
      }
    }

    // Keep the old per-day Anchor contract populated so existing intelligence
    // and review code automatically follows the user's persistent focus.
    if (persistentFocusId && persistentFocusRow && String(next.anchors?.[date] || "") !== persistentFocusId) {
      next = { ...next, anchors: { ...(next.anchors || {}), [date]: persistentFocusId } };
      changed = true;
    }

    if (!changed) return;
    setState(writeState(next));
  }, [open, date, rows, viewDone]);

  if (!open) return null;

  const chooseFocusHabit = (row) => {
    const id = habitId(row);
    if (!id) return;
    const latest = readState();
    setState(writeState({
      ...latest,
      anchors: { ...(latest.anchors || {}), [date]: id },
      meta: {
        ...(latest.meta || {}),
        focus_habit_id: id,
        focus_habit_label: habitLabel(row),
        focus_habit_selected_at: new Date().toISOString(),
      },
    }));
    setPickerOpen(false);
  };

  return (
    <section id="plushlife-focus-habit" style={{ marginBottom: 12, padding: "12px 13px", borderRadius: 16, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.82)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span aria-hidden="true" style={{ fontSize: 18 }}>🎯</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#A65DC1" }}>FOCUS HABIT</div>
          <div style={{ marginTop: 2, fontSize: 13.5, lineHeight: 1.35, fontWeight: 900, color: "#4F405C" }}>{focusLabel || "Choose one habit you really want to work on"}</div>
          {focusId && !focusRow && <div style={{ marginTop: 3, fontSize: 10.5, color: "#8C6B9E" }}>Not scheduled today — it is still your Focus Habit.</div>}
        </div>
        {focusRow && !viewDone?.[focusRow.key] && <button type="button" onClick={() => toggle?.(focusRow.key)} style={{ ...buttonStyle, border: 0, background: "#A65DC1", color: "white", flexShrink: 0 }}>✓ Done</button>}
        {focusRow && viewDone?.[focusRow.key] && <span style={{ fontSize: 11, color: "#318C79", fontWeight: 900, flexShrink: 0 }}>✓ Done</span>}
      </div>
      <button type="button" onClick={() => setPickerOpen((value) => !value)} aria-expanded={pickerOpen} style={{ ...buttonStyle, marginTop: 8, minHeight: 40, padding: "7px 10px" }}>{focusId ? "Change focus habit" : "Choose Focus Habit"}</button>
      {pickerOpen && <div style={{ display: "grid", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #EEE3F2" }}>
        <div style={{ fontSize: 10.5, lineHeight: 1.4, color: "#8C6B9E" }}>Only habits are shown here — regular tasks, meals, schedules, and check-ins stay out of this list.</div>
        {habitRows.slice(0, 14).map((row) => <button key={habitId(row)} type="button" onClick={() => chooseFocusHabit(row)} style={{ ...buttonStyle, textAlign: "left", background: habitId(row) === focusId ? "#FAF0FD" : "white" }}>{viewDone?.[row.key] ? "✓ " : ""}{habitLabel(row)}</button>)}
        {!habitRows.length && <div style={{ fontSize: 11.5, color: "#8C6B9E" }}>You do not have a habit scheduled today yet. Mark a task as “Build a habit” or “Reduce a habit,” then it can become your Focus Habit.</div>}
      </div>}
    </section>
  );
}
