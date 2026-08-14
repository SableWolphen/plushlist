const HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function readState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function writeState(state) {
  const next = { ...state, updated_at: new Date().toISOString() };
  try { localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(next)); } catch (_error) {}
  try { window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated")); } catch (_error) {}
  return next;
}

function habitId(row) { return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || ""); }
function habitLabel(row) { return String(row?.label || row?.sourceTask?.label || row?.sourceTask?.name || "this habit"); }

function copyFor(item, rowsById) {
  const label = habitLabel(rowsById.get(item.habitId));
  const anchor = habitLabel(rowsById.get(item.anchorHabitId));
  if (item.type === "move_time") return { title: `Would “${label}” fit better around ${item.suggestedTime}?`, body: `You have completed it near that time on ${item.evidence.samples} observed days.`, accept: "Review its time" };
  if (item.type === "attach_anchor") return { title: `“${label}” often follows “${anchor}.”`, body: `That sequence appeared ${item.evidence.count} times. Would you like PlushLife to remember the connection?`, accept: "Use this anchor" };
  if (item.type === "use_tiny") return { title: `The Tiny version of “${label}” seems useful.`, body: `It has helped you show up ${item.evidence.uses} times. PlushLife can lead with it on low-energy days.`, accept: "Use on low-energy days" };
  if (item.type === "adjust_reminder") return { title: `The reminder for “${label}” may not be helping yet.`, body: `Only ${item.evidence.helped} of ${item.evidence.opens} recent opens were followed by completion.`, accept: "Review reminder" };
  if (item.type === "pause_or_keep") return { title: `Is “${label}” still worth keeping as-is?`, body: `It was skipped on ${item.evidence.missed} of ${item.evidence.opportunities} recent opportunities. Nothing will change unless you choose it.`, accept: "Review habit" };
  return { title: "A routine may be taking shape.", body: `${item.habitIds.map((id) => habitLabel(rowsById.get(id))).join(" → ")} has repeated enough to be worth grouping.`, accept: "Keep these together" };
}

export function HabitSuggestions({ rows = [], openTaskManager }) {
  const [state, setState] = React.useState(() => readState());
  React.useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => {
      window.removeEventListener("plushlife:habit-coach-updated", refresh);
      window.removeEventListener("plushlife:habit-coach-hydrated", refresh);
    };
  }, []);
  const engine = state.meta?.__background_engine || {};
  const item = (engine.suggestions || [])[0];
  if (!item) return null;
  const rowsById = new Map(rows.map((row) => [habitId(row), row]));
  const copy = copyFor(item, rowsById);

  const decide = (decision) => {
    const now = new Date().toISOString();
    const current = readState();
    const currentEngine = current.meta?.__background_engine || {};
    const choices = { ...(currentEngine.userChoices || {}), [item.fingerprint]: { decision, at: now } };
    const meta = { ...(current.meta || {}) };
    if (decision === "accepted") {
      if (item.type === "attach_anchor") meta[item.habitId] = { ...(meta[item.habitId] || {}), stackAfter: item.anchorHabitId, anchorSource: "accepted_suggestion" };
      if (item.type === "use_tiny") meta[item.habitId] = { ...(meta[item.habitId] || {}), preferTinyOnLowEnergy: true };
      if (item.type === "group_routine") item.habitIds.forEach((id) => { meta[id] = { ...(meta[id] || {}), routineGroup: item.routineKey, routineGroupLabel: "My routine" }; });
    }
    meta.__background_engine = { ...currentEngine, userChoices: choices, suggestions: (currentEngine.suggestions || []).filter((suggestion) => suggestion.fingerprint !== item.fingerprint) };
    setState(writeState({ ...current, meta }));
    if (decision === "accepted" && ["move_time", "adjust_reminder", "pause_or_keep"].includes(item.type)) openTaskManager?.();
  };

  return (
    <section aria-label="Gentle habit suggestion" style={{ marginBottom: 12, padding: 12, borderRadius: 14, border: "1px solid #D7E8E3", background: "#F7FCFA" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".1em", fontWeight: 900, color: "#3E746A" }}>A GENTLE PATTERN</div>
      <div style={{ marginTop: 4, fontSize: 13.5, fontWeight: 900, color: "#4F405C" }}>{copy.title}</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#637B74" }}>{copy.body}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => decide("accepted")} style={{ padding: "7px 10px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>{copy.accept}</button>
        <button type="button" onClick={() => decide("dismissed")} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #BFDCD3", background: "white", color: "#4D8174", fontWeight: 850, cursor: "pointer" }}>Not now</button>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: "#82948F" }}>PlushLife never changes your routine until you choose.</div>
    </section>
  );
}
