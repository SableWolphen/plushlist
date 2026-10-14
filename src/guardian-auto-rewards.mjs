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
