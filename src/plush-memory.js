const PREFIX = "plushlife:memory:v1";

function key(userId, part) { return `${PREFIX}:${userId || "local"}:${part}`; }
function read(userId, part, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key(userId, part)) || "null"); return value == null ? fallback : value; }
  catch { return fallback; }
}
function write(userId, part, value) { try { localStorage.setItem(key(userId, part), JSON.stringify(value)); } catch {} return value; }
export function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function dayDiff(a, b) { return Math.max(0, Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000)); }

export function registerVisit(userId) {
  const today = localDay();
  const last = read(userId, "last-visit", "");
  const gapDays = last && last !== today ? dayDiff(last, today) : 0;
  write(userId, "last-visit", today);
  return { lastVisit: last, gapDays };
}

export function addCaringDay(userId, date = localDay(), kind = "care") {
  const items = read(userId, "caring-days", []);
  const next = [...items.filter((item) => item?.date !== date || item?.kind !== kind), { date, kind }].slice(-120);
  write(userId, "caring-days", next);
  return next;
}

export function caringStreak(userId, extraDates = []) {
  const stored = read(userId, "caring-days", []).map((item) => item?.date).filter(Boolean);
  const dates = new Set([...stored, ...(extraDates || []).filter(Boolean)]);
  let streak = 0; const cursor = new Date();
  for (let i = 0; i < 365; i += 1) { const day = localDay(cursor); if (!dates.has(day)) break; streak += 1; cursor.setDate(cursor.getDate()-1); }
  return streak;
}

export function saveFutureNote(userId, text) {
  const clean = String(text || "").trim().slice(0, 420);
  if (!clean) return null;
  return write(userId, "future-note", { text: clean, savedAt: Date.now() });
}
export function getFutureNote(userId) { return read(userId, "future-note", null); }
export function clearFutureNote(userId) { try { localStorage.removeItem(key(userId, "future-note")); } catch {} }

export function rescueSignal({ rows = [], viewDone = {}, dailyCheckIn = {} } = {}) {
  const required = rows.filter((row) => !row?.isBonus);
  const unfinished = required.filter((row) => !viewDone?.[row.key]).length;
  const loadRatio = required.length ? unfinished / required.length : 0;
  const lowEnergy = ["empty", "low"].includes(dailyCheckIn?.energy);
  const lowCapacity = ["very_low", "low"].includes(dailyCheckIn?.capacity);
  const hardMood = ["overwhelmed", "anxious", "sad", "sick", "numb", "stressed"].includes(dailyCheckIn?.mood);
  const shouldOffer = (lowEnergy || lowCapacity || hardMood) && unfinished >= 3 || loadRatio >= .8 && unfinished >= 6;
  const reason = lowEnergy ? "Your energy check-in is low and there are still several things asking for attention." : lowCapacity ? "You marked lower capacity today, so PlushLife can reduce the number of decisions on screen." : hardMood ? "Your check-in says today feels heavier. PlushLife can make the routine smaller without deleting anything." : "There is a lot still visible today. PlushLife can temporarily narrow the list.";
  return { shouldOffer, unfinished, loadRatio, reason };
}

export function supportMemory(history = [], tools = []) {
  const useful = history.filter((entry) => ["helped", "a_little"].includes(entry?.outcome));
  const counts = new Map(); useful.forEach((entry) => counts.set(entry.session_id, (counts.get(entry.session_id)||0)+1));
  const ranked = [...counts.entries()].sort((a,b)=>b[1]-a[1]);
  if (!ranked.length) return { confidence: "learning", tool: null, count: 0 };
  const [id, count] = ranked[0]; const tool = tools.find((item) => item.id === id) || null;
  return { confidence: count >= 3 ? "strong" : count >= 2 ? "growing" : "learning", tool, count };
}

export function sleepMemory(history = [], tools = []) {
  const sleep = history.filter((entry) => entry?.session_kind === "sleep");
  const useful = sleep.filter((entry) => ["helped", "a_little"].includes(entry?.outcome));
  const counts = new Map(); useful.forEach((entry) => counts.set(entry.session_id, (counts.get(entry.session_id)||0)+1));
  const best = [...counts.entries()].sort((a,b)=>b[1]-a[1])[0];
  if (!best) return { confidence: "learning", tool: null, count: 0, text: "PlushLife is still learning which wind-down tools fit you best." };
  const tool = tools.find((item)=>item.id===best[0]) || null; const count = best[1];
  return { confidence: count >= 3 ? "strong" : "growing", tool, count, text: tool ? `${tool.title} has been helpful ${count} ${count === 1 ? "time" : "times"} after you checked in.` : "PlushLife is still learning your sleep pattern." };
}

export function recordPathFeedback(userId, pathId, dayNumber, feedback) {
  const all = read(userId, "path-feedback", {}); const path = all[pathId] || {};
  path[String(dayNumber)] = { feedback, at: Date.now() }; all[pathId] = path; write(userId, "path-feedback", all); return path;
}
export function pathAdaptation(userId, pathId) {
  const path = read(userId, "path-feedback", {})?.[pathId] || {};
  const values = Object.values(path).map((item)=>item?.feedback);
  if (!values.length) return { mode: "learning", text: "PlushLife is still learning how this path fits you." };
  const tooMuch = values.filter((v)=>v==="too_much").length;
  const helped = values.filter((v)=>v==="helped").length;
  if (tooMuch >= 1 && tooMuch >= helped) return { mode: "gentler", text: "You said an earlier step felt like too much. Take only the smallest useful piece of this step; repeating or pausing is part of the path." };
  if (helped >= 2) return { mode: "working", text: "A couple of earlier steps helped. Keep the same pace instead of adding extra difficulty." };
  return { mode: "learning", text: "Your feedback is mixed so far, so PlushLife is keeping this flexible rather than turning it into a rule." };
}

export function careAreaState(pct, previousPct = null) {
  const value = Number(pct) || 0;
  if (previousPct != null && value >= Number(previousPct) + 8) return { label: "Growing", icon: "🌱" };
  if (previousPct != null && value <= Number(previousPct) - 12) return { label: "Recovering", icon: "💜" };
  if (value >= 70) return { label: "Steady", icon: "✨" };
  if (value >= 35) return { label: "Needs a little support", icon: "🪶" };
  return { label: "Still learning", icon: "🌙" };
}

export function recordMoment(userId, text, kind = "care", date = localDay()) {
  const clean = String(text || "").trim().slice(0, 180); if (!clean) return [];
  const items = read(userId, "moments", []);
  const fingerprint = `${date}:${kind}:${clean}`;
  if (items.some((item)=>item.fingerprint===fingerprint)) return items;
  const next = [...items, { fingerprint, date, kind, text: clean, at: Date.now() }].slice(-80); write(userId, "moments", next); return next;
}
export function monthlyMoments(userId, month = localDay().slice(0,7)) { return read(userId, "moments", []).filter((item)=>String(item?.date||"").startsWith(month)).slice(-6).reverse(); }
