const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const MAX_HISTORY_DAYS = 60;
const AREAS = ["Body", "Mind", "Home", "Sleep", "Relationships", "Work / School", "Self-care"];
const FRICTION = {
  forget: ["I forget", "Pair it with something you already do or move it closer to the moment you need it."],
  effort: ["Too much effort", "Shrink the starting version until it feels almost too easy."],
  wrong_time: ["Wrong time", "Try the same habit at a different time for seven days and compare."],
  motivation: ["I don't feel like it", "Lower the starting bar and make the first action obvious."],
  long: ["Takes too long", "Create a minimum version that still counts on busy days."],
  help: ["I need help", "Make the next step smaller or ask for support instead of carrying the whole habit alone."],
};

const PATHS = [
  { id: "sleep", emoji: "🌙", name: "Sleep Better", steps: ["Keep a steady wake-up time", "Get a little morning light", "Choose a caffeine cutoff", "Start a short wind-down", "Protect a realistic bedtime"] },
  { id: "feel", emoji: "💜", name: "Feel Better", steps: ["Take medication if prescribed", "Drink something", "Eat something", "Move or stretch a little", "Do one mood or energy check-in"] },
  { id: "reset", emoji: "🏡", name: "Get My Life Together", steps: ["Start a tiny morning reset", "Reset the dishes", "Choose one laundry touchpoint", "Tidy for ten minutes", "Prep one thing for tomorrow"] },
  { id: "focus", emoji: "🎯", name: "Focus & Study", steps: ["Pick one clear outcome", "Do a ten-minute start", "Take a real break", "Do one more focused block", "Close the loop and plan the next step"] },
  { id: "care", emoji: "🧸", name: "Gentle Self-care", steps: ["Do one hygiene step", "Eat one easy meal or snack", "Drink water", "Get a little fresh air or light", "Make bedtime softer"] },
  { id: "move", emoji: "👟", name: "Move More", steps: ["Put on comfortable shoes", "Move for five minutes", "Build toward ten minutes", "Try one enjoyable movement", "Choose a repeatable weekly rhythm"] },
];

function safeRead() {
  try {
    const raw = localStorage.getItem(HABIT_STATE_KEY);
    if (!raw) return { version: 1, anchors: {}, goals: {}, meta: {}, experiments: [], paths: {}, reviews: {}, history: {}, recovery: {} };
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      anchors: parsed.anchors || {}, goals: parsed.goals || {}, meta: parsed.meta || {}, experiments: parsed.experiments || [],
      paths: parsed.paths || {}, reviews: parsed.reviews || {}, history: parsed.history || {}, recovery: parsed.recovery || {},
    };
  } catch (_error) {
    return { version: 1, anchors: {}, goals: {}, meta: {}, experiments: [], paths: {}, reviews: {}, history: {}, recovery: {} };
  }
}

function safeWrite(state) {
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

function isEssential(row) {
  return !!(row?.isEssential || row?.essential || row?.sourceTask?.essential || row?.sourceTask?.is_essential);
}

function dayKey(value) {
  return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10);
}

function weekStartKey(dateString = dayKey()) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const one = new Date(`${a}T12:00:00`);
  const two = new Date(`${b}T12:00:00`);
  return Math.round((two - one) / 86400000);
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
      essential: isEssential(row),
    };
  }
  return result;
}

function historyForHabit(state, id) {
  return Object.entries(state.history || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, day]) => day?.[id] ? [{ date, ...day[id] }] : []);
}

function habitStats(state, id) {
  const history = historyForHabit(state, id).slice(-42);
  const attempts = history.length;
  const done = history.filter((item) => item.done).length;
  const rate = attempts ? done / attempts : null;
  const weekday = {};
  for (const item of history) {
    const label = new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
    weekday[label] ||= { total: 0, done: 0 };
    weekday[label].total += 1;
    if (item.done) weekday[label].done += 1;
  }
  const bestDay = Object.entries(weekday)
    .filter(([, value]) => value.total >= 2)
    .map(([label, value]) => ({ label, rate: value.done / value.total, total: value.total }))
    .sort((a, b) => b.rate - a.rate || b.total - a.total)[0] || null;
  const last7 = history.slice(-7);
  const previous7 = history.slice(-14, -7);
  const lastRate = last7.length ? last7.filter((item) => item.done).length / last7.length : null;
  const previousRate = previous7.length ? previous7.filter((item) => item.done).length / previous7.length : null;
  return { history, attempts, done, rate, bestDay, lastRate, previousRate };
}

function insightFor(state, row) {
  if (!row) return "Keep showing up a few times and PlushLife will learn what helps this habit stick.";
  const id = habitId(row);
  const stats = habitStats(state, id);
  const meta = state.meta?.[id] || {};
  if (stats.attempts < 4) return "PlushLife is still learning this habit. A few more real days will make the pattern more useful.";
  if (stats.bestDay && stats.bestDay.rate >= 0.75) return `You tend to succeed with this on ${stats.bestDay.label}s. That may be a good day to protect this habit.`;
  if (stats.rate !== null && stats.rate < 0.35) return meta.minimum ? `This habit has been hard to start. Your minimum version — “${meta.minimum}” — may be the better default on low-energy days.` : "This habit may be too hard to start right now. Try giving it a tiny minimum version instead of pushing harder.";
  if (stats.lastRate !== null && stats.previousRate !== null && stats.lastRate > stats.previousRate + 0.15) return "This habit is getting easier lately. Keep the setup stable for another week before changing it.";
  if (stats.rate !== null && stats.rate >= 0.8) return "This is one of your steadier habits. Protect what is already working instead of making it harder.";
  return "This habit is in the middle: consistent enough to build on, but still worth making the cue and first step obvious.";
}

function experimentSummary(state, experiment) {
  const stats = historyForHabit(state, experiment.habitId).filter((item) => item.date >= experiment.started && item.date <= experiment.ends);
  const beforeStart = new Date(`${experiment.started}T12:00:00`);
  beforeStart.setDate(beforeStart.getDate() - 7);
  const beforeKey = beforeStart.toISOString().slice(0, 10);
  const before = historyForHabit(state, experiment.habitId).filter((item) => item.date >= beforeKey && item.date < experiment.started);
  const duringRate = stats.length ? stats.filter((item) => item.done).length / stats.length : null;
  const beforeRate = before.length ? before.filter((item) => item.done).length / before.length : null;
  if (duringRate === null) return "Waiting for a few real days of data.";
  if (beforeRate === null) return `${Math.round(duringRate * 100)}% so far. Keep testing until the seven days are up.`;
  const delta = Math.round((duringRate - beforeRate) * 100);
  return delta >= 10 ? `Working better so far: +${delta} points versus the previous week.` : delta <= -10 ? `Not helping yet: ${Math.abs(delta)} points lower than the previous week.` : "About the same so far. The simpler option may still be worth keeping if it feels easier.";
}

function addDays(dateString, count) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + count);
  return date.toISOString().slice(0, 10);
}

function cardButton(active = false) {
  return {
    padding: "8px 10px", borderRadius: 10, border: active ? "2px solid #A65DC1" : "1px solid #DCC9E8",
    background: active ? "#FAF0FD" : "white", color: "#6B5A7D", fontWeight: 850, fontSize: 11.5, cursor: "pointer",
  };
}

export function HabitCoach({ open, rows = [], viewDone = {}, period, nextStepTask, toggle, openTaskManager, selectDayType, setEssentialsPickerOpen, returnGapDays = 0, goToDashboard, setCareSection, children }) {
  const date = dayKey(period?.date);
  const [state, setState] = React.useState(() => safeRead());
  const [expanded, setExpanded] = React.useState(false);
  const [anchorPicker, setAnchorPicker] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState("");
  const [goalDraft, setGoalDraft] = React.useState(() => safeRead().goals?.[date] || "");
  const currentRows = (rows || []).filter((row) => !row?.isBonus);
  const rowById = new Map(currentRows.map((row) => [habitId(row), row]));
  const anchorId = state.anchors?.[date] || "";
  const anchorRow = rowById.get(anchorId) || null;
  const selectedRow = rowById.get(selectedId) || anchorRow || currentRows[0] || null;
  const selectedMeta = selectedRow ? (state.meta?.[habitId(selectedRow)] || {}) : {};

  React.useEffect(() => {
    const onHydrate = () => setState(safeRead());
    window.addEventListener("plushlife:habit-coach-hydrated", onHydrate);
    return () => window.removeEventListener("plushlife:habit-coach-hydrated", onHydrate);
  }, []);

  React.useEffect(() => {
    if (!open || !date) return;
    setState((current) => {
      const nextHistory = pruneHistory({ ...(current.history || {}), [date]: observationFor(currentRows, viewDone) });
      const next = { ...current, history: nextHistory };
      safeWrite(next);
      return next;
    });
  }, [open, date, rows, viewDone]);

  React.useEffect(() => { setGoalDraft(state.goals?.[date] || ""); }, [date]);

  if (!open) return null;

  const save = (updater) => setState((current) => safeWrite(typeof updater === "function" ? updater(current) : updater));
  const setAnchor = (id) => {
    save((current) => ({ ...current, anchors: { ...(current.anchors || {}), [date]: id } }));
    setAnchorPicker(false);
    setSelectedId(id);
  };
  const saveGoal = () => save((current) => ({ ...current, goals: { ...(current.goals || {}), [date]: goalDraft.trim() } }));
  const updateMeta = (patch) => {
    if (!selectedRow) return;
    const id = habitId(selectedRow);
    save((current) => ({ ...current, meta: { ...(current.meta || {}), [id]: { ...(current.meta?.[id] || {}), ...patch, label: habitLabel(selectedRow) } } }));
  };

  const incomplete = currentRows.filter((row) => !viewDone?.[row.key]);
  const smartRow = (anchorRow && !viewDone?.[anchorRow.key]) ? anchorRow : (nextStepTask?.sourceTask ? currentRows.find((row) => row.key === nextStepTask.key || habitId(row) === String(nextStepTask.sourceTask.id || "")) : null) || incomplete.find((row) => {
    const meta = state.meta?.[habitId(row)] || {};
    return meta.stackAfter && viewDone?.[rowById.get(meta.stackAfter)?.key];
  }) || incomplete[0] || null;
  const smartMeta = smartRow ? state.meta?.[habitId(smartRow)] || {} : {};
  const smartReason = smartRow ? (habitId(smartRow) === anchorId ? "It is your Anchor Habit today." : smartMeta.stackAfter && viewDone?.[rowById.get(smartMeta.stackAfter)?.key] ? "The habit you stacked it after is already done." : isEssential(smartRow) ? "It is one of your essentials." : "It is a useful next win from today’s remaining habits.") : "Everything important on today’s list is already handled.";

  const currentExperiment = selectedRow ? state.experiments?.find((item) => item.habitId === habitId(selectedRow) && item.status !== "ended" && item.ends >= date) : null;
  const activePath = state.paths?.active ? PATHS.find((path) => path.id === state.paths.active.id) : null;
  const activeStep = activePath ? Math.min(Number(state.paths.active.step || 0), activePath.steps.length - 1) : 0;

  return (
    <section style={{ marginBottom: 14, borderRadius: 17, background: "linear-gradient(145deg,#FFFDFC,#F8F4FF)", border: "1px solid #E6D4F2", overflow: "hidden", boxShadow: "0 7px 22px rgba(118,85,138,.06)" }}>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>🎯 TODAY'S ANCHOR</div>
            <div style={{ marginTop: 4, fontSize: 15.5, lineHeight: 1.35, fontWeight: 900, color: "#4F405C" }}>{anchorRow ? habitLabel(anchorRow) : "Choose the one habit that matters most"}</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: "#806B8D", lineHeight: 1.45 }}>You never have to win the whole day for today to count.</div>
          </div>
          {anchorRow && !viewDone?.[anchorRow.key] && <button type="button" onClick={() => toggle?.(anchorRow.key)} style={{ ...cardButton(true), border: 0, background: "#A65DC1", color: "white", flexShrink: 0 }}>✓ Done</button>}
          {anchorRow && viewDone?.[anchorRow.key] && <span style={{ padding: "6px 8px", borderRadius: 999, background: "#EEF9F6", color: "#318C79", fontSize: 10.5, fontWeight: 900 }}>✓ Anchor done</span>}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setAnchorPicker((value) => !value)} style={cardButton(!!anchorRow)}>{anchorRow ? "Change anchor" : "Choose anchor"}</button>
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} style={cardButton(expanded)}>⚙️ {expanded ? "Close habit tools" : "Habit tools"}</button>
        </div>
        {anchorPicker && <div style={{ display: "grid", gap: 6, marginTop: 8, padding: 9, borderRadius: 11, background: "#FBF7FC" }}>
          {currentRows.slice(0, 14).map((row) => <button key={habitId(row)} type="button" onClick={() => setAnchor(habitId(row))} style={{ ...cardButton(habitId(row) === anchorId), textAlign: "left" }}>{viewDone?.[row.key] ? "✓ " : ""}{habitLabel(row)}</button>)}
          {!currentRows.length && <div style={{ fontSize: 11.5, color: "#8C6B9E" }}>Add a habit first, then you can make it today’s anchor.</div>}
        </div>}
        {state.goals?.[date] && <div style={{ marginTop: 6, fontSize: 11.5, color: "#76558A" }}>✨ Today’s goal: <strong>{state.goals[date]}</strong></div>}
      </div>

      {expanded && <div style={{ borderTop: "1px solid #EDE3F2", padding: "12px 14px 14px", display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 7 }}>
          <input value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} maxLength={140} placeholder="Optional goal of the day" style={{ minWidth: 0, padding: "8px 9px", borderRadius: 9, border: "1px solid #E0D1E8", background: "white", color: "#5B4B6B" }} />
          <button type="button" onClick={saveGoal} style={cardButton(false)}>Save</button>
        </div>
        {returnGapDays >= 2 && <div style={{ padding: 11, borderRadius: 12, background: "#FFF9E9", border: "1px solid #F0D99E", color: "#6B5A3D" }}>
          <div style={{ fontSize: 11.5, fontWeight: 900 }}>🧸 Recovery Mode</div>
          <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45 }}>No backlog. Pick the easiest way back into your habits.</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => save((current) => ({ ...current, recovery: { ...(current.recovery || {}), [date]: "fresh" } }))} style={cardButton(false)}>Start fresh today</button>
            <button type="button" onClick={() => setEssentialsPickerOpen?.(true)} style={cardButton(false)}>Choose essentials</button>
            <button type="button" onClick={() => selectDayType?.("soft")} style={cardButton(false)}>Make today lighter</button>
          </div>
        </div>}

        <div style={{ padding: 11, borderRadius: 12, background: "#F4FBF9", border: "1px solid #CFE8E1" }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".1em", fontWeight: 900, color: "#318C79" }}>✨ WHAT SHOULD I DO NOW?</div>
          <div style={{ marginTop: 5, fontSize: 14, fontWeight: 900, color: "#4F625D" }}>{smartRow ? habitLabel(smartRow) : "You can stop for now."}</div>
          <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: "#607A73" }}>{smartReason}</div>
          {smartRow && <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => toggle?.(smartRow.key)} style={{ ...cardButton(false), border: 0, background: "#318C79", color: "white" }}>✓ Done</button>
            {smartMeta.minimum && <button type="button" onClick={() => toggle?.(smartRow.key)} style={cardButton(false)}>🌱 Do tiny version: {smartMeta.minimum}</button>}
            <button type="button" onClick={() => { setSelectedId(habitId(smartRow)); }} style={cardButton(false)}>Why is this hard?</button>
          </div>}
        </div>

        <details style={{ borderRadius: 12, border: "1px solid #E6D4F2", background: "white", overflow: "hidden" }} open={!!selectedId}>
          <summary style={{ padding: "10px 11px", fontSize: 11.5, fontWeight: 900, color: "#76558A", cursor: "pointer" }}>🛠 Tune one habit</summary>
          <div style={{ padding: "0 11px 11px", display: "grid", gap: 8 }}>
            <select value={selectedRow ? habitId(selectedRow) : ""} onChange={(event) => setSelectedId(event.target.value)} style={{ padding: 9, borderRadius: 9, border: "1px solid #DCC9E8", background: "white" }}>
              {currentRows.map((row) => <option key={habitId(row)} value={habitId(row)}>{habitLabel(row)}</option>)}
            </select>
            {selectedRow && <>
              <div style={{ padding: 9, borderRadius: 10, background: "#FAF6FC", color: "#6B5A7D", fontSize: 11.5, lineHeight: 1.5 }}>🧠 {insightFor(state, selectedRow)}</div>
              <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "#76558A" }}>LIFE AREA
                <select value={selectedMeta.area || ""} onChange={(event) => updateMeta({ area: event.target.value })} style={{ padding: 8, borderRadius: 9, border: "1px solid #DCC9E8" }}><option value="">Choose an area</option>{AREAS.map((area) => <option key={area} value={area}>{area}</option>)}</select>
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "#76558A" }}>MINIMUM VERSION
                <input value={selectedMeta.minimum || ""} onChange={(event) => updateMeta({ minimum: event.target.value.slice(0, 100) })} placeholder="Example: walk outside for 2 minutes" style={{ padding: 8, borderRadius: 9, border: "1px solid #DCC9E8" }} />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "#76558A" }}>WHY DOES THIS GET HARD?
                <select value={selectedMeta.friction || ""} onChange={(event) => updateMeta({ friction: event.target.value })} style={{ padding: 8, borderRadius: 9, border: "1px solid #DCC9E8" }}><option value="">Choose a reason</option>{Object.entries(FRICTION).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}</select>
              </label>
              {selectedMeta.friction && <div style={{ padding: "8px 9px", borderRadius: 9, background: "#FFF9E9", color: "#6B5A3D", fontSize: 11.5 }}>💡 {FRICTION[selectedMeta.friction]?.[1]}</div>}
              <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "#76558A" }}>HABIT STACK
                <select value={selectedMeta.stackAfter || ""} onChange={(event) => updateMeta({ stackAfter: event.target.value })} style={{ padding: 8, borderRadius: 9, border: "1px solid #DCC9E8" }}><option value="">No stack yet</option>{currentRows.filter((row) => habitId(row) !== habitId(selectedRow)).map((row) => <option key={habitId(row)} value={habitId(row)}>After: {habitLabel(row)}</option>)}</select>
              </label>
              {selectedMeta.stackAfter && rowById.get(selectedMeta.stackAfter) && <div style={{ fontSize: 11.5, color: "#76558A" }}>🔗 After <strong>{habitLabel(rowById.get(selectedMeta.stackAfter))}</strong> → <strong>{habitLabel(selectedRow)}</strong></div>}
              {!currentExperiment ? <button type="button" onClick={() => {
                const id = habitId(selectedRow);
                const experiment = { id: `${id}-${Date.now()}`, habitId: id, label: habitLabel(selectedRow), started: date, ends: addDays(date, 6), status: "active", setup: selectedMeta.stackAfter ? "stack" : selectedMeta.minimum ? "minimum" : selectedMeta.friction === "wrong_time" ? "reschedule" : "simplify" };
                save((current) => ({ ...current, experiments: [...(current.experiments || []).filter((item) => item.habitId !== id || item.status === "ended"), experiment] }));
              }} style={cardButton(false)}>🧪 Start a 7-day habit experiment</button> : <div style={{ padding: 9, borderRadius: 10, background: "#F2FFFB", color: "#3E746A", fontSize: 11.5, lineHeight: 1.5 }}><strong>🧪 Experiment through {currentExperiment.ends}</strong><br />{experimentSummary(state, currentExperiment)}<br /><button type="button" onClick={() => save((current) => ({ ...current, experiments: (current.experiments || []).map((item) => item.id === currentExperiment.id ? { ...item, status: "ended" } : item) }))} style={{ ...cardButton(false), marginTop: 6 }}>End experiment</button></div>}
              <button type="button" onClick={() => openTaskManager?.()} style={cardButton(false)}>✏️ Reschedule, rename, pause or edit this habit</button>
            </>}
          </div>
        </details>

        <details style={{ borderRadius: 12, border: "1px solid #E6D4F2", background: "white", overflow: "hidden" }}>
          <summary style={{ padding: "10px 11px", fontSize: 11.5, fontWeight: 900, color: "#76558A", cursor: "pointer" }}>🗺 PlushPaths · guided habit journeys</summary>
          <div style={{ padding: "0 11px 11px" }}>
            {activePath ? <div style={{ padding: 10, borderRadius: 10, background: "#FAF6FC" }}>
              <div style={{ fontWeight: 900, color: "#5B4B6B" }}>{activePath.emoji} {activePath.name}</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: "#806B8D" }}>Step {activeStep + 1} of {activePath.steps.length}</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 850, color: "#5B4B6B" }}>{activePath.steps[activeStep]}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {activeStep < activePath.steps.length - 1 ? <button type="button" onClick={() => save((current) => ({ ...current, paths: { ...(current.paths || {}), active: { ...current.paths.active, step: activeStep + 1 } } }))} style={cardButton(false)}>I’m ready for the next step</button> : <button type="button" onClick={() => save((current) => ({ ...current, paths: { ...(current.paths || {}), completed: [...(current.paths?.completed || []), activePath.id], active: null } }))} style={cardButton(false)}>Finish this path ✨</button>}
                <button type="button" onClick={() => openTaskManager?.()} style={cardButton(false)}>Add or edit a matching habit</button>
                <button type="button" onClick={() => save((current) => ({ ...current, paths: { ...(current.paths || {}), active: null } }))} style={cardButton(false)}>Pause path</button>
              </div>
            </div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7 }}>
              {PATHS.map((path) => <button key={path.id} type="button" onClick={() => save((current) => ({ ...current, paths: { ...(current.paths || {}), active: { id: path.id, step: 0, started: date } } }))} style={{ ...cardButton(false), textAlign: "left", minHeight: 55 }}>{path.emoji} {path.name}</button>)}
            </div>}
          </div>
        </details>

        <details style={{ borderRadius: 12, border: "1px solid #E6D4F2", background: "white", overflow: "hidden" }}>
          <summary style={{ padding: "10px 11px", fontSize: 11.5, fontWeight: 900, color: "#76558A", cursor: "pointer" }}>🌿 Life areas</summary>
          <div style={{ padding: "0 11px 11px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {AREAS.map((area) => {
              const count = currentRows.filter((row) => state.meta?.[habitId(row)]?.area === area).length;
              return <span key={area} style={{ padding: "6px 8px", borderRadius: 999, background: count ? "#F4ECF8" : "#F8F6F9", color: count ? "#76558A" : "#A08FA9", fontSize: 10.5, fontWeight: 800 }}>{area} · {count}</span>;
            })}
          </div>
        </details>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={() => goToDashboard?.("progress")} style={cardButton(false)}>📊 Open Weekly Habit Review</button>
          <button type="button" onClick={() => { setCareSection?.("quick"); goToDashboard?.("care"); }} style={cardButton(false)}>♥ Support tools</button>
        </div>
        {children}
      </div>}
    </section>
  );
}

export function BabyHabitAnchor({ open, rows = [], viewDone = {}, period, toggle }) {
  const date = dayKey(period?.date);
  const [state, setState] = React.useState(() => safeRead());
  React.useEffect(() => {
    const refresh = () => setState(safeRead());
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    return () => { window.removeEventListener("plushlife:habit-coach-hydrated", refresh); window.removeEventListener("plushlife:habit-coach-updated", refresh); };
  }, []);
  if (!open) return null;
  const anchorId = state.anchors?.[date];
  const row = (rows || []).find((item) => habitId(item) === anchorId);
  if (!row) return null;
  const done = !!viewDone?.[row.key];
  return <section style={{ padding: "10px 12px", borderRadius: 15, background: "rgba(255,255,255,.76)", border: "1px solid #E6D4F2", display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 18 }}>🎯</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10.5, fontWeight: 900, color: "#A65DC1" }}>MY IMPORTANT THING</div><div style={{ marginTop: 2, fontSize: 12.5, fontWeight: 850, color: "#5B4B6B" }}>{habitLabel(row)}</div></div>{done ? <span style={{ fontSize: 11, color: "#318C79", fontWeight: 900 }}>✓ Tucked in</span> : <button type="button" onClick={() => toggle?.(row.key)} style={{ ...cardButton(true), border: 0, background: "#A65DC1", color: "white" }}>✓ Done</button>}</section>;
}

export function WeeklyHabitReview({ open, openTaskManager, goToDashboard }) {
  const [state, setState] = React.useState(() => safeRead());
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    const refresh = () => setState(safeRead());
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    return () => { window.removeEventListener("plushlife:habit-coach-hydrated", refresh); window.removeEventListener("plushlife:habit-coach-updated", refresh); };
  }, []);
  if (!open) return null;
  const today = dayKey();
  const week = weekStartKey(today);
  const sevenDaysAgo = addDays(today, -6);
  const habits = new Map();
  for (const [date, day] of Object.entries(state.history || {})) {
    if (date < sevenDaysAgo || date > today) continue;
    for (const [id, item] of Object.entries(day || {})) {
      const current = habits.get(id) || { id, label: item.label || state.meta?.[id]?.label || "Habit", total: 0, done: 0 };
      current.total += 1;
      if (item.done) current.done += 1;
      habits.set(id, current);
    }
  }
  const ranked = [...habits.values()].map((item) => ({ ...item, rate: item.total ? item.done / item.total : 0 })).sort((a, b) => b.total - a.total || b.rate - a.rate).slice(0, 8);
  const decisionFor = (item) => {
    if (item.total >= 4 && item.rate >= 0.75) return "keep";
    if (item.total >= 4 && item.rate === 0) return "drop";
    if (item.rate < 0.4) return "shrink";
    if (item.rate < 0.7) return "reschedule";
    return "keep";
  };
  const saveDecision = (id, decision) => setState((current) => safeWrite({ ...current, reviews: { ...(current.reviews || {}), [week]: { ...(current.reviews?.[week] || {}), [id]: decision } }, meta: decision === "shrink" ? { ...(current.meta || {}), [id]: { ...(current.meta?.[id] || {}), needsShrink: true } } : current.meta }));
  const reviewed = Object.keys(state.reviews?.[week] || {}).length;
  return <section style={{ marginBottom: 14, borderRadius: 17, background: "linear-gradient(145deg,#F6FBFF,#FFF9FD)", border: "1px solid #D9D9F0", overflow: "hidden" }}>
    <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 9, padding: "12px 13px", border: 0, background: "transparent", textAlign: "left", cursor: "pointer" }}>
      <span><span style={{ display: "block", fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#4A80B5" }}>🧭 REVIEW & ADJUST</span><span style={{ display: "block", marginTop: 3, fontSize: 13.5, fontWeight: 900, color: "#4F405C" }}>Keep what works. Change what doesn't.</span><span style={{ display: "block", marginTop: 2, fontSize: 11, color: "#806B8D" }}>{ranked.length ? `${ranked.length} habits with real data this week · ${reviewed} reviewed` : "Use your habits for a few days and the review will fill itself in."}</span></span><span aria-hidden="true" style={{ fontSize: 20, color: "#8C6B9E" }}>{expanded ? "▾" : "›"}</span>
    </button>
    {expanded && <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
      {ranked.map((item) => {
        const suggested = decisionFor(item);
        const chosen = state.reviews?.[week]?.[item.id] || "";
        const stats = habitStats(state, item.id);
        return <div key={item.id} style={{ padding: 10, borderRadius: 11, background: "white", border: "1px solid #E6DFF0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ color: "#5B4B6B", fontSize: 12.5 }}>{item.label}</strong><span style={{ fontSize: 11, color: "#8C6B9E", fontWeight: 900 }}>{Math.round(item.rate * 100)}%</span></div>
          <div style={{ marginTop: 4, fontSize: 11, color: "#806B8D", lineHeight: 1.45 }}>{suggested === "keep" ? "This is working. Protect the current cue and difficulty." : suggested === "shrink" ? "This looks hard to start. Make the minimum version smaller." : suggested === "reschedule" ? (stats.bestDay ? `Try moving or emphasizing it around ${stats.bestDay.label}, where it has worked better.` : "The habit may need a better time or cue.") : "This has not been helping this week. Pausing or dropping it may make the plan healthier."}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>{["keep", "shrink", "reschedule", "drop"].map((decision) => <button key={decision} type="button" onClick={() => saveDecision(item.id, decision)} style={{ ...cardButton(chosen === decision), padding: "6px 8px", fontSize: 10.5 }}>{decision === suggested ? "★ " : ""}{decision[0].toUpperCase() + decision.slice(1)}</button>)}</div>
          {(chosen === "shrink" || chosen === "reschedule" || chosen === "drop") && <button type="button" onClick={() => openTaskManager?.()} style={{ ...cardButton(false), marginTop: 7, padding: "6px 8px", fontSize: 10.5 }}>Apply this in task setup</button>}
        </div>;
      })}
      {!ranked.length && <div style={{ padding: 10, color: "#806B8D", fontSize: 11.5 }}>No pressure to manufacture data. PlushLife will review the habits you actually use.</div>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button type="button" onClick={() => goToDashboard?.("today")} style={cardButton(false)}>Go to today</button><button type="button" onClick={() => openTaskManager?.()} style={cardButton(false)}>Edit my habits</button></div>
    </div>}
  </section>;
}
