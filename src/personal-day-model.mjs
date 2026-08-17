export const PERSONAL_DAY_MODEL_VERSION = 1;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function taskId(row) {
  return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
}

function taskMinutes(row) {
  return Math.max(0, number(row?.sourceTask?.estimated_minutes ?? row?.estimated_minutes, 0));
}

function gentlerLabel(row) {
  return String(row?.sourceTask?.tiny_label || row?.tiny_label || row?.sourceTask?.soft_label || row?.soft_label || "").trim();
}

function evidenceConfidence(observedDays, checkInDays, completionEvents) {
  const evidence = clamp(Math.round(
    Math.min(observedDays, 21) / 21 * 55 +
    Math.min(checkInDays, 14) / 14 * 25 +
    Math.min(completionEvents, 20) / 20 * 20
  ));
  return {
    evidence,
    confidence: evidence >= 72 ? "strong" : evidence >= 42 ? "moderate" : "learning",
  };
}

function recommendedDayType({ lowCapacity, overloadRisk, recentGap, incomplete, hour }) {
  if (recentGap >= 5) return "recovery";
  if (lowCapacity && overloadRisk >= 72) return "tiny";
  if (lowCapacity || overloadRisk >= 64 || (hour >= 20 && incomplete >= 4)) return "soft";
  return "full";
}

function stateLabel({ dayType, overloadRisk, lowCapacity, recentGap, hour }) {
  if (recentGap >= 5) return "coming back gently";
  if (dayType === "tiny") return "very low-capacity day";
  if (dayType === "soft" && lowCapacity) return "lower-energy day";
  if (overloadRisk >= 70) return "crowded day";
  if (hour >= 21) return "late-day wind-down";
  return "steady day";
}

function buildIntervention({ dayType, overloadRisk, load, recentGap, rows, taskPredictions, profiles }) {
  if (recentGap >= 2) {
    return {
      kind: "comeback",
      title: recentGap >= 5 ? "Restart with less pressure" : "Make the return easy",
      text: recentGap >= 5
        ? "A smaller Recovery-style day is more realistic than trying to catch up."
        : "Resume with the most important few things instead of rebuilding the whole backlog.",
    };
  }

  if (overloadRisk >= 72) {
    return {
      kind: "trim",
      title: "Trim the visible day early",
      text: `Keep about ${Math.max(1, number(load?.suggestedVisibleCount, 3))} important things in view before the day gets more crowded.`,
    };
  }

  const fragile = (rows || [])
    .map((row) => ({ row, profile: profiles?.[taskId(row)] || {}, prediction: taskPredictions?.[taskId(row)] }))
    .filter(({ profile, prediction }) => prediction && ["Fragile", "Recovering"].includes(String(profile.stability || "")))
    .sort((a, b) => number(b.profile.evidence) - number(a.profile.evidence))[0];

  if (fragile) {
    const label = String(fragile.row?.label || "this task");
    const tiny = gentlerLabel(fragile.row);
    return {
      kind: tiny ? "smaller" : "timing",
      title: tiny ? `Use the gentler version of “${label}”` : `Protect “${label}”`,
      text: tiny
        ? `“${tiny}” is ready when the full version is too much.`
        : fragile.profile.preferredPeriod
          ? `This habit tends to land better around ${fragile.profile.preferredPeriod}.`
          : "This habit has been less reliable lately, so give it a little more support.",
    };
  }

  if (dayType === "soft") {
    return { kind: "pace", title: "Keep today realistic", text: "Favor smaller, finishable steps and leave high-effort tasks for a better window when possible." };
  }

  return { kind: "steady", title: "Keep the day steady", text: "No major adjustment is needed yet. PlushLife can keep learning from what actually happens today." };
}

export function buildPersonalDayModel({ rows = [], viewDone = {}, dailyCheckIn = {}, profiles = {}, smartTaskProfiles = {}, load = {}, recovery = {}, crossPatterns = {}, hour = new Date().getHours(), checkInDays = 0 } = {}) {
  const active = (rows || []).filter((row) => row && !row.isBonus);
  const incompleteRows = active.filter((row) => !viewDone?.[row.key]);
  const incomplete = incompleteRows.length;
  const done = active.length - incomplete;
  const lowCapacity = ["empty", "low"].includes(String(dailyCheckIn?.energy || "")) || ["very_low", "low"].includes(String(dailyCheckIn?.capacity || ""));
  const highCapacity = dailyCheckIn?.energy === "high" || dailyCheckIn?.capacity === "high";
  const recentGap = Math.max(0, number(recovery?.recentGap));
  const loadScore = clamp(number(load?.score, active.length * 6 + incomplete * 3));
  const latePressure = hour >= 20 ? Math.min(20, incomplete * 4) : hour >= 17 ? Math.min(10, incomplete * 2) : 0;
  const capacityPressure = lowCapacity ? 18 : highCapacity ? -7 : 0;
  const comebackPressure = recentGap >= 5 ? 14 : recentGap >= 2 ? 7 : 0;
  const overloadRisk = clamp(Math.round(loadScore * 0.72 + latePressure + capacityPressure + comebackPressure));
  const dayType = recommendedDayType({ lowCapacity, overloadRisk, recentGap, incomplete, hour });

  const profileValues = Object.values(profiles || {});
  const observedDays = Math.max(0, ...profileValues.map((profile) => number(profile?.observedDays)), 0);
  const completionEvents = profileValues.reduce((sum, profile) => sum + number(profile?.completionEvents), 0);
  const confidenceInfo = evidenceConfidence(observedDays, number(checkInDays), completionEvents);

  const taskPredictions = {};
  incompleteRows.forEach((row) => {
    const id = taskId(row);
    if (!id) return;
    const smart = smartTaskProfiles?.[id] || {};
    const profile = profiles?.[id] || {};
    const minutes = taskMinutes(row);
    const tiny = gentlerLabel(row);
    let likelihood = number(smart.completionLikelihood, Number.isFinite(Number(profile.completionRate)) ? Number(profile.completionRate) : 50);
    let adjustment = 0;
    const reasons = [];

    if (smart.timingMatch && profile.confidence !== "learning") { adjustment += 7; reasons.push("good timing"); }
    if (smart.timingMismatch && profile.confidence !== "learning") { adjustment -= 5; reasons.push("weaker timing"); }
    if (lowCapacity && minutes > 0 && minutes <= 10) { adjustment += 8; reasons.push("fits current energy"); }
    if (lowCapacity && minutes >= 30) { adjustment -= 14; reasons.push("large for current energy"); }
    if ((dayType === "tiny" || dayType === "soft") && tiny) { adjustment += 6; reasons.push("gentler version available"); }
    if (overloadRisk >= 70 && minutes > 0 && minutes <= 15) { adjustment += 7; reasons.push("finishable on a crowded day"); }
    if (overloadRisk >= 70 && minutes >= 30) { adjustment -= 10; reasons.push("adds load to a crowded day"); }
    if (hour >= 21 && minutes >= 30) { adjustment -= 12; reasons.push("too large this late"); }
    if (profile.stability === "Recovering") { adjustment -= 4; reasons.push("rebuilding"); }

    likelihood = clamp(Math.round(likelihood + adjustment), 5, 95);
    taskPredictions[id] = {
      likelihood,
      adjustment,
      reasons,
      suggestedVersion: (dayType === "tiny" || dayType === "soft") && tiny ? tiny : "",
      preferredPeriod: profile.preferredPeriod || "",
    };
  });

  const lowEnergyGap = Number.isFinite(Number(crossPatterns?.lowEnergyCompletion)) && Number.isFinite(Number(crossPatterns?.usualEnergyCompletion))
    ? Number(crossPatterns.usualEnergyCompletion) - Number(crossPatterns.lowEnergyCompletion)
    : null;
  const associatedPatterns = [];
  if (lowEnergyGap !== null && lowEnergyGap >= 15) associatedPatterns.push(`Low-energy days have about ${Math.round(lowEnergyGap)} points lower completion than usual-energy days.`);
  if (recentGap >= 2) associatedPatterns.push(`There has been a ${recentGap}-day gap, so comeback behavior matters more than normal optimization.`);

  const intervention = buildIntervention({ dayType, overloadRisk, load, recentGap, rows: incompleteRows, taskPredictions, profiles });

  return {
    version: PERSONAL_DAY_MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    state: stateLabel({ dayType, overloadRisk, lowCapacity, recentGap, hour }),
    recommendedDayType: dayType,
    overloadRisk,
    completion: { active: active.length, done, incomplete, percent: active.length ? Math.round(done / active.length * 100) : 0 },
    confidence: confidenceInfo.confidence,
    evidence: confidenceInfo.evidence,
    taskPredictions,
    intervention,
    associatedPatterns,
    uncertainty: confidenceInfo.confidence === "learning"
      ? "Still learning — this is a cautious estimate, not a conclusion."
      : confidenceInfo.confidence === "moderate"
        ? "This pattern has repeated enough to guide gentle suggestions, but PlushLife should keep testing it."
        : "This pattern has repeated across enough real days to use with stronger confidence.",
  };
}
