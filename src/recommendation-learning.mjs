export const RECOMMENDATION_LEARNING_VERSION = 1;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function feedbackProfile(events) {
  const recent = events.slice(-20);
  const counts = { done: 0, easier: 0, skip: 0, hide: 0 };
  recent.forEach((event) => {
    if (Object.prototype.hasOwnProperty.call(counts, event.action)) counts[event.action] += 1;
  });
  const decisions = counts.done + counts.skip + counts.hide;
  const acceptanceRate = decisions ? counts.done / decisions : null;
  const easierRate = recent.length ? counts.easier / recent.length : 0;

  let scoreAdjustment = 0;
  if (decisions >= 3 && acceptanceRate !== null) {
    scoreAdjustment += Math.round((acceptanceRate - 0.5) * 24);
  }
  if (counts.skip + counts.hide >= 3) scoreAdjustment -= 5;
  if (counts.done >= 3) scoreAdjustment += 4;
  scoreAdjustment = clamp(scoreAdjustment, -14, 14);

  let friction = "";
  if (counts.easier >= 2 && easierRate >= 0.3) friction = "too_much_effort";
  else if (counts.skip >= 3 && counts.skip >= counts.hide) friction = "not_a_good_fit_now";
  else if (counts.hide >= 3) friction = "too_much_pressure";

  return {
    samples: recent.length,
    counts,
    acceptanceRate: acceptanceRate === null ? null : Math.round(acceptanceRate * 100),
    easierRate: Math.round(easierRate * 100),
    scoreAdjustment,
    preferGentler: counts.easier >= 2 && easierRate >= 0.3,
    friction,
    confidence: recent.length >= 8 ? "strong" : recent.length >= 4 ? "moderate" : "learning",
  };
}

function sustainableCapacity(history) {
  const successfulCounts = Object.entries(history || {})
    .filter(([date]) => validDate(date))
    .slice(-42)
    .map(([, day]) => Object.values(day || {}).filter(Boolean))
    .filter((items) => items.length >= 2)
    .map((items) => ({ active: items.length, rate: items.filter((item) => item?.done).length / items.length }))
    .filter((day) => day.rate >= 0.7)
    .map((day) => day.active);

  if (successfulCounts.length < 5) return { comfortableTaskCount: null, samples: successfulCounts.length, confidence: "learning" };
  return {
    comfortableTaskCount: median(successfulCounts),
    samples: successfulCounts.length,
    confidence: successfulCounts.length >= 12 ? "strong" : "moderate",
  };
}

function recentSequenceBonuses({ sequences = [], completionEvents = [], today = "", now = new Date() }) {
  const nowMs = now.getTime();
  const recentAnchors = new Set((completionEvents || [])
    .filter((event) => event?.habitId && event.date === today)
    .filter((event) => {
      const at = Date.parse(event.completedAt || "");
      return Number.isFinite(at) && nowMs >= at && nowMs - at <= 90 * 60 * 1000;
    })
    .map((event) => String(event.habitId)));

  const bonuses = {};
  (sequences || []).forEach((sequence) => {
    const anchorId = String(sequence?.anchorHabitId || "");
    const habitId = String(sequence?.habitId || "");
    if (!anchorId || !habitId || !recentAnchors.has(anchorId)) return;
    const agreement = number(sequence.agreement, 0);
    const count = number(sequence.count, 0);
    if (count < 3 || agreement < 0.55) return;
    bonuses[habitId] = Math.max(bonuses[habitId] || 0, clamp(Math.round(5 + agreement * 8), 6, 13));
  });
  return bonuses;
}

export function buildRecommendationLearning({ feedback = [], history = {}, completionEvents = [], sequences = [], today = "", now = new Date() } = {}) {
  const byTask = {};
  (feedback || []).filter((event) => event?.taskId && event?.action).forEach((event) => {
    const id = String(event.taskId);
    if (!byTask[id]) byTask[id] = [];
    byTask[id].push(event);
  });

  const taskFeedback = Object.fromEntries(Object.entries(byTask).map(([id, events]) => [id, feedbackProfile(events)]));
  const capacity = sustainableCapacity(history);
  const sequenceBonuses = recentSequenceBonuses({ sequences, completionEvents, today, now });

  return {
    version: RECOMMENDATION_LEARNING_VERSION,
    taskFeedback,
    capacity,
    sequenceBonuses,
    updatedAt: now.toISOString(),
  };
}
