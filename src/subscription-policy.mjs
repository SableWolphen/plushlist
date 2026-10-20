// Product catalog is informational until a server-verified billing integration is deployed.
// Do not treat client fields, checkout redirects, or local storage as proof of purchase.
export const PLAN_CATALOG = Object.freeze({
  free: Object.freeze({ id: "free", monthlyUsdCents: 0, active: true }),
  plushplus: Object.freeze({ id: "plushplus", monthlyUsdCents: 499, active: false }),
  plushfamily: Object.freeze({ id: "plushfamily", monthlyUsdCents: 899, active: false }),
});
const ACTIVE_STATUSES = new Set(["active", "in_grace_period"]);
const VERIFIED_PROVIDERS = new Set(["stripe", "google_play", "apple_app_store"]);
export function publicPlans() {
  return Object.values(PLAN_CATALOG).map(({ id, monthlyUsdCents, active }) =>
    ({ id, monthlyUsdCents, checkoutEnabled: active && id !== "free" }));
}
export function resolveServerEntitlement(record, now = Date.now()) {
  if (!record || typeof record !== "object") return "free";
  if (!VERIFIED_PROVIDERS.has(record.provider) || !ACTIVE_STATUSES.has(record.status)) return "free";
  if (!["plushplus", "plushfamily"].includes(record.plan)) return "free";
  if (record.serverVerified !== true || typeof record.verifiedAt !== "string" ||
      !Number.isFinite(Date.parse(record.verifiedAt))) return "free";
  if (record.expiresAt !== null && record.expiresAt !== undefined) {
    const expiry = Date.parse(record.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= now) return "free";
  }
  return record.plan;
}
export function assertCheckoutReady(config) {
  const required = ["providerConfigured", "webhookVerified", "entitlementsPersisted",
    "termsPublished", "refundPolicyPublished", "platformComplianceReviewed"];
  const missing = required.filter(key => config?.[key] !== true);
  if (missing.length) throw new Error("Checkout disabled: " + missing.join(", "));
  return true;
}
