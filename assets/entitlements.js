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
    if (root.document && !root.__plushlifeExperiencePolishLoading) {
      root.__plushlifeExperiencePolishLoading = true;
      const experiencePolishScript = root.document.createElement("script");
      experiencePolishScript.src = "./assets/experience-polish.js";
      experiencePolishScript.defer = true;
      root.document.head.appendChild(experiencePolishScript);
    }
    if (root.document && !root.__plushlifeGentleRewardLoading) {
      root.__plushlifeGentleRewardLoading = true;
      const gentleRewardScript = root.document.createElement("script");
      gentleRewardScript.src = "./assets/gentle-reward.js";
      gentleRewardScript.defer = true;
      root.document.head.appendChild(gentleRewardScript);
    }
    if (root.document && !root.__plushlifeWeeklyReflectionLoading) {
      root.__plushlifeWeeklyReflectionLoading = true;
      const weeklyReflectionScript = root.document.createElement("script");
      weeklyReflectionScript.src = "./assets/weekly-reflection-window.js";
      weeklyReflectionScript.defer = true;
      root.document.head.appendChild(weeklyReflectionScript);
    }
    if (root.document && !root.__plushlifeResumeContextLoading) {
      root.__plushlifeResumeContextLoading = true;
      const resumeContextScript = root.document.createElement("script");
      resumeContextScript.src = "./assets/resume-context.js";
      resumeContextScript.defer = true;
      root.document.head.appendChild(resumeContextScript);
    }
    if (root.document && !root.__plushlifeLandingMobileAuthLoading) {
      root.__plushlifeLandingMobileAuthLoading = true;
      const landingMobileAuthScript = root.document.createElement("script");
      landingMobileAuthScript.src = "./assets/landing-mobile-auth.js";
      landingMobileAuthScript.defer = true;
      root.document.head.appendChild(landingMobileAuthScript);
    }
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
