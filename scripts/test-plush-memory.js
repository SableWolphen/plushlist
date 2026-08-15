const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8").replace(/\r\n/g, "\n");
}

const memory = read("src/plush-memory.js");
const profile = read("src/plush-profile.js");
const adaptation = read("src/plush-smart-adaptation.js");
const today = read("src/components/plush-knows-me.jsx");
const smartToday = read("src/components/plush-knows-me-smart.jsx");
const todayRouter = read("src/components/today-panel.jsx");
const care = read("src/components/care-panel.jsx");
const growth = read("src/components/growth-moments.jsx");
const settings = read("src/components/recommendation-settings.jsx");
const phoneTime = read("scripts/test-phone-time-notifications.js");

const checks = [
  [memory.includes('export function rescueSignal'), "shared rescue signal exists"],
  [memory.includes('export function dayForecast') && today.includes('DAY FORECAST'), "Day Forecast is derived from current check-in and workload"],
  [today.includes('signal.shouldOffer') && today.includes('Not now'), "automatic Rescue suggestion remains opt-in"],
  [today.includes('document.getElementById("plushlife-gentle-launcher")?.click()'), "Rescue opens existing safe PlushRescue instead of mutating tasks"],
  [!today.includes('Care streak') && !today.includes('PlushProfile') && !today.includes('weekly memory') && !today.includes('This week PlushLife updated'), "Today does not present care-streak, profile, or weekly-memory cards"],
  [today.includes('Future Me note') && memory.includes('saveFutureNote'), "Future Me notes are implemented"],
  [today.includes('Hi. Your stuff is still here.') && memory.includes('registerVisit'), "guilt-free return after inactivity is implemented"],
  [growth.includes('PlushMoments') && growth.includes('monthlyMoments') && memory.includes('recordMoment'), "monthly PlushMoments live in Growth"],
  [settings.includes('plushProfileSummary') && settings.includes('CORRECT LEARNED SUGGESTIONS'), "living profile corrections live in Settings"],
  [profile.includes('profileContext') && profile.includes('sameContext'), "recommendation learning includes mood/energy/capacity/load/time context"],
  [profile.includes('Strong fit') && profile.includes('Growing clue') && profile.includes('Still learning'), "profile uses confidence tiers instead of one-shot certainty"],
  [profile.includes('beginRecommendation') && profile.includes('syncSessionOutcomes'), "recommendations can be linked to later real outcomes"],
  [today.includes('Did this forecast fit the day?') && today.includes('Did making the day smaller help?'), "forecast and Rescue have explicit outcome loops"],
  [settings.includes('That changed · forget this') && profile.includes('forgetPattern'), "users can correct or forget learned patterns in Settings"],
  [settings.includes('RECOMMENDATION BOUNDARIES') && profile.includes('setBoundary'), "users can set personal recommendation boundaries in Settings"],
  [adaptation.includes('recordCompletionSequence') && adaptation.includes('sequenceSuggestion'), "task sequence memory learns only from real completion order"],
  [adaptation.includes('snapshot.date !== currentDay') && adaptation.includes('item.count >= 2') && smartToday.includes('sequence.count >= 2'), "sequence learning ignores initial-load completions and requires repeated evidence"],
  [adaptation.includes('recordRecoverySnapshot') && adaptation.includes('recoveryFingerprint') && adaptation.includes('slice(-45)'), "rough-day recovery fingerprints are bounded and evidence based"],
  [adaptation.includes('Just One Thing') && adaptation.includes('Tiny Essentials') && adaptation.includes('Pause the Pressure'), "personalized Rescue recipes are available"],
  [adaptation.includes('recommendationFit(userId, "rescue_recipe"') && smartToday.includes('recordRecommendationOutcome(userId, "rescue_recipe"'), "Rescue recipe selection learns from user outcomes"],
  [smartToday.includes('Use {recipe.label}') && smartToday.includes('Did this recipe fit today?'), "Rescue recipe remains opt-in and has an outcome loop"],
  [smartToday.includes('doneSignature') && !smartToday.includes('[userId, props.viewDone,'), "smart adaptation effects are stable instead of object-identity driven"],
  [smartToday.includes('minHeight: 44'), "smart adaptation actions retain 44px tap targets"],
  [todayRouter.includes('import("./plush-knows-me-smart.jsx")') && smartToday.includes('export function SmartAdaptationPanel'), "Today lazy-loads smarter adaptation outside the critical entry"],
  [care.includes('data-actionable-care-recommendation') && care.includes('Start {memory.tool.name}') && !care.includes('GOLD · PLUSHMEMORY'), "PlushCare presents learned support as a direct action"],
  [care.includes('memory.tool &&') && !care.includes('Still learning what works for you'), "PlushCare hides learned recommendations when evidence is absent"],
  [care.includes('memory.count >= 2') && care.includes('careFit?.confidence === "strong"'), "PlushCare only explains recommendations backed by evidence"],
  [smartToday.includes('sequence.count >= 2') && smartToday.includes('recovery.count >= 2') && smartToday.includes('Why this?'), "Today only offers Why this explanations when evidence exists"],
  [smartToday.includes('Show me that next step') && smartToday.includes('Use {recipe.label}') && care.includes('Start {memory.tool.name}'), "smart recommendations remain actionable"],
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
