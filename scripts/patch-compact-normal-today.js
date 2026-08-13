const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

const path = 'src/components/today-panel-core.jsx';

replaceOnce(path,
`            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
            return displayEntries.length > 0 ? (
          <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
                {displayEntries.map((entry, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: entry.time ? "70px 1fr" : "1fr", alignItems: "center", gap: 7, padding: "8px 9px", borderRadius: 9, background: entry.isException ? "#EEF9F5" : "#FFFFFF99", border: entry.isException ? "1px solid #B9E0D0" : "1px solid #EFE3F3" }}>
                    {entry.time && <span style={{ fontSize: 13, color: day.accent, fontWeight: 900 }}>{formatTime12(entry.time)}</span>}
                    <span style={{ fontSize: 12.5, lineHeight: 1.35, color: "#5B4B6B", fontWeight: 600 }}>{entry.isException && <span style={{ marginRight: 5, color: "#318C79", fontSize: 10, fontWeight: 900 }}>EXTRA</span>}{entry.text}</span>
                  </div>
                ))}
              </div>
            ) : null;`,
`            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
            const previewEntries = displayEntries.slice(0, 3);
            const extraEntries = displayEntries.slice(3);
            const renderScheduleEntry = (entry, index, prefix = "preview") => (
              <div key={prefix + "-" + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "70px minmax(0,1fr)" : "1fr", alignItems: "center", gap: 7, minHeight: 40, padding: "7px 9px", borderRadius: 9, background: entry.isException ? "#EEF9F5" : "#FFFFFF99", border: entry.isException ? "1px solid #B9E0D0" : "1px solid #EFE3F3" }}>
                {entry.time && <span style={{ fontSize: 12.5, color: day.accent, fontWeight: 900 }}>{formatTime12(entry.time)}</span>}
                <span style={{ minWidth: 0, fontSize: 12, lineHeight: 1.3, color: "#5B4B6B", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.isException && <span style={{ marginRight: 5, color: "#318C79", fontSize: 9.5, fontWeight: 900 }}>EXTRA</span>}{entry.text}</span>
              </div>
            );
            return displayEntries.length > 0 ? (
              <div data-plushlife-compact-schedule="true" style={{ display: "grid", gap: 5, marginTop: 8 }}>
                {previewEntries.map((entry, index) => renderScheduleEntry(entry, index))}
                {extraEntries.length > 0 && <details style={{ borderRadius: 10, border: "1px solid #E8DDEE", background: "rgba(255,255,255,.5)", overflow: "hidden" }}>
                  <summary style={{ minHeight: 44, padding: "10px 11px", cursor: "pointer", listStyle: "none", color: day.accent, fontSize: 11.5, fontWeight: 900 }}>+ {extraEntries.length} more schedule item{extraEntries.length === 1 ? "" : "s"} · Show all</summary>
                  <div style={{ display: "grid", gap: 5, padding: "0 6px 6px" }}>{extraEntries.map((entry, index) => renderScheduleEntry(entry, index, "extra"))}</div>
                </details>}
              </div>
            ) : null;`,
'compact schedule preview');

replaceOnce(path,
`          <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.58)", border: "1px solid #E6D4F2" }}>`,
`          <div style={{ marginTop: 10, padding: 11, borderRadius: 14, background: "rgba(255,255,255,0.58)", border: "1px solid #E6D4F2" }}>`,
'habits preview density');

const audit = 'scripts/audit-interactive-wiring.js';
let auditSource = fs.readFileSync(audit, 'utf8');
const needle = `  'src/components/habit-retention.jsx': [`;
const block = `  'src/components/today-panel-core.jsx': [\n    ['data-plushlife-compact-schedule="true"', 'compact normal Today schedule'],\n    ['previewEntries = displayEntries.slice(0, 3)', 'three-row schedule preview'],\n    ['more schedule item', 'expandable full schedule'],\n  ],\n`;
if (!auditSource.includes(block)) {
  if (!auditSource.includes(needle)) throw new Error('Missing audit insertion marker');
  auditSource = auditSource.replace(needle, block + needle);
  fs.writeFileSync(audit, auditSource);
}
