import assert from "node:assert/strict";
import { sameScheduleEntries } from "../src/schedule-persistence.mjs";
import { summarizeGuardianProgress } from "../src/guardian-progress-summary.mjs";
import { removeTrackerTask, restoreTrackerTask } from "../src/task-lifecycle.mjs";

const wanted = [{ time: "07:00", text: "Wake up" }, { time: "", text: "Read" }];
assert.equal(sameScheduleEntries([{ text: "Wake up", time: "07:00" }, { text: "Read", time: "" }], wanted), true);
assert.equal(sameScheduleEntries([...wanted].reverse(), wanted), false, "Item order still matters");
assert.equal(sameScheduleEntries([{ time: "08:00", text: "Wake up" }, wanted[1]], wanted), false);
assert.equal(sameScheduleEntries([wanted[0], { time: "", text: "Changed" }], wanted), false);
assert.equal(sameScheduleEntries([], []), true);
assert.equal(sameScheduleEntries(null, []), false, "A missing response is not a verified save");
assert.equal(sameScheduleEntries([null], [null]), false);

const today = "2026-10-20";
const row = { progress_date: today, total_count: 8, completed_count: 1, daily_count: 5, daily_completed: 0, scheduled_count: 3, scheduled_completed: 1 };
assert.equal(summarizeGuardianProgress([row], today).today.percent, 13);
assert.deepEqual(summarizeGuardianProgress([{ ...row, progress_date: "2026-10-19", completed_count: 3, scheduled_completed: 3 }, row], today).weekly, { total_count: 16, completed_count: 4, percent: 25 });
assert.equal(summarizeGuardianProgress([], today), null, "Denied/failed loads must not show 0/0");
assert.equal(summarizeGuardianProgress([row, row], today), null);
assert.equal(summarizeGuardianProgress([{ ...row, completed_count: 9 }], today), null);
assert.equal(summarizeGuardianProgress([{ ...row, total_count: -1 }], today), null);
assert.equal(summarizeGuardianProgress([{ ...row, daily_completed: null }], today), null);
assert.equal(summarizeGuardianProgress([row], "2026-10-21"), null);
assert.equal(summarizeGuardianProgress([{ ...row, total_count: 0, completed_count: 0, daily_count: 0, daily_completed: 0, scheduled_count: 0, scheduled_completed: 0 }], today).today.percent, 0);

// A small persisted-store stand-in exercises the same PostgREST chain used by
// the handlers. A reload reads this store, not the component's optimistic list.
const task = { user_id: "cozy", task_key: "fixture", task: "Test", day_id: "daily" };
const store = new Map([[task.task_key, task]]);
const history = new Set([task.task_key]);
let fail = false;
const client = { from(table) {
  assert.equal(table, "tracker_tasks", "Deleting/Undo must not mutate completion history");
  const filters = {};
  let restored;
  const chain = {
    delete() { return chain; }, eq(key, value) { filters[key] = value; return chain; },
    upsert(value) { restored = value; return chain; },
    select() {
      if (restored) return { async single() { store.set(restored.task_key, restored); return { data: { task_key: restored.task_key }, error: null }; } };
      return (async () => {
        if (fail) return { data: null, error: new Error("network") };
        const existing = store.get(filters.task_key);
        if (existing?.user_id !== filters.user_id) return { data: [], error: null };
        store.delete(filters.task_key);
        return { data: [{ task_key: filters.task_key }], error: null };
      })();
    },
  };
  return chain;
} };
await assert.rejects(removeTrackerTask(client, "other", "fixture"), /confirm/);
assert.equal(store.has("fixture"), true, "Cross-owner deletion cannot remove the task");
fail = true;
await assert.rejects(removeTrackerTask(client, "cozy", "fixture"), /network/);
assert.equal(store.has("fixture"), true);
fail = false;
await removeTrackerTask(client, "cozy", "fixture");
assert.equal(store.has("fixture"), false, "Delete is persisted before success, without waiting for Undo expiry");
await restoreTrackerTask(client, "cozy", { ...task, label: "UI label", wasCompleted: true });
assert.deepEqual(store.get("fixture"), task, "Undo restores durable task data without UI fields");
assert.equal(history.has("fixture"), true, "Delete/Undo retains completion, with no new award event");
await assert.rejects(restoreTrackerTask(client, "other", task), /another account/);
console.log("E2E regressions passed: jsonb verification, private progress summaries, durable deletion and Undo.");
