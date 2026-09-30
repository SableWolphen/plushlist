const assert = require("node:assert/strict");
const entitlements = require("../assets/entitlements.js");

// The only behavior that matters right now: nothing is ever gated while
// enforced is false or omitted, regardless of plan.
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits"), true);
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", {}), true);
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", { enforced: false, plan: entitlements.PLUSH_PLANS.FREE }), true);
assert.equal(entitlements.hasPlushFeature("plushFamilyFeatures", { enforced: false, plan: entitlements.PLUSH_PLANS.FREE }), true);
assert.equal(entitlements.hasPlushFeature("not_a_real_feature", { enforced: false }), true);

// Once enforced is true (future state, not used anywhere yet), plan
// actually matters.
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", { enforced: true, plan: entitlements.PLUSH_PLANS.FREE }), true);
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", { enforced: true, plan: entitlements.PLUSH_PLANS.PLUSHPLUS }), true);
assert.equal(entitlements.hasPlushFeature("plushFamilyFeatures", { enforced: true, plan: entitlements.PLUSH_PLANS.PLUSHPLUS }), false);
assert.equal(entitlements.hasPlushFeature("plushFamilyFeatures", { enforced: true, plan: entitlements.PLUSH_PLANS.PLUSHFAMILY }), true);
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", { enforced: true, plan: entitlements.PLUSH_PLANS.PLUSHFAMILY }), true);

// Unknown plan (e.g. a future value not yet handled) fails closed, not open.
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", { enforced: true, plan: "not_a_real_plan" }), false);

// devPreviewPlan overrides plan when enforced — this is what the
// admin-only preview toggle in index.html actually drives.
assert.equal(entitlements.hasPlushFeature("plushUnlimitedHabits", { enforced: true, plan: entitlements.PLUSH_PLANS.PLUSHPLUS, devPreviewPlan: entitlements.PLUSH_PLANS.FREE }), true);
assert.equal(entitlements.hasPlushFeature("plushFamilyFeatures", { enforced: true, plan: entitlements.PLUSH_PLANS.FREE, devPreviewPlan: entitlements.PLUSH_PLANS.PLUSHFAMILY }), true);

// Every declared flag must resolve somewhere sane under every plan (no
// typo'd flag name silently falling through undefined).
for (const flag of entitlements.PLUSH_FEATURE_FLAGS) {
  for (const plan of Object.values(entitlements.PLUSH_PLANS)) {
    const result = entitlements.hasPlushFeature(flag, { enforced: true, plan });
    assert.equal(typeof result, "boolean", `${flag} under ${plan} should resolve to a boolean`);
  }
}

// PlushPlus is a strict subset of PlushFamily's features (family should
// never have less than plus).
const plusFeatures = entitlements.PLAN_FEATURES[entitlements.PLUSH_PLANS.PLUSHPLUS];
const familyFeatures = entitlements.PLAN_FEATURES[entitlements.PLUSH_PLANS.PLUSHFAMILY];
assert.ok(plusFeatures.every((flag) => familyFeatures.includes(flag)), "PlushFamily should include every PlushPlus feature");
for (const flag of entitlements.CORE_FREE_FEATURES) assert.equal(entitlements.hasPlushFeature(flag,{enforced:true,plan:"free"}),true, `${flag} must remain free`);
assert.equal(entitlements.hasPlushFeature("plushAdvancedInsights",{enforced:true,plan:"free"}),false);

console.log("entitlements tests passed");
