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
const careSources = `${care}\n${careExisting}`;
const tasks = read("src/components/tasks-panel.jsx");
const settings = read("src/components/organized-settings.jsx");

const checks = [
  [index.includes("viewport-fit=cover"), "viewport respects Android/iOS safe areas"],
  [index.includes("@media (pointer: coarse)") && index.includes("min-height: 44px"), "coarse-pointer controls meet the 44px touch target"],
  [shared.includes("overflow-x: clip") && shared.includes("max-width: 100%"), "shared UI prevents accidental horizontal page overflow"],
  [shared.includes("font-size: 16px !important") && shared.includes("max-width: 380px"), "small-screen form fields avoid browser zoom and cramped text"],
  [shared.includes("PanelErrorBoundary") && shared.includes("Your saved data was not changed"), "tool panels recover locally instead of taking down the whole app"],
  [today.includes('data-plushlife-compact-card="next-step"') && today.includes('data-plushlife-compact-card="plushweek"'), "Today keeps primary summary cards compact"],
  [today.includes('textOverflow: "ellipsis"') && today.includes('whiteSpace: "nowrap"'), "long Today labels are constrained instead of widening the page"],
  [careSources.includes('gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"') && careSources.includes('gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))"'), "Care tools reflow to available phone width"],
  [tasks.includes('minWidth: 0') && tasks.includes('width: "100%"') && tasks.includes('flexWrap: "wrap"'), "task editing fields and schedule controls can shrink/wrap on narrow phones"],
  [app.includes("/* compact-phone-shell */") && app.includes("padding-bottom:calc(104px + env(safe-area-inset-bottom))"), "main mobile shell keeps fixed navigation from covering content"],
  [app.includes(".pl-app-bottom-nav") && app.includes("min-height:56px") && app.includes(".pl-app-nav-add{width:42px"), "bottom navigation stays compact instead of becoming oversized"],
  [today.includes(".pl-home-hero{min-height:188px") && today.includes(".pl-home-copy h1{font-size:21px") && today.includes(".pl-home-bubble{right:9px"), "Home hero stays compact and avoids greeting/mascot overlap"],
  [today.includes(".pl-muted-note{display:none}") && today.includes('[data-plushlife-compact-card="next-step"]{padding:11px 12px 12px!important}'), "Home hides clipped helper copy and keeps the next-step card dense on phones"],
  [careExisting.includes('gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"'), "Quick Care tiles remain responsive on narrow phones"],
  [!careExisting.includes("linear-gradient(160deg,#1B2245,#2E3A6B 55%,#1B2245)") && careExisting.includes("linear-gradient(145deg,#FAF2FF,#FFF8FC)"), "PlushSleep keeps the soft non-clinical Care styling"],
  [app.includes(".pl-ambient-theme-layer") && app.includes("--pl-theme-accent") && !app.includes("inset 0 0 0 8px"), "themes remain visible without restoring the heavy app frame"],
  [settings.includes('placeholder="Search settings"') && settings.includes("Privacy & Data") && settings.includes("Experience") && settings.includes("Notifications & Reminders"), "Settings keeps high-complexity options organized and discoverable"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Mobile UX regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Mobile UX checks passed (${checks.length}).`);
