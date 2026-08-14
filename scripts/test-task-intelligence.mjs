import assert from "node:assert/strict";
import { buildSmartTaskProfile, rankSmartTask, taskId } from "../src/task-intelligence.mjs";

const row = {
  key: "hydrate",
  sourceTask: { id: "hydrate", estimated_minutes: 5, tiny_label: "Take three sips", essential_on_low_capacity: true },
};

assert.equal(taskId(row), "hydrate");

const profile = buildSmartTaskProfile({
  row,
  learned: { preferredPeriod: "morning", completionRate: 62, confidence: "moderate", stability: "Fragile", dominantMissReason: "bad_timing" },
  load: { suggestedVisibleCount: 3 },
  nowPeriod: "morning",
  focusTaskId: "hydrate",
});
assert.equal(profile.isFocus, true);
assert.equal(profile.isEssential, true);
assert.equal(profile.timingMatch, true);
assert.equal(profile.lowCapacityFit, true);
assert.equal(profile.suggestedVisible, 3);
assert.ok(profile.completionLikelihood >= 5 && profile.completionLikelihood <= 95);
assert.ok(profile.supportNeed > 20);

const ranked = rankSmartTask({ profile, lowCapacity: true });
assert.ok(ranked.score > 100);
assert.ok(ranked.reasons.some((reason) => reason.includes("Focus Habit")));
assert.ok(ranked.reasons.some((reason) => reason.includes("smaller lift")));

const easyStable = buildSmartTaskProfile({
  row: { key: "easy", sourceTask: { id: "easy", estimated_minutes: 2 } },
  learned: { completionRate: 95, confidence: "strong", stability: "Stable" },
  nowPeriod: "morning",
});
const recovering = buildSmartTaskProfile({
  row: { key: "recover", sourceTask: { id: "recover", estimated_minutes: 8 } },
  learned: { completionRate: 45, confidence: "moderate", stability: "Recovering", dominantMissReason: "too_much" },
  nowPeriod: "morning",
});
assert.ok(recovering.supportNeed > easyStable.supportNeed, "recovering tasks should receive more support weight");
assert.ok(rankSmartTask({ profile: recovering }).score > 80, "recovery tasks should remain viable instead of being buried by easy wins");

console.log("Smart task intelligence tests passed.");
