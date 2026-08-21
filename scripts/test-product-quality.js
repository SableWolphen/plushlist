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
const taskIntelligence = read("src/task-intelligence.mjs");
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
const deviceBackup = read("src/device-backup.js");
const goldAccess = read("src/plush-gold.js");
const goldPreview = read("src/components/plush-gold-preview.jsx");
const landing = read("src/components/landing.jsx");
const loginPage = read("login.html");
const calmHome = read("src/components/calm-home-controls.jsx");

const checks = [
  [deviceBackup.includes("indexedDB") && deviceBackup.includes("DEVICE_BACKUP_TABLES") && deviceBackup.includes("cloudDataDeleted: false"), "on-device backup is additive and never deletes cloud data"],
  [deviceBackup.includes("MAX_DEVICE_SNAPSHOTS = 3") && deviceBackup.includes("verifyDeviceBackup") && deviceBackup.includes("SHA-256"), "device backup keeps verified recovery snapshots"],
  [deviceBackup.includes("AUTO_BACKUP_START_DELAY_MS = 30000") && deviceBackup.includes("BACKUP_QUERY_BATCH_SIZE = 4"), "automatic device backup stays off the critical startup window and avoids a network burst"],
  [runtime.includes("PREFETCH_DELAY_MS = 8000") && runtime.includes("PREFETCH_LIMIT = 2"), "lazy-panel prefetch waits until after startup and limits background competition"],
  [deviceBackup.includes("caregiver_links") === false && deviceBackup.includes("push_subscriptions") === false && deviceBackup.includes("supporter_payments") === false, "device backup excludes relationship, push-token and payment rows"],
  [appSource.includes("scheduleAutomaticDeviceBackup") && appSource.includes("refreshDeviceBackup") && !appSource.includes("email: user.email || null"), "app creates device backups and minimizes presence data"],
  [settings.includes("On-device backup") && settings.includes("Nothing is deleted from the cloud automatically"), "Privacy & Data explains lossless device backup behavior"],
  [landing.includes("PlushLife Free") && landing.includes("Plush Gold") && landing.includes("FREE PREVIEW"), "signed-out landing compares Free and Gold"],
  [loginPage.includes("PlushLife Free") && loginPage.includes("Plush Gold") && loginPage.includes("FREE PREVIEW"), "dedicated login page compares Free and Gold"],
  [landing.includes("No payment is required right now") && loginPage.includes("No payment required right now"), "login tier comparison clearly keeps Gold free during preview"],
  [goldAccess.includes('PLUSH_GOLD_ACCESS_MODE = "free_preview"') && goldAccess.includes("PLUSH_GOLD_BILLING_ENABLED = false"), "Plush Gold stays fully unlocked with billing disabled during preview"],
  [goldAccess.includes("advanced_growth_insights") && goldAccess.includes("smart_next_step") && goldAccess.includes("adaptive_habit_coaching") && goldAccess.includes("advanced_reminders") && goldAccess.includes("habit_experiments") && goldAccess.includes("recovery_intelligence") && goldAccess.includes("expanded_growth_history") && goldAccess.includes("multiple_focus_habits") && goldAccess.includes("advanced_planning") && goldAccess.includes("advanced_personalization") && goldAccess.includes("priority_history_protection") && goldAccess.includes("gold_reports"), "Plush Gold has one central registry for current and reserved premium capabilities"],
  [goldPreview.includes("Everything is included free for now") && goldPreview.includes("Billing off · free preview"), "Plush Gold preview stays discoverable during the free preview"],
  [settings.includes("Plush Gold Preview") && settings.includes("<PlushGoldPreview />"), "Plush Gold preview is discoverable from Settings"],
  [progress.includes('hasGoldFeature("advanced_growth_insights")') && smartNextStep.includes('hasGoldFeature("smart_next_step")') && background.includes('hasGoldFeature("adaptive_habit_coaching")'), "advanced intelligence routes through the Gold entitlement model"],
  [completed.includes("COMPLETED_LINGER_MS = 4200"), "completed tasks stay visible long enough for an easy undo"],
  [completed.includes("Undo is available for a few seconds") && completed.includes("moved to Completed Today"), "screen-reader completion and undo announcements exist"],
  [today.includes("useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || [])"), "all Today modes use shared completion flow"],
  [today.includes("<LazyLowScreenToday {...modeProps} />") && today.includes("<CompletedTaskArea"), "Low Screen mode exposes Completed Today"],
  [today.includes("LowScreenJustCompleted") && today.includes("JUST COMPLETED"), "Low Screen keeps a completed task crossed off during the linger period"],
  [baby.includes("CompletedTaskArea") && baby.includes("recentlyCompletedKeys"), "Baby Mode uses the same completion lifecycle"],
  [baby.includes("✓ {completedCount}") && baby.includes("waiting.map((task, index)"), "Baby Mode keeps completed work collapsed while showing the simple Little Jobs list"],
  [!baby.includes("YOUR TINY THING") && baby.includes("todayCardIndex = 1"), "Baby Mode starts with Little Jobs instead of a duplicate Tiny Thing card"],
  [today.includes("if (props.babyMode)") && today.includes("{weeklyReminder}{backgroundEngine}{liveRegion}") && today.includes("<LazyBabyToday {...modeProps} />"), "Baby Mode keeps background learning active without the normal Today recommendation stack"],
  [today.includes("DAY {dayNumber} OF 3") && today.includes("activityDaysTotal >= 3") && today.includes("Now PlushLife starts noticing"), "new users get a focused three-day introduction"],
  [today.indexOf("<FirstDaysGuide") < today.indexOf("<TodayPanelCore"), "first-days guidance is promoted above the main Today flow"],
  [today.includes("homeSettings.insights") && today.includes("homeSettings.extras"), "deep smart insights and extra Today tools stay off the default surface"],
  [calmHome.includes("I'm struggling") && calmHome.includes("help me restart") && calmHome.includes("setCalmQuickOpen"), "Today has one visible struggle and restart entry point"],
  [calmHome.includes("make today tiny") && calmHome.includes("open care") && calmHome.includes("edit habits"), "calm commands translate plain-language needs into actions"],
  [calmHome.includes('window.addEventListener("online"') && calmHome.includes('window.addEventListener("offline"') && calmHome.includes("sync when you reconnect"), "offline status is explicit and reconnect behavior is reassuring"],
  [calmHome.includes("COMPANION TONE") && calmHome.includes("BACKGROUND FEEL") && calmHome.includes("plushlife:calm-home:v1"), "companion tone and background feel are customizable and persist locally"],
  [today.includes("Give the week a direction") && today.includes("Add weekly intention") && today.includes("SundayCloseWeek"), "first-days onboarding and Sunday closeout reinforce the weekly intention loop"],
  [today.includes('stored === "done" || stored === "shown"') && today.includes("visits >= 3") && today.includes("Skip this week"), "weekly intention reminder appears at most once per week and stays easy to skip"],
  [companionCore.includes("const inFirstWeek = firstWeekElapsed <= 7") && !companionCore.includes("firstWeekDay <= 7 &&"), "Companion first-week guide actually ends after day seven"],
  [today.includes("<CompactAnchor {...modeProps} />"), "Today keeps the compact focus-habit card available without crowding the default surface"],
  [!today.includes("HabitRetentionTools") && !today.includes("HabitResilienceSuite"), "advanced habit tool suites stay off Today"],
  [anchor.includes("FOCUS HABIT") && anchor.includes("focus_habit_id") && !anchor.includes("HABIT ASSIST") && !anchor.includes("HABIT RESILIENCE"), "Focus Habit stays compact and persistent"],
  [anchor.includes('String(row.habitType || "regular") !== "regular"') && anchor.includes("Only habits are shown here"), "Focus Habit picker excludes regular tasks and shows habits only"],
  [anchor.includes("focus_habit_selected_at") && anchor.includes("anchors: { ...(latest.anchors || {}), [date]: id }"), "Focus Habit preserves existing anchor intelligence compatibility"],
  [today.includes("useSmartNextStep") && smartNextStep.includes("focusHabitId") && smartNextStep.includes("rankSmartTask") && taskIntelligence.includes("preferredPeriod") && taskIntelligence.includes("stability") && taskIntelligence.includes("completionLikelihood") && taskIntelligence.includes("lowCapacity"), "One Next Step quietly ranks Focus Habit, timing, stability and capacity"],
  [today.includes('dayType === "rest" ? null') && today.includes("smartNextStep.task || props.nextStepTask") && today.includes("smartNextStepHidden ? null"), "Next Step stays available across caring day modes while Rest Day remains quiet"],
  [today.includes("CapacityNudge") && today.includes("Today may fit better a little lighter") && today.includes("Use {label}") && smartNextStep.includes("capacityForecast"), "PlushHome can suggest a gentler day without forcing a mode change"],
  [today.includes('if (dayType === "full" && !changed) return null') && today.includes("Gentler versions + one next step") && today.includes("Smallest meaningful steps"), "day-mode cue stays quiet on ordinary Full Days but explains adaptive modes"],
  [today.includes("PersonalLearningLine") && today.includes("PlushLife noticed:") && today.includes("DayWrapUp"), "Today surfaces compact personal learning and end-of-day continuity"],
  [anchor.includes('data-plushlife-compact-card="focus-habit"') && anchor.includes('>{focusId ? "Change" : "Choose"}</button>'), "Focus Habit uses the compact mobile summary layout"],
  [todayCore.includes('data-plushlife-compact-card="next-step"') && todayCore.includes('data-plushlife-compact-card="plushweek"'), "Next Step and PlushWeek use compact mobile summary cards"],
  [todayCore.includes('whiteSpace: "nowrap"') && todayCore.includes('textOverflow: "ellipsis"'), "compact Today summaries prevent long text from growing the page"],
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
