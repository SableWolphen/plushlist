const fs = require("fs");
const path = require("path");
const Babel = require("@babel/standalone");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const match = html.match(/<script id="app-source" type="text\/plain">([\s\S]*?)<\/script>/);

if (!match) throw new Error("Could not find the PlushLife app source in index.html");

Babel.transform(match[1], {
  presets: [["react", { runtime: "classic" }]],
  filename: "index.html",
});

const requiredRegressionMarkers = [
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
  'function MamasCorner({ incompleteTasks, onConfirmTask, caregiverName = "Mommy", parentVoice = "motherly" })',
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
  'const [journalQuickOpenDate, setJournalQuickOpenDate] = useState(() => trackerPeriod().date);',
  '.select("body, prompt")',
  'prompt: journalPromptToSave',
  'The question was not saved with this older entry.',
  'JOURNAL FOR {new Date(`${journalQuickOpenDate}T12:00:00Z`)',
  '📮 PLUSHWEEK · WEEKLY INTENTION',
  'Weekly planning and Sunday follow-up · separate from PlushJournal',
  '📮 PLUSHWEEK',
  'What do I want to carry with me this week?',
  'plushlife-journal-prompt-${user.id}-${period.date}',
  'Your daily PlushJournal prompt',
  "📝 Open today's PlushJournal",
  'const openTodayJournal = async () => {',
  '📖 PLUSHJOURNAL HISTORY',
  'reflectionHistory.slice(0, 10)',
];

for (const marker of requiredRegressionMarkers) {
  if (!match[1].includes(marker)) {
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
  if (match[1].includes(marker)) {
    throw new Error(`Found obsolete native/card-wide drag marker: ${marker}`);
  }
}

console.log("App source compiles successfully.");
