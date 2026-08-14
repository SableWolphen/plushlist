export const SMART_TASK_PROFILE_VERSION = 1;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function taskId(row) {
  return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
}

export function taskEstimatedMinutes(row) {
  return Math.max(0, number(row?.sourceTask?.estimated_minutes ?? row?.estimated_minutes, 0));
}

export function taskTinyLabel(row) {
  return String(row?.sourceTask?.tiny_label || row?.tiny_label || row?.sourceTask?.soft_label || row?.soft_label || "").trim();
}

export function taskIsEssential(row) {
  return !!(row?.isEssential || row?.essential || row?.sourceTask?.essential || row?.sourceTask?.is_essential || row?.sourceTask?.essential_on_low_capacity);
}

export function buildSmartTaskProfile({ row, learned = {}, load = {}, nowPeriod = "", focusTaskId = "" } = {}) {
  const id = taskId(row);
  const estimatedMinutes = taskEstimatedMinutes(row);
  const tinyLabel = taskTinyLabel(row);
  const preferredPeriod = String(learned.preferredPeriod || "");
  const completionRate = Number.isFinite(Number(learned.completionRate)) ? Number(learned.completionRate) : null;
  const confidence = String(learned.confidence || "learning");
  const stability = String(learned.stability || "Learning");
  const isEssential = taskIsEssential(row);
  const isFocus = !!id && id === String(focusTaskId || "");
  const timingMatch = !!preferredPeriod && !!nowPeriod && preferredPeriod === nowPeriod;
  const timingMismatch = !!preferredPeriod && !!nowPeriod && preferredPeriod !== nowPeriod;
  const fragile = stability === "Fragile" || stability === "Recovering";
  const reliable = confidence === "strong" && completionRate !== null && completionRate >= 85 && stability === "Stable";
  const lowCapacityFit = estimatedMinutes > 0 && estimatedMinutes <= 10;
  const highEffort = estimatedMinutes >= 30;
  const friction = String(learned.dominantMissReason || "");

  let completionLikelihood = 50;
  if (completionRate !== null) completionLikelihood = completionRate;
  if (timingMatch) completionLikelihood += 8;
  if (timingMismatch) completionLikelihood -= 5;
  if (lowCapacityFit) completionLikelihood += 4;
  if (highEffort) completionLikelihood -= 7;
  if (tinyLabel) completionLikelihood += 3;
  if (stability === "Recovering") completionLikelihood -= 6;
  if (stability === "Fragile") completionLikelihood -= 4;
  completionLikelihood = clamp(Math.round(completionLikelihood), 5, 95);

  let supportNeed = 10;
  if (fragile) supportNeed += stability === "Recovering" ? 34 : 26;
  if (friction) supportNeed += 10;
  if (completionRate !== null && completionRate < 55) supportNeed += 16;
  if (learned.daysSinceDone >= 3) supportNeed += 12;
  if (isFocus) supportNeed += 12;
  supportNeed = clamp(Math.round(supportNeed), 0, 100);

  const suggestedVisible = number(load?.suggestedVisibleCount, 0);
  return {
    version: SMART_TASK_PROFILE_VERSION,
    id,
    key: String(row?.key || id),
    isEssential,
    isFocus,
    estimatedMinutes,
    tinyLabel,
    preferredPeriod,
    preferredHour: learned.preferredHour ?? null,
    confidence,
    stability,
    completionRate,
    completionLikelihood,
    supportNeed,
    friction,
    timingMatch,
    timingMismatch,
    lowCapacityFit,
    highEffort,
    reliable,
    suggestedVisible,
  };
}

export function rankSmartTask({ profile, index = 0, lowCapacity = false, fallback = false } = {}) {
  if (!profile) return { score: -Infinity, reasons: [] };
  let score = 100 - Math.min(index, 40);
  const reasons = [];

  if (profile.isFocus) { score += 70; reasons.push("it is your Focus Habit"); }
  if (profile.isEssential) { score += 26; reasons.push("it is one of today's essentials"); }
  if (fallback) score += 14;

  // Balance “easy to do now” with “needs support” so PlushLife does not
  // endlessly pick only easy wins or only difficult recovery tasks.
  score += Math.round((profile.completionLikelihood - 50) * 0.22);
  score += Math.round(profile.supportNeed * 0.18);

  if (profile.stability === "Recovering") reasons.push("it is rebuilding after a rough patch");
  else if (profile.stability === "Fragile") reasons.push("it could use a little support");

  if (profile.timingMatch && profile.confidence !== "learning") reasons.push(`this is usually a good ${profile.preferredPeriod} task for you`);
  if (profile.timingMismatch && profile.friction === "bad_timing") score -= 10;

  if (lowCapacity) {
    if (profile.lowCapacityFit) { score += 12; reasons.push("it is a smaller lift for your current energy"); }
    if (profile.tinyLabel) { score += 8; reasons.push("it has a gentler version ready"); }
    if (profile.highEffort) score -= 12;
  }

  if (profile.reliable) score -= 3;
  return { score, reasons };
}
