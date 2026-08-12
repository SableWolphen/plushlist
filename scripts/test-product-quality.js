const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const today = read("src/components/today-panel.jsx");
const todayCore = read("src/components/today-panel-core.jsx");
const completed = read("src/components/completed-task-flow.jsx");
const baby = read("src/components/baby-today.jsx");
const progress = read("src/components/progress-panel.jsx");
const growthMove = read("src/components/growth-next-move.jsx");
const smartNextStep = read("src/components/smart-next-step.jsx");
const shared = read("src/components/shared.jsx");
const settings = read("src/components/organized-settings.jsx");
const anchor = read("src/components/compact-anchor.jsx");
const background = read("src/components/habit-background-engine.jsx");
const companion = read("src/components/daily-companion.jsx");
const companionCore = read("src/components/daily-companion-core.jsx");
const companionSync = read("src/components/companion-cloud-sync.jsx");
const lowScreenMode = read("src/components/low-screen-mode.jsx");
const appSource = read("src/app-source.jsx");
const runtime = read("assets/plush-runtime.js");
const syncWww = read("scripts/sync-www.js");
const packageJson = read("package.json");

const checks = [
  [completed.includes("COMPLETED_LINGER_MS = 2600"), "completed tasks linger before moving"],
  [completed.includes("moved to Completed Today"), "screen-reader completion announcement exists"],
  [today.includes("useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || [])"), "all Today modes use shared completion flow"],
  [today.includes("<LazyLowScreenToday {...modeProps} />") && today.includes("<CompletedTaskArea"), "Low Screen mode exposes Completed Today"],
  [today.includes("LowScreenJustCompleted") && today.includes("JUST COMPLETED"), "Low Screen keeps a completed task crossed off during the linger period"],
  [baby.includes("CompletedTaskArea") && baby.includes("recentlyCompletedKeys"), "Baby Mode uses the same completion lifecycle"],
  [today.includes("FIRST WEEK · DAY") && today.includes("activityDaysTotal >= 7"), "new users get a focused seven-day introduction"],
  [companionCore.includes("const inFirstWeek = firstWeekElapsed <= 7") && !companionCore.includes("firstWeekDay <= 7 &&"), "Companion first-week guide actually ends after day seven"],
  [today.includes("<CompactAnchor {...modeProps} />"), "Today uses the compact anchor instead of the full habit toolbox"],
  [!today.includes("HabitRetentionTools") && !today.includes("HabitResilienceSuite"), "advanced habit tool suites stay off Today"],
  [anchor.includes("TODAY'S ANCHOR") && !anchor.includes("HABIT ASSIST") && !anchor.includes("HABIT RESILIENCE"), "compact anchor stays focused"],
  [today.includes("useSmartNextStep") && smartNextStep.includes("profile.preferredPeriod") && smartNextStep.includes("profile.stability") && smartNextStep.includes("anchorId"), "One Next Step quietly ranks anchor, timing, stability and capacity"],
  [todayCore.includes("nextStepReason") && todayCore.includes("No catching up. We're only looking at today."), "Today explains smart next-step choices and keeps comeback language guilt-free"],
  [todayCore.includes("Resume normally") && todayCore.includes("Essentials only") && todayCore.includes("Lighter routine"), "returning users get clear restart choices"],
  [today.includes("LazyHabitBackgroundEngine") && today.includes("requestIdleCallback"), "quiet habit engine loads after the first paint"],
  [today.includes('import("./baby-today.jsx")') && today.includes('import("./habit-retention.jsx")'), "optional Today modes are code-split"],
  [today.includes("today-interactive") && today.includes("background-intelligence-start"), "Today records usable and background-work timing separately"],
  [companion.includes('import("./daily-companion-core.jsx")') && !companion.includes('import { DailyCompanion as DailyCompanionCore }'), "collapsed companion keeps its heavy core out of startup"],
  [lowScreenMode.includes("__retention") && !lowScreenMode.includes("HabitRetentionTools"), "low-screen detection stays lightweight"],
  [background.includes("dominantMissReason") && background.includes("preferredHour") && background.includes("stability"), "background engine learns friction, timing and stability"],
  [background.includes("suggestedRamp") && background.includes("suggestedVisibleCount"), "background engine learns recovery and daily load"],
  [background.includes("crossPatterns") && background.includes("experimentResults"), "background engine evaluates cross-patterns and experiments"],
  [background.includes("maintenanceDue") && background.includes("MAX_EVENTS") && background.includes("450"), "background engine prunes, maintains and throttles work"],
  [progress.includes("<GrowthNextMove />") && growthMove.includes("BEST NEXT ADJUSTMENT") && growthMove.includes("observed days"), "PlushGrowth puts one evidence-backed adjustment before deeper analytics"],
  [progress.includes("Why PlushLife thinks this:"), "habit insights explain their evidence"],
  [progress.includes("LazyWeeklyHabitReview") && progress.includes("insightsOpen"), "deep PlushGrowth tools wait until Habit Insights is opened"],
  [settings.includes("REMINDER LOAD") && settings.includes("This suggestion comes from your own recent check-in timing."), "reminders include quiet load guidance and evidence for timing suggestions"],
  [settings.includes("Reduce visual decisions, ambient theme effects, and extra decoration."), "Simple Layout explains its ambient-theme impact inline"],
  [companionSync.includes("FALLBACK_SYNC_MS = 120000") && companionSync.includes("plushlife:habit-coach-updated") && !companionSync.includes("12000)"), "companion sync is event-driven instead of frequent polling"],
  [appSource.includes("WARM_START_CACHE_VERSION = 1") && appSource.includes("warm-cache-hydrated") && appSource.includes("tracker-sync-ready"), "signed-in warm starts hydrate locally before server refresh"],
  [appSource.includes("React.useMemo(() => new Map") && appSource.includes("requiredKeysCache = new Map"), "history maps and repeated schedule lookups avoid redundant render work"],
  [runtime.includes("first-user-interaction") && runtime.includes("boot-shell-ready") && runtime.includes("first-app-render"), "local diagnostics separate boot, app render and first interaction"],
  [syncWww.includes("plush-boot-shell") && syncWww.includes("Critical app entry:"), "production build provides an instant boot shell and reports critical bundle size"],
  [packageJson.includes("check-bundle-budget.js"), "production sync enforces the permanent bundle budget"],
  [shared.includes("previousActive") && shared.includes("firstFocusable"), "dialogs restore and manage keyboard focus"],
  [shared.includes("minHeight: 44"), "shared dialog action meets minimum touch target"],
  [shared.includes("Simple Layout reduces ambient theme effects"), "Simple Layout/theme interaction is explained"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Product quality regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Product quality checks passed (${checks.length}).`);
