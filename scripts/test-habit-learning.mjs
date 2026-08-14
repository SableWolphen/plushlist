import assert from "node:assert/strict";
import fs from "node:fs";
import { buildHabitLearning, LEARNING_THRESHOLDS } from "../src/habit-learning.mjs";

const rows = [
  { id: "breakfast", label: "Breakfast", reminderTime: "08:00" },
  { id: "vitamins", label: "Vitamins", reminderTime: "07:00", tinyLabel: "Put vitamins beside breakfast" },
  { id: "stretch", label: "Stretch", reminderTime: "18:00" },
];
const completionEvents = [];
for (let day = 1; day <= 8; day += 1) {
  const date = `2026-08-${String(day).padStart(2, "0")}`;
  completionEvents.push({ id: `${date}:breakfast`, date, habitId: "breakfast", hour: 8, minute: 0 });
  completionEvents.push({ id: `${date}:vitamins`, date, habitId: "vitamins", hour: 8, minute: 15 });
}
const history = {};
for (let day = 1; day <= 8; day += 1) history[`2026-08-${String(day).padStart(2, "0")}`] = { breakfast: { done: true }, vitamins: { done: day <= 3 }, stretch: { done: true } };
const retention = { completionStates: {
  "2026-08-01:vitamins": "tiny", "2026-08-02:vitamins": "tiny", "2026-08-03:vitamins": "tiny",
} };

const learned = buildHabitLearning({ rows, completionEvents, history, retention });
assert.equal(learned.timing.vitamins.observedTime, "08:15");
assert.ok(learned.timing.vitamins.shiftMinutes >= LEARNING_THRESHOLDS.timingShiftMinutes);
assert.equal(learned.sequences[0].anchorHabitId, "breakfast");
assert.equal(learned.sequences[0].habitId, "vitamins");
assert.equal(learned.tiny.vitamins.uses, 3);
assert.ok(learned.skips.vitamins);
assert.ok(learned.suggestions.some((item) => item.type === "move_time" && item.habitId === "vitamins"));
assert.ok(learned.suggestions.some((item) => item.type === "attach_anchor" && item.habitId === "vitamins"));

const dismissed = learned.suggestions[0];
const afterChoice = buildHabitLearning({ rows, completionEvents, history, retention, userChoices: { [dismissed.fingerprint]: { decision: "dismissed" } } });
assert.ok(!afterChoice.suggestions.some((item) => item.fingerprint === dismissed.fingerprint), "user choices must suppress the matching suggestion");

const weakReminderEvents = Array.from({ length: 5 }, (_, index) => ({ action: "opened", taskKey: "stretch", at: `2026-08-0${index + 1}T17:00:00.000Z` }));
const withReminders = buildHabitLearning({ rows, completionEvents, history, reminderEvents: weakReminderEvents });
assert.equal(withReminders.reminderEffectiveness.stretch.rate, 0);
assert.ok(withReminders.suggestions.some((item) => item.type === "adjust_reminder" && item.habitId === "stretch"));

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(index, /plushlifeKind === "daily-reminder" \|\| item\.extra\.plushlifeKind === "task-reminder"/);
assert.match(index, /extra: \{ plushlifeKind: "task-reminder"/);
assert.match(index, /\{ id: "DONE", title: "Done" \}/);
assert.match(index, /plushlife:pending-notification-action:v1/);
assert.match(index, /anchorTaskKey/);

const app = fs.readFileSync(new URL("../src/app-source.jsx", import.meta.url), "utf8");
assert.match(app, /measurableMatch = task\.match/);
assert.match(app, /consumeWidgetAction/);
const widget = fs.readFileSync(new URL("../android/app/src/main/java/com/PlushLife/PlushLifeWidgetProvider.java", import.meta.url), "utf8");
assert.match(widget, /plushlifeTaskAction/);
console.log("Habit background learning checks passed.");
