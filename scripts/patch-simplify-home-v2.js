const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

const today = 'src/components/today-panel-core.jsx';
replaceOnce(today,
`  const { dayIdForDate, offsetDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;
  const { DAYS } = window.PlushLifeContent;`,
`  const { dayIdForDate, offsetDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;
  const { DAYS } = window.PlushLifeContent;
  const [showFullTodaySchedule, setShowFullTodaySchedule] = React.useState(false);
  const [arrangeTodayTasks, setArrangeTodayTasks] = React.useState(false);`,
'Home disclosure state');

replaceOnce(today,
`            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
            return displayEntries.length > 0 ? (
          <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
                {displayEntries.map((entry, index) => (`,
`            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
            const visibleScheduleEntries = showFullTodaySchedule ? displayEntries : displayEntries.slice(0, 3);
            return displayEntries.length > 0 ? (
          <div data-plushlife-home-schedule-preview="true" style={{ display: "grid", gap: 5, marginTop: 8 }}>
                {visibleScheduleEntries.map((entry, index) => (`,
'compact Home schedule');

const scheduleClose = `                ))}
              </div>
            ) : null;`;
const scheduleCloseReplacement = `                ))}
                {displayEntries.length > 3 && <button type="button" aria-expanded={showFullTodaySchedule} onClick={() => setShowFullTodaySchedule((shown) => !shown)} style={{ minHeight: 44, padding: "7px 4px", border: 0, background: "transparent", color: day.accent, fontWeight: 900, fontSize: 11.5, cursor: "pointer", textAlign: "left" }}>{showFullTodaySchedule ? "Show fewer schedule items" : "+ " + (displayEntries.length - 3) + " more · Show all"}</button>}
              </div>
            ) : null;`;
replaceOnce(today, scheduleClose, scheduleCloseReplacement, 'Home schedule expansion');

replaceOnce(today,
`                <button type="button" onClick={() => setTaskListCollapsed(true)} style={{ marginBottom: 10, padding: "7px 11px", borderRadius: 9, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▾ Collapse list</button>`,
`                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <button type="button" onClick={() => { setTaskListCollapsed(true); setArrangeTodayTasks(false); }} style={{ minHeight: 44, padding: "8px 10px", borderRadius: 9, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>▾ Collapse</button>
                  {!isFutureView && !isHistoricalView && <button type="button" aria-pressed={arrangeTodayTasks} onClick={() => setArrangeTodayTasks((open) => !open)} style={{ minHeight: 44, padding: "8px 10px", borderRadius: 9, border: arrangeTodayTasks ? "1px solid " + day.accent : "1px solid #E6D4F2", background: arrangeTodayTasks ? day.accent + "12" : "white", color: arrangeTodayTasks ? day.accent : "#8C6B9E", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>{arrangeTodayTasks ? "✓ Done arranging" : "↕ Arrange"}</button>}
                </div>`,
'arrange button');

replaceOnce(today,
`                        {!isFutureView && !isHistoricalView && visibleGroupOrder.length > 1 && (`,
`                        {arrangeTodayTasks && !isFutureView && !isHistoricalView && visibleGroupOrder.length > 1 && (`,
'group controls disclosure');
replaceOnce(today,
`                        {draggableTodayTask && <button`,
`                        {arrangeTodayTasks && draggableTodayTask && <button`,
'drag disclosure');
replaceOnce(today,
`                        {r.sourceTask && !isFutureView && (
                          <button`,
`                        {arrangeTodayTasks && r.sourceTask && !isFutureView && (
                          <button`,
'pause disclosure');

const baby = 'src/components/baby-today.jsx';
replaceOnce(baby,
`                  {task.sourceTask?.task_key ? <button`,
`                  {showAllLittleJobs && task.sourceTask?.task_key ? <button`,
'Baby compact drag disclosure');

const audit = 'scripts/audit-interactive-wiring.js';
let auditSource = fs.readFileSync(audit, 'utf8');
const todayBlock = `  'src/components/today-panel-core.jsx': [`;
const position = auditSource.indexOf(todayBlock);
if (position < 0) throw new Error('Missing Today audit block');
const lineEnd = auditSource.indexOf('\n', position) + 1;
const checks = `    ['data-plushlife-home-schedule-preview="true"', 'three-item Home schedule preview'],
    ['arrangeTodayTasks', 'opt-in task arrange controls'],
    ['setTaskListCollapsed(true); setArrangeTodayTasks(false)', 'collapse exits arrange mode'],
`;
if (!auditSource.includes('three-item Home schedule preview')) auditSource = auditSource.slice(0, lineEnd) + checks + auditSource.slice(lineEnd);
const babyNeedle = `    ['startPointerTaskDrag?.(event, task.sourceTask.task_key', 'Baby Mode task drag reorder'],`;
if (!auditSource.includes('Baby Mode drag controls only when expanded')) auditSource = auditSource.replace(babyNeedle, babyNeedle + `
    ['showAllLittleJobs && task.sourceTask?.task_key', 'Baby Mode drag controls only when expanded'],`);
fs.writeFileSync(audit, auditSource);
