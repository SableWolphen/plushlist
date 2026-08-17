import assert from "node:assert/strict";
import { buildRecommendationLearning } from "../src/recommendation-learning.mjs";

const feedback = [
  { taskId: "walk", action: "easier", date: "2026-08-10" },
  { taskId: "walk", action: "done", date: "2026-08-10" },
  { taskId: "walk", action: "easier", date: "2026-08-11" },
  { taskId: "walk", action: "done", date: "2026-08-11" },
  { taskId: "walk", action: "skip", date: "2026-08-12" },
  { taskId: "journal", action: "skip", date: "2026-08-10" },
  { taskId: "journal", action: "skip", date: "2026-08-11" },
  { taskId: "journal", action: "skip", date: "2026-08-12" },
  { taskId: "journal", action: "hide", date: "2026-08-13" },
];

const history = {};
for (let day = 1; day <= 8; day += 1) {
  const date = `2026-08-${String(day).padStart(2, "0")}`;
  history[date] = {
    meds: { done: true },
    breakfast: { done: true },
    shower: { done: true },
    walk: { done: day % 2 === 0 },
  };
}

const now = new Date("2026-08-16T18:30:00Z");
const result = buildRecommendationLearning({
  feedback,
  history,
  today: "2026-08-16",
  now,
  completionEvents: [
    { habitId: "breakfast", date: "2026-08-16", completedAt: "2026-08-16T18:10:00Z" },
  ],
  sequences: [
    { anchorHabitId: "breakfast", habitId: "meds", count: 6, agreement: 0.8 },
  ],
});

assert.equal(result.taskFeedback.walk.preferGentler, true, "successful easier requests should teach PlushLife to prefer the gentler version");
assert.equal(result.taskFeedback.walk.easierSuccessRate, 100, "easier trials followed by completion should be measured as successful");
assert.equal(result.taskFeedback.walk.friction, "too_much_effort", "repeated easier requests should diagnose effort friction");
assert.ok(result.taskFeedback.journal.scoreAdjustment < 0, "repeated skips should lower future recommendation weight");
assert.equal(result.taskFeedback.journal.friction, "not_a_good_fit_now", "repeated skips should be distinguished from effort friction");
assert.ok(result.sequenceBonuses.meds > 0, "a recently completed learned anchor should boost its usual next task");
assert.equal(result.capacity.comfortableTaskCount, 4, "successful-day history should learn a personal task-load threshold");
assert.notEqual(result.capacity.confidence, "learning", "enough successful days should graduate the capacity estimate");

const thin = buildRecommendationLearning({
  feedback: [{ taskId: "walk", action: "skip", date: "2026-08-16" }],
  history: { "2026-08-16": { walk: { done: false }, meds: { done: true } } },
  today: "2026-08-16",
  now,
});
assert.equal(thin.taskFeedback.walk.confidence, "learning", "one interaction must not create false certainty");
assert.equal(thin.capacity.comfortableTaskCount, null, "thin history should not invent a personal capacity threshold");

console.log("Recommendation learning tests passed.");
