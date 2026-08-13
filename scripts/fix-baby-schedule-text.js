const fs = require('fs');
const path = 'src/components/baby-today.jsx';
let source = fs.readFileSync(path, 'utf8');
const oldFilter = '.filter((entry) => entry && (entry.label || entry.title || entry.time))';
const newFilter = '.filter((entry) => entry && (entry.text || entry.label || entry.title || entry.time))';
if (!source.includes(oldFilter)) throw new Error('Missing Baby Mode schedule filter');
source = source.replace(oldFilter, newFilter);
const oldText = '{entry.label || entry.title || "Scheduled item"}';
const newText = '{entry.text || entry.label || entry.title || "Scheduled item"}';
if (!source.includes(oldText)) throw new Error('Missing Baby Mode schedule text renderer');
source = source.replace(oldText, newText);
fs.writeFileSync(path, source);

const auditPath = 'scripts/audit-interactive-wiring.js';
let audit = fs.readFileSync(auditPath, 'utf8');
const marker = "    ['babyScheduleEntries.slice(0, 3)', 'compact Baby Mode schedule preview'],\n";
if (!audit.includes("entry.text || entry.label || entry.title")) {
  if (!audit.includes(marker)) throw new Error('Missing Baby Mode schedule audit marker');
  audit = audit.replace(marker, marker + "    ['entry.text || entry.label || entry.title', 'Baby Mode schedule uses saved item text'],\n");
  fs.writeFileSync(auditPath, audit);
}
