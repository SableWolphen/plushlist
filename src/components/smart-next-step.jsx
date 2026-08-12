import { hasGoldFeature } from "../plush-gold.js";

const HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function readHabitState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function habitId(row) {
  return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
}

function currentPeriod(hour) {
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
}

function isEssential(row) {
  return !!(row?.isEssential || row?.essential || row?.sourceTask?.essential || row?.sourceTask?.is_essential || row?.sourceTask?.essential_on_low_capacity);
}

function estimatedMinutes(row) {
  const value = Number(row?.sourceTask?.estimated_minutes || row?.estimated_minutes || 0);
  return Number.isFinite(value) ? value : 0;
}

function smallerVersion(row) {
  return String(row?.sourceTask?.tiny_label || row?.sourceTask?.soft_label || "").trim();
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
      const id = habitId(row);
      const profile = profiles[id] || {};
      let score = 100 - Math.min(index, 40);
      const reasons = [];

      if (id && id === anchorId) { score += 70; reasons.push(focusHabitId ? "it is your Focus Habit" : "it is your Anchor"); }
      if (isEssential(row)) { score += 26; reasons.push("it is one of today's essentials"); }
      if (row.key === fallbackKey) score += 14;

      if (goldSmart) {
        if (profile.stability === "Recovering") { score += 20; reasons.push("it is rebuilding after a rough patch"); }
        else if (profile.stability === "Fragile") { score += 15; reasons.push("it could use a little support"); }
        else if (profile.stability === "New") score += 5;

        if (profile.preferredPeriod && profile.confidence !== "learning") {
          if (profile.preferredPeriod === nowPeriod) { score += 16; reasons.push(`this is usually a good ${nowPeriod} habit for you`); }
          else score -= 4;
        }

        const minutes = estimatedMinutes(row);
        if (lowCapacity && minutes > 0 && minutes <= 10) { score += 12; reasons.push("it is a smaller lift for your current energy"); }
        if (lowCapacity && smallerVersion(row)) { score += 8; reasons.push("it has a gentler version ready"); }
        if (lowCapacity && minutes >= 30) score -= 12;

        if (profile.dominantMissReason === "bad_timing" && profile.preferredPeriod && profile.preferredPeriod !== nowPeriod) score -= 10;
        if (profile.confidence === "strong" && profile.completionRate >= 85 && profile.stability === "Stable") score -= 3;
      }

      return { row, score, reasons };
    }).sort((a, b) => b.score - a.score);

    const winner = ranked[0];
    const reason = winner.reasons.length
      ? `PlushLife picked this because ${winner.reasons.slice(0, 2).join(" and ")}.`
      : "PlushLife picked this from the unfinished things that matter today.";
    return { task: winner.row, reason };
  }, [rows, viewDone, period?.date, dailyCheckIn?.energy, dailyCheckIn?.capacity, fallbackTask?.key, recentlyCompletedKeys, revision]);
}
