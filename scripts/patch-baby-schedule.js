const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

replaceOnce(
  'src/components/baby-today.jsx',
  '  trackerProfile,\n  setCareSection,\n  goToDashboard,\n  pct = 0,',
  '  trackerProfile,\n  selectedSchedule,\n  selectedScheduleExceptionEntries = [],\n  scheduleDayId,\n  setCareSection,\n  goToDashboard,\n  pct = 0,',
  'BabyToday schedule props',
);

replaceOnce(
  'src/components/baby-today.jsx',
  '  const comfortItem = trackerProfile?.comfort_item || trackerProfile?.comfort_item_name || "";\n',
  '  const comfortItem = trackerProfile?.comfort_item || trackerProfile?.comfort_item_name || "";\n  const { legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule || {};\n  const baseScheduleEntries = selectedSchedule?.entries?.length\n    ? selectedSchedule.entries\n    : (legacyScheduleToEntries ? legacyScheduleToEntries(selectedSchedule) : []);\n  const babyScheduleEntries = [...(baseScheduleEntries || []), ...(selectedScheduleExceptionEntries || [])]\n    .filter((entry) => entry && (entry.label || entry.title || entry.time))\n    .sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));\n',
  'BabyToday schedule data',
);

const scheduleCard = [
  '      <BabyHabitAnchor open={open} rows={rows} viewDone={viewDone} period={period} toggle={toggle} />',
  '',
  '      {babyScheduleEntries.length > 0 && <section aria-label="Today schedule" style={{ padding: 11, borderRadius: 15, background: "rgba(255,255,255,.78)", border: "1px solid #D9E5F1" }}>',
  '        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>',
  '          <div style={{ minWidth: 0 }}>',
  '            <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#4A80B5" }}>🗓 TODAY’S SCHEDULE</div>',
  '            <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSchedule?.label || scheduleDayId || "Today"}</div>',
  '          </div>',
  '          <button type="button" onClick={() => goToDashboard?.("week")} style={{ ...softButton, minHeight: 40, padding: "7px 10px", fontSize: 11.5, flexShrink: 0 }}>Open planner</button>',
  '        </div>',
  '        <div style={{ display: "grid", gap: 5, marginTop: 8 }}>',
  '          {babyScheduleEntries.slice(0, 3).map((entry, index) => <div key={(entry.time || "any") + "-" + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "62px 1fr" : "1fr", gap: 7, alignItems: "center", minHeight: 34, padding: "6px 8px", borderRadius: 9, background: entry.isException ? "#EEF9F5" : "#FFFFFFA8", border: "1px solid #E8E0EC" }}>',
  '            {entry.time && <span style={{ fontSize: 11.5, color: "#4A80B5", fontWeight: 900 }}>{formatTime12 ? formatTime12(entry.time) : entry.time}</span>}',
  '            <span style={{ minWidth: 0, fontSize: 11.8, color: "#5B4B6B", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.label || entry.title || "Scheduled item"}</span>',
  '          </div>)}',
  '        </div>',
  '        {babyScheduleEntries.length > 3 && <button type="button" onClick={() => goToDashboard?.("week")} style={{ marginTop: 6, minHeight: 40, padding: "7px 0", border: 0, background: "transparent", color: "#4A80B5", fontSize: 11.5, fontWeight: 900, cursor: "pointer" }}>+ {babyScheduleEntries.length - 3} more in PlushCalendar</button>}',
  '      </section>}',
  '',
].join('\n');

replaceOnce(
  'src/components/baby-today.jsx',
  '      <BabyHabitAnchor open={open} rows={rows} viewDone={viewDone} period={period} toggle={toggle} />\n\n',
  scheduleCard,
  'BabyToday schedule card',
);

replaceOnce(
  'scripts/audit-interactive-wiring.js',
  "    ['onClick={() => goToDashboard?.(\"progress\")}', 'Progress route'],\n",
  "    ['onClick={() => goToDashboard?.(\"progress\")}', 'Progress route'],\n    ['aria-label=\"Today schedule\"', 'Baby Mode schedule card'],\n    ['babyScheduleEntries.slice(0, 3)', 'compact Baby Mode schedule preview'],\n",
  'Baby schedule wiring audit',
);
