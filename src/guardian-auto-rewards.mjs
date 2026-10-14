// Local automatic reward grants; idempotent across rerenders and reloads.
export function awardEligibleRewards(rewards = [], rows = [], done = {}, date = "") {
  const eligible = (Array.isArray(rows) ? rows : []).filter(r=>r?.key && !r.isBonus && !r.sourceTask?.archived_at);
  const percent = eligible.length ? 100 * eligible.filter(r=>!!done[r.key]).length / eligible.length : 0;
  const unlocked = [];
  const next = rewards.map(reward=>{
    if (!reward || reward.claimed || reward.autoAwardedAt) return reward;
    const progress = reward.mode === "progress" && eligible.length > 0 && percent >= Number(reward.targetPercent || 100);
    const effort = reward.mode === "effort" && Number(reward.goal) > 0 && Number(reward.count) >= Number(reward.goal);
    if (!progress && !effort) return reward;
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
export function autoGuardianGifts(ledger = [], rows = [], done = {}, date = "", prefs = {}, resting = false) {
  const existing = [...new Set((Array.isArray(ledger) ? ledger : []).filter(x=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}:(25|50|75|100|baby-day)$/.test(x)))].slice(-180);
  if (!prefs.automaticGifts || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ledger:existing, unlocked:[] };
  const categories = Array.isArray(prefs.giftCategories) ? prefs.giftCategories : ["stickers","celebrations","trophies","activities"];
  // A baby day is an optional free-time idea, never conditional on completing self-care.
  const weekday = new Date(date+"T12:00:00").getDay();
  const babyDay = categories.includes("babyDays") && prefs.littleMode === true && prefs.careMode === true && !existing.includes(date+":baby-day")
    ? [{threshold:"baby-day",category:"babyDays",name:"🍼 Your cozy baby day — enjoy your favorite comforting activities whenever you'd like"}] : [];
  if (resting) return { ledger:[...existing,...babyDay.map(()=>date+":baby-day")].slice(-180), unlocked:babyDay };
  const eligible = (Array.isArray(rows) ? rows : []).filter(r=>r?.key && !r.isBonus && !r.sourceTask?.archived_at);
  if (!eligible.length) return { ledger:[...existing,...babyDay.map(()=>date+":baby-day")].slice(-180), unlocked:babyDay };
  const percent = eligible.filter(r=>!!done[r.key]).length * 100 / eligible.length;
  const choices = ["🎬 Enjoy a movie night","📖 Pick a comforting bedtime story","🎮 Have a cozy game session","🧸 Make time for plushie cuddles","🖍️ Try a little coloring session"];
  const regular = DEFAULT_GUARDIAN_GIFTS.filter(g=>categories.includes(g.category) && percent >= g.threshold && !existing.includes(date+":"+g.threshold));
  const activity = categories.includes("activities") && percent >= 75 && !existing.includes(date+":75")
    ? [{threshold:75,category:"activities",name:choices[Math.floor(Date.parse(date+"T12:00:00")/86400000)%choices.length]}] : [];
  const unlocked = [...regular,...activity,...babyDay];
  return { ledger:[...existing,...unlocked.map(g=>date+":"+g.threshold)].slice(-180), unlocked };
}
