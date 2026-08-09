(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.PlushLifePremiumSmart = api;
    if (root.document) {
      root.dispatchEvent(new CustomEvent("plushlife-smart-ready", { detail: { version: api.VERSION } }));
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const VERSION = "1.0.0";
  const STOP_WORDS = new Set("a an and are as at be been but by for from had has have he her hers him his i if in into is it its me my of on or our ours she so than that the their theirs them they this to too us was we were what when where which who will with you your yours".split(" "));
  const POSITIVE_WORDS = new Set("calm calmer good great grateful happy hopeful proud relief relieved safe steady strong win better accomplished loved connected peaceful rested excited".split(" "));
  const STRESS_WORDS = new Set("anxious anxiety overwhelmed overwhelm stress stressed rough tired exhausted angry upset sad lonely worried worry panic panicked difficult hard burnout burned".split(" "));
  const COMMON_THEMES = {
    work: ["work", "job", "boss", "coworker", "meeting", "shift", "deadline"],
    sleep: ["sleep", "slept", "bed", "bedtime", "insomnia", "tired", "rest"],
    relationships: ["friend", "family", "partner", "relationship", "mom", "dad", "girlfriend", "boyfriend", "wife", "husband"],
    body: ["pain", "sore", "headache", "body", "sick", "ill", "energy", "fatigue"],
    money: ["money", "bill", "rent", "debt", "pay", "financial", "cost"],
    selfCare: ["walk", "shower", "water", "eat", "meal", "exercise", "workout", "journal", "breath", "breathing"]
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function avg(values) {
    const clean = values.map(Number).filter(Number.isFinite);
    return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
  }

  function pct(numerator, denominator) {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
  }

  function dateKey(value) {
    const d = value instanceof Date ? value : new Date(value || Date.now());
    if (!Number.isFinite(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function normalizeMood(value) {
    const map = { awful: 1, verylow: 1, rough: 2, low: 2, okay: 3, neutral: 3, good: 4, great: 5, excellent: 5 };
    if (Number.isFinite(Number(value))) return clamp(value, 1, 5);
    return map[String(value || "").toLowerCase().replace(/[^a-z]/g, "")] || 3;
  }

  function normalizeEnergy(value) {
    const map = { empty: 1, exhausted: 1, low: 2, okay: 3, medium: 3, steady: 4, high: 5, energized: 5 };
    if (Number.isFinite(Number(value))) return clamp(value, 1, 5);
    return map[String(value || "").toLowerCase().replace(/[^a-z]/g, "")] || 3;
  }

  function summarizeProgress(records) {
    const rows = Array.isArray(records) ? records : [];
    const completed = rows.reduce((sum, row) => sum + Math.max(0, Number(row.completedTasks || row.completed || 0)), 0);
    const planned = rows.reduce((sum, row) => sum + Math.max(0, Number(row.plannedTasks || row.planned || 0)), 0);
    const focusMinutes = rows.reduce((sum, row) => sum + Math.max(0, Number(row.focusMinutes || 0)), 0);
    const journalDays = new Set(rows.filter((row) => row.journaled || Number(row.journalEntries || 0) > 0).map((row) => dateKey(row.date))).size;
    const checkinRows = rows.filter((row) => row.mood !== undefined || row.energy !== undefined);
    const moodAvg = avg(checkinRows.map((row) => normalizeMood(row.mood)));
    const energyAvg = avg(checkinRows.map((row) => normalizeEnergy(row.energy)));
    const recent = rows.slice(-7);
    const previous = rows.slice(-14, -7);
    const recentRate = pct(recent.reduce((s, r) => s + Number(r.completedTasks || r.completed || 0), 0), recent.reduce((s, r) => s + Number(r.plannedTasks || r.planned || 0), 0));
    const previousRate = pct(previous.reduce((s, r) => s + Number(r.completedTasks || r.completed || 0), 0), previous.reduce((s, r) => s + Number(r.plannedTasks || r.planned || 0), 0));
    const insights = [];
    if (planned > 0) insights.push(`You completed ${pct(completed, planned)}% of the care you planned.`);
    if (focusMinutes > 0) insights.push(`You protected ${focusMinutes} focus minutes.`);
    if (journalDays > 1) insights.push(`You checked in with your journal on ${journalDays} different days.`);
    if (previous.length && recentRate >= previousRate + 10) insights.push("Your routine follow-through improved compared with the previous week.");
    if (previous.length && recentRate + 15 <= previousRate) insights.push("Your recent week was lighter. A smaller routine may fit better right now.");
    if (energyAvg <= 2.3 && rows.length >= 3) insights.push("Energy has been running low. Tiny versions and recovery-friendly routines may help.");
    return {
      days: new Set(rows.map((row) => dateKey(row.date)).filter(Boolean)).size,
      completionRate: pct(completed, planned),
      completedTasks: completed,
      plannedTasks: planned,
      focusMinutes,
      journalDays,
      averageMood: Math.round(moodAvg * 10) / 10,
      averageEnergy: Math.round(energyAvg * 10) / 10,
      recentCompletionRate: recentRate,
      previousCompletionRate: previousRate,
      insights
    };
  }

  function analyzeFocus(sessions) {
    const rows = (Array.isArray(sessions) ? sessions : []).filter(Boolean);
    const finished = rows.filter((s) => s.completed !== false && Number(s.minutes || s.durationMinutes || 0) > 0);
    const byHour = new Map();
    finished.forEach((s) => {
      const d = new Date(s.startedAt || s.date || Date.now());
      const hour = Number.isFinite(d.getTime()) ? d.getHours() : 12;
      const entry = byHour.get(hour) || { sessions: 0, minutes: 0 };
      entry.sessions += 1;
      entry.minutes += Number(s.minutes || s.durationMinutes || 0);
      byHour.set(hour, entry);
    });
    const bestHour = [...byHour.entries()].sort((a, b) => (b[1].sessions * 100 + b[1].minutes) - (a[1].sessions * 100 + a[1].minutes))[0]?.[0] ?? null;
    const averageMinutes = Math.round(avg(finished.map((s) => Number(s.minutes || s.durationMinutes || 0))));
    const presets = averageMinutes >= 40 ? [25, 45, 60] : averageMinutes >= 20 ? [15, 25, 40] : [10, 15, 25];
    return {
      totalSessions: finished.length,
      totalMinutes: finished.reduce((s, x) => s + Number(x.minutes || x.durationMinutes || 0), 0),
      averageMinutes,
      bestHour,
      bestWindowLabel: bestHour === null ? null : `${String(bestHour).padStart(2, "0")}:00–${String((bestHour + 1) % 24).padStart(2, "0")}:00`,
      suggestedPresets: presets,
      suggestion: bestHour === null ? "Try a short focus block and see what time feels easiest." : `Your completed focus sessions cluster around ${String(bestHour).padStart(2, "0")}:00.`
    };
  }

  function buildReminderPlan(input) {
    const context = input || {};
    const quietStart = context.quietStart || "21:30";
    const quietEnd = context.quietEnd || "08:00";
    const style = ["gentle", "direct", "discreet"].includes(context.style) ? context.style : "gentle";
    const followUpMinutes = clamp(context.followUpMinutes || 30, 10, 180);
    const maxDaily = clamp(context.maxDaily || 3, 1, 8);
    const energy = normalizeEnergy(context.energy);
    const mood = normalizeMood(context.mood);
    const soften = mood <= 2 || energy <= 2;
    const templates = {
      gentle: soften ? "No rush. One tiny step is enough when you're ready." : "A gentle nudge from PlushLife — your next step is waiting.",
      direct: soften ? "Your plan can be smaller today. Pick one thing." : "Ready for your next planned step?",
      discreet: "You have something waiting in PlushLife."
    };
    return {
      quietHours: { start: quietStart, end: quietEnd },
      style,
      followUpMinutes,
      maxDaily,
      softenForLowCapacity: true,
      body: templates[style],
      snoozeChoices: [10, 30, 60],
      canReschedule: true,
      skipIfCompleted: true
    };
  }

  function scoreTask(task, context) {
    let score = 0;
    const minutes = Math.max(1, Number(task.estimatedMinutes || task.estimated_minutes || 15));
    const energy = normalizeEnergy(context.energy);
    if (task.essential || task.essential_on_low_capacity) score += 30;
    if (task.favorite || task.helpfulBefore) score += 15;
    if (minutes <= Number(context.availableMinutes || 20)) score += 20;
    if (energy <= 2 && minutes <= 10) score += 25;
    if (energy >= 4 && minutes >= 15) score += 5;
    if (task.skippedRecently) score -= 5;
    if (task.completed) score -= 100;
    return score;
  }

  function buildAdaptiveRoutine(context, tasks) {
    const ctx = context || {};
    const energy = normalizeEnergy(ctx.energy);
    const mood = normalizeMood(ctx.mood);
    const available = clamp(ctx.availableMinutes || 20, 3, 180);
    const candidates = (Array.isArray(tasks) ? tasks : []).filter((t) => t && !t.archived && !t.archived_at && !t.completed);
    const selected = [];
    let used = 0;
    candidates.sort((a, b) => scoreTask(b, ctx) - scoreTask(a, ctx)).forEach((task) => {
      const fullMinutes = Math.max(1, Number(task.estimatedMinutes || task.estimated_minutes || 15));
      const tinyMinutes = Math.max(1, Number(task.tinyMinutes || Math.min(5, fullMinutes)));
      const useTiny = energy <= 2 || mood <= 2;
      const minutes = useTiny ? tinyMinutes : fullMinutes;
      if (used + minutes > available || selected.length >= (energy <= 2 ? 3 : 6)) return;
      selected.push({
        id: task.id || task.task_key || task.label || task.task,
        label: useTiny ? (task.tinyLabel || task.tiny_label || task.soft_label || task.label || task.task) : (task.label || task.task),
        minutes,
        mode: useTiny ? "tiny" : "full",
        reason: useTiny ? "Fits a lower-capacity day" : "Fits your available time"
      });
      used += minutes;
    });
    if (!selected.length) {
      selected.push({ id: "reset", label: energy <= 2 ? "Drink some water and take one slow breath" : "Choose one small thing that would make later easier", minutes: 3, mode: "tiny", reason: "A low-friction starting point" });
      used = 3;
    }
    return {
      mode: energy <= 2 || mood <= 2 ? "gentle" : energy >= 4 && mood >= 4 ? "momentum" : "balanced",
      availableMinutes: available,
      plannedMinutes: used,
      steps: selected,
      intro: energy <= 2 || mood <= 2 ? "Today can be smaller. This plan protects the essentials." : "Here is a routine shaped around the time and capacity you have right now."
    };
  }

  function recommendCalm(context, history) {
    const ctx = context || {};
    const mood = normalizeMood(ctx.mood);
    const energy = normalizeEnergy(ctx.energy);
    const recent = Array.isArray(history) ? history : [];
    const preferred = recent.filter((x) => x.helpful !== false).map((x) => x.type).filter(Boolean);
    const favorite = preferred.reduce((best, type, _, arr) => arr.filter((x) => x === type).length > arr.filter((x) => x === best).length ? type : best, preferred[0]);
    let type = favorite || "box-breathing";
    let minutes = 3;
    if (energy <= 2) { type = favorite || "body-scan"; minutes = 5; }
    if (mood <= 2) { type = favorite || "grounding-5-4-3-2-1"; minutes = 4; }
    if (ctx.goal === "sleep") { type = favorite || "wind-down"; minutes = 10; }
    if (ctx.goal === "focus") { type = favorite || "paced-breathing"; minutes = 2; }
    const labels = {
      "box-breathing": "Box breathing",
      "body-scan": "Gentle body scan",
      "grounding-5-4-3-2-1": "5-4-3-2-1 grounding",
      "wind-down": "Sleep wind-down",
      "paced-breathing": "Slow paced breathing",
      thunderstorm: "Thunderstorm soundscape"
    };
    return { type, label: labels[type] || type, minutes, reason: favorite ? "You have marked this kind of calm session as helpful before." : "This fits your current mood, energy, and goal." };
  }

  function tokenize(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  }

  function journalInsights(entries) {
    const rows = (Array.isArray(entries) ? entries : []).filter((entry) => entry && String(entry.text || entry.body || "").trim());
    const counts = new Map();
    const themes = {};
    Object.keys(COMMON_THEMES).forEach((key) => { themes[key] = 0; });
    let positive = 0, stress = 0;
    rows.forEach((entry) => {
      const words = tokenize(entry.text || entry.body);
      const unique = new Set(words);
      unique.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
      words.forEach((word) => {
        if (POSITIVE_WORDS.has(word)) positive += 1;
        if (STRESS_WORDS.has(word)) stress += 1;
      });
      Object.entries(COMMON_THEMES).forEach(([theme, keywords]) => {
        if (keywords.some((word) => unique.has(word))) themes[theme] += 1;
      });
    });
    const recurringWords = [...counts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word, count]) => ({ word, entries: count }));
    const recurringThemes = Object.entries(themes).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).map(([theme, count]) => ({ theme, entries: count }));
    const insights = recurringThemes.slice(0, 3).map((item) => `${item.theme.charAt(0).toUpperCase() + item.theme.slice(1)} has come up in ${item.entries} recent journal entries.`);
    if (rows.length >= 3 && positive > stress * 1.5) insights.push("Your recent writing contains more positive/relief language than stress language.");
    if (rows.length >= 3 && stress > positive * 1.5) insights.push("Stress-related language has appeared often lately. Consider a lighter routine or a calming tool if that feels useful.");
    return {
      entryCount: rows.length,
      recurringWords,
      recurringThemes,
      positiveSignalCount: positive,
      stressSignalCount: stress,
      insights,
      disclaimer: "These are simple word and frequency patterns, not a diagnosis or clinical assessment."
    };
  }

  function rankRecommendations(context) {
    const ctx = context || {};
    const mood = normalizeMood(ctx.mood);
    const energy = normalizeEnergy(ctx.energy);
    const missed = Math.max(0, Number(ctx.missedTasks || 0));
    const available = Math.max(0, Number(ctx.availableMinutes || 0));
    const hour = Number.isFinite(Number(ctx.hour)) ? Number(ctx.hour) : new Date().getHours();
    const recs = [];
    const add = (id, score, title, body) => recs.push({ id, score, title, body });
    add("tiny-step", (energy <= 2 ? 45 : 15) + (missed >= 3 ? 30 : 0), "Take one Tiny Step", "Shrink the next action until it feels doable.");
    add("rescue", (mood <= 2 ? 55 : 5) + (energy <= 2 ? 20 : 0), "Open PlushRescue", "Use the lowest-friction care options for a hard moment.");
    add("focus", (energy >= 3 ? 30 : 5) + (available >= 15 ? 20 : 0), "Start a focus block", "Protect a short window for one thing that matters.");
    add("journal", (ctx.hasJournaledToday ? 0 : 20) + (mood <= 3 ? 10 : 0), "Write a quick journal note", "Capture what is taking up space in your head.");
    add("calm", (mood <= 3 ? 35 : 10) + (hour >= 20 ? 15 : 0), "Try a calm session", "Use breathing, grounding, or a soundscape for a few minutes.");
    add("routine", (available >= 10 ? 25 : 5) + (missed >= 2 ? 15 : 0), "Build a right-sized routine", "Fit today’s plan to your actual time and energy.");
    return recs.sort((a, b) => b.score - a.score).map(({ score, ...item }) => item);
  }

  function guideMessage(context) {
    const ctx = context || {};
    const mood = normalizeMood(ctx.mood);
    const energy = normalizeEnergy(ctx.energy);
    const missed = Math.max(0, Number(ctx.missedTasks || 0));
    if (ctx.goal === "sleep") return { title: "Let's make the landing softer", body: "Dim the plan down: one small cleanup step, a calm session, then your wind-down routine.", action: "calm" };
    if (mood <= 2 && energy <= 2) return { title: "Today can be very small", body: "You do not need to catch up. Pick one caring action and let the rest wait.", action: "rescue" };
    if (missed >= 3) return { title: "Want to shrink the list?", body: "A smaller plan can be more useful than pushing through everything. I can build a tiny routine for the time you have.", action: "routine" };
    if (energy >= 4 && mood >= 4) return { title: "You've got some momentum", body: "This may be a good window for a focus block or one task that makes tomorrow easier.", action: "focus" };
    return { title: "What would help most right now?", body: "I can suggest a Tiny Step, a right-sized routine, a focus block, journaling, or a calming exercise based on your check-in.", action: "recommend" };
  }

  function createStore(storage) {
    const host = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    const key = "plushlife-premium-smart-v1";
    function read() {
      if (!host) return { focusSessions: [], calmHistory: [], preferences: {} };
      try { return { focusSessions: [], calmHistory: [], preferences: {}, ...JSON.parse(host.getItem(key) || "{}") }; }
      catch (_) { return { focusSessions: [], calmHistory: [], preferences: {} }; }
    }
    function write(next) { if (host) host.setItem(key, JSON.stringify(next)); return next; }
    return {
      get: read,
      setPreferences(preferences) { const state = read(); state.preferences = { ...state.preferences, ...preferences }; return write(state); },
      addFocusSession(session) { const state = read(); state.focusSessions = [...state.focusSessions, { ...session, savedAt: new Date().toISOString() }].slice(-180); return write(state); },
      addCalmResult(result) { const state = read(); state.calmHistory = [...state.calmHistory, { ...result, savedAt: new Date().toISOString() }].slice(-180); return write(state); },
      clear() { if (host) host.removeItem(key); }
    };
  }

  return {
    VERSION,
    normalizeMood,
    normalizeEnergy,
    summarizeProgress,
    analyzeFocus,
    buildReminderPlan,
    buildAdaptiveRoutine,
    recommendCalm,
    journalInsights,
    rankRecommendations,
    guideMessage,
    createStore
  };
});
