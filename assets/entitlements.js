(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.PlushLifeEntitlements = api;
    if (root.document && !root.__plushlifePremiumSmartLoading) {
      root.__plushlifePremiumSmartLoading = true;
      const script = root.document.createElement("script");
      script.src = "./assets/premium-smart.js";
      script.defer = true;
      root.document.head.appendChild(script);
    }
    if (root.document && !root.__plushlifeDarkModeLoading) {
      root.__plushlifeDarkModeLoading = true;
      const appearanceScript = root.document.createElement("script");
      appearanceScript.src = "./assets/dark-mode.js";
      appearanceScript.defer = true;
      root.document.head.appendChild(appearanceScript);
    }
    if (root.document && !root.__plushlifeNurseryThemeLoading) {
      root.__plushlifeNurseryThemeLoading = true;
      const nurseryThemeScript = root.document.createElement("script");
      nurseryThemeScript.src = "./assets/nursery-theme.js";
      nurseryThemeScript.defer = true;
      root.document.head.appendChild(nurseryThemeScript);
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Centralized future-subscription architecture. Nothing in this file is
  // called anywhere in the app to actually restrict a real feature today —
  // hasPlushFeature() always returns true unless explicitly told
  // enforced: true. This lets PlushLife build and test premium capabilities
  // before Play Billing is turned on, without taking anything away from beta users.

  const PLUSH_PLANS = {
    FREE: "free",
    PLUSHPLUS: "plushplus",
    PLUSHFAMILY: "plushfamily",
  };

  const PLUSH_FEATURE_FLAGS = [
    "plushUnlimitedHabits",
    "plushAdvancedRoutines",
    "plushAdvancedInsights",
    "plushFullPathsLibrary",
    "plushAdvancedJournal",
    "plushFocusTools",
    "plushCalmTools",
    "plushSleepTools",
    "plushCloudBackup",
    "plushCrossDeviceSync",
    "plushWidgets",
    "plushSmartProgress",
    "plushSmartFocus",
    "plushSmartReminders",
    "plushAdaptiveRoutines",
    "plushPersonalizedCalm",
    "plushJournalPatterns",
    "plushSmartRecommendations",
    "plushPersonalizedGuide",
    "plushFamilyFeatures",
  ];

  const PLUSHPLUS_FEATURES = PLUSH_FEATURE_FLAGS.filter((flag) => flag !== "plushFamilyFeatures");

  const PLAN_FEATURES = {
    [PLUSH_PLANS.FREE]: [],
    [PLUSH_PLANS.PLUSHPLUS]: PLUSHPLUS_FEATURES,
    [PLUSH_PLANS.PLUSHFAMILY]: [...PLUSHPLUS_FEATURES, "plushFamilyFeatures"],
  };

  function hasPlushFeature(featureKey, context) {
    const { enforced = false, plan = PLUSH_PLANS.FREE, devPreviewPlan = null } = context || {};
    if (!enforced) return true;
    const effectivePlan = devPreviewPlan || plan;
    const features = PLAN_FEATURES[effectivePlan];
    return Array.isArray(features) && features.includes(featureKey);
  }

  return { PLUSH_PLANS, PLUSH_FEATURE_FLAGS, PLAN_FEATURES, hasPlushFeature };
});

// Keep the normal Today task list fully visible without fighting the optional
// discovery helper on a timer. That helper may still tag rows as home overflow,
// but this late stylesheet makes that presentation tag inert. PlushRescue uses
// a different data-plushlife-rescue-hidden attribute, so explicit Rescue modes
// can still intentionally reduce the list.
(function keepFullTodayTaskListStable() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const installOverride = () => {
    if (document.getElementById("plushlife-full-task-list-override")) return;
    const style = document.createElement("style");
    style.id = "plushlife-full-task-list-override";
    style.textContent = `
      [data-plushlife-home-overflow="true"] { display: flex !important; }
      #plushlife-home-more { display: none !important; }
    `;
    document.head.appendChild(style);
  };
  if (document.readyState === "loading") {
    window.addEventListener("load", installOverride, { once: true });
  } else {
    installOverride();
  }
})();
