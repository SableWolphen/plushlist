import assert from "node:assert/strict";
import { adaptiveDaySuggestion } from "../src/plush-smart-adaptation.js";

const rows = [
  { key: "one", label: "Clean kitchen" },
  { key: "two", label: "Read a book" },
];
const base = adaptiveDaySuggestion({ energy: "low", load: "high" }, rows, {});
assert.equal(base.mode, "tiny");
assert.match(base.primary.label, /three things/);
assert.equal(base.noAutomaticTaskChanges, true);
assert.equal(rows[0].label, "Clean kitchen");
assert.equal(adaptiveDaySuggestion({ chosenMode: "full", energy: "empty", load: "high" }, rows, {}).mode, "full");
assert.equal(adaptiveDaySuggestion({ resting: true }, rows, {}).mode, "rest");
assert.equal(adaptiveDaySuggestion({ energy: "low" }, rows, { one: true }).primary.key, "two");
assert.equal(adaptiveDaySuggestion({}, rows, { one: true, two: true }).primary, null);
assert.equal(adaptiveDaySuggestion({}, [], {}).primary, null);
console.log("Adaptive day regression checks passed");
