// Reward counters use different units. Keep their meaning visible to the Cozy.
const units = {first_step:'completed step',daily_core:'essential-care day',care_days:'essential-care day',activity_days:'caring day',build_checkins:'build-habit check-in',reduce_checkins:'change-habit check-in',reflection_count:'reflection'};
export function nextCompanionReward(outfits=[], unlocked=new Set(), progress=()=>0) {
  const candidates=outfits.filter(item=>!unlocked.has(item.id)&&units[item.unlock?.type]).map(item=>{
    const raw=Number(progress(item));
    const count=Number.isFinite(raw)?Math.max(0,Math.min(item.unlock.count,Math.floor(raw))):0;
    return {outfit:item,count,total:item.unlock.count,remaining:Math.max(0,item.unlock.count-count),unit:units[item.unlock.type]};
  }).filter(item=>item.remaining>0);
  // Prefer day rewards after the first step; unrelated habit counters shouldn't
  // replace the day reward merely because their raw numbers are smaller.
  candidates.sort((a,b)=>Number(!['first_step','activity_days','care_days','daily_core'].includes(a.outfit.unlock.type))-Number(!['first_step','activity_days','care_days','daily_core'].includes(b.outfit.unlock.type)) || a.remaining-b.remaining || a.total-b.total);
  const next=candidates[0];
  return next?{...next,copy:`${next.remaining} more ${next.unit}${next.remaining===1?'':'s'} until ${next.outfit.name}`}:null;
}
export const COZY_DECOR = [
  {id:'plant',name:'Little plant',reward:'bow',hint:'Your first completed step'},
  {id:'cushion',name:'Cozy cushion',reward:'scarf',hint:'3 caring days'},
  {id:'keepsake',name:'Keepsake shelf',reward:'backpack',hint:'7 caring days'},
];
export function earnedCozyDecor(unlocked=new Set()) { return COZY_DECOR.filter(item=>unlocked.has(item.reward)); }
export function weeklyKeepsakeMemories(memories=[], now=new Date()) {
  const start=new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate()-((start.getDay()+6)%7));
  return memories.filter(item=>typeof item?.text==='string' && item.text.trim() && new Date(item.date)>=start && new Date(item.date)<=now).slice(0,20);
}
