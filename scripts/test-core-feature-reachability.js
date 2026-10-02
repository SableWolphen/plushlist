const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
const expect = (condition, label) => checks.push([Boolean(condition), label]);

const app = read("src/app-source.jsx");
const today = read("src/components/today-panel.jsx");
const todayCore = read("src/components/today-panel-core.jsx");
const tasks = read("src/components/tasks-panel.jsx");
const care = read("src/components/care-panel.jsx");
const progress = read("src/components/progress-panel-core.jsx");
const guardian = read("src/components/guardian-panel.jsx");
const together = read("src/components/together-corner.jsx");
const rewards = read("src/components/rewards-panel.jsx");
const settings = read("src/components/organized-settings.jsx");
const weekly = read("assets/weekly-reflection-window.js");
const taskPrivacy = read("supabase/migrations/20261002001500_tighten_task_privacy.sql");

expect(app.includes("setCheckInPopupOpen(true)") && app.includes("dailyCheckInLoaded"), "daily check-in can still surface automatically");
expect(app.includes("plushlife:daily-journal-prompt") && app.includes("setDailyJournalPromptOpen(true)"), "daily journal prompt remains automatic");
expect(weekly.includes("scheduleMaybeShow") && weekly.includes("maybeShow();") && weekly.includes("plushlife:weekly-reflection-request"), "weekly reflection remains automatic and manually reachable");
expect(app.includes("setWeeklyKickoffOpen(true)") && app.includes("setWeeklyKickoffNote(entries.find"), "weekly kickoff remains reachable and loads last week's intention");

expect(today.includes("<GentleDayTools") && today.includes("<ShapeMyDay") && today.includes("<EveningGratitude") && today.includes("<CozyDaily"), "Today retains adaptive day, evening journal, and cozy tools");
expect(today.includes("<RestDayCard") && today.includes("<HabitStudio compact"), "Today retains rest-day and habit tools");
expect(todayCore.includes("A little more, when you want it") && todayCore.includes("Reflect on my week · optional"), "Today keeps secondary tools reachable without crowding Home");

expect(tasks.includes("🗑️ Delete") && tasks.includes("startEditingTask") && tasks.includes("QuickCapture"), "Tasks retains add, edit, and delete");
expect(tasks.includes("importTasksFromText") && tasks.includes("starterPack"), "Tasks retains import and starter-pack paths");
expect(app.includes('.eq("user_id", user.id).order("sort_order")') && taskPrivacy.includes("can_view_tasks"), "task loading stays user-scoped and Guardian sharing remains permission-gated");

expect(care.includes("setCheckInPopupOpen(true)") && care.includes("CareHistory"), "Care retains check-in and journal/check-in history");
expect(care.includes("PLUSH_PATHS") && care.includes("SLEEP_TOOLS") && care.includes("soundscape"), "Care retains paths, sleep, and sound tools");

expect(progress.includes("HabitGardenCard") && progress.includes("Show insights & monthly trends"), "Progress retains habit garden and deeper insights");
expect(read("src/components/progress-gold-views.jsx").includes("My story") && read("src/components/progress-gold-views.jsx").includes("Care garden"), "Progress story and care-garden views remain available");

expect(guardian.includes("TogetherCorner") && guardian.includes("Sharing & care agreement"), "Guardian retains Together and sharing controls");
expect(together.includes("Do It Together") && together.includes("setParticipationState") && together.includes("startTimer"), "Do It Together retains co-op participation and timers");

expect(rewards.includes("Next little unlock") && rewards.includes("winsJarEntries"), "Rewards retains unlock progress and wins jar");
expect(settings.includes("Download my data") && settings.includes("Restore from backup") && settings.includes("Privacy & Data"), "Settings retains backup, restore, and privacy tools");

expect(app.includes("PopupCloseButton") && app.includes('aria-label="Close"'), "popup escape controls remain present");
expect(app.includes("swUpdate") || app.includes("update notice") || app.includes("Update now"), "app update notice path remains present");

const failures = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(ok ? "✓" : "✗", label);
if (failures.length) {
  console.error("\nCore feature reachability audit failed:", failures.map(([, label]) => label).join("; "));
  process.exit(1);
}
console.log("\nCore feature reachability checks passed:", checks.length);
