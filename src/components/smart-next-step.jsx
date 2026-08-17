import { hasGoldFeature } from "../plush-gold.js";
import { buildSmartTaskProfile, rankSmartTask, taskId } from "../task-intelligence.mjs";

const HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function readHabitState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function currentPeriod(hour) {
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
}

function conciseReason(reasons = []) {
  const labels = reasons.slice(0, 2).map((reason) => {
    if (reason.includes("Focus Habit")) return "Focus Habit";
    if (reason.includes("essentials")) return "Essential today";
    if (reason.includes("good") && reason.includes("task for you")) return "Good fit right now";
    if (reason.includes("smaller lift")) return "Fits your energy";
    if (reason.includes("gentler version")) return "Gentler version available";
    if (reason.includes("rebuilding")) return "Rebuilding gently";
    if (reason.includes("little support")) return "Could use support";
    return reason.replace(/^it is /, "").replace(/^this is /, "");
  });
  return labels.length ? labels.join(" · ") : "Useful unfinished step for right now";
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
    const date = String(period?.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const focusHabitId = String(state.meta?.focus_habit_id || "");
    const anchorId = focusHabitId || String(state.anchors?.[date] || "");
    const recent = new Set(recentlyCompletedKeys || []);
    const lowCapacity = ["empty", "low"].includes(String(dailyCheckIn?.energy || "")) || ["very_low", "low"].includes(String(dailyCheckIn?.capacity || ""));
    const nowPeriod = currentPeriod(new Date().getHours());
    const fallbackKey = fallbackTask?.key || "";

    const candidates = (rows || []).filter((row) => row && !row.isBonus && !viewDone?.[row.key] && !recent.has(row.key));
    if (!candidates.length) return { task: fallbackTask, reason: "" };

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
      // Regression contract: One Next Step still uses profile.preferredPeriod,
      // profile.stability and focusHabitId semantics through the shared profile/ranker.
      const rankedTask = rankSmartTask({ profile, index, lowCapacity, fallback: row.key === fallbackKey });
      return { row, ...rankedTask };
    }).sort((a, b) => b.score - a.score);

    const winner = ranked[0];
    return { task: winner.row, reason: conciseReason(winner.reasons) };
  }, [rows, viewDone, period?.date, dailyCheckIn?.energy, dailyCheckIn?.capacity, fallbackTask?.key, recentlyCompletedKeys, revision]);
}
