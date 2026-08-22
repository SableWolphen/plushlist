(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.PlushLifeEntitlements = api;
    const load = (flag, src) => {
      if (!root.document || root[flag]) return;
      root[flag] = true;
      const script = root.document.createElement("script");
      script.src = src;
      script.defer = true;
      root.document.head.appendChild(script);
    };
    load("__plushlifePremiumSmartLoading", "./assets/premium-smart.js");
    load("__plushlifeDarkModeLoading", "./assets/dark-mode.js");
    load("__plushlifeNurseryThemeLoading", "./assets/nursery-theme.js");
    load("__plushlifeExperiencePolishLoading", "./assets/experience-polish.js");
    load("__plushlifeStatePolishLoading", "./assets/state-polish.js");
    load("__plushlifeGentleRewardLoading", "./assets/gentle-reward.js");
    load("__plushlifeWeeklyReflectionLoading", "./assets/weekly-reflection-window.js");
    load("__plushlifeResumeContextLoading", "./assets/resume-context.js");
    load("__plushlifeLandingMobileAuthLoading", "./assets/landing-mobile-auth.js");
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const PLUSH_PLANS = { FREE: "free", PLUSHPLUS: "plushplus", PLUSHFAMILY: "plushfamily" };
  const PLUSH_FEATURE_FLAGS = [
    "plushUnlimitedHabits","plushAdvancedRoutines","plushAdvancedInsights","plushFullPathsLibrary","plushAdvancedJournal","plushFocusTools","plushCalmTools","plushSleepTools","plushCloudBackup","plushCrossDeviceSync","plushWidgets","plushSmartProgress","plushSmartFocus","plushSmartReminders","plushAdaptiveRoutines","plushPersonalizedCalm","plushJournalPatterns","plushSmartRecommendations","plushPersonalizedGuide","plushFamilyFeatures",
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
    const features = PLAN_FEATURES[devPreviewPlan || plan];
    return Array.isArray(features) && features.includes(featureKey);
  }
  return { PLUSH_PLANS, PLUSH_FEATURE_FLAGS, PLAN_FEATURES, hasPlushFeature };
});

(function keepFullTodayTaskListStable() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const installOverride = () => {
    if (document.getElementById("plushlife-full-task-list-override")) return;
    const style = document.createElement("style");
    style.id = "plushlife-full-task-list-override";
    style.textContent = `[data-plushlife-home-overflow="true"] { display:flex!important; } #plushlife-home-more { display:none!important; }`;
    document.head.appendChild(style);
  };
  if (document.readyState === "loading") window.addEventListener("load", installOverride, { once: true }); else installOverride();
})();
