const fs = require('fs');
const path = 'scripts/patch-simplify-home.js';
let source = fs.readFileSync(path, 'utf8');
const bad = 'border: arrangeTodayTasks ? `1px solid ${day.accent}` : "1px solid #E6D4F2"';
const good = 'border: arrangeTodayTasks ? "1px solid " + day.accent : "1px solid #E6D4F2"';
if (!source.includes(bad)) throw new Error('Expected patch syntax marker not found');
source = source.replace(bad, good);
fs.writeFileSync(path, source);
