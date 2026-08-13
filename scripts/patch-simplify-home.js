const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

const today = 'src/components/today-panel-core.jsx';
replaceOnce(today,
`  const { dayIdForDate, offsetDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;\n  const { DAYS } = window.PlushLifeContent;`,
`  const { dayIdForDate, offsetDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;\n  const { DAYS } = window.PlushLifeContent;\n  const [showFullTodaySchedule, setShowFullTodaySchedule] = React.useState(false);\n  const [arrangeTodayTasks, setArrangeTodayTasks] = React.useState(false);`,
'Home progressive disclosure state');

replaceOnce(today,
`        <div data-plushlife-compact-card="plushweek" style={{ marginBottom: 9, padding: "8px 10px", borderRadius: 13, background: "linear-gradient(135deg,#FBF3FE,#FFF9FD)", border: "1px solid #E3C9EC" }}>\n          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>\n            <div style={{ flex: 1, minWidth: 0 }}>\n              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>\n                <div style={{ fontSize: 9.5, letterSpacing: "0.12em", fontWeight: 900, color: "#A65DC1" }}>📮 PLUSHWEEK</div>\n                {!weeklyIntentionEditing && <button type="button" onClick={() => { setWeeklyIntentionDraft(weeklyIntentionText); setWeeklyIntentionEditing(true); }} data-plushlife-compact-hit-target="plushweek-edit" style={{ minHeight: 44, margin: "-7px 0", padding: "11px 6px", border: 0, background: "transparent", color: "#8E4EAA", fontWeight: 900, fontSize: 10.5, cursor: "pointer", flexShrink: 0 }}>{weeklyIntentionText ? "Edit" : "Add"}</button>}\n              </div>\n              {!weeklyIntentionEditing && <div style={{ marginTop: 1, fontSize: 12.5, lineHeight: 1.3, color: weeklyIntentionText ? "#5B4B6B" : "#9A86A7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{weeklyIntentionText || "Set one gentle direction for this week"}</div>\n            </div>\n          </div>`,
`        <div data-plushlife-compact-card="plushweek" style={{ marginBottom: 7, padding: "5px 9px", borderRadius: 11, background: "rgba(255,255,255,.5)", border: "1px solid #E8DDEE" }}>\n          {!weeklyIntentionEditing && <div style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}>\n            <span aria-hidden="true" style={{ flexShrink: 0 }}>📮</span>\n            <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: weeklyIntentionText ? "#5B4B6B" : "#9A86A7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{weeklyIntentionText || "Set a gentle direction for this week"}</span>\n            <button type="button" onClick={() => { setWeeklyIntentionDraft(weeklyIntentionText); setWeeklyIntentionEditing(true); }} data-plushlife-compact-hit-target="plushweek-edit" style={{ minHeight: 44, padding: "10px 5px", border: 0, background: "transparent", color: "#8E4EAA", fontWeight: 900, fontSize: 10.5, cursor: "pointer", flexShrink: 0 }}>{weeklyIntentionText ? "Edit" : "Add"}</button>\n          </div>}`,
'one-line PlushWeek');

replaceOnce(today,
`            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));\n            return displayEntries.length > 0 ? (\n          <div style={{ display: "grid", gap: 5, marginTop: 10 }}>\n                {displayEntries.map((entry, index) => (`,
`            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));\n            const visibleScheduleEntries = showFullTodaySchedule ? displayEntries : displayEntries.slice(0, 3);\n            return displayEntries.length > 0 ? (\n          <div data-plushlife-home-schedule-preview="true" style={{ display: "grid", gap: 5, marginTop: 8 }}>\n                {visibleScheduleEntries.map((entry, index) => (`,
'normal schedule preview');

replaceOnce(today,
`                ))}\n              </div>\n            ) : null;`,
`                ))}\n                {displayEntries.length > 3 && <button type="button" aria-expanded={showFullTodaySchedule} onClick={() => setShowFullTodaySchedule((shown) => !shown)} style={{ minHeight: 44, padding: "7px 4px", border: 0, background: "transparent", color: day.accent, fontWeight: 900, fontSize: 11.5, cursor: "pointer", textAlign: "left" }}>{showFullTodaySchedule ? "Show fewer schedule items" : "+ " + (displayEntries.length - 3) + " more · Show all"}</button>}\n              </div>\n            ) : null;`,
'normal schedule expansion');

replaceOnce(today,
`                <button type="button" onClick={() => setTaskListCollapsed(true)} style={{ marginBottom: 10, padding: "7px 11px", borderRadius: 9, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▾ Collapse list</button>`,
`                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>\n                  <button type="button" onClick={() => { setTaskListCollapsed(true); setArrangeTodayTasks(false); }} style={{ minHeight: 44, padding: "8px 10px", borderRadius: 9, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>▾ Collapse</button>\n                  {!isFutureView && !isHistoricalView && <button type="button" aria-pressed={arrangeTodayTasks} onClick={() => setArrangeTodayTasks((open) => !open)} style={{ minHeight: 44, padding: "8px 10px", borderRadius: 9, border: arrangeTodayTasks ? \`1px solid ${day.accent}\` : "1px solid #E6D4F2", background: arrangeTodayTasks ? day.accent + "12" : "white", color: arrangeTodayTasks ? day.accent : "#8C6B9E", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>{arrangeTodayTasks ? "✓ Done arranging" : "↕ Arrange"}</button>}\n                </div>`,
'arrange mode controls');

replaceOnce(today,
`                        {!isFutureView && !isHistoricalView && visibleGroupOrder.length > 1 && (`,
`                        {arrangeTodayTasks && !isFutureView && !isHistoricalView && visibleGroupOrder.length > 1 && (`,
'group arrows only in arrange mode');
replaceOnce(today,
`                        {draggableTodayTask && <button`,
`                        {arrangeTodayTasks && draggableTodayTask && <button`,
'drag handles only in arrange mode');
replaceOnce(today,
`                        {r.sourceTask && !isFutureView && (\n                          <button`,
`                        {arrangeTodayTasks && r.sourceTask && !isFutureView && (\n                          <button`,
'pause controls only in arrange mode');

const baby = 'src/components/baby-today.jsx';
replaceOnce(baby,
`                {showAllLittleJobs && group.section && visibleGroupOrder.length > 1 && <span style={{ display: "flex", gap: 4 }}>`,
`                {showAllLittleJobs && group.section && visibleGroupOrder.length > 1 && <span style={{ display: "flex", gap: 4 }}>`,
'keep Baby group controls expanded-only');
replaceOnce(baby,
`                  {task.sourceTask?.task_key ? <button`,
`                  {showAllLittleJobs && task.sourceTask?.task_key ? <button`,
'hide Baby drag handles in compact preview');

const audit = 'scripts/audit-interactive-wiring.js';
let auditSource = fs.readFileSync(audit, 'utf8');
const marker = `  'src/components/today-panel-core.jsx': [`;
const additions = [
  `    ['data-plushlife-home-schedule-preview="true"', 'three-item Home schedule preview'],`,
  `    ['arrangeTodayTasks', 'opt-in task arrange controls'],`,
  `    ['setTaskListCollapsed(true); setArrangeTodayTasks(false)', 'collapse exits arrange mode'],`,
];
const start = auditSource.indexOf(marker);
if (start < 0) throw new Error('Missing Today audit block');
const lineEnd = auditSource.indexOf('\n', start) + 1;
for (const addition of additions.reverse()) {
  if (!auditSource.includes(addition.trim())) auditSource = auditSource.slice(0, lineEnd) + addition + '\n' + auditSource.slice(lineEnd);
}
const babyNeedle = `    ['startPointerTaskDrag?.(event, task.sourceTask.task_key', 'Baby Mode task drag reorder'],`;
if (!auditSource.includes(`['showAllLittleJobs && task.sourceTask?.task_key', 'Baby Mode drag controls only when expanded']`)) {
  if (!auditSource.includes(babyNeedle)) throw new Error('Missing Baby audit marker');
  auditSource = auditSource.replace(babyNeedle, babyNeedle + `\n    ['showAllLittleJobs && task.sourceTask?.task_key', 'Baby Mode drag controls only when expanded'],`);
}
fs.writeFileSync(audit, auditSource);
