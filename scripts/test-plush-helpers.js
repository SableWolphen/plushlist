const assert = require("node:assert/strict");
const helpers = require("../assets/plush-helpers.js");

assert.equal(helpers.formatRelativeTime(null), "Never yet");
assert.equal(helpers.formatRelativeTime(new Date().toISOString()), "Just now");
assert.equal(helpers.formatRelativeTime(new Date(Date.now() - 5 * 60000).toISOString()), "5 minutes ago");
assert.equal(helpers.formatRelativeTime(new Date(Date.now() - 90 * 60000).toISOString()), "1 hour ago");

assert.ok(Array.isArray(helpers.MOTHERLY_NICKNAMES) && helpers.MOTHERLY_NICKNAMES.length > 0);
assert.ok(Array.isArray(helpers.OPTIONAL_SECTION_MARKERS) && helpers.OPTIONAL_SECTION_MARKERS.length > 0);

// mascotGrowthStageForDays should return the highest stage the day count
// qualifies for, and always fall back to the lowest stage for 0 days.
const stage100 = helpers.mascotGrowthStageForDays(150);
assert.equal(stage100.label, "radiant");
const stage0 = helpers.mascotGrowthStageForDays(0);
assert.equal(stage0.label, "new");

// urlBase64ToUint8Array should round-trip a known VAPID-shaped key without
// throwing, and produce a Uint8Array.
const decoded = helpers.urlBase64ToUint8Array("BMJMbr9mvNVbmo7X8YNKHxOL0Wb62RNvfti9jMn8lwlCFaYqJpZqxam_GDE5RRU-p9RRFscP1mIetfa404Em7Dw");
assert.ok(decoded instanceof Uint8Array);
assert.ok(decoded.length > 0);

console.log("plush-helpers tests passed");
