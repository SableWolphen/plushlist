const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

// module split phase 5: the app source is no longer an inline
// <script id="app-source"> block in index.html — it's src/app-source.jsx,
// which imports files under src/components/ (see scripts/sync-www.js).
// Bundle it the same way sync-www.js does as the "compiles successfully"
// check.
const appSourcePath = path.join(__dirname, "..", "src", "app-source.jsx");
const componentsDir = path.join(__dirname, "..", "src", "components");
const appSource = fs.readFileSync(appSourcePath, "utf8");
const componentsSource = fs.readdirSync(componentsDir)
  .filter((file) => file.endsWith(".jsx"))
  .map((file) => fs.readFileSync(path.join(componentsDir, file), "utf8"))
  .join("");

esbuild.buildSync({
  entryPoints: [appSourcePath],
  bundle: true,
  write: false,
  format: "iife",
  loader: { ".jsx": "jsx" },
  jsx: "transform",
});

// Some regression markers below cover content that has since moved out of
// the inline app-source block into the assets/plush-*.js modules (mascot
// outfits, appearance themes, small pure helpers, schedule/date/task
// utilities, billing provider, etc.) and, as of phases 5-6, into
// src/components/*.jsx (ToolPanel, HabitTypeIcon, PlushMascot, NurseryNook,
// AppLoadingScreen, BabyArrivalRitual, MamasCorner, BabyModeCareSuite,
// LandingPage) — check markers against all of them so a marker still passes
// if its content moved rather than disappeared.
const movedModuleFiles = ["plush-content.js", "plush-helpers.js", "plush-schedule.js", "plush-billing.js"];
const movedModulesText = movedModuleFiles
  .map((file) => fs.readFileSync(path.join(__dirname, "..", "assets", file), "utf8"))
  .join("");
const searchableSource = (appSource + componentsSource + movedModulesText).replace(/\r\n/g, "\n");

const requiredRegressionMarkers = [
  'Close habit tools',
  '<HabitCoach {...props}>',
  // WEEKDAY_PRESET_IDS/WEEKEND_PRESET_IDS are exported by
  // assets/plush-schedule.js but were missing from app-source.jsx's
  // top-level destructuring of window.PlushLifeSchedule — a real bug
  // (ReferenceError at runtime, not caught by esbuild since bare
  // identifier references aren't statically checked) discovered while
  // extracting the "Change my tasks" panel in module split phase 7.
  'WEEKDAY_PRESET_IDS,\n  WEEKEND_PRESET_IDS,\n} = window.PlushLifeSchedule;',
  'const [onboardingMode, setOnboardingMode] = useState(null);',
  'onboardingMode === "supporter"',
  '.from("weekly_intentions")',
  'Open Guardian invitations 💛',
  'pendingInviteAutoOpenedFor',
  'const invitation = supportLinks.find((link) => link.id === linkId);',
  'const isGuardianAccount = !!user && trackerProfile?.account_type === "caretaker";',
  'GUARDIAN SUPPORT DASHBOARD',
  '{ id: "guardian", label: "Guardian", icon: "💛", accent: "#318C79" }',
  '🧸 My Guardians',
  '💛 People I Support',
  'Nothing is shared until they accept, and you choose every permission.',
  'STARTER PACKS · ADD A GENTLE HEAD START',
  'const addStarterPack = async () => {',
  'Nothing you already had was changed.',
  'Add another one anyway?',
  'Import ${duplicateNames.length === 1 ? "it" : "them"} again anyway?',
  'const careAreas = (() => {',
  '📖 YOUR CARE STORY',
  '🪴 CARE AREAS',
  'const [progressView, setProgressView] = useState("overview");',
  'aria-label="Progress views"',
  'className="habit-insights-card"',
  '🌱 HABIT INSIGHTS',
  'const APPEARANCE_THEMES = [',
  'Rainy-Day Coat',
  'AMBIENT THEME',
  'appearanceTheme !== "soft"',
  'Ambient themes never recolor content.',
  'A little hello from Mommy 🍼',
  'const MOTHERLY_NICKNAMES = [',
  'function NurseryNook({ outfit, mood, activityDays, onOpenCloset })',
  'MY LITTLE NURSERY',
  'function BabyModeCareSuite({ date, todayDone, todayTotal, activityDays, careDays, caregiverName, comfortItemName, littleJobs, onCompleteTask, onManageTasks, onOpenJournal })',
  'LITTLE CARE CORNER',
  'BEDTIME WIND-DOWN',
  'Today’s little-win sticker: Super Cozy Helper',
  'const WINS_JAR_NOTES = [',
  'YOUR WINS JAR',
  'yearlight-crown',
  'case "reflection_count": return reflectionDates.length;',
  'STILL TO UNLOCK',
  'Your progress is shown on each reward',
  'function BabyArrivalRitual({ comfortItemName, onShowTinyThing, onSoftDay, onShowPlanner })',
  'LITTLE SPACE ARRIVAL',
  'NURSERY KEEPSAKE WALL',
  'BEDTIME NEST',
  'MY LITTLE JOBS',
  'function MamasCorner({ userId, incompleteTasks, onConfirmTask, caregiverName = "Mommy", parentVoice = "motherly", supabase })',
  'supabase.from("mommy_chat_threads")',
  'className="mamas-private-window" role="dialog" aria-modal="true"',
  'PRIVATE {caregiverName.toUpperCase()}’S CORNER',
  'const isMamaCornerProfile = (user?.email || "").trim().toLowerCase() === "johnston.alexander.k@gmail.com";',
  'const taskPointerDragRef = React.useRef(null);',
  'const startPointerTaskDrag = (event, taskKey, taskLabel) => {',
  'data-plushlife-task-drag-scope',
  'const sectionsFromOtherLists = trackerTasks',
  'const moveTaskGroup = async (section, direction, visibleSections = taskGroupOrder) => {',
  'aria-label={`Move ${header} group earlier`}',
  'const babyCaregiverName = preferences.baby_voice === "fatherly" ? "Daddy" : "Mommy";',
  'const hasStarLampAndBasket = activityDays >= 10;',
  'function littleSpaceTaskLabel(label) {',
  'Let\'s take care of “${task}” together, one tiny step at a time',
  'Let\'s help the clothes get clean and cozy',
  'Let\'s take care of one important money step',
  '🧸 MY LITTLE JOBS',
  '{babyMode ? "🧸 Little Jobs" : "✓ Tasks"}',
  'littleJobs={rows.filter((row) => !viewDone[row.key])}',
  '✏️ Change my little jobs',
  'const [showAllLittleJobs, setShowAllLittleJobs] = React.useState(false);',
  'const visible = showAllLittleJobs ? waiting : waiting.slice(0, 4);',
  'const [journalQuickOpenDate, setJournalQuickOpenDate] = useState(() => trackerPeriod().date);',
  '.select("body, prompt")',
  'prompt: journalPromptToSave',
  'reflectionViewerPrompt || reflectionPromptForDay(dayIdForDate(reflectionViewerDate)',
  'JOURNAL FOR {new Date(`${journalQuickOpenDate}T12:00:00Z`)',
  '📮 PLUSHWEEK · WEEKLY INTENTION',
  'Weekly planning and Sunday follow-up · separate from PlushJournal',
  '📮 PLUSHWEEK',
  'What do I want to carry with me this week?',
  'plushlife-journal-prompt-${user.id}-${period.date}',
  'Your daily PlushJournal prompt',
  "📝 Open today's PlushJournal",
  'const openTodayJournal = async () => {',
  '{ id: "today", label: "PlushHome"',
  '{ id: "week", label: "PlushCalendar"',
  '{ id: "care", label: "PlushCare"',
  '{ id: "progress", label: "PlushGrowth"',
  'babyMode && item.id === "today" ? "Nursery" : item.label',
  'setJournalQuickOpen(true);',
  '📖 PLUSHJOURNAL HISTORY',
  'journalHistoryExpanded ? reflectionHistory.length : 5',
  '📮 PLUSHWEEK HISTORY',
  'weeklyIntentionHistoryExpanded ? weeklyIntentionHistory.length : 5',
];

for (const marker of requiredRegressionMarkers) {
  if (!searchableSource.includes(marker)) {
    throw new Error(`Missing onboarding/weekly-intention regression marker: ${marker}`);
  }
}

const prohibitedRegressionMarkers = [
  'startTaskCardTouchDrag',
  'draggable={draggableTodayTask}',
  'draggable="true"',
  'BIG FEELINGS TRANSLATOR',
];

for (const marker of prohibitedRegressionMarkers) {
  if (appSource.includes(marker)) {
    throw new Error(`Found obsolete native/card-wide drag marker: ${marker}`);
  }
}

console.log("App source compiles successfully.");
