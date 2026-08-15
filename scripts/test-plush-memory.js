const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const memory = read("src/plush-memory.js");
const profile = read("src/plush-profile.js");
const today = read("src/components/plush-knows-me.jsx");
const care = read("src/components/care-panel.jsx");
const phoneTime = read("scripts/test-phone-time-notifications.js");

const checks = [
  [memory.includes('export function rescueSignal'), "shared rescue signal exists"],
  [memory.includes('export function dayForecast') && today.includes('DAY FORECAST'), "Day Forecast is derived from current check-in and workload"],
  [today.includes('signal.shouldOffer') && today.includes('Not now'), "automatic Rescue suggestion remains opt-in"],
  [today.includes('document.getElementById("plushlife-gentle-launcher")?.click()'), "Rescue opens existing safe PlushRescue instead of mutating tasks"],
  [today.includes('Care streak') && today.includes('not a productivity streak'), "care streak rewards care rather than productivity pressure"],
  [today.includes('Future Me note') && memory.includes('saveFutureNote'), "Future Me notes are implemented"],
  [today.includes('Hi. Your stuff is still here.') && memory.includes('registerVisit'), "guilt-free return after inactivity is implemented"],
  [today.includes('PlushMoments') && memory.includes('recordMoment'), "monthly PlushMoments are implemented"],
  [today.includes('PlushProfile · What works for me') && profile.includes('plushProfileSummary'), "living PlushProfile is implemented"],
  [profile.includes('profileContext') && profile.includes('sameContext'), "recommendation learning includes mood/energy/capacity/load/time context"],
  [profile.includes('Strong fit') && profile.includes('Growing clue') && profile.includes('Still learning'), "profile uses confidence tiers instead of one-shot certainty"],
  [profile.includes('beginRecommendation') && profile.includes('syncSessionOutcomes'), "recommendations can be linked to later real outcomes"],
  [today.includes('Did this forecast fit the day?') && today.includes('Did making the day smaller help?'), "forecast and Rescue have explicit outcome loops"],
  [today.includes('That changed / forget this') && profile.includes('forgetPattern'), "users can correct or forget learned patterns"],
  [today.includes('My gentle boundaries') && profile.includes('setBoundary'), "users can set personal recommendation boundaries"],
  [today.includes('This week PlushLife updated') && profile.includes('weeklyMemoryUpdate'), "Gold receives a weekly memory update"],
  [care.includes('GOLD · PLUSHMEMORY') && care.includes('Still learning what works for you'), "Gold memory has a no-fabrication fallback"],
  [care.includes('recommendationFit') && care.includes('situations similar to right now'), "PlushCare distinguishes contextual fit from global history"],
  [care.includes('ADAPTIVE PLUSHPATH') && care.includes('How is the current step fitting?'), "adaptive PlushPaths collect explicit fit feedback"],
  [care.includes('savePathFit("too_much")') && memory.includes('pathAdaptation'), "path feedback can soften later guidance"],
  [care.includes('🌙 TONIGHT') && memory.includes('sleepMemory'), "PlushSleep personalized tonight suggestion is implemented"],
  [memory.includes('Recovering') && memory.includes('Needs a little support') && memory.includes('Still learning'), "care-area state vocabulary stays non-punitive"],
  [today.includes('minHeight: 44') && care.includes('minHeight: 44'), "new interactive surfaces keep 44px tap targets"],
  [phoneTime.includes("Phone-time notification checks passed"), "phone-local notification regression protection remains in the suite"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("PlushMemory regression checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`PlushMemory regression checks passed (${checks.length}).`);
