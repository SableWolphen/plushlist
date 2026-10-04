#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const growth = read("src/components/growth-next-move.jsx");
const growthMoments = read("src/components/growth-moments.jsx");
const recommendations = read("src/components/recommendation-settings.jsx");
const weekly = read("assets/weekly-reflection-window.js");
const reward = read("assets/gentle-reward.js");
const states = read("assets/state-polish.js");
const entitlements = read("assets/entitlements.js");
const app = read("src/app-source.jsx");
const today = read("src/components/today-panel-core.jsx");
const widgetSettings = read("src/components/widget-settings.jsx");
const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };

expect(growth.includes("Why this suggestion?") && growth.includes("WHAT PLUSHLIFE KNOWS LATELY"), "Growth must explain suggestions and distinguish learned patterns");
expect(growth.includes("What PlushLife changed and why") && growth.includes("growth-adjustment-history"), "Growth must keep a local change explanation history");
expect(growth.includes("10-SECOND GROWTH CHECK"), "Growth must remain quickly scannable");
expect(growth.includes("WHAT CHANGED SINCE YESTERDAY"), "Growth must surface recent recommendation changes without hiding the reason");
expect(growthMoments.includes("Nothing to review yet") && growthMoments.includes("meaningful moments"), "empty Growth moments must explain what happens next");
expect(recommendations.includes("HOW PLUSHLIFE LEARNS") && recommendations.includes("What it is still unsure about"), "recommendation settings must include a clear trust layer");
expect(recommendations.includes("forget this pattern") && recommendations.includes("Learned from"), "learned suggestions must expose evidence and a forget control");
expect(weekly.includes("reflectionLines") && weekly.includes("YOUR WEEK IS READY"), "weekly reflection must be personalized instead of static");
expect(weekly.includes("YOUR COZY WEEK") && weekly.includes("Little space arrival"), "nursery mode must get its own weekly reflection tone");
expect(weekly.includes("day === 0") && weekly.includes("day === 1") && weekly.includes("day === 2"), "weekly reflection must keep the Sunday evening through Tuesday grace window");
expect(!weekly.includes("fetch("), "weekly reflection must remain local-only");
expect(reward.includes("plushlife:task-completion-feedback") && reward.includes("plushlife-soft-reward"), "completion atmosphere must respond to the existing completion event");
expect(reward.includes("prefers-reduced-motion:reduce"), "completion atmosphere must respect reduced motion");
expect(states.includes('[role="status"]') && states.includes('[role="alert"]'), "loading and error states must share polish rules");
expect(states.includes("max-width:340px") && states.includes("orientation:landscape"), "edge-state polish must cover very small phones and short landscape screens");
expect(states.includes("forced-colors:active") && states.includes("prefers-reduced-motion:reduce"), "edge-state polish must preserve accessibility modes");
expect(!states.includes("MutationObserver"), "state polish stays CSS-only instead of mutating React-owned DOM");
expect(entitlements.includes("./assets/state-polish.js") && entitlements.includes("./assets/gentle-reward.js") && !entitlements.includes("./assets/resume-context.js"), "experience layers must load without the removed resume prompt");
expect(!entitlements.includes("enforced: true"), "experience work must not activate billing entitlements");
expect(!entitlements.includes("keepFullTodayTaskListStable") && !entitlements.includes("plushlife-full-task-list-override"), "Today layout stability is declarative, not injected after render");
expect(app.includes('className="classic-sync-strip"') && app.includes('borderRadius: 999') && !app.includes('{syncStatus === "error" ? "Retry" : "Sync now"}'), "Home sync status stays a compact single control");
expect(app.includes('id="plushlife-checkin-trigger"') && app.includes('style={{ display: "none" }}') && today.includes("pl-reference-quick-grid"), "Home check-in stays reachable without duplicating a status banner above the reference layout");
expect(today.includes("pl-home-today-row") && !today.includes("Start a gentle timer"), "Today header stays compact and does not duplicate the large timer control");
expect(today.includes("min-height:128px!important") && today.includes("pl-home-cozy-link"), "mobile Home hero stays compact while Cozy Space remains reachable");
expect(today.includes('border: "1px solid var(--pl-theme-line)"') && today.includes('background: C.card'), "Home cards use theme surfaces instead of light-only card chrome");
expect(widgetSettings.includes("var(--pl-theme-surface-2)") && widgetSettings.includes("var(--pl-theme-bg)") && widgetSettings.includes("var(--pl-theme-accent-2)"), "widget preview follows the active app theme");

if (failures.length) {
  console.error("Product experience checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Product experience checks passed (${27} checks).`);
