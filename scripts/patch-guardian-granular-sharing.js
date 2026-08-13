const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

const app = 'src/app-source.jsx';
replaceOnce(app,
`const GUARDIAN_ROLE_PRESETS = [
  { id: "view_only", label: "Just keep an eye on things", icon: "👀", description: "Can see your progress and tasks. Can't message you, add rewards, or suggest tasks.", permissions: { can_view_progress: true, can_send_notes: false, can_add_rewards: false, can_suggest_tasks: false } },
  { id: "accountability", label: "Accountability partner", icon: "🎯", description: "Can see your progress and suggest tasks for you to add. Can't send notes or add rewards.", permissions: { can_view_progress: true, can_send_notes: false, can_add_rewards: false, can_suggest_tasks: true } },
  { id: "encouragement", label: "Encouragement only", icon: "💛", description: "Can send you encouraging notes and set up rewards. Can't see your progress or tasks at all.", permissions: { can_view_progress: false, can_send_notes: true, can_add_rewards: true, can_suggest_tasks: false } },
  { id: "full", label: "Full support", icon: "🌟", description: "Can see your progress, send notes, add rewards, and suggest tasks — everything.", permissions: { can_view_progress: true, can_send_notes: true, can_add_rewards: true, can_suggest_tasks: true } },
];`,
`const GUARDIAN_ROLE_PRESETS = [
  { id: "view_only", label: "Just keep an eye on things", icon: "👀", description: "Can see progress only. Tasks, schedule, mood, notes, rewards, and suggestions stay off unless you enable them.", permissions: { can_view_progress: true, can_view_tasks: false, can_view_schedule: false, can_view_mood: false, can_send_notes: false, can_add_rewards: false, can_suggest_tasks: false } },
  { id: "accountability", label: "Accountability partner", icon: "🎯", description: "Can see progress and the tasks you explicitly share, and can suggest tasks. Schedule and mood stay private by default.", permissions: { can_view_progress: true, can_view_tasks: true, can_view_schedule: false, can_view_mood: false, can_send_notes: false, can_add_rewards: false, can_suggest_tasks: true } },
  { id: "encouragement", label: "Encouragement only", icon: "💛", description: "Can send encouraging notes and add rewards. They cannot see progress, tasks, schedule, or mood.", permissions: { can_view_progress: false, can_view_tasks: false, can_view_schedule: false, can_view_mood: false, can_send_notes: true, can_add_rewards: true, can_suggest_tasks: false } },
  { id: "full", label: "Full support", icon: "🌟", description: "Shares progress, today's tasks, schedule, and a small mood summary, plus notes, rewards, and task suggestions. Private notes and journals still stay private.", permissions: { can_view_progress: true, can_view_tasks: true, can_view_schedule: true, can_view_mood: true, can_send_notes: true, can_add_rewards: true, can_suggest_tasks: true } },
];`, 'Guardian presets');

replaceOnce(app,
`  const [supportTrackerTasks, setSupportTrackerTasks] = useState([]);`,
`  const [supportTrackerTasks, setSupportTrackerTasks] = useState([]);
  const [supportSchedules, setSupportSchedules] = useState([]);
  const [supportScheduleExceptions, setSupportScheduleExceptions] = useState([]);
  const [supportMoodSummary, setSupportMoodSummary] = useState(null);`, 'support sharing state');

replaceOnce(app,
`      setSupportTrackerTasks([]);
      setSupportAchievements(null);`,
`      setSupportTrackerTasks([]);
      setSupportSchedules([]);
      setSupportScheduleExceptions([]);
      setSupportMoodSummary(null);
      setSupportAchievements(null);`, 'support reset');

replaceOnce(app,
`    const [notesResult, rewardsResult, progressResult, historyResult, tasksResult, suggestionsResult, achievementsResult, restResult] = await Promise.all([`,
`    const [notesResult, rewardsResult, progressResult, historyResult, tasksResult, schedulesResult, exceptionsResult, moodResult, suggestionsResult, achievementsResult, restResult] = await Promise.all([`, 'support load result list');

const taskQuery = `      supabase.from("tracker_tasks").select("task_key, day_id, section, task, detail, sort_order, is_bonus, schedule_type, start_date, end_date, one_time_date, why_note, archived_at, schedule_days, paused_since, paused_until").eq("user_id", targetOwnerId).is("archived_at", null).order("sort_order"),`;
replaceOnce(app, taskQuery, taskQuery + `
      supabase.from("tracker_schedules").select("day_id, label, wake, morning, work, workout, home, entries").eq("user_id", targetOwnerId).order("day_id"),
      supabase.from("schedule_exceptions").select("id, start_date, end_date, entries").eq("user_id", targetOwnerId).lte("start_date", period.date).gte("end_date", period.date),
      supabase.rpc("guardian_daily_checkin_summary", { p_owner_user_id: targetOwnerId, p_date: period.date }).maybeSingle(),`, 'support schedule/mood queries');

replaceOnce(app,
`    setSupportTrackerTasks(tasksResult.data || []);
    setTaskSuggestions(suggestionsResult.data || []);`,
`    setSupportTrackerTasks(tasksResult.data || []);
    setSupportSchedules(schedulesResult.data || []);
    setSupportScheduleExceptions(exceptionsResult.data || []);
    setSupportMoodSummary(moodResult.data || null);
    setTaskSuggestions(suggestionsResult.data || []);`, 'support result state');

replaceOnce(app,
`    if (notesResult.error || rewardsResult.error || progressResult.error || historyResult.error || tasksResult.error || suggestionsResult.error) {`,
`    if (notesResult.error || rewardsResult.error || progressResult.error || historyResult.error || tasksResult.error || schedulesResult.error || exceptionsResult.error || moodResult.error || suggestionsResult.error) {`, 'support error coverage');

replaceOnce(app,
`  const canViewSupportProgress = !isSupportAdult || !!activeSupportLink?.can_view_progress;
  const canSendSupportNotes = !isSupportAdult || !!activeSupportLink?.can_send_notes;`,
`  const canViewSupportProgress = !isSupportAdult || !!activeSupportLink?.can_view_progress;
  const canViewSupportTasks = !isSupportAdult || !!activeSupportLink?.can_view_tasks;
  const canViewSupportSchedule = !isSupportAdult || !!activeSupportLink?.can_view_schedule;
  const canViewSupportMood = !isSupportAdult || !!activeSupportLink?.can_view_mood;
  const canSendSupportNotes = !isSupportAdult || !!activeSupportLink?.can_send_notes;`, 'support permission booleans');

replaceOnce(app,
`activeSupportLink={activeSupportLink} canViewSupportProgress={canViewSupportProgress}`,
`activeSupportLink={activeSupportLink} canViewSupportProgress={canViewSupportProgress} canViewSupportTasks={canViewSupportTasks} canViewSupportSchedule={canViewSupportSchedule} canViewSupportMood={canViewSupportMood} supportTrackerTasks={supportTrackerTasks} supportSchedules={supportSchedules} supportScheduleExceptions={supportScheduleExceptions} supportMoodSummary={supportMoodSummary}`,
'GuardianPanel sharing props');

const panel = 'src/components/guardian-panel.jsx';
replaceOnce(panel,
`supportProgress={supportProgress}`,
`supportProgress={supportProgress}`, 'guardian panel sanity marker');

replaceOnce(panel,
`activeSupportLink, canViewSupportProgress, supportProgressView`,
`activeSupportLink, canViewSupportProgress, canViewSupportTasks, canViewSupportSchedule, canViewSupportMood, supportTrackerTasks = [], supportSchedules = [], supportScheduleExceptions = [], supportMoodSummary, supportProgressView`, 'guardian panel prop signature');

replaceOnce(panel,
`  const { daysBetweenDates } = window.PlushLifeSchedule;`,
`  const { daysBetweenDates, dayIdForDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;
  const sharedTaskKeys = new Set([...(supportDailyEssentialKeys || []), ...(supportScheduledTodayKeys || [])]);
  const sharedTodayTasks = (supportTrackerTasks || []).filter((task) => sharedTaskKeys.has(task.task_key));
  const supportDayId = dayIdForDate?.(period.date);
  const sharedSchedule = (supportSchedules || []).find((item) => item.day_id === supportDayId) || null;
  const sharedScheduleEntries = [
    ...(sharedSchedule?.entries?.length ? sharedSchedule.entries : (legacyScheduleToEntries?.(sharedSchedule) || [])),
    ...(supportScheduleExceptions || []).flatMap((item) => (item.entries || []).map((entry) => ({ ...entry, isException: true }))),
  ].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));`, 'guardian shared data derivation');

replaceOnce(panel,
`                          ["can_view_progress", "View progress"],
                          ["can_send_notes", "Send notes"],`,
`                          ["can_view_progress", "View progress"],
                          ["can_view_tasks", "See today's tasks"],
                          ["can_view_schedule", "See schedule"],
                          ["can_view_mood", "See mood summary"],
                          ["can_send_notes", "Send notes"],`, 'owner permission controls');

const permissionGridEnd = `                      </div>
                      <label style={{ display: "grid", gap: 5, marginTop: 10, paddingTop: 9, borderTop: "1px solid #D9ECFA", fontSize: 10.5, fontWeight: 900, color: "#4C8FE8" }}>`;
replaceOnce(panel, permissionGridEnd,
`                      </div>
                      <div style={{ marginTop: 8, padding: "8px 9px", borderRadius: 9, background: "white", border: "1px solid #E3ECF5" }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: "#4C8FE8", letterSpacing: ".08em" }}>SHARED ACCESS</div>
                        <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {[["can_view_progress","Progress"],["can_view_tasks","Today's tasks"],["can_view_schedule","Schedule"],["can_view_mood","Mood summary"],["can_send_notes","Notes"],["can_add_rewards","Rewards"],["can_suggest_tasks","Task suggestions"]].filter(([key]) => link[key]).map(([key,label]) => <span key={key} style={{ padding: "3px 7px", borderRadius: 999, background: "#EEF7FF", color: "#416D98", fontSize: 9.5, fontWeight: 800 }}>{label}</span>)}
                          {![["can_view_progress"],["can_view_tasks"],["can_view_schedule"],["can_view_mood"],["can_send_notes"],["can_add_rewards"],["can_suggest_tasks"]].some(([key]) => link[key]) && <span style={{ fontSize: 10.5, color: "#8C6B9E" }}>Nothing shared right now.</span>}
                        </div>
                        {!pending && <div style={{ marginTop: 5, fontSize: 9.8, color: "#8C6B9E" }}>Last Guardian view: {formatRelativeTime(link.last_viewed_at)} · Pause access anytime.</div>}
                      </div>
                      <label style={{ display: "grid", gap: 5, marginTop: 10, paddingTop: 9, borderTop: "1px solid #D9ECFA", fontSize: 10.5, fontWeight: 900, color: "#4C8FE8" }}>`,
'owner shared access summary');

const beforeProgress = `            {isSupportAdult && canViewSupportProgress && supportAchievements?.last_celebrated_date`;
const sharedCards = `            {isSupportAdult && <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div style={{ padding: 11, borderRadius: 12, background: "#FFF9FD", border: "1px solid #E9D7F0" }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: "#8D5CA5", letterSpacing: ".08em" }}>WHAT ${selectedSupportName.toUpperCase()} SHARED WITH YOU</div>
                <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.45, color: "#806B8D" }}>Connection alone does not unlock private data. Each category below is controlled by the Cozy.</div>
              </div>
              {canViewSupportTasks ? <div style={{ padding: 11, borderRadius: 12, background: "#F7FBFF", border: "1px solid #D9ECFA" }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4C8FE8" }}>✓ TODAY'S SHARED TASKS</div>
                {sharedTodayTasks.length ? <div style={{ display: "grid", gap: 5, marginTop: 7 }}>{sharedTodayTasks.slice(0, 8).map((task) => <div key={task.task_key} style={{ padding: "7px 8px", borderRadius: 8, background: "white", color: "#5B4B6B", fontSize: 11.5, fontWeight: 750 }}>{task.task}</div>)}</div> : <div style={{ marginTop: 6, fontSize: 11, color: "#71839A" }}>No shared tasks are scheduled for today.</div>}
              </div> : null}
              {canViewSupportSchedule ? <div style={{ padding: 11, borderRadius: 12, background: "#F7FBFF", border: "1px solid #D9ECFA" }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4C8FE8" }}>🗓 SHARED SCHEDULE</div>
                {sharedScheduleEntries.length ? <div style={{ display: "grid", gap: 5, marginTop: 7 }}>{sharedScheduleEntries.slice(0, 8).map((entry, index) => <div key={(entry.time || "any") + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "62px 1fr" : "1fr", gap: 6, padding: "7px 8px", borderRadius: 8, background: entry.isException ? "#EEF9F5" : "white", fontSize: 11 }}>
                  {entry.time && <strong style={{ color: "#4C8FE8" }}>{formatTime12?.(entry.time) || entry.time}</strong>}<span style={{ color: "#5B4B6B" }}>{entry.text || entry.label || entry.title || "Scheduled item"}</span>
                </div>)}</div> : <div style={{ marginTop: 6, fontSize: 11, color: "#71839A" }}>No schedule items are shared for today.</div>}
              </div> : null}
              {canViewSupportMood ? <div style={{ padding: 11, borderRadius: 12, background: "#F7FBFF", border: "1px solid #D9ECFA" }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4C8FE8" }}>♥ SHARED MOOD SUMMARY</div>
                {supportMoodSummary ? <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.5, color: "#5B4B6B" }}>{[supportMoodSummary.mood && `Mood: ${supportMoodSummary.mood}`, supportMoodSummary.energy && `Energy: ${supportMoodSummary.energy}`, supportMoodSummary.capacity && `Capacity: ${supportMoodSummary.capacity}`, supportMoodSummary.day_type && `Day: ${supportMoodSummary.day_type}`, supportMoodSummary.support_preference && `Support: ${supportMoodSummary.support_preference}`].filter(Boolean).join(" · ")}</div> : <div style={{ marginTop: 6, fontSize: 11, color: "#71839A" }}>No mood summary shared for today. Private notes are never included.</div>}
              </div> : null}
            </div>}

`;
replaceOnce(panel, beforeProgress, sharedCards + beforeProgress, 'guardian shared cards');

const audit = 'scripts/audit-interactive-wiring.js';
let auditSource = fs.readFileSync(audit, 'utf8');
const auditMarker = `    ['aria-label="Today schedule"', 'Baby Mode schedule card'],\n`;
if (auditSource.includes(auditMarker) && !auditSource.includes('can_view_schedule')) {
  auditSource = auditSource.replace(auditMarker, auditMarker + `    ['can_view_tasks', 'Guardian task sharing permission'],\n    ['can_view_schedule', 'Guardian schedule sharing permission'],\n    ['can_view_mood', 'Guardian mood-summary permission'],\n`);
  fs.writeFileSync(audit, auditSource);
}
