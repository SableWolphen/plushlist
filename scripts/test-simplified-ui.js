const fs = require("fs");
const assert = require("assert");

const app = fs.readFileSync("src/app-source.jsx", "utf8");
const today = fs.readFileSync("src/components/today-panel.jsx", "utf8");
const todayCore = fs.readFileSync("src/components/today-panel-core.jsx", "utf8");
const progress = fs.readFileSync("src/components/progress-panel-core.jsx", "utf8");
const settings = fs.readFileSync("src/components/organized-settings.jsx", "utf8");
const content = fs.readFileSync("assets/plush-content.js", "utf8");

assert.match(app, /primaryDashboardItems = dashboardItems\.filter\(\(item\) => item\.id !== "week"\)/);
assert.match(content, /id: "today", label: "Today"/);
assert.match(content, /id: "progress", label: "Progress"/);
assert.match(content, /id: "care", label: "Support"/);
assert.match(progress, /Calendar & history/);
assert.match(today, /Help & extras/);
assert.match(todayCore, /data-plushlife-compact-card="plushweek" aria-hidden="true"/);
assert.match(settings, /More settings \(\$\{hiddenSettingCount\}\)/);

console.log("Simplified UI regression checks passed.");
