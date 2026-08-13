const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

const baby = 'src/components/baby-today.jsx';
replaceOnce(baby,
`  const [showMore, setShowMore] = React.useState(false);\n  const [showAllLittleJobs, setShowAllLittleJobs] = React.useState(false);`,
`  const [showMore, setShowMore] = React.useState(false);\n  const [showAllLittleJobs, setShowAllLittleJobs] = React.useState(false);\n  const [showFullSchedule, setShowFullSchedule] = React.useState(false);`,
'Baby Mode schedule expansion state');

replaceOnce(baby,
`          {babyScheduleEntries.slice(0, 3).map((entry, index) => <div key={(entry.time || "any") + "-" + index}`,
`          {babyScheduleEntries.slice(0, showFullSchedule ? babyScheduleEntries.length : 3).map((entry, index) => <div key={(entry.time || "any") + "-" + index}`,
'Baby Mode schedule visible rows');

replaceOnce(baby,
`        {babyScheduleEntries.length > 3 && <button type="button" onClick={() => goToDashboard?.("week")} style={{ marginTop: 6, minHeight: 40, padding: "7px 0", border: 0, background: "transparent", color: "#4A80B5", fontSize: 11.5, fontWeight: 900, cursor: "pointer" }}>+ {babyScheduleEntries.length - 3} more in PlushCalendar</button>}`,
`        {babyScheduleEntries.length > 3 && <button type="button" aria-expanded={showFullSchedule} onClick={() => setShowFullSchedule((shown) => !shown)} style={{ marginTop: 6, minHeight: 44, padding: "7px 0", border: 0, background: "transparent", color: "#4A80B5", fontSize: 11.5, fontWeight: 900, cursor: "pointer" }}>{showFullSchedule ? "Show fewer schedule items" : "+ " + (babyScheduleEntries.length - 3) + " more · Show all"}</button>}`,
'Baby Mode schedule expand button');

const today = 'src/components/today-panel-core.jsx';
replaceOnce(today,
`<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "12px 2px 6px", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>`,
`<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "8px 2px 4px", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>`,
'normal Today group spacing');
replaceOnce(today,
`style={{ marginBottom: 6, borderRadius: 12,`,
`style={{ marginBottom: 4, borderRadius: 10,`,
'normal Today task card spacing');
replaceOnce(today,
`style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", cursor: isFutureView ? "not-allowed" : "pointer", opacity: isFutureView ? 0.62 : 1 }}>`,
`style={{ minHeight: 48, display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", cursor: isFutureView ? "not-allowed" : "pointer", opacity: isFutureView ? 0.62 : 1 }}>`,
'normal Today compact task row');
replaceOnce(today,
`style={{ flex: "0 0 auto", width: 28, height: 32, minHeight: 32, padding: 0, borderRadius: 8,`,
`style={{ flex: "0 0 auto", width: 38, height: 44, minHeight: 44, padding: 0, borderRadius: 8,`,
'normal Today drag target');
replaceOnce(today,
`style={{ width: 22, height: 22, minWidth: 22, borderRadius: 7,`,
`style={{ width: 20, height: 20, minWidth: 20, borderRadius: 6,`,
'normal Today checkbox density');
replaceOnce(today,
`<span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: checked ? "#B08AC7" : "#5B4B6B", textDecoration: checked ? "line-through" : "none" }}>`,
`<span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.3, fontWeight: 650, color: checked ? "#B08AC7" : "#5B4B6B", textDecoration: checked ? "line-through" : "none" }}>`,
'normal Today task text density');
replaceOnce(today,
`style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, border: "none",`,
`style={{ flexShrink: 0, width: 38, height: 44, minHeight: 44, borderRadius: 8, border: "none",`,
'normal Today pause target');

const audit = 'scripts/audit-interactive-wiring.js';
let auditSource = fs.readFileSync(audit, 'utf8');
const needle = `    ['entry.text || entry.label || entry.title', 'Baby Mode schedule uses saved item text'],`;
if (!auditSource.includes(`['showFullSchedule', 'Baby Mode inline full schedule']`)) {
  if (!auditSource.includes(needle)) throw new Error('Missing Baby Mode audit marker');
  auditSource = auditSource.replace(needle, needle + `\n    ['showFullSchedule', 'Baby Mode inline full schedule'],`);
}
const todayNeedle = `  'src/components/today-panel-core.jsx': [`;
if (!auditSource.includes(todayNeedle)) {
  const insertion = `  'src/components/today-panel-core.jsx': [\n    ['minHeight: 48, display: "flex"', 'compact normal Today task rows'],\n    ['width: 38, height: 44, minHeight: 44', 'touch-safe compact task controls'],\n  ],\n`;
  const marker = `  'src/components/habit-retention.jsx': [`;
  if (!auditSource.includes(marker)) throw new Error('Missing Today audit insertion marker');
  auditSource = auditSource.replace(marker, insertion + marker);
}
fs.writeFileSync(audit, auditSource);
