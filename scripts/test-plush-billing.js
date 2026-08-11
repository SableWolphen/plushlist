const assert = require("node:assert/strict");
const billing = require("../assets/plush-billing.js");

(async () => {
  const provider = billing.getBillingProvider();
  assert.equal(provider.provider, "google_play");
  assert.equal(provider, billing.GooglePlayBillingProvider);

  // Nothing is wired up to real billing yet — every purchase-shaped method
  // must throw rather than silently pretend to succeed, so a future caller
  // can never be fooled into thinking a purchase went through.
  for (const method of ["getProducts", "purchase", "restorePurchases", "manageSubscription"]) {
    await assert.rejects(() => provider[method](), /not wired up yet/, `${method} should reject until billing is implemented`);
  }

  // getSubscriptionStatus is the one exception — it's meant to be safely
  // callable today (checked before any purchase flow exists) and should
  // resolve to "no subscription" rather than throw.
  const status = await provider.getSubscriptionStatus();
  assert.equal(status, null);

  console.log("plush-billing tests passed");
})();
