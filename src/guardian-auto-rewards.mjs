// Completing work earns progress. Merely changing which tasks are listed does not.
export function trackRewardProgress(previous = null, rows = [], done = {}, date = "") {
  const eligible = (Array.isArray(rows) ? rows : []).filter(r => r?.key && !r.isBonus && !r.sourceTask?.archived_at);
  const keys = [...new Set(eligible.map(r => String(r.key)))].sort();
  const completedKeys = keys.filter(key => !!done[key]);
  const sameDay = previous?.date === date && Array.isArray(previous.keys) && Array.isArray(previous.completedKeys);
  const known = new Set(sameDay ? previous.keys : []);
  const priorDone = new Set(sameDay ? previous.completedKeys : []);
  const newlyCompleted = sameDay && completedKeys.some(key => known.has(key) && !priorDone.has(key));
  const removedTask = sameDay && previous.keys.some(key => !keys.includes(key));
  const total = Math.max(keys.length, sameDay ? Number(previous.total) || 0 : 0);
  const snapshot = { date, keys, completedKeys, total, lastAction: newlyCompleted ? "completed" : removedTask ? "removed" : "other" };
  const changed = !sameDay || total !== previous.total || keys.join("|") !== previous.keys.join("|") ||
    completedKeys.join("|") !== previous.completedKeys.join("|");
  return { snapshot, changed, newlyCompleted, removedTask, verifiedComplete: total > 0 && completedKeys.length === total };
}

// Local automatic reward grants; idempotent across rerenders and reloads.
export function awardEligibleRewards(rewards = [], rows = [], done = {}, date = "", progress = {}) {
  const eligible = (Array.isArray(rows) ? rows : []).filter(r=>r?.key && !r.isBonus && !r.sourceTask?.archived_at);
  const denominator = Math.max(eligible.length, Number(progress.total) || 0);
  const percent = denominator ? 100 * eligible.filter(r=>!!done[r.key]).length / denominator : 0;
  const unlocked = [];
  const next = rewards.map(reward=>{
    if (!reward || reward.claimed || reward.autoAwardedAt) return reward;
    const progressUnlocked = reward.mode === "progress" && progress.newlyCompleted !== false && denominator > 0 && percent >= Number(reward.targetPercent || 100);
    const effort = !progress.removedTask && reward.mode === "effort" && Number(reward.goal) > 0 && Number(reward.count) >= Number(reward.goal);
    if (!progressUnlocked && !effort) return reward;
    unlocked.push({ id:reward.id, name:String(reward.name || "A cozy reward").slice(0,100) });
    return { ...reward, claimed:true, autoAwardedAt: date };
  });
  return { rewards:next, unlocked };
}

export const DEFAULT_GUARDIAN_GIFTS = Object.freeze([
  { threshold:25, category:"stickers", name:"🌟 A little star sticker" },
  { threshold:50, category:"celebrations", name:"🧸 A cozy Guardian cheer" },
  { threshold:100, category:"trophies", name:"🏆 Today's little victory trophy" },
]);
// Date-scoped, finite unlock keys: the same milestone can unlock tomorrow,
// but never twice for the same day, including after app reloads.
export function autoGuardianGifts(ledger = [], rows = [], done = {}, date = "", prefs = {}, resting = false, progress = {}) {
  const existing = [...new Set((Array.isArray(ledger) ? ledger : []).filter(x=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}:(25|50|75|100|baby-day)$/.test(x)))].slice(-180);
  if (!prefs.automaticGifts || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ledger:existing, unlocked:[] };
  const categories = Array.isArray(prefs.giftCategories) ? prefs.giftCategories : ["stickers","celebrations","trophies","activities"];
  // A baby day is an optional free-time idea, never conditional on completing self-care.
  
  const babyDay = !progress.removedTask && categories.includes("babyDays") && prefs.littleMode === true && prefs.careMode === true && !existing.includes(date+":baby-day")
    ? [{threshold:"baby-day",category:"babyDays",name:"🍼 Your cozy baby day — enjoy your favorite comforting activities whenever you'd like"}] : [];
  if (resting) return { ledger:[...existing,...babyDay.map(()=>date+":baby-day")].slice(-180), unlocked:babyDay };
  const eligible = (Array.isArray(rows) ? rows : []).filter(r=>r?.key && !r.isBonus && !r.sourceTask?.archived_at);
  if (!eligible.length) return { ledger:[...existing,...babyDay.map(()=>date+":baby-day")].slice(-180), unlocked:babyDay };
  const denominator = Math.max(eligible.length, Number(progress.total) || 0);
  const percent = denominator ? eligible.filter(r=>!!done[r.key]).length * 100 / denominator : 0;
  const choices = ["🎬 Enjoy a movie night","📖 Pick a comforting bedtime story","🎮 Have a cozy game session","🧸 Make time for plushie cuddles","🖍️ Try a little coloring session"];
  const regular = DEFAULT_GUARDIAN_GIFTS.filter(g=>progress.newlyCompleted !== false && categories.includes(g.category) && percent >= g.threshold && !existing.includes(date+":"+g.threshold));
  const activity = progress.newlyCompleted !== false && categories.includes("activities") && percent >= 75 && !existing.includes(date+":75")
    ? [{threshold:75,category:"activities",name:choices[Math.floor(Date.parse(date+"T12:00:00")/86400000)%choices.length]}] : [];
  const unlocked = [...regular,...activity,...babyDay];
  return { ledger:[...existing,...unlocked.map(g=>date+":"+g.threshold)].slice(-180), unlocked };
}

export function availableGuardianGifts(ledger = [], used = []) {
  const usedIds = new Set(Array.isArray(used) ? used : []);
  const names = {
    "25": "🌟 A little star sticker",
    "50": "🧸 A cozy Guardian cheer",
    "100": "🏆 Today's little victory trophy",
    "baby-day": "🍼 A cozy Little Day",
  };
  const activities = ["🎬 Enjoy a movie night","📖 Pick a comforting bedtime story","🎮 Have a cozy game session","🧸 Make time for plushie cuddles","🖍️ Try a little coloring session"];
  return (Array.isArray(ledger) ? ledger : []).filter(id =>
    typeof id === "string" && /^\d{4}-\d{2}-\d{2}:(25|50|75|100|baby-day)$/.test(id) && !usedIds.has(id)
  ).map(id => {
    const date = id.slice(0,10), level=id.slice(11);
    const day = Math.floor(Date.parse(date+"T12:00:00")/86400000);
    return {id,date,name:level==="75"?activities[day%activities.length]:names[level]};
  }).reverse();
}
