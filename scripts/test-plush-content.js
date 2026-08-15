const assert = require("node:assert/strict");
const content = require("../assets/plush-content.js");

const expectedArrayKeys = [
  "MASCOT_OUTFITS",
  "APPEARANCE_THEMES",
  "MASCOT_GROWTH_STAGES",
  "DAYS",
  "TEMPLATE_PACKS",
  "DASHBOARDS",
  "PLUSH_PATHS",
  "SLEEP_TOOLS",
  "SOUNDSCAPES",
  "GENTLE_AFFIRMATIONS",
  "COMFORT_TOOLS",
];

for (const key of expectedArrayKeys) {
  assert.ok(Array.isArray(content[key]), `${key} should be an array`);
  assert.ok(content[key].length > 0, `${key} should not be empty`);
}

// Every entry that has an id must have a unique one within its own array —
// the app looks these up by id (e.g. find/select by id), so a duplicate
// would make one entry permanently unreachable.
for (const key of expectedArrayKeys) {
  const withIds = content[key].filter((entry) => entry && typeof entry === "object" && "id" in entry);
  if (withIds.length === 0) continue;
  const ids = withIds.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, `${key} should not contain duplicate ids`);
}

// DAYS must cover exactly the seven weekdays used for schedule lookups.
assert.deepEqual(
  content.DAYS.map((day) => day.id),
  ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  "DAYS should list all seven weekdays in order"
);

// DASHBOARDS backs the main navigation tabs and must always include the
// core today/care/progress destinations the rest of the app links to.
const dashboardIds = content.DASHBOARDS.map((dashboard) => dashboard.id);
for (const requiredId of ["today", "week", "care", "progress"]) {
  assert.ok(dashboardIds.includes(requiredId), `DASHBOARDS is missing the "${requiredId}" tab`);
}

const softLight = content.APPEARANCE_THEMES.find((theme) => theme.id === "soft-light");
assert.ok(softLight, "Soft Light should be available as an appearance theme");
assert.equal(softLight.background, "#FFF8FB", "Soft Light should use the warm cream-pink base");
assert.match(softLight.glowA, /[0-9A-F]{8}$/i, "Soft Light decorative washes should remain translucent");

console.log("plush-content tests passed");
