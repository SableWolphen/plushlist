import assert from "node:assert/strict";
import vm from "node:vm";
import { buildSync } from "esbuild";
import { MAIN_DESTINATIONS, mainDestination, adjacentDestination, guardianLanding } from "../src/navigation.mjs";

assert.equal(new Set(MAIN_DESTINATIONS.map(item => item.id)).size, 4);
assert.equal(mainDestination("week"), "tasks", "Calendar must keep Plan selected");
assert.equal(mainDestination("guardian"), "care", "Guardian lives under Care, so Care stays selected");
assert.equal(adjacentDestination("today", 1), "tasks", "Swipes follow the visible navigation");
assert.equal(adjacentDestination("week", 1), "care", "Calendar swipes continue from Plan");
assert.equal(adjacentDestination("week", -1), "today");
assert.equal(adjacentDestination("progress", 1), "progress", "Navigation stops at the last destination");
assert.equal(adjacentDestination("guardian", 1), "progress", "Swiping on from Guardian continues from Care");
assert.equal(guardianLanding("caretaker"), "support", "A Guardian should see progress immediately");
assert.equal(guardianLanding("mine"), "support");
assert.equal(guardianLanding("mine", true), "support", "Pending invitations must be visible on arrival");

// Render the real Plan component and exercise its user-facing controls.
const code = buildSync({ entryPoints: ["src/components/plan-navigation.jsx"], bundle: true, write: false, format: "cjs" }).outputFiles[0].text;
const scope = { module: { exports: {} }, React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }) } };
vm.runInNewContext(code, scope);
const selected = [];
let edits = 0;
const render = view => scope.module.exports.PlanNavigation({ view, onSelect: id => selected.push(id), onEditSchedule: () => edits++ });
const nodes = node => node && typeof node === "object" ? [node, ...node.children.flatMap(nodes)] : [];
for (const view of ["today", "habits", "later", "calendar"]) {
  const buttons = nodes(render(view)).filter(node => node.type === "button");
  const active = buttons.filter(node => node.props["aria-pressed"]);
  assert.equal(active.length, 1, "Only one Plan view can be selected");
  active[0].props.onClick();
  assert.equal(selected.at(-1), view, "Every Plan tab must route to its own view");
}
nodes(render("today")).find(node => node.type === "button" && node.children.includes("Edit schedule")).props.onClick();
assert.equal(edits, 1, "Schedule editing remains a direct action");
// Plan week strip: Monday to Sunday around the chosen day, and picking a day opens it.
const { planWeek } = scope.module.exports;
const week = planWeek("2026-11-01", "2026-11-01");
assert.equal(week.map(day => day.date).join(","), ["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30","2026-10-31","2026-11-01"].join(","), "A Sunday belongs to the week that started Monday");
assert.equal(week.filter(day => day.selected).length, 1);
assert.equal(planWeek("2026-11-04", "2026-11-01")[0].date, "2026-11-02", "Picking a future day shows that week");
const picked = [];
const withWeek = scope.module.exports.PlanNavigation({ view: "today", onSelect: () => {}, onEditSchedule: () => {}, selectedDate: "2026-10-28", today: "2026-11-01", onPickDate: date => picked.push(date) });
const dayButtons = nodes(withWeek).filter(node => node.type === "button" && node.props["aria-current"] !== undefined || (node.type === "button" && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /.test(node.props["aria-label"] || "")));
assert.equal(dayButtons.length, 7, "Plan shows a seven-day strip");
assert.equal(nodes(withWeek).filter(node => node.type === "button" && node.props["aria-pressed"]).length, 1, "Day buttons do not count as Plan views");
dayButtons.find(node => node.props["aria-label"].startsWith("Sun 1")).props.onClick();
assert.deepEqual(picked, ["2026-11-01"], "Tapping a day opens that day");
console.log("Streamlined navigation passed: Plan selection, routes, schedule editing, Guardian landing and invitations.");
