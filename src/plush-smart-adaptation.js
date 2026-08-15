import { recommendationFit } from "./plush-profile.js";

const PREFIX = "plushlife:smart-adaptation:v1";
function key(userId, part) { return `${PREFIX}:${userId || "local"}:${part}`; }
function read(userId, part, fallback) { try { const value = JSON.parse(localStorage.getItem(key(userId, part)) || "null"); return value == null ? fallback : value; } catch { return fallback; } }
function write(userId, part, value) { try { localStorage.setItem(key(userId, part), JSON.stringify(value)); } catch {} return value; }
function day() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

export function recordCompletionSequence(userId, rows = [], viewDone = {}) {
  const currentDay = day();
  const current = rows.filter((row) => !row?.isBonus && viewDone?.[row.key]).map((row) => row.key);
  const snapshot = read(userId, "done-snapshot", null);
  const state = read(userId, "sequence-state", { lastKey: null, lastAt: 0, lastDay: "", pairs: {} });
  if (!snapshot || snapshot.date !== currentDay) {
    write(userId, "done-snapshot", { date: currentDay, keys: current.slice(-120) });
    state.lastKey = null;
    state.lastAt = 0;
    state.lastDay = currentDay;
    write(userId, "sequence-state", state);
    return state;
  }
  const previous = new Set(Array.isArray(snapshot.keys) ? snapshot.keys : []);
  const newlyDone = current.filter((taskKey) => !previous.has(taskKey));
  newlyDone.forEach((taskKey) => {
    const now = Date.now();
    if (state.lastKey && state.lastKey !== taskKey && state.lastDay === currentDay && now - Number(state.lastAt || 0) <= 3 * 60 * 60 * 1000) {
      const pairKey = `${state.lastKey}→${taskKey}`;
      state.pairs[pairKey] = Math.min(20, Number(state.pairs[pairKey] || 0) + 1);
    }
    state.lastKey = taskKey;
    state.lastAt = now;
    state.lastDay = currentDay;
  });
  state.pairs = Object.fromEntries(Object.entries(state.pairs || {}).sort((a,b)=>b[1]-a[1]).slice(0,80));
  write(userId, "sequence-state", state);
  write(userId, "done-snapshot", { date: currentDay, keys: current.slice(-120) });
  return state;
}

export function sequenceSuggestion(userId, rows = [], viewDone = {}) {
  const state = read(userId, "sequence-state", { lastKey: null, pairs: {} });
  if (!state.lastKey || state.lastDay !== day() || !viewDone?.[state.lastKey]) return null;
  const candidates = Object.entries(state.pairs || {}).map(([pair, count]) => {
    const [fromKey, toKey] = pair.split("→");
    return { fromKey, toKey, count: Number(count) || 0 };
  }).filter((item) => item.fromKey === state.lastKey && !viewDone?.[item.toKey] && item.count >= 2).sort((a,b)=>b.count-a.count);
  const best = candidates[0];
  if (!best) return null;
  const from = rows.find((row) => row.key === best.fromKey);
  const to = rows.find((row) => row.key === best.toKey);
  if (!from || !to) return null;
  return {
    fromKey: best.fromKey,
    toKey: best.toKey,
    fromLabel: from.label || from.task || "that step",
    toLabel: to.label || to.task || "the next step",
    count: best.count,
    confidence: best.count >= 4 ? "strong" : "growing",
    text: `After ${from.label || from.task || "that step"}, you have often moved into ${to.label || to.task || "the next step"}. Want to keep that little chain going?`,
  };
}

function roughContext(context = {}) {
  return ["empty","low"].includes(context.energy) || ["very_low","low"].includes(context.capacity) || ["overwhelmed","sad","numb","sick","stressed","anxious"].includes(context.mood) || context.load === "high";
}
function signature(context = {}) { return [context.energy, context.capacity, context.mood, context.load, context.time].map((v)=>v || "unknown").join("|"); }
function similarity(a = {}, b = {}) {
  const fields = ["energy","capacity","mood","load","time"];
  let known = 0; let same = 0;
  fields.forEach((field) => { if (a[field] && b[field] && a[field] !== "unknown" && b[field] !== "unknown") { known += 1; if (a[field] === b[field]) same += 1; } });
  return known ? same / known : 0;
}

export function recordRecoverySnapshot(userId, context = {}) {
  if (!roughContext(context)) return read(userId, "recovery-days", []);
  const items = read(userId, "recovery-days", []);
  const today = day();
  const next = [...items.filter((item) => item.date !== today), { date: today, context, signature: signature(context), at: Date.now() }].slice(-45);
  return write(userId, "recovery-days", next);
}

export function recoveryFingerprint(userId, context = {}) {
  if (!roughContext(context)) return null;
  const today = day();
  const matches = read(userId, "recovery-days", []).filter((item) => item.date !== today && similarity(item.context, context) >= .6);
  if (matches.length < 2) return { confidence: "learning", count: matches.length, text: "This looks like a heavier day, but PlushLife does not have enough similar days yet to call it a pattern." };
  return {
    confidence: matches.length >= 4 ? "strong" : "growing",
    count: matches.length,
    text: `This resembles ${matches.length} earlier heavier day${matches.length === 1 ? "" : "s"}. PlushLife can use what helped on those days without assuming today will go the same way.`,
  };
}

const RECIPES = [
  { id: "just-one", label: "Just One Thing", icon: "✨", action: "next", description: "Put one doable step front and center." },
  { id: "tiny-essentials", label: "Tiny Essentials", icon: "🌿", action: "smaller", description: "Show only a few caring steps and tiny versions." },
  { id: "pause-pressure", label: "Pause the Pressure", icon: "🌙", action: "pause", description: "Keep the day intact while softening pressure." },
];

export function rescueRecipe(userId, context = {}) {
  const scored = RECIPES.map((recipe) => {
    const fit = recommendationFit(userId, "rescue_recipe", recipe.id, context);
    let heuristic = 0;
    if (recipe.id === "just-one" && (context.energy === "empty" || context.capacity === "very_low")) heuristic += 1.1;
    if (recipe.id === "tiny-essentials" && (context.load === "high" || context.energy === "low" || context.capacity === "low")) heuristic += 1;
    if (recipe.id === "pause-pressure" && ["overwhelmed","stressed","anxious"].includes(context.mood)) heuristic += .9;
    if (recipe.id === "pause-pressure" && context.load === "light") heuristic += .2;
    const learned = fit.total ? (fit.score - .45) * 2 + Math.min(.6, fit.contextual * .15) : 0;
    return { ...recipe, fit, score: heuristic + learned };
  }).sort((a,b)=>b.score-a.score);
  const best = scored[0];
  const confidence = best.fit.confidence === "strong" ? "strong" : best.fit.confidence === "growing" ? "growing" : "learning";
  return { ...best, confidence, reason: best.fit.total >= 2 ? `${best.label} has some evidence in situations like this.` : `PlushLife is choosing ${best.label} from today’s check-in and workload while it learns what fits you.` };
}
