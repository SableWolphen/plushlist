(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeBilling = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Billing-provider architecture placeholder — moved out of the main
  // app-source script (module split phase 3). Nothing here is wired up to
  // real Play Billing yet; every method just throws until that's built.

  const GooglePlayBillingProvider = {
    provider: "google_play",
    async getProducts() {
      throw new Error("Google Play Billing is not wired up yet - this is architecture groundwork only.");
    },
    async purchase(_productId) {
      throw new Error("Google Play Billing is not wired up yet - this is architecture groundwork only.");
    },
    async restorePurchases() {
      throw new Error("Google Play Billing is not wired up yet - this is architecture groundwork only.");
    },
    async getSubscriptionStatus() {
      // Real implementation reads from the entitlements table (database/entitlements.sql),
      // never trusting a client-reported purchase directly - see project spec section 34.
      return null;
    },
    async manageSubscription() {
      throw new Error("Google Play Billing is not wired up yet - this is architecture groundwork only.");
    },
  };

  // Documented adapter location for future Apple StoreKit support (iPhone/iPad).
  // Intentionally not implemented - do not build a fake purchase flow here.
  // When built, it must satisfy the exact same BillingProvider shape above so
  // a user who already purchased on one platform is never asked to pay twice.
  // const AppleStoreKitProvider = { provider: "apple_app_store", ... };

  function getBillingProvider() {
    // Add a platform check here (Capacitor.getPlatform() === "ios") once
    // AppleStoreKitProvider exists. Android and web both use Google Play today.
    return GooglePlayBillingProvider;
  }

  return { GooglePlayBillingProvider, getBillingProvider };
});
