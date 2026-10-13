export function shouldReviewQuickSchedule(text) {
  return /\b(?:every\s+(?:day|morning|evening|night|week|weekday|weekend|mon|tue|wed|thu|fri|sat|sun)|tomorrow|tonight|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(String(text || ""));
}
export function chooseRescueMode(mode) {
  if (!["soft", "tiny", "rest", "full"].includes(mode)) return null;
  return { mode, message: mode === "rest" ? "Resting is allowed. Your finished tasks stay finished." :
    mode === "tiny" ? "Only the smallest steps for now." :
    mode === "soft" ? "A lighter day with fewer expectations." : "Your usual day is back." };
}
export function searchPrivateEveryday({ query = "", tasks = [], schedules = [], notes = [] } = {}) {
  const text = String(query).trim().toLocaleLowerCase();
  if (text.length < 2) return [];
  const matches = (item) => item.toLocaleLowerCase().includes(text);
  return [
    ...tasks.filter(item => !item?.archived_at && matches([item.task, item.section, item.why_note].filter(Boolean).join(" ")))
      .map(item => ({ id: "task:" + item.task_key, type: "task", title: item.task, hint: item.section || "Task", source: item })),
    ...schedules.flatMap((schedule) => (Array.isArray(schedule?.entries) ? schedule.entries : []).filter(entry =>
      matches([entry.text, entry.title, entry.label, schedule.label].filter(Boolean).join(" "))
    ).map((entry, i) => ({ id: "schedule:" + schedule.day_id + ":" + i, type: "schedule",
      title: entry.text || entry.title || entry.label || schedule.label || "Schedule item", hint: schedule.label || "Schedule", source: schedule }))),
    ...notes.filter(note => matches([note.body, note.prompt, note.note_date].filter(Boolean).join(" ")))
      .map(note => ({ id: "journal:" + note.note_date, type: "journal", title: "Journal · " + note.note_date, hint: "Private journal", source: note }))
  ].slice(0, 30);
}
export function buildLittleWins({ history = [], checkIns = [], today = "" } = {}) {
  const doneDates = [...new Set(history.filter(day => day?.progress_date <= today &&
    Array.isArray(day.completed_keys) && day.completed_keys.length).map(day => day.progress_date))];
  const caringDates = [...new Set(checkIns.filter(day => day?.check_date <= today && day?.check_date)
    .map(day => day.check_date))];
  const combined = [...new Set([...doneDates, ...caringDates])].sort((a,b)=>b.localeCompare(a));
  return combined.slice(0, 14).map(date => {
    const count = history.find(day => day.progress_date === date)?.completed_keys?.length || 0;
    const mood = checkIns.find(day => day.check_date === date)?.mood || "";
    return { date, title: count ? `${count} little step${count === 1 ? "" : "s"} finished` : "You showed up for yourself",
      description: mood ? "Checked in with how you felt." : "A little care still counts." };
  });
}
