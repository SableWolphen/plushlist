const fs = require("fs");
const path = require("path");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8").replace(/\r\n/g, "\n");
}

const settings = read("src/components/organized-settings.jsx");
const app = read("src/app-source.jsx");
const growth = read("assets/growth-loop.js");
const entitlements = read("assets/entitlements.js");
const billing = read("assets/plush-billing.js");
const fastStart = read("assets/fast-start.js");
const checkinTheme = read("assets/checkin-theme.js");

const checks = [
  [settings.includes("APPEARANCE_THEMES.map((theme)") && settings.includes("onClick={() => selectAppearanceTheme(theme.id)}"), "every ambient theme button calls selectAppearanceTheme"],
  [app.includes("const selectAppearanceTheme = (themeId) => {") && app.includes("setAppearanceTheme(themeId);") && app.includes("plushlist-appearance-"), "theme selection updates state and persists per user"],
  [app.includes("const updatePreference = (patch) => {") && app.includes("savePreferences(next);"), "preference toggles persist through savePreferences"],

  [settings.includes('title="🍼 Baby Mode"') && settings.includes('nickname_style: event.target.checked ? "baby" : "warm"'), "Baby Mode toggle updates nickname style"],
  [settings.includes('dino_theme: event.target.checked ? false : preferences.dino_theme'), "enabling Baby Mode disables Dino Theme"],
  [settings.includes('title="🦕 Dino Theme"') && settings.includes('nickname_style: event.target.checked ? "warm" : preferences.nickname_style'), "Dino Theme selection leaves the shared layout and exits Baby wording mode"],

  [settings.includes("onClick={openDailyCheckIn}") && settings.includes("openDailyCheckIn, watchPairingCode"), "Settings can reopen the unified daily check-in directly"],
  [growth.includes('document.querySelector(\'[data-plushlife-open-checkin="true"]\')') && growth.includes("openCapacityPicker: openDailyCheckIn"), "legacy capacity API routes into the unified daily check-in"],
  [app.includes('data-plushlife-open-checkin="true"') && app.includes("const openDailyCheckIn = () =>") && app.includes("openDailyCheckIn={() => { setSettingsOpen(false);"), "the app exposes one canonical daily check-in trigger and wires Settings directly"],
  [app.includes("data-plushlife-day-type={value}") && app.includes("DAY_TYPES.map"), "all canonical day choices expose a stable selector"],
  [growth.includes("choicesByDate: choiceHistoryWith(mode)") || growth.includes("nextStepReasonText"), "growth logic still retains day-mode reasoning support"],
  [!growth.includes('overlay.innerHTML = `<div class="plushlife-growth-checkin-card"'), "growth loop no longer renders a second capacity dialog"],

  [app.includes("CHECKIN_MOODS.filter") && app.includes("onClick={() => selectCheckInMood(value)}") && app.includes("aria-pressed={dailyCheckIn.mood === value}"), "every mood choice has a live selection handler and pressed state"],
  [app.includes("DAY_TYPES.map") && app.includes("onClick={() => selectDayType(value)}") && app.includes("aria-pressed={dailyCheckIn.day_type === value}"), "every day-type choice has a live selection handler and pressed state"],
  [app.includes('["full", "☀️", "Full"') && app.includes('["soft", "🌤️", "Soft"') && app.includes('["tiny", "🌱", "Tiny"') && app.includes('["recovery", "↺", "Recovery"') && app.includes('["rest", "🌴", "Rest"'), "all five day types remain available"],

  [!entitlements.includes("./assets/dark-mode.js"), "dark-mode runtime is not loaded"],
  [!billing.includes("./assets/checkin-theme-mode.js") && !billing.includes("./assets/unified-dark-home.js"), "dark check-in and dark-home detectors are not loaded"],
  [fastStart.includes('dataset.plushlifeColorMode = "light"') && fastStart.includes('style.colorScheme = "light"'), "startup forces light mode before React"],
  [checkinTheme.includes('function detectScheme(){\n    return "light";'), "check-in styling is pinned to light palettes"],

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
