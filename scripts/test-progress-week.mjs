import assert from "node:assert/strict";
import React from "react";
import { buildSync } from "esbuild";

// Progress opens with "You showed up N of M days" and one bar per day this week.
globalThis.React = React;
globalThis.window = globalThis.window || {};
const build = buildSync({ entryPoints: ["src/components/progress-panel.jsx"], bundle: true, write: false, format: "esm", platform: "browser", loader: { ".jsx": "jsx", ".js": "jsx" }, logLevel: "silent" });
const { weekSummary } = await import("data:text/javascript;base64," + Buffer.from(build.outputFiles[0].text).toString("base64"));

const week = weekSummary([
  { date: "2026-10-26", done: 2, possible: 3 },
  { date: "2026-10-27", done: 0, possible: 3, rest: true },
  { date: "2026-10-28", done: 3, possible: 3 },
  { date: "2026-10-29", done: 0, possible: 3 },
]);
assert.equal(week.headline, "You showed up 2 of 4 days");
assert.equal(week.note, "Rest counts too. You took 1 rest day.");
assert.equal(week.bars.length, 7, "Always seven bars, with the rest of the week shown ahead");
assert.deepEqual(week.bars.map((bar) => bar.kind), ["done", "rest", "done", "empty", "ahead", "ahead", "ahead"]);
assert.deepEqual(week.bars.map((bar) => bar.letter), ["M", "T", "W", "T", "F", "S", "S"]);
assert.ok(week.bars[2].height > week.bars[0].height, "A fuller day has a taller bar");
assert.equal(weekSummary([{ date: "2026-10-26", done: 0, possible: 2 }]).headline, "A fresh week. Any little thing counts.", "No guilt on an empty week");
assert.equal(weekSummary([]).bars.length, 0);
const joined = weekSummary([
  { date: "2026-10-26", done: 0, possible: 2 }, { date: "2026-10-27", done: 0, possible: 2 },
  { date: "2026-10-28", done: 1, possible: 2 },
], "2026-10-28");
assert.equal(joined.headline, "You showed up 1 of 1 day", "Days before someone joined are not counted against them");
assert.deepEqual(joined.bars.slice(0, 3).map((bar) => bar.kind), ["before", "before", "done"]);
console.log("Progress week summary passed: headline, rest days, seven bars and an empty week.");
