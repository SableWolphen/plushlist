import { hasGoldFeature } from "../plush-gold.js";
import { buildSmartTaskProfile, rankSmartTask, taskId } from "../task-intelligence.mjs";
import { buildRecommendationLearning } from "../recommendation-learning.mjs";

const HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function readHabitState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function currentPeriod(hour) {
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
}

function taskLowCapacityEssential(row) {
  const task = row?.sourceTask || row || {};
  return !!(task.essential_on_low_capacity ?? task.essentialOnLowCapacity ?? row?.essential_on_low_capacity ?? row?.essentialOnLowCapacity);
}

function taskEstimatedMinutes(row) {
  const task = row?.sourceTask || row || {};
  const value = Number(task.estimated_minutes ?? task.estimatedMinutes ?? row?.estimated_minutes ?? row?.estimatedMinutes);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function conciseReason(reasons = [], dayReason = "", learnedReason = "", adaptationReason = "") {
  const labels = reasons.slice(0, 2).map((reason) => {
    if (reason.includes("Focus Habit")) return "Focus Habit";
    if (reason.includes("essentials")) return "Essential today";
    if (reason.includes("good") && reason.includes("task for you")) return "Good fit right now";
    if (reason.includes("smaller lift")) return "Fits your energy";
    if (reason.includes("gentler version")) return "Gentler version available";
    if (reason.includes("crowded day")) return "Good size for today";
    if (reason.includes("realistic size")) return "Realistic for this late";
    if (reason.includes("rebuilding")) return "Rebuilding gently";
    if (reason.includes("little support")) return "Could use support";
    return reason.replace(/^it is /, "").replace(/^this is /, "");
  });
  if (adaptationReason) labels.unshift(adaptationReason);
  if (learnedReason && labels.length < 2) labels.push(learnedReason);
  if (dayReason && labels.length < 2) labels.push(dayReason);
  return [...new Set(labels)].slice(0, 2).join(" · ") || "Useful unfinished step for right now";
}

function dayModelReason(prediction) {
  if (!prediction) return "";
  if (prediction.reasons?.includes("fits current energy")) return "Fits this kind of day";
  if (prediction.reasons?.includes("finishable on a crowded day")) return "Good size for today";
  if (prediction.reasons?.includes("good timing")) return "Good timing";
  if (prediction.suggestedVersion) return "Gentler version ready";
  return "";
}

function feedbackReason(feedback, sequenceBonus) {
  if (sequenceBonus > 0) return "Often works well after what you just did";
  if (!feedback || feedback.confidence === "learning") return "";
  if (feedback.preferGentler) return "Smaller version tends to work better";
  if (feedback.acceptanceRate >= 70) return "Usually a good recommendation for you";
  return "";
}

function adaptationReason(dayType, lowCapacity, overwhelmed) {
  if (dayType === "tiny") return "Tiny Day: smallest useful step";
  if (dayType === "recovery") return "Recovery Day: rebuild gently";
  if (dayType === "soft") return "Soft Day: lower-pressure fit";
  if (overwhelmed) return "Today changed: keeping this gentle";
  if (lowCapacity) return "Fits your energy right now";
  return "";
}

export function useSmartNextStep({ rows = [], viewDone = {}, period, dailyCheckIn = {}, fallbackTask = null, recentlyCompletedKeys = [] }) {
  const [revision, setRevision] = React.useState(0);

  React.useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => {
      window.removeEventListener("plushlife:habit-coach-updated", refresh);
      window.removeEventListener("plushlife:habit-coach-hydrated", refresh);
    };
  }, []);

  return React.useMemo(() => {
    const goldSmart = hasGoldFeature("smart_next_step");
    const state = readHabitState();
    const engine = goldSmart ? (state.meta?.__background_engine || {}) : {};
    const profiles = engine.habitProfiles || {};
    const smartProfiles = engine.smartTaskProfiles || {};
    const dayModel = engine.dayModel || {};
    const date = String(period?.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const focusHabitId = String(state.meta?.focus_habit_id || "");
    const anchorId = focusHabitId || String(state.anchors?.[date] || "");
    const recent = new Set(recentlyCompletedKeys || []);
    const energy = String(dailyCheckIn?.energy || "").toLowerCase();
    const capacity = String(dailyCheckIn?.capacity || "").toLowerCase();
    const mood = String(dailyCheckIn?.mood || "").toLowerCase();
    const dayType = String(dailyCheckIn?.day_type || "full").toLowerCase();
    const lowCapacity = ["empty", "low"].includes(energy) || ["very_low", "low"].includes(capacity);
    const overwhelmed = ["overwhelmed", "anxious", "stressed", "sick"].includes(mood) && lowCapacity;
    const now = new Date();
    const nowPeriod = currentPeriod(now.getHours());
    const fallbackKey = fallbackTask?.key || "";
    const recommendationLearning = buildRecommendationLearning({
      feedback: engine.nextStepFeedback || [],
      history: state.history || {},
      completionEvents: engine.completionEvents || [],
      sequences: engine.learning?.sequences || [],
      today: date,
      now,
    });
    const comfortableTaskCount = Number(recommendationLearning.capacity?.comfortableTaskCount);
    const requiredCount = (rows || []).filter((row) => row && !row.isBonus).length;
    const beyondPersonalCapacity = Number.isFinite(comfortableTaskCount) && comfortableTaskCount > 0 && requiredCount > comfortableTaskCount;
    const capacityForecast = {
      crowded: beyondPersonalCapacity,
      comfortableTaskCount: Number.isFinite(comfortableTaskCount) && comfortableTaskCount > 0 ? comfortableTaskCount : null,
      suggestedDayType: dayType !== "full" ? dayType : (overwhelmed ? "tiny" : lowCapacity || beyondPersonalCapacity ? "soft" : "full"),
      reason: overwhelmed ? "Your check-in suggests a very gentle day may fit better." : lowCapacity ? "Your current energy may fit a softer day." : beyondPersonalCapacity ? "Today has more visible tasks than your recent comfortable range." : "",
    };

    if (dayType === "rest") return { task: null, reason: "Rest is the plan today", dayModel, recommendationLearning, capacityForecast };

    let candidates = (rows || []).filter((row) => row && !row.isBonus && !viewDone?.[row.key] && !recent.has(row.key));
    if (!candidates.length) return { task: fallbackTask, reason: "", dayModel, recommendationLearning, capacityForecast };

    const essentials = candidates.filter(taskLowCapacityEssential);
    if (["tiny", "recovery"].includes(dayType) && essentials.length) candidates = essentials;
    else if (overwhelmed && essentials.length) candidates = essentials;

    const ranked = candidates.map((row, index) => {
      const id = taskId(row);
      const learned = profiles[id] || {};
      const profile = smartProfiles[id] || buildSmartTaskProfile({
        row,
        learned,
        load: engine.load || {},
        nowPeriod,
        focusTaskId: anchorId,
      });
      const rankedTask = rankSmartTask({ profile, index, lowCapacity: lowCapacity || dayType !== "full", fallback: row.key === fallbackKey });
      const prediction = dayModel.taskPredictions?.[id] || null;
      const dayAdjustment = Number.isFinite(Number(prediction?.adjustment)) ? Number(prediction.adjustment) : 0;
      const feedback = recommendationLearning.taskFeedback?.[id] || null;
      const feedbackAdjustment = Number.isFinite(Number(feedback?.scoreAdjustment)) ? Number(feedback.scoreAdjustment) : 0;
      const sequenceBonus = Number(recommendationLearning.sequenceBonuses?.[id] || 0);
      const minutes = taskEstimatedMinutes(row);
      let capacityAdjustment = 0;
      if (beyondPersonalCapacity) {
        if (profile.quickWin) capacityAdjustment += 5;
        if (profile.highEffort) capacityAdjustment -= 8;
      }
      if (feedback?.preferGentler && profile.tinyLabel) capacityAdjustment += 4;
      if (taskLowCapacityEssential(row) && (lowCapacity || dayType !== "full")) capacityAdjustment += 12;
      if (minutes && dayType === "soft" && minutes <= 10) capacityAdjustment += 4;
      if (minutes && ["tiny", "recovery"].includes(dayType) && minutes <= 5) capacityAdjustment += 8;
      if (profile.highEffort && ["soft", "tiny", "recovery"].includes(dayType)) capacityAdjustment -= 12;
      return {
        row,
        prediction,
        feedback,
        sequenceBonus,
        ...rankedTask,
        score: rankedTask.score + dayAdjustment + feedbackAdjustment + sequenceBonus + capacityAdjustment,
      };
    }).sort((a, b) => b.score - a.score);

    const winner = ranked[0];
    return {
      task: winner.row,
      reason: conciseReason(
        winner.reasons,
        dayModelReason(winner.prediction),
        feedbackReason(winner.feedback, winner.sequenceBonus),
        adaptationReason(dayType, lowCapacity, overwhelmed),
      ),
      dayModel,
      prediction: winner.prediction,
      recommendationLearning,
      feedback: winner.feedback,
      capacityForecast,
    };
  }, [rows, viewDone, period?.date, dailyCheckIn?.energy, dailyCheckIn?.capacity, dailyCheckIn?.mood, dailyCheckIn?.day_type, fallbackTask?.key, recentlyCompletedKeys, revision]);
}
