import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";

const home = fs.readFileSync("src/components/storybook-home.jsx", "utf8");
const today = fs.readFileSync("src/components/today-panel-core.jsx", "utf8");
const app = fs.readFileSync("src/app-source.jsx", "utf8");
const settings = fs.readFileSync("src/components/organized-settings.jsx", "utf8");
const styles = fs.readFileSync("assets/storybook-themes.css", "utf8");
const tasks = fs.readFileSync("src/components/tasks-panel.jsx", "utf8");
const care = fs.readFileSync("src/components/care-panel.jsx", "utf8");
const progress = fs.readFileSync("src/components/progress-panel-core.jsx", "utf8");

buildSync({ entryPoints: ["src/components/today-panel-core.jsx", "src/components/organized-settings.jsx", "src/components/care-panel.jsx", "src/components/progress-panel-core.jsx", "src/components/tasks-panel.jsx"], bundle: true, write: false, outdir: "out", format: "esm", platform: "browser", target: "es2022", loader: { ".jsx": "jsx" } });

assert(home.includes('aria-label="Today\'s checklist"'), "The actual Home checklist remains primary");
assert(home.indexOf('className="pl-storybook-today"') < home.indexOf('className="pl-storybook-doors"'), "Show tasks before actions");
assert(home.indexOf('className="pl-storybook-doors"') < home.indexOf('className="pl-storybook-lookahead"'), "Optional previews must not push daily actions below the fold");
for(const [label,action] of [
  ["Check in", "openDailyCheckIn?.()"],
  ["Journal", "openTodayJournal?.()"],
  ["Guardian", 'goToDashboard?.("guardian")'],
  ["Focus", "onClick={focus}"],
]){
  assert(home.includes('<strong>'+label+'</strong>'), "Daily action missing: "+label);
  assert(home.includes(action), "Daily action handler missing: "+label);
}
assert(home.includes('<QuickCapture compact onQuickAdd={onQuickAdd}'), "Home must create tasks inline");
assert(home.includes('toggle?.(row.key)'), "Checklist must still edit the real saved task state");
assert(home.includes("habitTypeForRow(row)"), "Habit identity must remain visible");
assert(!home.includes('className="pl-storybook-support"'), "Home should not duplicate Guardian settings");
assert(home.includes('goToDashboard?.("guardian")'), "Home offers the unified Guardian entry");
assert(home.includes("pl-storybook-lookahead") && home.includes("weekStory.line"), "Existing weekly recap and tomorrow plan remain available");
assert.equal((today.match(/className="pl-home-extras"/g)||[]).length,1,"Only one all-tools hub should remain");
assert.equal((today.match(/className="pl-storybook-planning"/g)||[]).length,1,"Only one planning drawer should remain");
assert(app.includes('<PlanNavigation view='), "Tasks and Calendar share Plan navigation");
assert(home.includes('setSettingsOpen?.(true)'), "Settings stay available directly from Home");
assert(today.includes('setCalmQuickOpen?.(true)'), "Calm stays available through daily support");
assert(care.includes('<CozySpace '), "Cozy Space remains available in Care");
assert(!today.includes('<details className="pl-home-advanced">'), "Do not nest a second More options drawer");

for(const feature of ["<DayAgenda tasks=","<CompletedToday rows=","{homeSections.habits}","{optionalTools}","<CozyDayHome userId=","<DayRescue currentMode="]) {
  assert(today.includes(feature), "Secondary feature was deleted rather than organized: "+feature);
}
assert(settings.includes('new Set(["personalize", "notifications", "privacy", "account"])'), "Everyday Settings must lead with four relevant categories");
for(const id of ["experience","recommendations","devices","rest","support","gold"]) {
  assert(settings.includes('["'+id+'",'),"Advanced settings missing: "+id);
}
assert(app.includes('<nav className="pl-app-bottom-nav" aria-label="Main navigation">'),"The existing five-tab navigation remains unchanged");
assert(tasks.includes("<QuickCapture onQuickAdd="), "Fast task creation remains available");
assert(styles.includes("grid-template-columns:repeat(4,minmax(0,1fr))"),"Daily actions must fit four across");
assert(styles.includes("#main-content .pl-home-tool-links"),"Explore tools must be easy to tap");
assert(styles.includes("var(--pl-theme-surface)"),"New UI must inherit the selected theme, including dark mode");
assert(styles.includes("@media(max-width:345px)"),"Small phones need a dedicated layout");

assert(care.includes("pl-reference-care-launchers"), "Care needs a clear four-action entry point");
assert(care.includes('onSupport={props.onOpenSupport}'), "Cozy Space retains access to the primary Guardian destination");
assert(!care.includes('className="pl-companion-care-entry"'), "Care should not repeat a separate Guardian promotional card");
assert(care.indexOf('className="pl-care-card"') < care.indexOf('>🧸 My Cozy Space</summary>'), "Care's actual help flow must precede advanced customization");
assert(care.includes('<CareHistory {...props} />'), "Care history must remain private and reachable");
assert(care.includes('<ExistingCarePanel {...props}'), "Calm, paths and sleep stay available");
assert(progress.includes('label: "Overview"') && progress.includes('label: "My Story"') && progress.includes('label: "Care Areas"'), "Progress views should have plain-English labels");
assert(progress.includes('className="pl-progress-highlights"') && progress.includes("<CozyWeeklyStory") && progress.includes("<LittleWins"), "Weekly win panels should be optional without losing entries");
assert(tasks.includes('["today", "Today"]'), "The default Tasks tab must clearly mean today");
assert(tasks.includes("Quick add · Just give it a name"), "Quick task creation should be labeled clearly");
console.log("Simplified PlushLife passed: focused Home, Care, Tasks, Progress, Settings, safe routing and theme-aware mobile layout.");
