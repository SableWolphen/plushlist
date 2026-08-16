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

const crowdedQuick = buildSmartTaskProfile({
  row: { key: "quick", sourceTask: { id: "quick", estimated_minutes: 8 } },
  load: { level: "overloaded", suggestedVisibleCount: 3 },
  nowPeriod: "afternoon",
});
const crowdedLarge = buildSmartTaskProfile({
  row: { key: "large", sourceTask: { id: "large", estimated_minutes: 45 } },
  load: { level: "overloaded", suggestedVisibleCount: 3 },
  nowPeriod: "afternoon",
});
const crowdedQuickRank = rankSmartTask({ profile: crowdedQuick });
const crowdedLargeRank = rankSmartTask({ profile: crowdedLarge });
assert.equal(crowdedQuick.overloaded, true);
assert.ok(crowdedQuickRank.score > crowdedLargeRank.score, "crowded days should favor a realistic quick step over a large task");
assert.ok(crowdedQuickRank.reasons.some((reason) => reason.includes("crowded day")));

const lateQuick = buildSmartTaskProfile({
  row: { key: "late-quick", sourceTask: { id: "late-quick", estimated_minutes: 10 } },
  nowPeriod: "night",
});
const lateLarge = buildSmartTaskProfile({
  row: { key: "late-large", sourceTask: { id: "late-large", estimated_minutes: 40 } },
  nowPeriod: "night",
});
const lateQuickRank = rankSmartTask({ profile: lateQuick });
const lateLargeRank = rankSmartTask({ profile: lateLarge });
assert.ok(lateQuickRank.score > lateLargeRank.score, "late-night recommendations should prefer a smaller realistic task");
assert.ok(lateQuickRank.reasons.some((reason) => reason.includes("late in the day")));

console.log("Smart task intelligence tests passed.");
