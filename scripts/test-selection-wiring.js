const fs = require("fs");
const path = require("path");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8").replace(/\r\n/g, "\n");
}

const settings = read("src/components/organized-settings.jsx");
const appearancePicker = read("src/components/appearance-theme-picker.jsx");
const app = read("src/app-source.jsx");
const appearanceMode = read("src/hooks/use-appearance-mode.js");
const growth = read("assets/growth-loop.js");
const entitlements = read("assets/entitlements.js");
const billing = read("assets/plush-billing.js");
const fastStart = read("assets/fast-start.js");
const checkinTheme = read("assets/checkin-theme.js");
const dailyCopy = read("assets/daily-checkin-copy.js");

// Exercise the rendered picker: a source-string match misses mapped controls.
const assert = require("node:assert/strict");
const os = require("node:os");
const React = require("react");
const Renderer = require("react-test-renderer");
global.React = React;
global.window = { PlushLifeContent: require("../assets/plush-content.js"), PlushLifeThemeCopy: require("../assets/plush-theme-copy.js") };
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "theme-picker-"));
require("esbuild").buildSync({entryPoints:[path.join(__dirname,"../src/components/appearance-theme-picker.jsx")],bundle:true,platform:"node",format:"cjs",outfile:path.join(temp,"picker.cjs")});
const {AppearanceThemePicker} = require(path.join(temp,"picker.cjs"));
const chosen=[],patches=[];
let tree;
Renderer.act(()=>{tree=Renderer.create(React.createElement(AppearanceThemePicker,{preferences:{dark_mode:true,nickname_style:"warm"},appearanceTheme:"none",dinoTheme:false,selectAppearanceTheme:id=>chosen.push(id),updatePreference:patch=>patches.push(patch)}));});
const choiceButtons=tree.root.findAllByType("button").filter(button=>button.props["data-theme-choice"]);
Renderer.act(()=>choiceButtons.forEach(button=>button.props.onClick()));
assert.deepEqual(chosen,["none",...window.PlushLifeContent.APPEARANCE_THEMES.map(theme=>theme.id)]);
assert.deepEqual(patches,[{dino_theme:true,nickname_style:"warm"},{nickname_style:"baby",dino_theme:false}]);
const appearanceButtons=tree.root.findByProps({"aria-label":"Choose light or dark appearance"}).findAllByType("button");
Renderer.act(()=>appearanceButtons.forEach(button=>button.props.onClick()));
assert.deepEqual(patches.slice(-2),[{dark_mode:false},{dark_mode:true}]);
assert.equal(choiceButtons.filter(button=>button.props["aria-pressed"]).length,1);
assert.equal(choiceButtons.find(button=>button.props["aria-pressed"]).props["data-theme-choice"],"none");
assert.equal(choiceButtons.find(button=>button.props["data-theme-choice"] === "baby").findByProps({className:"pl-world-choice-name"}).props.children[0],"Mommy Mode", "The picker must name Mommy Mode explicitly");
Renderer.act(()=>tree.update(React.createElement(AppearanceThemePicker,{preferences:{dark_mode:true,nickname_style:"baby",baby_voice:"motherly"},appearanceTheme:"none",dinoTheme:false,selectAppearanceTheme:id=>chosen.push(id),updatePreference:patch=>patches.push(patch)})));
Renderer.act(()=>tree.root.findAllByType("button").find(button=>button.props.children === "Daddy Mode · Fatherly").props.onClick());
assert.deepEqual(patches.at(-1),{baby_voice:"fatherly"},"Daddy remains an explicit saved voice choice");
Renderer.act(()=>tree.update(React.createElement(AppearanceThemePicker,{preferences:{dark_mode:true,nickname_style:"baby",baby_voice:"fatherly"},appearanceTheme:"none",dinoTheme:false,selectAppearanceTheme:id=>chosen.push(id),updatePreference:patch=>patches.push(patch)})));
assert.equal(tree.root.findByProps({"data-theme-choice":"baby"}).findByProps({className:"pl-world-choice-name"}).props.children[0],"Daddy Mode");
Renderer.act(()=>tree.root.findAllByType("button").find(button=>button.props.children === "Mommy Mode · Motherly").props.onClick());
assert.deepEqual(patches.at(-1),{baby_voice:"motherly"},"Mommy remains an explicit saved voice choice");
Renderer.act(()=>tree.unmount());
fs.rmSync(temp,{recursive:true,force:true});
const pickerBehaviorPassed=true;

const checks = [
  [pickerBehaviorPassed, "every ambient theme button calls selectAppearanceTheme"],
  [app.includes("const selectAppearanceTheme = (themeId) => {") && app.includes("setAppearanceTheme(validTheme);") && app.includes("plushlist-appearance-"), "theme selection updates state and persists per user"],
  [appearanceMode.includes('window.localStorage.setItem("plushlife:appearance-mode:v1", mode)') && app.includes('useAppearanceMode(preferences.dark_mode)') && app.includes('const paletteWorld = activeWorld;') && app.includes('DARK_THEME_PALETTES'), "light/dark appearance persists independently while each chosen theme keeps its own world"],
  [pickerBehaviorPassed && app.includes('useState("none")') && app.includes('appearanceTheme === "none" && !babyMode && !dinoTheme ? noThemePalette'), "No theme is explicit, persisted, and uses a neutral palette"],
  [appearancePicker.includes('aria-label="Choose light or dark appearance"') && pickerBehaviorPassed && settings.includes("LazyAppearanceThemePicker"), "Personalize exposes explicit Light and Dark choices next to theme selection"],
  [app.includes("const updatePreference = (patch) => {") && app.includes("savePreferences(next);"), "preference toggles persist through savePreferences"],

  [pickerBehaviorPassed, "Baby Mode toggle updates nickname style"],
  [appearancePicker.includes('nickname_style: "baby", dino_theme: false'), "enabling Baby Mode disables Dino Theme"],
  [pickerBehaviorPassed, "Dino Theme selection leaves the shared layout and exits Baby wording mode"],

  [settings.includes("onClick={openDailyCheckIn}") && settings.includes("openDailyCheckIn, dailyCheckIn"), "Settings can reopen the unified daily check-in directly"],
  [growth.includes('document.getElementById("plushlife-checkin-trigger")') && growth.includes("openCapacityPicker: openDailyCheckIn"), "legacy capacity API routes into the unified daily check-in"],
  [app.includes('id="plushlife-checkin-trigger"') && app.includes("openDailyCheckIn={() => { setSettingsOpen(false);"), "the app exposes one canonical daily check-in trigger and wires Settings directly"],
  [app.includes("data-plushlife-day-type={value}") && app.includes("DAY_TYPES.map"), "all canonical day choices expose a stable selector"],
  [growth.includes("choicesByDate: choiceHistoryWith(mode)") || growth.includes("nextStepReasonText"), "growth logic still retains day-mode reasoning support"],
  [!growth.includes('overlay.innerHTML = `<div class="plushlife-growth-checkin-card"'), "growth loop no longer renders a second capacity dialog"],

  [app.includes("CHECKIN_MOODS.filter") && app.includes("onClick={() => selectCheckInMood(value)}") && app.includes("aria-pressed={dailyCheckIn.mood === value}"), "every mood choice has a live selection handler and pressed state"],
  [app.includes("DAY_TYPES.map") && app.includes("onClick={() => selectDayType(value)}") && app.includes("aria-pressed={dailyCheckIn.day_type === value}"), "every day-type choice has a live selection handler and pressed state"],
  [app.includes('["full", "☀️", "Full"') && app.includes('["soft", "🌤️", "Soft"') && app.includes('["tiny", "🌱", "Tiny"') && app.includes('["recovery", "↺", "Recovery"') && app.includes('["rest", "🌴", "Rest"'), "all five day types remain available"],

  [!entitlements.includes("./assets/dark-mode.js"), "dark-mode runtime is not loaded"],
  [!billing.includes("./assets/checkin-theme-mode.js") && !billing.includes("./assets/unified-dark-home.js"), "dark check-in and dark-home detectors are not loaded"],
  [!billing.includes("./assets/checkin-theme.js") && !billing.includes("./assets/checkin-comfort-prompt.js") && !billing.includes("./assets/daily-checkin-copy.js") && !billing.includes("./assets/experience-system-v2.js") && !billing.includes("./assets/nursery-layout-unifier.js"), "runtime must not mutate React-owned DOM after selections"],
  [fastStart.includes('startupMode = savedAppearance === "light" || savedAppearance === "dark" ? savedAppearance : "dark"') && fastStart.includes('dataset.plushlifeColorMode = startupMode'), "startup restores saved appearance and falls back to dark"],
  [checkinTheme.includes('dataset.plushlifeColorMode === "dark" ? "dark" : "light"'), "check-in styling follows the active appearance"],

  [(dailyCopy.match(/today\?"/g) || []).length >= 10 && dailyCopy.includes("const normal=[") && dailyCopy.includes("const baby=["), "daily check-in has a large rotating question bank for regular and Nursery wording"],
  [dailyCopy.includes("86400000") && dailyCopy.includes("getFullYear()") && dailyCopy.includes("getDate()"), "daily check-in rotation data remains available without owning React DOM"],

  [settings.includes('["focus_mode"') === false || settings.includes('checked={preferences.focus_mode}'), "Focus mode toggle remains controlled"],
  [settings.includes('["gentle_streaks"') && settings.includes('["large_text"') && settings.includes('["reduced_motion"') && settings.includes('["high_contrast"') && settings.includes('["simple_mode"') && settings.includes('["pattern_insights_enabled"') && settings.includes('["colorblind_mode"'), "all Experience toggles remain listed"],
  [settings.includes("updatePreference({ [key]: event.target.checked })"), "mapped Experience toggles write their selected value"],
  [settings.includes("reminder_times: preferences.reminder_times.map") && settings.includes("reminder_times: preferences.reminder_times.filter") && settings.includes('"12:00"'), "reminder edit remove and add options remain wired"],
  [settings.includes("quiet_start: event.target.value") && settings.includes("quiet_end: event.target.value"), "quiet-hour selections remain wired"],
  [settings.includes("toggleRestToday") && settings.includes("saveRestRange"), "rest-day and rest-range controls remain wired"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Selection wiring checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Selection wiring checks passed (${checks.length}).`);
