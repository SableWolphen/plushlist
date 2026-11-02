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
console.log("Streamlined navigation passed: Plan selection, routes, schedule editing, Guardian landing and invitations.");
