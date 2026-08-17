import assert from "node:assert/strict";
import { buildPersonalDayModel } from "../src/personal-day-model.mjs";

const rows = [
  { key: "meds", label: "Take medication", sourceTask: { id: "meds", estimated_minutes: 3, tiny_label: "Take medication" } },
  { key: "walk", label: "Long walk", sourceTask: { id: "walk", estimated_minutes: 35, tiny_label: "Step outside" } },
  { key: "shower", label: "Shower", sourceTask: { id: "shower", estimated_minutes: 15, tiny_label: "Wash face" } },
  { key: "journal", label: "Journal", sourceTask: { id: "journal", estimated_minutes: 10 } },
];

const profiles = {
  meds: { observedDays: 18, completionEvents: 12, completionRate: 92, confidence: "strong", stability: "Stable", preferredPeriod: "evening" },
  walk: { observedDays: 16, completionEvents: 8, completionRate: 48, confidence: "moderate", stability: "Fragile", preferredPeriod: "afternoon", evidence: 72 },
  shower: { observedDays: 14, completionEvents: 7, completionRate: 62, confidence: "moderate", stability: "Recovering", preferredPeriod: "evening", evidence: 68 },
  journal: { observedDays: 10, completionEvents: 6, completionRate: 70, confidence: "moderate", stability: "Stable", preferredPeriod: "night" },
};

const smartTaskProfiles = {
  meds: { completionLikelihood: 90, timingMatch: true },
  walk: { completionLikelihood: 45, timingMismatch: true },
  shower: { completionLikelihood: 58, timingMatch: true },
  journal: { completionLikelihood: 72, timingMismatch: false },
};

const rough = buildPersonalDayModel({
  rows,
  viewDone: {},
  dailyCheckIn: { energy: "low", capacity: "low" },
  profiles,
  smartTaskProfiles,
  load: { score: 82, level: "overloaded", suggestedVisibleCount: 3 },
  recovery: { recentGap: 0 },
  crossPatterns: { lowEnergyCompletion: 45, usualEnergyCompletion: 72 },
  hour: 20,
  checkInDays: 14,
});

assert.ok(rough.overloadRisk >= 70, "crowded low-energy evenings should predict overload");
assert.ok(["tiny", "soft"].includes(rough.recommendedDayType), "rough days should recommend a gentler day size");
assert.equal(rough.intervention.kind, "trim", "high overload risk should trigger an early trim suggestion");
assert.ok(rough.taskPredictions.meds.likelihood > rough.taskPredictions.walk.likelihood, "small well-timed tasks should outrank a large poorly timed task");
assert.equal(rough.taskPredictions.walk.suggestedVersion, "Step outside", "gentler versions should be retained in the prediction model");
assert.ok(rough.associatedPatterns.some((item) => item.includes("Low-energy")), "cross-day energy pattern should be described observationally");

const comeback = buildPersonalDayModel({
  rows,
  viewDone: { meds: true },
  dailyCheckIn: { energy: "steady", capacity: "usual" },
  profiles,
  smartTaskProfiles,
  load: { score: 48, level: "comfortable", suggestedVisibleCount: 4 },
  recovery: { recentGap: 6 },
  hour: 10,
  checkInDays: 14,
});
assert.equal(comeback.recommendedDayType, "recovery");
assert.equal(comeback.intervention.kind, "comeback");

const steady = buildPersonalDayModel({
  rows: rows.slice(0, 2),
  viewDone: { meds: true },
  dailyCheckIn: { energy: "steady", capacity: "usual" },
  profiles,
  smartTaskProfiles,
  load: { score: 30, level: "comfortable", suggestedVisibleCount: 2 },
  recovery: { recentGap: 0 },
  hour: 11,
  checkInDays: 2,
});
assert.equal(steady.recommendedDayType, "full");
assert.equal(steady.confidence, "learning", "thin history should stay uncertainty-aware");
assert.ok(steady.uncertainty.includes("cautious"));

console.log("Personal Day Model tests passed.");
