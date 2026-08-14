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
  { id: "sleep", emoji: "ðŸŒ™", name: "Sleep Better", steps: ["Keep a steady wake-up time", "Get a little morning light", "Choose a caffeine cutoff", "Start a short wind-down", "Protect a realistic bedtime"] },
  { id: "feel", emoji: "ðŸ’œ", name: "Feel Better", steps: ["Take medication if prescribed", "Drink something", "Eat something", "Move or stretch a little", "Do one mood or energy check-in"] },
  { id: "reset", emoji: "ðŸ¡", name: "Get My Life Together", steps: ["Start a tiny morning reset", "Reset the dishes", "Choose one laundry touchpoint", "Tidy for ten minutes", "Prep one thing for tomorrow"] },
  { id: "focus", emoji: "ðŸŽ¯", name: "Focus & Study", steps: ["Pick one clear outcome", "Do a ten-minute start", "Take a real break", "Do one more focused block", "Close the loop and plan the next step"] },
  { id: "care", emoji: "ðŸ§¸", name: "Gentle Self-care", steps: ["Do one hygiene step", "Eat one easy meal or snack", "Drink water", "Get a little fresh air or light", "Make bedtime softer"] },
  { id: "move", emoji: "ðŸ‘Ÿ", name: "Move More", steps: ["Put on comfortable shoes", "Move for five minutes", "Build toward ten minutes", "Try one enjoyable movement", "Choose a repeatable weekly rhythm"] },
];

function safeRead() {
  try {
    const raw = localStorage.getItem(HABIT_STATE_KEY);
    if (!raw) return { version: 1, anchors: {}, goals: {}, meta: {}, experiments: [], paths: {}, reviews: {}, history: {}, measurements: {}, recovery: {} };
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      anchors: parsed.anchors || {}, goals: parsed.goals || {}, meta: parsed.meta || {}, experiments: parsed.experiments || [],
      paths: parsed.paths || {}, reviews: parsed.reviews || {}, history: parsed.history || {}, measurements: parsed.measurements || {}, recovery: parsed.recovery || {},
    };
  } catch (_error) {
    return { version: 1, anchors: {}, goals: {}, meta: {}, experiments: [], paths: {}, reviews: {}, history: {}, measurements: {}, recovery: {} };
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
  if (stats.rate !== null && stats.rate < 0.35) return meta.minimum ? `This habit has been hard to start. Your minimum version â€” â€œ${meta.minimum}â€ â€” may be the better default on low-energy days.` : "This habit may be too hard to start right now. Try giving it a tiny minimum version instead of pushing harder.";
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
  const smartReason = smartRow ? (habitId(smartRow) === anchorId ? "It is your Anchor Habit today." : smartMeta.stackAfter && viewDone?.[rowById.get(smartMeta.stackAfter)?.key] ? "The habit you stacked it after is already done." : isEssential(smartRow) ? "It is one of your essentials." : "It is a useful next win from todayâ€™s remaining habits.") : "Everything important on todayâ€™s list is already handled.";

  const currentExperiment = selectedRow ? state.experiments?.find((item) => item.habitId === habitId(selectedRow) && item.status !== "ended" && item.ends >= date) : null;

  return (
    <section style={{ marginBottom: 14, borderRadius: 17, background: "linear-gradient(145deg,#FFFDFC,#F8F4FF)", border: "1px solid #E6D4F2", overflow: "hidden", boxShadow: "0 7px 22px rgba(118,85,138,.06)" }}>
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>ðŸŽ¯ TODAY'S ANCHOR</div>
            <div style={{ marginTop: 4, fontSize: 15.5, lineHeight: 1.35, fontWeight: 900, color: "#4F405C" }}>{anchorRow ? habitLabel(anchorRow) : "Choose the one habit that matters most"}</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: "#806B8D", lineHeight: 1.45 }}>You never have to win the whole day for today to count.</div>
          </div>
          {anchorRow && !viewDone?.[anchorRow.key] && <button type="button" onClick={() => toggle?.(anchorRow.key)} style={{ ...cardButton(true), border: 0, background: "#A65DC1", color: "white", flexShrink: 0 }}>âœ“ Done</button>}
          {anchorRow && viewDone?.[anchorRow.key] && <span style={{ padding: "6px 8px", borderRadius: 999, background: "#EEF9F6", color: "#318C79", fontSize: 10.5, fontWeight: 900 }}>âœ“ Anchor done</span>}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setAnchorPicker((value) => !value)} style={cardButton(!!anchorRow)}>{anchorRow ? "Change anchor" : "Choose anchor"}</button>
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} style={cardButton(expanded)}>âš™ï¸ {expanded ? "Close habit tools" : "Habit tools"}</button>
        </div>
        {anchorPicker && <div style={{ display: "grid", gap: 6, marginTop: 8, padding: 9, borderRadius: 11, background: "#FBF7FC" }}>
          {currentRows.slice(0, 14).map((row) => <button key={habitId(row)} type="button" onClick={() => setAnchor(habitId(row))} style={{ ...cardButton(habitId(row) === anchor×¯6¶‰žËkºwµçUP!Iü4(€€€€€€€€€€€€€€€€ñÍ•±•ÐÙ…±Õ”õíÍ•±•Ñ•‘5•Ñ„¹™É¥Ñ¥½¸ñð€ˆ‰ô½¹¡…¹”õì¡•Ù•¹Ð¤€ôøÕÁ‘…Ñ•5•Ñ„¡ì™É¥Ñ¥½¸è•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”ô¥ôÍÑå±”õíìÁ…‘‘¥¹œè€à°‰½É‘•ÉI…‘¥ÕÌè€ä°‰½É‘•Èè€ˆÅÁàÍ½±¥€åàˆõôøñ½ÁÑ¥½¸Ù…±Õ”ôˆˆù¡½½Í”„É•…Í½¸ð½½ÁÑ¥½¸ùí=‰©•Ð¹•¹ÑÉ¥•Ì¡I%Q%=8¤¹µ…À ¡m¥°m±…‰•±ut¤€ôø€ñ½ÁÑ¥½¸­•äõí¥‘ôÙ…±Õ”õí¥‘ôùí±…‰•±ôð½½ÁÑ¥½¸ø¥ôð½Í•±•Ðø4(€€€€€€€€€€€€€€ð½±…‰•°ø4(€€€€€€€€€€€€€íÍ•±•Ñ•‘5•Ñ„¹™É¥Ñ¥½¸€˜˜€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ˆáÁà€åÁàˆ°‰½É‘•ÉI…‘¥ÕÌè€ä°‰…­É½Õ¹è€ˆåäˆ°½±½Èè€ˆŒÙÕÍˆ°™½¹ÑM¥é”è€ÄÄ¸ÔõôûÂ~J„íI%Q%=9mÍ•±•Ñ•‘5•Ñ„¹™É¥Ñ¥½¹tü¹lÅuôð½‘¥Øùô4(€€€€€€€€€€€€€€ñ±…‰•°ÍÑå±”õíì‘¥ÍÁ±…äè€‰É¥ˆ°…Àè€Ð°™½¹ÑM¥é”è€ÄÀ¸Ô°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÜØÔÔáˆõôù!	%PMQ,4(€€€€€€€€€€€€€€€€ñÍ•±•ÐÙ…±Õ”õíÍ•±•Ñ•‘5•Ñ„¹ÍÑ…­™Ñ•Èñð€ˆ‰ô½¹¡…¹”õì¡•Ù•¹Ð¤€ôøÕÁ‘…Ñ•5•Ñ„¡ìÍÑ…­™Ñ•Èè•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”ô¥ôÍÑå±”õíìÁ…‘‘¥¹œè€à°‰½É‘•ÉI…‘¥ÕÌè€ä°‰½É‘•Èè€ˆÅÁàÍ½±¥€åàˆõôøñ½ÁÑ¥½¸Ù…±Õ”ôˆˆù9¼ÍÑ…¬å•Ðð½½ÁÑ¥½¸ùíÕÉÉ•¹ÑI½ÝÌ¹™¥±Ñ•È ¡É½Ü¤€ôø¡…‰¥Ñ%¡É½Ü¤€„ôô¡…‰¥Ñ%¡Í•±•Ñ•‘I½Ü¤¤¹µ…À ¡É½Ü¤€ôø€ñ½ÁÑ¥½¸­•äõí¡…‰¥Ñ%¡É½Ü¥ôÙ…±Õ”õí¡…‰¥Ñ%¡É½Ü¥ôù™Ñ•Èèí¡…‰¥Ñ1…‰•°¡É½Ü¥ôð½½ÁÑ¥½¸ø¥ôð½Í•±•Ðø4(€€€€€€€€€€€€€€ð½±…‰•°ø4(€€€€€€€€€€€€€íÍ•±•Ñ•‘5•Ñ„¹ÍÑ…­™Ñ•È€˜˜É½Ý	å%¹•Ð¡Í•±•Ñ•‘5•Ñ„¹ÍÑ…­™Ñ•È¤€˜˜€ñ‘¥ØÍÑå±”õíì™½¹ÑM¥é”è€ÄÄ¸Ô°½±½Èè€ˆŒÜØÔÔáˆõôûÂ~R\™Ñ•È€ñÍÑÉ½¹œùí¡…‰¥Ñ1…‰•°¡É½Ý	å%¹•Ð¡Í•±•Ñ•‘5•Ñ„¹ÍÑ…­™Ñ•È¤¥ôð½ÍÑÉ½¹œøƒŠH€ñÍÑÉ½¹œùí¡…‰¥Ñ1…‰•°¡Í•±•Ñ•‘I½Ü¥ôð½ÍÑÉ½¹œøð½‘¥Øùô4(€€€€€€€€€€€€€ì…ÕÉÉ•¹ÑáÁ•É¥µ•¹Ð€ü€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøì4(€€€€€€€€€€€€€€€½¹ÍÐ¥€ô¡…‰¥Ñ%¡Í•±•Ñ•‘I½Ü¤ì4(€€€€€€€€€€€€€€€½¹ÍÐ•áÁ•É¥µ•¹Ð€ôì¥è€‘í¥‘ô´‘í…Ñ”¹¹½Ü ¥õ€°¡…‰¥Ñ%è¥°±…‰•°è¡…‰¥Ñ1…‰•°¡Í•±•Ñ•‘I½Ü¤°ÍÑ…ÉÑ•è‘…Ñ”°•¹‘Ìè…‘‘…åÌ¡‘…Ñ”°€Ø¤°ÍÑ…ÑÕÌè€‰…Ñ¥Ù”ˆ°Í•ÑÕÀèÍ•±•Ñ•‘5•Ñ„¹ÍÑ…­™Ñ•È€ü€‰ÍÑ…¬ˆ€èÍ•±•Ñ•‘5•Ñ„¹µ¥¹¥µÕ´€ü€‰µ¥¹¥µÕ´ˆ€èÍ•±•Ñ•‘5•Ñ„¹™É¥Ñ¥½¸€ôôô€‰ÝÉ½¹}Ñ¥µ”ˆ€ü€‰É•Í¡•‘Õ±”ˆ€è€‰Í¥µÁ±¥™äˆôì4(€€€€€€€€€€€€€€€Í…Ù” ¡ÕÉÉ•¹Ð¤€ôø€¡ì€¸¸¹ÕÉÉ•¹Ð°•áÁ•É¥µ•¹ÑÌèl¸¸¸¡ÕÉÉ•¹Ð¹•áÁ•É¥µ•¹ÑÌñðmt¤¹™¥±Ñ•È ¡¥Ñ•´¤€ôø¥Ñ•´¹¡…‰¥Ñ%€„ôô¥ñð¥Ñ•´¹ÍÑ…ÑÕÌ€ôôô€‰•¹‘•ˆ¤°•áÁ•É¥µ•¹Ñtô¤¤ì4(€€€€€€€€€€€€€õôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôûÂ~ž¨MÑ…ÉÐ„€Üµ‘…ä¡…‰¥Ð•áÁ•É¥µ•¹Ðð½‰ÕÑÑ½¸ø€è€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ä°‰½É‘•ÉI…‘¥ÕÌè€ÄÀ°‰…­É½Õ¹è€ˆÉˆ°½±½Èè€ˆŒÍÜÐÙˆ°™½¹ÑM¥é”è€ÄÄ¸Ô°±¥¹•!•¥¡Ðè€Ä¸ÔõôøñÍÑÉ½¹œûÂ~ž¨áÁ•É¥µ•¹ÐÑ¡É½Õ íÕÉÉ•¹ÑáÁ•É¥µ•¹Ð¹•¹‘Íôð½ÍÑÉ½¹œøñ‰È€¼ùí•áÁ•É¥µ•¹ÑMÕµµ…Éä¡ÍÑ…Ñ”°ÕÉÉ•¹ÑáÁ•É¥µ•¹Ð¥ôñ‰È€¼øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ…Ù” ¡ÕÉÉ•¹Ð¤€ôø€¡ì€¸¸¹ÕÉÉ•¹Ð°•áÁ•É¥µ•¹ÑÌè€¡ÕÉÉ•¹Ð¹•áÁ•É¥µ•¹ÑÌñðmt¤¹µ…À ¡¥Ñ•´¤€ôø¥Ñ•´¹¥€ôôôÕÉÉ•¹ÑáÁ•É¥µ•¹Ð¹¥€üì€¸¸¹¥Ñ•´°ÍÑ…ÑÕÌè€‰•¹‘•ˆô€è¥Ñ•´¤ô¤¥ôÍÑå±”õíì€¸¸¹…É‘	ÕÑÑ½¸¡™…±Í”¤°µ…É¥¹Q½Àè€Øõôù¹•áÁ•É¥µ•¹Ðð½‰ÕÑÑ½¸øð½‘¥Øùô4(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Á•¹Q…Í­5…¹…•Èü¸ ¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôûŠr?¾â<I•Í¡•‘Õ±”°É•¹…µ”°Á…ÕÍ”½È•‘¥ÐÑ¡¥Ì¡…‰¥Ðð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€ð¼ùô4(€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€ð½‘•Ñ…¥±Ìø4(4(€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ø°™±•á]É…Àè€‰ÝÉ…Àˆõôø4(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Q½…Í¡‰½…Éü¸ ‰ÁÉ½É•ÍÌˆ¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôûÂ~N(=Á•¸]••­±ä!…‰¥ÐI•Ù¥•Üð½‰ÕÑÑ½¸ø4(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøìÍ•Ñ…É•M•Ñ¥½¸ü¸ ‰ÅÕ¥¬ˆ¤ì½Q½…Í¡‰½…Éü¸ ‰…É”ˆ¤ìõôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôûŠf”MÕÁÁ½ÉÐÑ½½±Ìð½‰ÕÑÑ½¸ø4(€€€€€€€€ð½‘¥Øø4(€€€€€€€í¡¥±‘É•¹ô4(€€€€€€ð½‘¥Øùô4(€€€€ð½Í•Ñ¥½¸ø4(€€¤ì4)ô4(4)•áÁ½ÉÐ™Õ¹Ñ¥½¸!…‰¥ÑÉ½ÝÑ¡Q½½±Ì¡ìÉ½ÝÌ€ômt°Á•É¥½°½Á•¹Q…Í­5…¹…•Èô¤ì4(€½¹ÍÐmÍÑ…Ñ”°Í•ÑMÑ…Ñ•t€ôI•…Ð¹ÕÍ•MÑ…Ñ”  ¤€ôøÍ…™•I•… ¤¤ì4(€I•…Ð¹ÕÍ•™™•Ð  ¤€ôøì4(€€€½¹ÍÐÉ•™É•Í €ô€ ¤€ôøÍ•ÑMÑ…Ñ”¡Í…™•I•… ¤¤ì4(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µÕÁ‘…Ñ•ˆ°É•™É•Í ¤ì4(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µ¡å‘É…Ñ•ˆ°É•™É•Í ¤ì4(€€€É•ÑÕÉ¸€ ¤€ôøì4(€€€€€Ý¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µÕÁ‘…Ñ•ˆ°É•™É•Í ¤ì4(€€€€€Ý¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µ¡å‘É…Ñ•ˆ°É•™É•Í ¤ì4(€€€ôì4(€ô°mt¤ì4(€½¹ÍÐÍ…Ù”€ô€¡ÕÁ‘…Ñ•È¤€ôøÍ•ÑMÑ…Ñ” ¡ÕÉÉ•¹Ð¤€ôøÍ…™•]É¥Ñ”¡ÑåÁ•½˜ÕÁ‘…Ñ•È€ôôô€‰™Õ¹Ñ¥½¸ˆ€üÕÁ‘…Ñ•È¡ÕÉÉ•¹Ð¤€èÕÁ‘…Ñ•È¤¤ì4(€½¹ÍÐ‘…Ñ”€ô‘…å-•ä¡Á•É¥½ü¹‘…Ñ”¤ì4(€½¹ÍÐÕÉÉ•¹ÑI½ÝÌ€ô€¡É½ÝÌñðmt¤¹™¥±Ñ•È ¡É½Ü¤€ôø€…É½Üü¹…É¡¥Ù•‘}…Ð€˜˜€…É½Üü¹¥Í	½¹ÕÌ¤ì4(€½¹ÍÐ…Ñ¥Ù•A…Ñ €ôÍÑ…Ñ”¹Á…Ñ¡Ìü¹…Ñ¥Ù”€üAQ!L¹™¥¹ ¡Á…Ñ ¤€ôøÁ…Ñ ¹¥€ôôôÍÑ…Ñ”¹Á…Ñ¡Ì¹…Ñ¥Ù”¹¥¤€è¹Õ±°ì4(€½¹ÍÐ…Ñ¥Ù•MÑ•À€ô…Ñ¥Ù•A…Ñ €ü5…Ñ ¹µ¥¸¡9Õµ‰•È¡ÍÑ…Ñ”¹Á…Ñ¡Ì¹…Ñ¥Ù”¹ÍÑ•Àñð€À¤°…Ñ¥Ù•A…Ñ ¹ÍÑ•ÁÌ¹±•¹Ñ €´€Ä¤€è€Àì4(€É•ÑÕÉ¸€ñÍ•Ñ¥½¸ÍÑå±”õíìµ…É¥¹	½ÑÑ½´è€Äà°Á…‘‘¥¹œè€ÄÐ°‰½É‘•ÉI…‘¥ÕÌè€Äà°‰…­É½Õ¹è€‰±¥¹•…ÈµÉ…‘¥•¹Ð ÄÐÕ‘•œ°°áÑ¤ˆ°‰½É‘•Èè€ˆÅÁàÍ½±¥€ÙÑÈˆõôø4(€€€€ñ‘¥ØÍÑå±”õíì™½¹ÑM¥é”è€ÄÀ¸Ô°±•ÑÑ•ÉMÁ…¥¹œè€ˆ¸ÄÍ•´ˆ°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆØÕÄˆõôûÂ~ž´!	%PI=]Q ð½‘¥Øø4(€€€€ñ‘¥ØÍÑå±”õíìµ…É¥¹Q½Àè€Ð°™½¹ÑM¥é”è€ÄÌ¸Ô°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÑÐÀÕˆõôù)½ÕÉ¹•åÌ…¹±¥™”…É•…Ìð½‘¥Øø4(€€€€ñ‘¥ØÍÑå±”õíìµ…É¥¹Q½Àè€Ì°™½¹ÑM¥é”è€ÄÄ°½±½Èè€ˆŒàÀÙáˆõôù1½¹•ÈµÑ•É´¡…‰¥ÐÁ±…¹¹¥¹œ±¥Ù•Ì¡•É”¥¹ÍÑ•…½˜¥¸Ñ½‘…çŠeÌÑ½½±Ì¸ð½‘¥Øø4(€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰É¥ˆ°…Àè€ä°µ…É¥¹Q½Àè€ÄÀõôø4(€€€€€€ñ‘•Ñ…¥±ÌÍÑå±”õíì‰½É‘•ÉI…‘¥ÕÌè€ÄÈ°‰½É‘•Èè€ˆÅÁàÍ½±¥€ÙÑÈˆ°‰…­É½Õ¹è€‰Ý¡¥Ñ”ˆ°½Ù•É™±½Üè€‰¡¥‘‘•¸ˆõôø4(€€€€€€€€ñÍÕµµ…ÉäÍÑå±”õíìÁ…‘‘¥¹œè€ˆÄÁÁà€ÄÅÁàˆ°™½¹ÑM¥é”è€ÄÄ¸Ô°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÜØÔÔáˆ°ÕÉÍ½Èè€‰Á½¥¹Ñ•ÈˆõôûÂ~^èA±ÕÍ¡A…Ñ¡Ìƒ
ÜÕ¥‘•¡…‰¥Ð©½ÕÉ¹•åÌð½ÍÕµµ…Éäø4(€€€€€€€€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ˆÀ€ÄÅÁà€ÄÅÁàˆõôùí…Ñ¥Ù•A…Ñ €ü€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ÄÀ°‰½É‘•ÉI…‘¥ÕÌè€ÄÀ°‰…­É½Õ¹è€ˆÙˆõôø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíì™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÕÑÙˆõôùí…Ñ¥Ù•A…Ñ ¹•µ½©¥ôí…Ñ¥Ù•A…Ñ ¹¹…µ•ôð½‘¥Øø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíìµ…É¥¹Q½Àè€Ð°™½¹ÑM¥é”è€ÄÄ¸Ô°½±½Èè€ˆŒàÀÙáˆõôùMÑ•Àí…Ñ¥Ù•MÑ•À€¬€Åô½˜í…Ñ¥Ù•A…Ñ ¹ÍÑ•ÁÌ¹±•¹Ñ¡ôð½‘¥Øø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíìµ…É¥¹Q½Àè€Ø°™½¹ÑM¥é”è€ÄÌ°™½¹Ñ]•¥¡Ðè€àÔÀ°½±½Èè€ˆŒÕÑÙˆõôùí…Ñ¥Ù•A…Ñ ¹ÍÑ•ÁÍm…Ñ¥Ù•MÑ•Áuôð½‘¥Øø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ø°µ…É¥¹Q½Àè€à°™±•á]É…Àè€‰ÝÉ…Àˆõôø4(€€€€€€€€€€€í…Ñ¥Ù•MÑ•À€ð…Ñ¥Ù•A…Ñ ¹ÍÑ•ÁÌ¹±•¹Ñ €´€Ä€ü€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ…Ù” ¡ÕÉÉ•¹Ð¤€ôø€¡ì€¸¸¹ÕÉÉ•¹Ð°Á…Ñ¡Ìèì€¸¸¸¡ÕÉÉ•¹Ð¹Á…Ñ¡Ìñðíô¤°…Ñ¥Ù”èì€¸¸¹ÕÉÉ•¹Ð¹Á…Ñ¡Ì¹…Ñ¥Ù”°ÍÑ•Àè…Ñ¥Ù•MÑ•À€¬€Äôôô¤¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôù'Še´É•…‘ä™½ÈÑ¡”¹•áÐÍÑ•Àð½‰ÕÑÑ½¸ø€è€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ…Ù” ¡ÕÉÉ•¹Ð¤€ôø€¡ì€¸¸¹ÕÉÉ•¹Ð°Á…Ñ¡Ìèì€¸¸¸¡ÕÉÉ•¹Ð¹Á…Ñ¡Ìñðíô¤°½µÁ±•Ñ•èl¸¸¸¡ÕÉÉ•¹Ð¹Á…Ñ¡Ìü¹½µÁ±•Ñ•ñðmt¤°…Ñ¥Ù•A…Ñ ¹¥‘t°…Ñ¥Ù”è¹Õ±°ôô¤¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôù¥¹¥Í Ñ¡¥ÌÁ…Ñ ƒŠr ð½‰ÕÑÑ½¸ùô4(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Á•¹Q…Í­5…¹…•Èü¸ ¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôù‘½È•‘¥Ð„µ…Ñ¡¥¹œ¡…‰¥Ðð½‰ÕÑÑ½¸ø4(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ…Ù” ¡ÕÉÉ•¹Ð¤€ôø€¡ì€¸¸¹ÕÉÉ•¹Ð°Á…Ñ¡Ìèì€¸¸¸¡ÕÉÉ•¹Ð¹Á…Ñ¡Ìñðíô¤°…Ñ¥Ù”è¹Õ±°ôô¤¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôùA…ÕÍ”Á…Ñ ð½‰ÕÑÑ½¸ø4(€€€€€€€€€€ð½‘¥Øø4(€€€€€€€€ð½‘¥Øø€è€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰É¥ˆ°É¥‘Q•µÁ±…Ñ•½±Õµ¹Ìè€‰É•Á•…Ð È±µ¥¹µ…à À°Å™È¤¤ˆ°…Àè€ÜõôùíAQ!L¹µ…À ¡Á…Ñ ¤€ôø€ñ‰ÕÑÑ½¸­•äõíÁ…Ñ ¹¥‘ôÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ…Ù” ¡ÕÉÉ•¹Ð¤€ôø€¡ì€¸¸¹ÕÉÉ•¹Ð°Á…Ñ¡Ìèì€¸¸¸¡ÕÉÉ•¹Ð¹Á…Ñ¡Ìñðíô¤°…Ñ¥Ù”èì¥èÁ…Ñ ¹¥°ÍÑ•Àè€À°ÍÑ…ÉÑ•è‘…Ñ”ôôô¤¥ôÍÑå±”õíì€¸¸¹…É‘	ÕÑÑ½¸¡™…±Í”¤°Ñ•áÑ±¥¸è€‰±•™Ðˆ°µ¥¹!•¥¡Ðè€ÔÔõôùíÁ…Ñ ¹•µ½©¥ôíÁ…Ñ ¹¹…µ•ôð½‰ÕÑÑ½¸ø¥ôð½‘¥Øùôð½‘¥Øø4(€€€€€€ð½‘•Ñ…¥±Ìø4(€€€€€€ñ‘•Ñ…¥±ÌÍÑå±”õíì‰½É‘•ÉI…‘¥ÕÌè€ÄÈ°‰½É‘•Èè€ˆÅÁàÍ½±¥€ÙÑÈˆ°‰…­É½Õ¹è€‰Ý¡¥Ñ”ˆ°½Ù•É™±½Üè€‰¡¥‘‘•¸ˆõôø4(€€€€€€€€ñÍÕµµ…ÉäÍÑå±”õíìÁ…‘‘¥¹œè€ˆÄÁÁà€ÄÅÁàˆ°™½¹ÑM¥é”è€ÄÄ¸Ô°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÜØÔÔáˆ°ÕÉÍ½Èè€‰Á½¥¹Ñ•ÈˆõôûÂ~2ü1¥™”…É•…Ìð½ÍÕµµ…Éäø4(€€€€€€€€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ˆÀ€ÄÅÁà€ÄÅÁàˆ°‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ø°™±•á]É…Àè€‰ÝÉ…ÀˆõôùíIL¹µ…À ¡…É•„¤€ôøì4(€€€€€€€€€½¹ÍÐ½Õ¹Ð€ôÕÉÉ•¹ÑI½ÝÌ¹™¥±Ñ•È ¡É½Ü¤€ôøÍÑ…Ñ”¹µ•Ñ„ü¹m¡…‰¥Ñ%¡É½Ü¥tü¹…É•„€ôôô…É•„¤¹±•¹Ñ ì4(€€€€€€€€€É•ÑÕÉ¸€ñÍÁ…¸­•äõí…É•…ôÍÑå±”õíìÁ…‘‘¥¹œè€ˆÙÁà€áÁàˆ°‰½É‘•ÉI…‘¥ÕÌè€äää°‰…­É½Õ¹è½Õ¹Ð€ü€ˆÑàˆ€è€ˆáÙäˆ°½±½Èè½Õ¹Ð€ü€ˆŒÜØÔÔáˆ€è€ˆÀáäˆ°™½¹ÑM¥é”è€ÄÀ¸Ô°™½¹Ñ]•¥¡Ðè€àÀÀõôùí…É•…ôƒ
Üí½Õ¹Ñôð½ÍÁ…¸øì4(€€€€€€€ô¥ôð½‘¥Øø4(€€€€€€ð½‘•Ñ…¥±Ìø4(€€€€ð½‘¥Øø4(€€ð½Í•Ñ¥½¸øì4)ô4(4)•áÁ½ÉÐ™Õ¹Ñ¥½¸	…‰å!…‰¥Ñ¹¡½È¡ì½Á•¸°É½ÝÌ€ômt°Ù¥•Ý½¹”€ôíô°Á•É¥½°Ñ½±”ô¤ì4(€½¹ÍÐ‘…Ñ”€ô‘…å-•ä¡Á•É¥½ü¹‘…Ñ”¤ì4(€½¹ÍÐmÍÑ…Ñ”°Í•ÑMÑ…Ñ•t€ôI•…Ð¹ÕÍ•MÑ…Ñ”  ¤€ôøÍ…™•I•… ¤¤ì4(€I•…Ð¹ÕÍ•™™•Ð  ¤€ôøì4(€€€½¹ÍÐÉ•™É•Í €ô€ ¤€ôøÍ•ÑMÑ…Ñ”¡Í…™•I•… ¤¤ì4(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µ¡å‘É…Ñ•ˆ°É•™É•Í ¤ì4(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µÕÁ‘…Ñ•ˆ°É•™É•Í ¤ì4(€€€É•ÑÕÉ¸€ ¤€ôøìÝ¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µ¡å‘É…Ñ•ˆ°É•™É•Í ¤ìÝ¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µÕÁ‘…Ñ•ˆ°É•™É•Í ¤ìôì4(€ô°mt¤ì4(€¥˜€ …½Á•¸¤É•ÑÕÉ¸¹Õ±°ì4(€½¹ÍÐ…¹¡½É%€ôÍÑ…Ñ”¹…¹¡½ÉÌü¹m‘…Ñ•tì4(€½¹ÍÐÉ½Ü€ô€¡É½ÝÌñðmt¤¹™¥¹ ¡¥Ñ•´¤€ôø¡…‰¥Ñ%¡¥Ñ•´¤€ôôô…¹¡½É%¤ì4(€¥˜€ …É½Ü¤É•ÑÕÉ¸¹Õ±°ì4(€½¹ÍÐ‘½¹”€ô€„…Ù¥•Ý½¹”ü¹mÉ½Ü¹­•åtì4(€É•ÑÕÉ¸€ñÍ•Ñ¥½¸ÍÑå±”õíìÁ…‘‘¥¹œè€ˆÄÁÁà€ÄÉÁàˆ°‰½É‘•ÉI…‘¥ÕÌè€ÄÔ°‰…­É½Õ¹è€‰É‰„ ÈÔÔ°ÈÔÔ°ÈÔÔ°¸ÜØ¤ˆ°‰½É‘•Èè€ˆÅÁàÍ½±¥€ÙÑÈˆ°‘¥ÍÁ±…äè€‰™±•àˆ°…±¥¹%Ñ•µÌè€‰•¹Ñ•Èˆ°…Àè€äõôøñÍÁ…¸ÍÑå±”õíì™½¹ÑM¥é”è€ÄàõôûÂ~:¼ð½ÍÁ…¸øñ‘¥ØÍÑå±”õíì™±•àè€Ä°µ¥¹]¥‘Ñ è€Àõôøñ‘¥ØÍÑå±”õíì™½¹ÑM¥é”è€ÄÀ¸Ô°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆØÕÄˆõôù5d%5A=IQ9PQ!%9ð½‘¥Øøñ‘¥ØÍÑå±”õíìµ…É¥¹Q½Àè€È°™½¹ÑM¥é”è€ÄÈ¸Ô°™½¹Ñ]•¥¡Ðè€àÔÀ°½±½Èè€ˆŒÕÑÙˆõôùí¡…‰¥Ñ1…‰•°¡É½Ü¥ôð½‘¥Øøð½‘¥Øùí‘½¹”€ü€ñÍÁ…¸ÍÑå±”õíì™½¹ÑM¥é”è€ÄÄ°½±½Èè€ˆŒÌÄáÜäˆ°™½¹Ñ]•¥¡Ðè€äÀÀõôûŠrLQÕ­•¥¸ð½ÍÁ…¸ø€è€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÑ½±”ü¸¡É½Ü¹­•ä¥ôÍÑå±”õíì€¸¸¹…É‘	ÕÑÑ½¸¡ÑÉÕ”¤°‰½É‘•Èè€À°‰…­É½Õ¹è€ˆØÕÄˆ°½±½Èè€‰Ý¡¥Ñ”ˆõôûŠrL½¹”ð½‰ÕÑÑ½¸ùôð½Í•Ñ¥½¸øì4)ô4(4)•áÁ½ÉÐ™Õ¹Ñ¥½¸]••­±å!…‰¥ÑI•Ù¥•Ü¡ì½Á•¸°½Á•¹Q…Í­5…¹…•È°½Q½…Í¡‰½…Éô¤ì4(€½¹ÍÐmÍÑ…Ñ”°Í•ÑMÑ…Ñ•t€ôI•…Ð¹ÕÍ•MÑ…Ñ”  ¤€ôøÍ…™•I•… ¤¤ì4(€½¹ÍÐm•áÁ…¹‘•°Í•ÑáÁ…¹‘•‘t€ôI•…Ð¹ÕÍ•MÑ…Ñ”¡™…±Í”¤ì4(€I•…Ð¹ÕÍ•™™•Ð  ¤€ôøì4(€€€½¹ÍÐÉ•™É•Í €ô€ ¤€ôøÍ•ÑMÑ…Ñ”¡Í…™•I•… ¤¤ì4(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µ¡å‘É…Ñ•ˆ°É•™É•Í ¤ì4(€€€Ý¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µÕÁ‘…Ñ•ˆ°É•™É•Í ¤ì4(€€€É•ÑÕÉ¸€ ¤€ôøìÝ¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µ¡å‘É…Ñ•ˆ°É•™É•Í ¤ìÝ¥¹‘½Ü¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰Á±ÕÍ¡±¥™”é¡…‰¥Ðµ½… µÕÁ‘…Ñ•ˆ°É•™É•Í ¤ìôì4(€ô°mt¤ì4(€¥˜€ …½Á•¸¤É•ÑÕÉ¸¹Õ±°ì4(€½¹ÍÐÑ½‘…ä€ô‘…å-•ä ¤ì4(€½¹ÍÐÝ••¬€ôÝ••­MÑ…ÉÑ-•ä¡Ñ½‘…ä¤ì4(€½¹ÍÐÍ•Ù•¹…åÍ¼€ô…‘‘…åÌ¡Ñ½‘…ä°€´Ø¤ì4(€½¹ÍÐ¡…‰¥ÑÌ€ô¹•Ü5…À ¤ì4(€™½È€¡½¹ÍÐm‘…Ñ”°‘…åt½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡ÍÑ…Ñ”¹¡¥ÍÑ½Éäñðíô¤¤ì4(€€€¥˜€¡‘…Ñ”€ðÍ•Ù•¹…åÍ¼ñð‘…Ñ”€øÑ½‘…ä¤½¹Ñ¥¹Õ”ì4(€€€™½È€¡½¹ÍÐm¥°¥Ñ•µt½˜=‰©•Ð¹•¹ÑÉ¥•Ì¡‘…äñðíô¤¤ì4(€€€€€½¹ÍÐÕÉÉ•¹Ð€ô¡…‰¥ÑÌ¹•Ð¡¥¤ñðì¥°±…‰•°è¥Ñ•´¹±…‰•°ñðÍÑ…Ñ”¹µ•Ñ„ü¹m¥‘tü¹±…‰•°ñð€‰!…‰¥Ðˆ°Ñ½Ñ…°è€À°‘½¹”è€Àôì4(€€€€€ÕÉÉ•¹Ð¹Ñ½Ñ…°€¬ô€Äì4(€€€€€¥˜€¡¥Ñ•´¹‘½¹”¤ÕÉÉ•¹Ð¹‘½¹”€¬ô€Äì4(€€€€€¡…‰¥ÑÌ¹Í•Ð¡¥°ÕÉÉ•¹Ð¤ì4(€€€ô4(€ô4(€½¹ÍÐÉ…¹­•€ôl¸¸¹¡…‰¥ÑÌ¹Ù…±Õ•Ì ¥t¹µ…À ¡¥Ñ•´¤€ôø€¡ì€¸¸¹¥Ñ•´°É…Ñ”è¥Ñ•´¹Ñ½Ñ…°€ü¥Ñ•´¹‘½¹”€¼¥Ñ•´¹Ñ½Ñ…°€è€Àô¤¤¹Í½ÉÐ ¡„°ˆ¤€ôøˆ¹Ñ½Ñ…°€´„¹Ñ½Ñ…°ñðˆ¹É…Ñ”€´„¹É…Ñ”¤¹Í±¥” À°€à¤ì4(€½¹ÍÐ‘•¥Í¥½¹½È€ô€¡¥Ñ•´¤€ôøì4(€€€¥˜€¡¥Ñ•´¹Ñ½Ñ…°€øô€Ð€˜˜¥Ñ•´¹É…Ñ”€øô€À¸ÜÔ¤É•ÑÕÉ¸€‰­••Àˆì4(€€€¥˜€¡¥Ñ•´¹Ñ½Ñ…°€øô€Ð€˜˜¥Ñ•´¹É…Ñ”€ôôô€À¤É•ÑÕÉ¸€‰‘É½Àˆì4(€€€¥˜€¡¥Ñ•´¹É…Ñ”€ð€À¸Ð¤É•ÑÕÉ¸€‰Í¡É¥¹¬ˆì4(€€€¥˜€¡¥Ñ•´¹É…Ñ”€ð€À¸Ü¤É•ÑÕÉ¸€‰É•Í¡•‘Õ±”ˆì4(€€€É•ÑÕÉ¸€‰­••Àˆì4(€ôì4(€½¹ÍÐÍ…Ù••¥Í¥½¸€ô€¡¥°‘•¥Í¥½¸¤€ôøÍ•ÑMÑ…Ñ” ¡ÕÉÉ•¹Ð¤€ôøÍ…™•]É¥Ñ”¡ì€¸¸¹ÕÉÉ•¹Ð°É•Ù¥•ÝÌèì€¸¸¸¡ÕÉÉ•¹Ð¹É•Ù¥•ÝÌñðíô¤°mÝ••­tèì€¸¸¸¡ÕÉÉ•¹Ð¹É•Ù¥•ÝÌü¹mÝ••­tñðíô¤°m¥‘tè‘•¥Í¥½¸ôô°µ•Ñ„è‘•¥Í¥½¸€ôôô€‰Í¡É¥¹¬ˆ€üì€¸¸¸¡ÕÉÉ•¹Ð¹µ•Ñ„ñðíô¤°m¥‘tèì€¸¸¸¡ÕÉÉ•¹Ð¹µ•Ñ„ü¹m¥‘tñðíô¤°¹••‘ÍM¡É¥¹¬èÑÉÕ”ôô€èÕÉÉ•¹Ð¹µ•Ñ„ô¤¤ì4(€½¹ÍÐÉ•Ù¥•Ý•€ô=‰©•Ð¹­•åÌ¡ÍÑ…Ñ”¹É•Ù¥•ÝÌü¹mÝ••­tñðíô¤¹±•¹Ñ ì4(€É•ÑÕÉ¸€ñÍ•Ñ¥½¸ÍÑå±”õíìµ…É¥¹	½ÑÑ½´è€ÄÐ°‰½É‘•ÉI…‘¥ÕÌè€ÄÜ°‰…­É½Õ¹è€‰±¥¹•…ÈµÉ…‘¥•¹Ð ÄÐÕ‘•œ°Ù	°å¤ˆ°‰½É‘•Èè€ˆÅÁàÍ½±¥€ååÀˆ°½Ù•É™±½Üè€‰¡¥‘‘•¸ˆõôø4(€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•ÑáÁ…¹‘• ¡Ù…±Õ”¤€ôø€…Ù…±Õ”¥ô…É¥„µ•áÁ…¹‘•õí•áÁ…¹‘•‘ôÍÑå±”õíìÝ¥‘Ñ è€ˆÄÀÀ”ˆ°‘¥ÍÁ±…äè€‰É¥ˆ°É¥‘Q•µÁ±…Ñ•½±Õµ¹Ìè€ˆÅ™È…ÕÑ¼ˆ°…Àè€ä°Á…‘‘¥¹œè€ˆÄÉÁà€ÄÍÁàˆ°‰½É‘•Èè€À°‰…­É½Õ¹è€‰ÑÉ…¹ÍÁ…É•¹Ðˆ°Ñ•áÑ±¥¸è€‰±•™Ðˆ°ÕÉÍ½Èè€‰Á½¥¹Ñ•Èˆõôø4(€€€€€€ñÍÁ…¸øñÍÁ…¸ÍÑå±”õíì‘¥ÍÁ±…äè€‰‰±½¬ˆ°™½¹ÑM¥é”è€ÄÀ¸Ô°±•ÑÑ•ÉMÁ…¥¹œè€ˆ¸ÄÉ•´ˆ°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÑàÁÔˆõôûÂ~ž´IY%\€˜)UMPð½ÍÁ…¸øñÍÁ…¸ÍÑå±”õíì‘¥ÍÁ±…äè€‰‰±½¬ˆ°µ…É¥¹Q½Àè€Ì°™½¹ÑM¥é”è€ÄÌ¸Ô°™½¹Ñ]•¥¡Ðè€äÀÀ°½±½Èè€ˆŒÑÐÀÕˆõôù-••ÀÝ¡…ÐÝ½É­Ì¸¡…¹”Ý¡…Ð‘½•Í¸Ð¸ð½ÍÁ…¸øñÍÁ…¸ÍÑå±”õíì‘¥ÍÁ±…äè€‰‰±½¬ˆ°µ…É¥¹Q½Àè€È°™½¹ÑM¥é”è€ÄÄ°½±½Èè€ˆŒàÀÙáˆõôùíÉ…¹­•¹±•¹Ñ €ü€‘íÉ…¹­•¹±•¹Ñ¡ô¡…‰¥ÑÌÝ¥Ñ É•…°‘…Ñ„Ñ¡¥ÌÝ••¬ƒ
Ü€‘íÉ•Ù¥•Ý•‘ôÉ•Ù¥•Ý•‘€€è€‰UÍ”å½ÕÈ¡…‰¥ÑÌ™½È„™•Ü‘…åÌ…¹Ñ¡”É•Ù¥•ÜÝ¥±°™¥±°¥ÑÍ•±˜¥¸¸‰ôð½ÍÁ…¸øð½ÍÁ…¸øñÍÁ…¸…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆÍÑå±”õíì™½¹ÑM¥é”è€ÈÀ°½±½Èè€ˆŒáÙåˆõôùí•áÁ…¹‘•€ü€‹ŠZøˆ€è€‹Šè‰ôð½ÍÁ…¸ø4(€€€€ð½‰ÕÑÑ½¸ø4(€€€í•áÁ…¹‘•€˜˜€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ˆÀ€ÄÉÁà€ÄÉÁàˆ°‘¥ÍÁ±…äè€‰É¥ˆ°…Àè€àõôø4(€€€€€íÉ…¹­•¹µ…À ¡¥Ñ•´¤€ôøì4(€€€€€€€½¹ÍÐÍÕ•ÍÑ•€ô‘•¥Í¥½¹½È¡¥Ñ•´¤ì4(€€€€€€€½¹ÍÐ¡½Í•¸€ôÍÑ…Ñ”¹É•Ù¥•ÝÌü¹mÝ••­tü¹m¥Ñ•´¹¥‘tñð€ˆˆì4(€€€€€€€½¹ÍÐÍÑ…ÑÌ€ô¡…‰¥ÑMÑ…ÑÌ¡ÍÑ…Ñ”°¥Ñ•´¹¥¤ì4(€€€€€€€É•ÑÕÉ¸€ñ‘¥Ø­•äõí¥Ñ•´¹¥‘ôÍÑå±”õíìÁ…‘‘¥¹œè€ÄÀ°‰½É‘•ÉI…‘¥ÕÌè€ÄÄ°‰…­É½Õ¹è€‰Ý¡¥Ñ”ˆ°‰½É‘•Èè€ˆÅÁàÍ½±¥€ÙÀˆõôø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°©ÕÍÑ¥™å½¹Ñ•¹Ðè€‰ÍÁ…”µ‰•ÑÝ••¸ˆ°…Àè€àõôøñÍÑÉ½¹œÍÑå±”õíì½±½Èè€ˆŒÕÑÙˆ°™½¹ÑM¥é”è€ÄÈ¸Ôõôùí¥Ñ•´¹±…‰•±ôð½ÍÑÉ½¹œøñÍÁ…¸ÍÑå±”õíì™½¹ÑM¥é”è€ÄÄ°½±½Èè€ˆŒáÙåˆ°™½¹Ñ]•¥¡Ðè€äÀÀõôùí5…Ñ ¹É½Õ¹¡¥Ñ•´¹É…Ñ”€¨€ÄÀÀ¥ô”ð½ÍÁ…¸øð½‘¥Øø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíìµ…É¥¹Q½Àè€Ð°™½¹ÑM¥é”è€ÄÄ°½±½Èè€ˆŒàÀÙáˆ°±¥¹•!•¥¡Ðè€Ä¸ÐÔõôùíÍÕ•ÍÑ•€ôôô€‰­••Àˆ€ü€‰Q¡¥Ì¥ÌÝ½É­¥¹œ¸AÉ½Ñ•ÐÑ¡”ÕÉÉ•¹ÐÕ”…¹‘¥™™¥Õ±Ñä¸ˆ€èÍÕ•ÍÑ•€ôôô€‰Í¡É¥¹¬ˆ€ü€‰Q¡¥Ì±½½­Ì¡…ÉÑ¼ÍÑ…ÉÐ¸5…­”Ñ¡”µ¥¹¥µÕ´Ù•ÉÍ¥½¸Íµ…±±•È¸ˆ€èÍÕ•ÍÑ•€ôôô€‰É•Í¡•‘Õ±”ˆ€ü€¡ÍÑ…ÑÌ¹‰•ÍÑ…ä€üQÉäµ½Ù¥¹œ½È•µÁ¡…Í¥é¥¹œ¥Ð…É½Õ¹€‘íÍÑ…ÑÌ¹‰•ÍÑ…ä¹±…‰•±ô°Ý¡•É”¥Ð¡…ÌÝ½É­•‰•ÑÑ•È¹€€è€‰Q¡”¡…‰¥Ðµ…ä¹••„‰•ÑÑ•ÈÑ¥µ”½ÈÕ”¸ˆ¤€è€‰Q¡¥Ì¡…Ì¹½Ð‰••¸¡•±Á¥¹œÑ¡¥ÌÝ••¬¸A…ÕÍ¥¹œ½È‘É½ÁÁ¥¹œ¥Ðµ…äµ…­”Ñ¡”Á±…¸¡•…±Ñ¡¥•È¸‰ôð½‘¥Øø4(€€€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ô°µ…É¥¹Q½Àè€Ü°™±•á]É…Àè€‰ÝÉ…Àˆõôùíl‰­••Àˆ°€‰Í¡É¥¹¬ˆ°€‰É•Í¡•‘Õ±”ˆ°€‰‘É½À‰t¹µ…À ¡‘•¥Í¥½¸¤€ôø€ñ‰ÕÑÑ½¸­•äõí‘•¥Í¥½¹ôÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ…Ù••¥Í¥½¸¡¥Ñ•´¹¥°‘•¥Í¥½¸¥ôÍÑå±”õíì€¸¸¹…É‘	ÕÑÑ½¸¡¡½Í•¸€ôôô‘•¥Í¥½¸¤°Á…‘‘¥¹œè€ˆÙÁà€áÁàˆ°™½¹ÑM¥é”è€ÄÀ¸Ôõôùí‘•¥Í¥½¸€ôôôÍÕ•ÍÑ•€ü€‹Šb€ˆ€è€ˆ‰õí‘•¥Í¥½¹lÁt¹Ñ½UÁÁ•É…Í” ¤€¬‘•¥Í¥½¸¹Í±¥” Ä¥ôð½‰ÕÑÑ½¸ø¥ôð½‘¥Øø4(€€€€€€€€€ì¡¡½Í•¸€ôôô€‰Í¡É¥¹¬ˆñð¡½Í•¸€ôôô€‰É•Í¡•‘Õ±”ˆñð¡½Í•¸€ôôô€‰‘É½Àˆ¤€˜˜€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Á•¹Q…Í­5…¹…•Èü¸ ¥ôÍÑå±”õíì€¸¸¹…É‘	ÕÑÑ½¸¡™…±Í”¤°µ…É¥¹Q½Àè€Ü°Á…‘‘¥¹œè€ˆÙÁà€áÁàˆ°™½¹ÑM¥é”è€ÄÀ¸ÔõôùÁÁ±äÑ¡¥Ì¥¸Ñ…Í¬Í•ÑÕÀð½‰ÕÑÑ½¸ùô4(€€€€€€€€ð½‘¥Øøì4(€€€€€ô¥ô4(€€€€€ì…É…¹­•¹±•¹Ñ €˜˜€ñ‘¥ØÍÑå±”õíìÁ…‘‘¥¹œè€ÄÀ°½±½Èè€ˆŒàÀÙáˆ°™½¹ÑM¥é”è€ÄÄ¸Ôõôù9¼ÁÉ•ÍÍÕÉ”Ñ¼µ…¹Õ™…ÑÕÉ”‘…Ñ„¸A±ÕÍ¡1¥™”Ý¥±°É•Ù¥•ÜÑ¡”¡…‰¥ÑÌå½Ô…ÑÕ…±±äÕÍ”¸ð½‘¥Øùô4(€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€‰™±•àˆ°…Àè€Ø°™±•á]É…Àè€‰ÝÉ…Àˆõôøñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Q½…Í¡‰½…Éü¸ ‰Ñ½‘…äˆ¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôù¼Ñ¼Ñ½‘…äð½‰ÕÑÑ½¸øñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½Á•¹Q…Í­5…¹…•Èü¸ ¥ôÍÑå±”õí…É‘	ÕÑÑ½¸¡™…±Í”¥ôù‘¥Ðµä¡…‰¥ÑÌð½‰ÕÑÑ½¸øð½‘¥Øø4(€€€€ð½‘¥Øùô4(€€ð½Í•Ñ¥½¸øì4)ô4(