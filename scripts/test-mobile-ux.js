const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const index = read("index.html");
const app = read("src/app-source.jsx");
const ui = read("assets/plushlife-ui.css");
const finalMobile = read("assets/final-mobile-ui.css");
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
  [today.includes('className="pl-reference-home-overview"') && today.includes("pl-reference-progress") && today.includes("pl-reference-quick-grid"), "Home follows the reference hierarchy with progress, journal, and four quick actions"],
  [today.includes("pl-reference-next") && today.includes("nextRows") && today.includes("More for today") && !today.includes("homeDisplayGroups(homeLayout).map"), "Home shows only two Next up rows before secondary task/schedule tools"],
  [app.includes('id="plushlife-checkin-trigger"') && app.includes('style={{ display: "none" }}') && app.includes("pl-home-day-mode-note"), "Home removes the duplicate check-in banner while keeping check-in and non-Full-day controls reachable"],
  [finalMobile.includes("UX walkthrough hardening · 2026-10-04") && finalMobile.includes(".pl-reference-next-row") && finalMobile.includes("padding-bottom:calc(148px + env(safe-area-inset-bottom))"), "whole-app UX audit hardens Next up, safe areas, and fixed-nav clearance"],
  [care.includes("pl-reference-care-launchers") && care.includes("Daily check-in") && care.includes("Calmness pass"), "Care exposes the four reference shortcuts before deeper tools"],
  [finalMobile.includes("PlushLife reference source-of-truth redesign") && finalMobile.includes(".pl-reference-home-overview") && finalMobile.includes(".pl-reference-care-launchers") && finalMobile.includes(".pl-guardian-content"), "final mobile CSS contains the source-of-truth redesign layer"],
  [today.includes('textOverflow: "ellipsis"') && today.includes('whiteSpace: "nowrap"'), "long Today labels are constrained instead of widening the page"],
  [careSources.includes('gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"') && careSources.includes('gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))"'), "Care tools reflow to available phone width"],
  [tasks.includes('minWidth: 0') && tasks.includes('width: "100%"') && tasks.includes('flexWrap: "wrap"'), "task editing fields and schedule controls can shrink/wrap on narrow phones"],
  [tasks.includes("showAllToday") && tasks.includes("Tasks for the day") && tasks.includes("See the rest"), "Tasks defaults to a calm day view with the rest available on demand"],
  [tasks.includes("More options for") && tasks.includes("🗑️ Delete") && tasks.includes("setPendingTaskDelete"), "visible task rows expose a direct delete action with confirmation"],
  [taskPrivacy.includes("can_view_tasks") && taskPrivacy.includes("accepted_at is not null") && taskPrivacy.includes("auth.uid()) = user_id"), "task RLS keeps lists private except explicitly permitted Guardian sharing"],
  [app.includes("padding-bottom:calc(104px + env(safe-area-inset-bottom))") && app.includes('bottom: "calc(68px + env(safe-area-inset-bottom))"'), "content and transient notices stay above the fixed bottom navigation"],
  [app.includes("/* compact-phone-shell */") && app.includes("padding-bottom:calc(104px + env(safe-area-inset-bottom))"), "main mobile shell keeps fixed navigation from covering content"],
  [app.includes(".pl-app-bottom-nav") && app.includes("min-height:50px") && app.includes(".pl-app-nav-add{width:38px"), "bottom navigation stays compact instead of becoming oversized"],
  [today.includes("grid-template-columns:78px minmax(0,1fr)!important") && today.includes(".pl-home-hero>.pl-mascot-pat{") && today.includes("position:relative!important") && today.includes(".pl-home-hero>.pl-companion-copy{"), "Home hero uses structural lanes so mascot and greeting cannot overlap"],
  [today.includes(".pl-muted-note{display:none}") && today.includes('[data-plushlife-compact-card="next-step"]{padding:8px 9px 9px!important}'), "Home hides clipped helper copy and keeps the next-step card dense on phones"],
  [careExisting.includes('gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"'), "Quick Care tiles remain responsive on narrow phones"],
  [!careExisting.includes("linear-gradient(160deg,#1B2245,#2E3A6B 55%,#1B2245)") && careExisting.includes('background: "var(--pl-theme-surface)"'), "PlushSleep keeps the soft non-clinical Care styling"],
  [app.includes(".pl-ambient-theme-layer") && app.includes("--pl-theme-accent") && !app.includes("inset 0 0 0 8px"), "themes remain visible without restoring the heavy app frame"],
  [care.includes(".pl-care-title{margin-top:2px;font-size:15.5px") && care.includes(".pl-care-feeling{min-height:46px"), "Care cards stay compact on phones"],
  [care.includes(".plushcare-library .pl-care-tool{min-height:50px!important") && care.includes(".pl-care-shell{display:grid;gap:6px") && care.includes(".pl-care-spaces{padding:4px 0 0;border-radius:0;border:0;background:transparent;box-shadow:none}"), "Care library avoids oversized tiles and gaps"],
  [read("src/components/progress-panel-existing.jsx").includes(".pl-growth-stat{min-height:54px") && read("src/components/progress-panel-existing.jsx").includes(".pl-growth-heading{margin-top:2px;font-size:16px"), "Progress stays compact instead of dashboard-sized"],
  [read("src/components/week-panel.jsx").includes(".pl-calendar-cozy{display:grid;gap:8px;padding-bottom:calc(116px + env(safe-area-inset-bottom))}") && read("src/components/week-panel.jsx").includes("border-radius:15px!important") && read("src/components/week-panel.jsx").includes("box-shadow:none!important") && read("src/components/week-panel.jsx").includes(".pl-day-task-row") && read("src/components/week-panel.jsx").includes(".pl-calendar-day-pct") && !read("src/components/week-panel.jsx").includes(".pl-calendar-cozy section label{") && !finalMobile.includes(".pl-calendar-cozy>div") && !ui.includes(".pl-calendar-cozy>div"), "Calendar keeps compact cards, visible Day task labels, stable percentages, and no nested wrapper cards"],
  [app.includes("const homeScheduleDayId = dayIdForDate(period.date);") && app.includes("selectedSchedule={homeSelectedSchedule}") && app.includes("selectedScheduleExceptionEntries={homeScheduleExceptionEntries}"), "Home schedule is pinned to the actual current date instead of stale selected-day state"],
  [!today.includes("Long run with the girls") && !today.includes('firstTimed ?') && today.includes("No schedule set for today."), "Home schedule preview never invents placeholder schedule entries"],
  [today.includes("const visibleEntries = entries;") && !today.includes("entries.slice(0, 3)"), "Home shows the entire real schedule instead of truncating it"],
  [today.includes('onClick={() => goToDashboard?.("week")}') && app.includes('onClick={() => goToDashboard("week")} aria-label="Open calendar"'), "date controls open the Calendar"],
  [today.includes('onClick={() => setSettingsOpen?.(true)}') && app.includes('onClick={() => setSettingsOpen(true)} aria-label="Settings"'), "gear controls open Settings"],
  [app.includes('setCollectionOpen(true)') && app.includes('aria-label="Open rewards"') && app.includes('<DesignIcon name="plush"') && app.includes('<RewardsPanel inline={collectionOpen} open={collectionOpen}'), "bottom Plush button opens Rewards"],
  [progress.includes('className="pl-growth-weekbar pl-growth-week-summary"') && progress.includes('role="progressbar"') && progress.includes("props.weeklyOverallPct"), "Progress shows the current weekly progress bar"],
  [today.includes('aria-label="Tasks today"') && today.includes("function TasksToday") && today.includes('babyMode ? "Little Jobs" : dinoTheme ? "Dino Missions" : "Today’s tasks"'), "Home includes a dedicated themed Today tasks section"],
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
  [app.includes("function PopupCloseButton") && app.includes('label="Close delete task"') && app.includes('label="Close task editor"') && app.includes('label="Close weekly check-in"'), "app popups expose visible close buttons"],
  [app.includes('>Tasks</span></button>') && app.includes('>Care</span></button>') && app.includes('>Progress</span></button>') && app.includes('>Plush</span></button>'), "bottom navigation uses the intended Home, Tasks, Care, Progress, Plush destinations"],
  [ui.includes("Shared navigation layout lock") && ui.includes("grid-template-columns:repeat(5,minmax(0,1fr))") && ui.includes(".pl-header-add-button"), "every theme shares the same five-destination bottom navigation geometry"],
  [read("src/components/guardian-panel.jsx").includes("pl-guardian-action-switcher") && read("src/components/guardian-panel.jsx").includes("supportAction"), "Guardian support tools switch in place instead of stacking every form"],
  [read("src/components/guardian-panel.jsx").includes("pl-guardian-person-switcher") && read("src/components/guardian-panel.jsx").indexOf("pl-guardian-person-switcher") < read("src/components/guardian-panel.jsx").indexOf("pl-guardian-switcher"), "Guardian role switching stays at the top instead of buried down the page"],
  [finalMobile.includes("padding-bottom:148px!important") && finalMobile.includes("grid-template-columns:repeat(5,minmax(0,1fr))!important"), "final mobile layer reserves bottom-nav clearance and keeps five equal nav lanes"],
  [finalMobile.includes("#main-content .pl-inline-tool{") && finalMobile.includes("padding-bottom:148px!important"), "inline Tasks and Plush pages also clear the fixed bottom navigation"],
  [finalMobile.includes(".pl-home-hero>.pl-mascot-pat{") && finalMobile.includes("position:relative!important") && finalMobile.includes(".pl-home-hero>.pl-companion-copy{"), "final mobile override cannot reintroduce absolute Home mascot/text overlap"],
  [finalMobile.includes(".classic-sync-strip") && finalMobile.includes(".plushlife-app-header") && finalMobile.includes("display:none!important"), "final mobile override keeps duplicate global chrome suppressed"],
  [app.includes("compactAppShell") && app.includes('window.matchMedia?.("(max-width: 520px)")') && app.includes('!compactAppShell && <div className="plushlife-app-header"'), "mobile structurally omits the duplicate global app header instead of relying only on CSS"],
  [app.includes("pl-header-mascot-button") && app.includes("headerMascotDancing") && app.includes("<PlushMascot theme={activeWorld} outfit={selectedOutfit}"), "desktop header keeps the real PlushMascot and tap-to-dance behavior"],
  [read("src/components/theme-world.jsx").includes('const mascotWorld = "soft"') && read("src/components/theme-world.jsx").includes("Themes can change the world around it"), "every theme keeps the original PlushLife mascot art"],
  [app.includes("dailyCheckInLoaded") && app.includes("setCheckInPopupOpen(true)") && app.includes("plushlife:daily-journal-prompt"), "daily check-in and evening journal prompts can surface automatically"],
  [app.includes("weeklyIntentionsLoaded") && app.includes("setWeeklyKickoffNote(entries.find") && app.includes("setWeeklyKickoffOpen(true)"), "weekly intention kickoff remains reachable and loads the previous week"],
  [read("src/components/shared.jsx").includes('aria-label="Close"') && read("src/components/focus-timer.jsx").includes('aria-label="Close timer"') && read("src/components/share-win-modal.jsx").includes('aria-label="Close share popup"') && read("src/components/gentle-onboarding.jsx").includes('aria-label="Close welcome"'), "shared modal components expose close buttons"],
  [read("src/components/rewards-panel.jsx").includes("React.useState(4)") && read("src/components/rewards-panel.jsx").includes(".slice(0, 4)"), "Rewards previews a smaller collection instead of a wall of items"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Mobile UX regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Mobile UX checks passed (${checks.length}).`);
