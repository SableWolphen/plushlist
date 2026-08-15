export const PLUSH_GOLD_ACCESS_MODE = "free_preview";
export const PLUSH_GOLD_BILLING_ENABLED = false;

export const PLUSH_GOLD_FEATURES = Object.freeze({
  advanced_growth_insights: { label: "Advanced PlushGrowth insights", status: "available" },
  smart_next_step: { label: "Smarter Next Step", status: "available" },
  adaptive_habit_coaching: { label: "Adaptive habit coaching", status: "available" },
  advanced_reminders: { label: "Advanced reminder intelligence", status: "available" },
  habit_experiments: { label: "Habit experiments", status: "available" },
  recovery_intelligence: { label: "Recovery & comeback intelligence", status: "available" },
  expanded_growth_history: { label: "Expanded PlushGrowth history", status: "available" },
  guided_gold_paths: { label: "Gold guided PlushPaths", status: "available" },
  multiple_focus_habits: { label: "Multiple Focus Habits / focus cycles", status: "reserved" },
  advanced_planning: { label: "Advanced planning", status: "available" },
  advanced_personalization: { label: "Advanced personalization controls", status: "reserved" },
  priority_history_protection: { label: "Enhanced sync & history protection", status: "available" },
  gold_reports: { label: "Gold reports", status: "reserved" },
});

// During the preview every Gold capability remains unlocked for everyone.
// A future billing implementation should replace the entitlement resolver,
// not scatter purchase checks throughout product components.
export function hasGoldAccess() {
  return PLUSH_GOLD_ACCESS_MODE === "free_preview" || PLUSH_GOLD_ACCESS_MODE === "included";
}

export function hasGoldFeature(featureId) {
  if (!PLUSH_GOLD_FEATURES[featureId]) return false;
  return hasGoldAccess();
}

export function goldFeatureStatus(featureId) {
  return PLUSH_GOLD_FEATURES[featureId]?.status || "unknown";
}

export function goldPreviewSummary() {
  return {
    accessMode: PLUSH_GOLD_ACCESS_MODE,
    billingEnabled: PLUSH_GOLD_BILLING_ENABLED,
    unlocked: hasGoldAccess(),
    features: Object.entries(PLUSH_GOLD_FEATURES).map(([id, value]) => ({ id, ...value })),
  };
}
