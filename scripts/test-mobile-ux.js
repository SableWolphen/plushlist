const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const index = read("index.html");
const app = read("src/app-source.jsx");
const shared = read("src/components/shared.jsx");
const today = read("src/components/today-panel-core.jsx");
const care = read("src/components/care-panel.jsx");
const careExisting = read("src/components/care-panel-existing.jsx");
const progress = read("src/components/progress-panel-existing.jsx");
const growthMoments = read("src/components/growth-moments.jsx");
const careSources = `${care}\n${careExisting}`;
const tasks = read("src/components/tasks-panel.jsx");
const settings = read("src/components/organized-settings.jsx");
const taskPrivacy = read("supabase/migrations/20261002001500_tighten_task_privacy.sql");

const checks = [
  [care.includes('.pl-care-tabs.plushcare-library>div> :first-child') && !care.includes('.pl-care-tabs .plushcare-library'), "Care hides its legacy duplicate intro with a selector matching the library wrapper"],
  [careExisting.includes('className="pl-care-library-panel"') && care.includes('.plushcare-library .pl-care-library-panel'), "Care library styling targets its actual panels"],
  [!app.includes('.pl-unified-page-content section,') && !app.includes('.pl-unified-page-content details{'), "ambient themes do not paint structural grids and disclosures as white sheets"],

  [index.includes("viewport-fit=cover"), "viewport respects Android/iOS safe areas"],
  [index.includes("@media (pointer: coarse)") && index.includes("min-height: 44px"), "coarse-pointer controls meet the 44px touch target"],
  [shared.includes("overflow-x: clip") && shared.includes("max-width: 100%"), "shared UI prevents accidental horizontal page overflow"],
  [shared.includes("font-size: 16px !important") && shared.includes("max-width: 380px"), "small-screen form fields avoid browser zoom and cramped text"],
  [shared.includes("PanelErrorBoundary") && shared.includes("Your saved data was not changed"), "tool panels recover locally instead of taking down the whole app"],
  [today.includes('data-plushlife-compact-card="next-step"') && today.includes('data-plushlife-compact-card="plushweek"'), "Today keeps primary summary cards compact"],
  [today.includes('textOverflow: "ellipsis"') && today.includes('whiteSpace: "nowrap"'), "long Today labels are constrained instead of widening the page"],
  [careSources.includes('gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"') && careSources.includes('gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))"'), "Care tools reflow to available phone width"],
  [tasks.includes('minWidth: 0') && tasks.includes('width: "100%"') && tasks.includes('flexWrap: "wrap"'), "task editing fields and schedule controls can shrink/wrap on narrow phones"],
  [tasks.includes("showAllToday") && tasks.includes("Just a few at a time") && tasks.includes("See the rest"), "Tasks defaults to a small calm slice instead of showing the whole day at once"],
  [tasks.includes("More options for") && tasks.includes("🗑️ Delete") && tasks.includes("setPendingTaskDelete"), "visible task rows expose a direct delete action with confirmation"],
  [taskPrivacy.includes("can_view_tasks") && taskPrivacy.includes("accepted_at is not null") && taskPrivacy.includes("auth.uid()) = user_id"), "task RLS keeps lists private except explicitly permitted Guardian sharing"],
  [app.includes("padding-bottom:calc(104px + env(safe-area-inset-bottom))") && app.includes('bottom: "calc(68px + env(safe-area-inset-bottom))"'), "content and transient notices stay above the fixed bottom navigation"],
  [app.includes("/* compact-phone-shell */") && app.includes("padding-bottom:calc(104px + env(safe-area-inset-bottom))"), "main mobile shell keeps fixed navigation from covering content"],
  [app.includes(".pl-app-bottom-nav") && app.includes("min-height:50px") && app.includes(".pl-app-nav-add{width:38px"), "bottom navigation stays compact instead of becoming oversized"],
  [today.includes(".pl-home-hero{min-height:136px") && today.includes(".pl-home-copy h1{font-size:18px") && today.includes(".pl-home-bubble{right:6px"), "Home hero stays compact and avoids greeting/mascot overlap"],
  [today.includes(".pl-muted-note{display:none}") && today.includes('[data-plushlife-compact-card="next-step"]{padding:8px 9px 9px!important}'), "Home hides clipped helper copy and keeps the next-step card dense on phones"],
  [careExisting.includes('gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"'), "Quick Care tiles remain responsive on narrow phones"],
  [!careExisting.includes("linear-gradient(160deg,#1B2245,#2E3A6B 55%,#1B2245)") && careExisting.includes('background: "var(--pl-theme-surface)"'), "PlushSleep keeps the soft non-clinical Care styling"],
  [app.includes(".pl-ambient-theme-layer") && app.includes("--pl-theme-accent") && !app.includes("inset 0 0 0 8px"), "themes remain visible without restoring the heavy app frame"],
  [care.includes(".pl-care-title{margin-top:2px;font-size:15.5px") && care.includes(".pl-care-feeling{min-height:46px"), "Care cards stay compact on phones"],
  [care.includes(".plushcare-library .pl-care-tool{min-height:50px!important") && care.includes(".pl-care-shell{display:grid;gap:6px") && care.includes(".pl-care-spaces{padding:4px 0 0;border-radius:0;border:0;background:transparent;box-shadow:none}"), "Care library avoids oversized tiles and gaps"],
  [read("src/components/progress-panel-existing.jsx").includes(".pl-growth-stat{min-height:54px") && read("src/components/progress-panel-existing.jsx").includes(".pl-growth-heading{margin-top:2px;font-size:16px"), "Progress stays compact instead of dashboard-sized"],
  [read("src/components/week-panel.jsx").includes(".pl-calendar-cozy{display:grid;gap:7px") && read("src/components/week-panel.jsx").includes("border-radius:15px!important"), "Calendar keeps compact cards and spacing"],
  [app.includes("const homeScheduleDayId = dayIdForDate(period.date);") && app.includes("selectedSchedule={homeSelectedSchedule}") && app.includes("selectedScheduleExceptionEntries={homeScheduleExceptionEntries}"), "Home schedule is pinned to the actual current date instead of stale selected-day state"],
  [!today.includes("Long run with the girls") && !today.includes('firstTimed ?') && today.includes("No schedule set for today."), "Home schedule preview never invents placeholder schedule entries"],
  [today.includes("const visibleEntries = entries;") && !today.includes("entries.slice(0, 3)"), "Home shows the entire real schedule instead of truncating it"],
  [today.includes('onClick={() => goToDashboard?.("week")}') && app.includes('onClick={() => goToDashboard("week")} aria-label="Open calendar"'), "date controls open the Calendar"],
  [today.includes('onClick={() => setSettingsOpen?.(true)}') && app.includes('onClick={() => setSettingsOpen(true)} aria-label="Settings"'), "gear controls open Settings"],
  [app.includes('setCollectionOpen(true)') && app.includes('aria-label="Open rewards"') && app.includes('<DesignIcon name="plush"') && app.includes('<RewardsPanel inline={collectionOpen} open={collectionOpen}'), "bottom Plush button opens Rewards"],
  [progress.includes('className="pl-growth-weekbar"') && progress.includes('role="progressbar"') && progress.includes("props.weeklyOverallPct"), "Progress shows the current weekly progress bar"],
  [today.includes('aria-label="Tasks today"') && today.includes("function TasksToday") && today.includes('copy.Today || "Today"'), "Home includes a dedicated Today tasks section"],
  [today.includes("function isHabitRow") && today.includes("!isHabitRow(row)") && today.includes("rows.filter(isHabitRow)"), "Home separates regular tasks from habits instead of mixing them"],
  [app.includes(".pl-unified-page-hero{position:relative;overflow:visible") && app.includes("min-height:0;border-radius:0;background:transparent;border:0;box-shadow:none"), "non-Home page headers stay compact and do not become giant title cards"],
  [progress.includes('className="pl-growth-highlight-row"') && !progress.includes('✨ THIS WEEK’S LITTLE WINS</div>\n        <div className="pl-growth-heading">PlushGrowth'), "Progress avoids duplicating the page title in another card"],
  [growthMoments.includes("<details data-growth-plush-moments") && growthMoments.includes("<summary>") && !growthMoments.includes("borderRadius: 15, background: \"linear-gradient(145deg,#FFF9FD,#F7FCFA)\""), "empty PlushMoments guidance does not consume a full card"],
  [!care.includes("MamasCorner") && care.includes('className="pl-care-history-door pl-design-card"'), "Care removes the private corner and keeps history directly reachable"],
  [settings.includes('placeholder="Search settings"') && settings.includes("Privacy & Data") && settings.includes("Experience") && settings.includes("Notifications & Reminders"), "Settings keeps high-complexity options organized and discoverable"],
  [care.includes('summary style={{ minHeight: 44') && care.includes('>🧸 My Cozy Space</summary>'), "Care keeps the secondary Cozy Space collapsed until requested"],
  [read("src/components/progress-panel-core.jsx").includes('display: progressDetailsOpen ? undefined : "none"') && read("src/components/progress-panel-core.jsx").includes("Show insights & monthly trends"), "Progress keeps charts and deeper insights behind one reveal"],
  [settings.includes("primaryCategoryIds") && settings.includes("More settings ·"), "Settings shows common choices before advanced categories"],
  [read("src/components/guardian-panel.jsx").includes("shared with you</summary>") && read("src/components/guardian-panel.jsx").includes("More ways to support"), "Guardian keeps shared detail and secondary support tools collapsible"],
  [read("src/components/rewards-panel.jsx").includes("React.useState(4)") && read("src/components/rewards-panel.jsx").includes(".slice(0, 4)"), "Rewards previews a smaller collection instead of a wall of items"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Mobile UX regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Mobile UX checks passed (${checks.length}).`);
