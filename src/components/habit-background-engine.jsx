import { hasGoldFeature } from "../plush-gold.js";
import { buildHabitLearning } from "../habit-learning.mjs";

const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const ENGINE_KEY = "__background_engine";
const RESILIENCE_KEY = "__resilience";
const MAX_EVENTS = 180;
const MAX_CHECKINS = 60;

function readState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; } catch (_error) { return {}; }
}
function writeState(nextState) {
  try { localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(nextState)); } catch (_error) {}
  try { window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated")); } catch (_error) {}
}
function habitId(row) { return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || ""); }
function habitLabel(row) { return String(row?.label || row?.sourceTask?.label || row?.sourceTask?.name || "Habit"); }
function learningRow(row) {
  const source = row?.sourceTask || {};
  return {
    id: habitId(row),
    label: habitLabel(row),
    reminderTime: source.reminder_time || row?.reminder_time || "",
    tinyLabel: source.tiny_label || row?.tiny_label || "",
  };
}
function readReminderEvents() {
  try { return JSON.parse(localStorage.getItem("plushlife:notification-events:v1") || "[]") || []; }
  catch (_error) { return []; }
}
function dateKey(value) { return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10); }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")); }
function daysBetween(a, b) { return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000); }
function weekKey(value) {
  const d = new Date(`${dateKey(value)}T12:00:00`);
  const offset = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function periodLabel(hour) { return hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night"; }
function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid-1] + sorted[mid]) / 2);
}
function historyFor(state, id) {
  return Object.entries(state.history || {})
    .filter(([date]) => validDate(date))
    .sort(([a],[b]) => a.localeCompare(b))
    .flatMap(([date, day]) => day?.[id] ? [{ date, ...day[id] }] : []);
}
function missReasonsFor(state, id) {
  const reasons = state.meta?.[RESILIENCE_KEY]?.missReasons || {};
  return Object.entries(reasons)
    .filter(([key]) => key.endsWith(`:${id}`))
    .map(([key, reason]) => ({ date: key.slice(0,10), reason }))
    .filter((item) => validDate(item.date) && item.reason);
}
function profileFor(state, engine, row, today) {
  const id = habitId(row);
  const history = historyFor(state, id).slice(-42);
  const total = history.length;
  const done = history.filter((x)=>x.done).length;
  const rate = total ? done / total : null;
  const recent = history.slice(-7);
  const prior = history.slice(-14,-7);
  const recentRate = recent.length ? recent.filter((x)=>x.done).length / recent.length : null;
  const priorRate = prior.length ? prior.filter((x)=>x.done).length / prior.length : null;
  const reasons = missReasonsFor(state, id).slice(-12);
  const counts = {};
  reasons.forEach((item)=>{ counts[item.reason] = (counts[item.reason] || 0) + 1; });
  const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0] || null;
  const events = (engine.completionEvents || []).filter((event)=>event.habitId === id).slice(-20);
  const completionHours = events.map((event)=>Number(event.hour)).filter((hour)=>Number.isFinite(hour) && hour >= 0 && hour <= 23);
  const bestHour = completionHours.length >= 3 ? median(completionHours) : null;
  const bestPeriod = bestHour === null ? null : periodLabel(bestHour);
  const firstDate = history[0]?.date || today;
  const lastDone = [...history].reverse().find((item)=>item.done)?.date || "";
  const daysSinceDone = lastDone ? Math.max(0, daysBetween(lastDone, today)) : null;
  let stability = "Learning";
  if (total <= 3) stability = "New";
  else if (daysSinceDone !== null && daysSinceDone >= 3 && recentRate !== null && recentRate < .5) stability = "Recovering";
  else if (total >= 8 && rate !== null && rate >= .75 && recentRate !== null && recentRate >= .7) stability = "Stable";
  else if (total >= 5 && ((rate !== null && rate < .45) || (recentRate !== null && priorRate !== null && recentRate + .2 < priorRate))) stability = "Fragile";
  const evidence = Math.min(100, Math.round((Math.min(total, 14) / 14) * 70 + (Math.min(reasons.length, 5) / 5) * 15 + (Math.min(events.length, 5) / 5) * 15));
  const confidence = evidence >= 75 ? "strong" : evidence >= 45 ? "moderate" : "learning";
  return {
    id, label: habitLabel(row), stability, confidence, evidence,
    observedDays: total, completionRate: rate === null ? null : Math.round(rate * 100),
    recentRate: recentRate === null ? null : Math.round(recentRate * 100),
    dominantMissReason: dominant?.[0] || "", dominantMissReasonCount: dominant?.[1] || 0,
    preferredPeriod: bestPeriod, preferredHour: bestHour, completionEvents: events.length,
    firstObserved: firstDate, lastCompleted: lastDone,
  };
}
function recoveryProfile(state, today) {
  const dates = Object.keys(state.history || {}).filter(validDate).sort();
  if (dates.length < 6) return { confidence: "learning", usualReturnDays: null, recentGap: 0 };
  const gaps = [];
  for (let i=1;i<dates.length;i++) {
    const gap = daysBetween(dates[i-1], dates[i]);
    if (gap >= 2 && gap <= 30) gaps.push(gap);
  }
  const last = dates[dates.length-1];
  const recentGap = Math.max(0, daysBetween(last, today));
  return {
    confidence: gaps.length >= 3 ? "moderate" : "learning",
    usualReturnDays: gaps.length ? median(gaps) : null,
    recentGap,
    suggestedRamp: recentGap >= 5 ? "essentials" : recentGap >= 2 ? "lighter" : "normal",
  };
}
function loadProfile(rows, viewDone, dailyCheckIn) {
  const active = (rows || []).filter((row)=>!row?.isBonus);
  const incomplete = active.filter((row)=>!viewDone?.[row.key]).length;
  const done = active.length - incomplete;
  const energy = String(dailyCheckIn?.energy || "");
  const capacity = String(dailyCheckIn?.capacity || "");
  const low = ["empty","low"].includes(energy) || ["very_low","low"].includes(capacity);
  const high = energy === "high" || capacity === "high";
  const loadScore = Math.min(100, Math.round(active.length * 6 + incomplete * 3 + (low ? 22 : 0) - (high ? 8 : 0)));
  return {
    active: active.length, done, incomplete, energy, capacity, score: loadScore,
    level: loadScore >= 75 ? "overloaded" : loadScore >= 50 ? "full" : "comfortable",
    suggestedVisibleCount: low ? Math.min(3, active.length) : loadScore >= 75 ? Math.min(4, active.length) : Math.min(6, active.length),
  };
}
function checkInPatterns(engine, state) {
  const days = Object.entries(engine.checkIns || {}).filter(([date])=>validDate(date)).slice(-45);
  if (days.length < 6) return { confidence: "learning" };
  const buckets = { low: {days:0, rates:[]}, usual: {days:0, rates:[]}, high: {days:0, rates:[]} };
  days.forEach(([date, check])=>{
    const day = state.history?.[date] || {};
    const values = Object.values(day);
    if (!values.length) return;
    const rate = values.filter((item)=>item?.done).length / values.length;
    const low = ["empty","low"].includes(check.energy) || ["very_low","low"].includes(check.capacity);
    const high = check.energy === "high" || check.capacity === "high";
    const key = low ? "low" : high ? "high" : "usual";
    buckets[key].days += 1; buckets[key].rates.push(rate);
  });
  const avg = (arr)=>arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*100) : null;
  return {
    confidence: days.length >= 12 ? "moderate" : "learning",
    lowEnergyCompletion: avg(buckets.low.rates), usualEnergyCompletion: avg(buckets.usual.rates), highEnergyCompletion: avg(buckets.high.rates),
  };
}
function experimentResults(state, profiles, today) {
  const result = {};
  for (const experiment of state.experiments || []) {
    if (!experiment?.id || !experiment?.habitId || !validDate(experiment.started)) continue;
    const id = String(experiment.habitId);
    const during = historyFor(state,id).filter((item)=>item.date >= experiment.started && (!experiment.ends || item.date <= experiment.ends));
    const beforeStart = new Date(`${experiment.started}T12:00:00`); beforeStart.setDate(beforeStart.getDate()-7);
    const beforeKey = beforeStart.toISOString().slice(0,10);
    const before = historyFor(state,id).filter((item)=>item.date >= beforeKey && item.date < experiment.started);
    const rate = (arr)=>arr.length ? arr.filter((item)=>item.done).length/arr.length : null;
    const dr=rate(during), br=rate(before);
    result[experiment.id] = {
      habitId:id, status: experiment.status || (experiment.ends && today > experiment.ends ? "complete" : "active"),
      duringDays:during.length, beforeDays:before.length,
      delta: dr === null || br === null ? null : Math.round((dr-br)*100),
      frictionNow: profiles[id]?.dominantMissReason || "",
      updated_at:new Date().toISOString(),
    };
  }
  return result;
}

export function HabitBackgroundEngine({ open, rows = [], viewDone = {}, period, dailyCheckIn = {} }) {
  const goldBackground = hasGoldFeature("adaptive_habit_coaching") || hasGoldFeature("recovery_intelligence");
  const previousDoneRef = React.useRef({});
  const lastSignatureRef = React.useRef("");
  const timerRef = React.useRef(null);
  const today = dateKey(period?.date);

  React.useEffect(() => {
    if (!goldBackground || !open || !validDate(today)) return;
    const compactRows = (rows || []).filter((row)=>!row?.isBonus && habitId(row));
    const currentDone = Object.fromEntries(compactRows.map((row)=>[row.key, !!viewDone?.[row.key]]));
    const signature = JSON.stringify({
      d:today,
      done:currentDone,
      check:[dailyCheckIn?.energy || "", dailyCheckIn?.capacity || ""],
      rows:compactRows.map((row)=>habitId(row)),
    });
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const state = readState();
      const currentEngine = state.meta?.[ENGINE_KEY] || {};
      const now = new Date();
      let events = Array.isArray(currentEngine.completionEvents) ? currentEngine.completionEvents.filter((event)=>event?.id && validDate(event.date)) : [];
      compactRows.forEach((row)=>{
        const wasDone = !!previousDoneRef.current[row.key];
        const isDone = !!viewDone?.[row.key];
        if (!wasDone && isDone) {
          const id = `${today}:${habitId(row)}:${now.getHours()}:${now.getMinutes()}`;
          if (!events.some((event)=>event.id === id)) events.push({ id, date:today, habitId:habitId(row), label:habitLabel(row), hour:now.getHours(), minute:now.getMinutes(), period:periodLabel(now.getHours()), completedAt:now.toISOString() });
        }
      });
      events = events.slice(-MAX_EVENTS);
      previousDoneRef.current = currentDone;

      const checkIns = { ...(currentEngine.checkIns || {}) };
      if (dailyCheckIn?.energy || dailyCheckIn?.capacity || dailyCheckIn?.mood) {
        checkIns[today] = { energy:String(dailyCheckIn.energy || ""), capacity:String(dailyCheckIn.capacity || ""), mood:String(dailyCheckIn.mood || ""), updated_at:now.toISOString() };
      }
      const checkInEntries = Object.entries(checkIns).filter(([date])=>validDate(date)).sort(([a],[b])=>a.localeCompare(b)).slice(-MAX_CHECKINS);
      const prunedCheckIns = Object.fromEntries(checkInEntries);
      const baseEngine = { ...currentEngine, completionEvents:events, checkIns:prunedCheckIns };
      const profiles = Object.fromEntries(compactRows.map((row)=>{ const p=profileFor(state,baseEngine,row,today); return [p.id,p]; }));
      const load = loadProfile(compactRows, viewDone, dailyCheckIn);
      const recovery = recoveryProfile(state,today);
      const crossPatterns = checkInPatterns(baseEngine,state);
      const experiments = experimentResults(state,profiles,today);
      const userChoices = currentEngine.userChoices || {};
      const learning = buildHabitLearning({
        rows: compactRows.map(learningRow),
        history: state.history || {},
        completionEvents: events,
        retention: state.meta?.__retention || {},
        reminderEvents: readReminderEvents(),
        userChoices,
      });
      const week = weekKey(today);
      const maintenanceDue = currentEngine.maintenance?.week !== week;
      const engine = {
        version:3,
        completionEvents:events,
        checkIns:prunedCheckIns,
        habitProfiles:profiles,
        load,
        recovery,
        crossPatterns,
        experiments,
        learning,
        suggestions: learning.suggestions,
        userChoices,
        maintenance: maintenanceDue ? { week, ran_at:now.toISOString(), activeHabits:compactRows.length, staleProfilesRemoved:Object.keys(currentEngine.habitProfiles || {}).filter((id)=>!profiles[id]).length } : (currentEngine.maintenance || { week, ran_at:now.toISOString() }),
        updated_at:now.toISOString(),
      };
      const next = { ...state, meta:{ ...(state.meta || {}), [ENGINE_KEY]:engine }, updated_at:now.toISOString() };
      writeState(next);
    }, 450);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [goldBackground, open, today, rows, viewDone, dailyCheckIn?.energy, dailyCheckIn?.capacity, dailyCheckIn?.mood]);

  React.useEffect(() => {
    const hydrate = () => { lastSignatureRef.current = ""; };
    window.addEventListener("plushlife:habit-coach-hydrated", hydrate);
    return () => window.removeEventListener("plushlife:habit-coach-hydrated", hydrate);
  }, []);

  return null;
}
