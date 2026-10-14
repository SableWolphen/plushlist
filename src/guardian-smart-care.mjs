// Offline guidance. Nothing here changes scheduled tasks or contacts another service.
export function smartCarePlan(rows=[], done={}, energy="some", resting=false, now=new Date(), little=false) {
  const hour=now.getHours();
  const pending=(Array.isArray(rows)?rows:[]).filter(r=>r?.key && !done[r.key] && !r.isBonus && !r.sourceTask?.archived_at);
  const timed=pending.filter(r=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(r.time||r.sourceTask?.reminder_time||""))).sort((a,b)=>String(a.time||a.sourceTask?.reminder_time).localeCompare(String(b.time||b.sourceTask?.reminder_time)));
  const next=timed.find(r=>String(r.time||r.sourceTask?.reminder_time)>=String(hour).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"))||pending[0];
  const item=resting?"It's a rest day. Take care of yourself at your own pace.":energy==="low"?"Choose a tiny step or rest.":next?"Next little job: "+String(next.label).slice(0,100):"Your scheduled jobs are caught up. Enjoy some free time.";
  return [
    {icon:"🌤️",label:"Right now",detail:item},
    {icon:"🧸",label:"Comfort break",detail:little?"Pick a plushie, cartoon, coloring or quiet play.":"Take a break for something enjoyable."},
    {icon:"🌙",label:"Later",detail:hour>=18?"Wind down with a calm bedtime routine.":"Leave some room to unwind this evening."}
  ];
}
export function surpriseLetter(state={}, today="", resting=false) {
  const prefs=state.prefs||{};
  if (!prefs.surpriseLetters || !prefs.automaticReminders || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const existing=Array.isArray(state.surpriseLetterHistory)?state.surpriseLetterHistory:[];
  if (existing.some(l=>l.date===today)) return null;
  // At most one every three days, and none until at least three days after opt-in.
  const start=Date.parse(String(prefs.lettersEnabledOn||"")+"T12:00:00");
  const current=Date.parse(today+"T12:00:00");
  if (!Number.isFinite(start)||current-start<3*86400000) return null;
  const previous=existing.at(-1);
  if (previous && current-Date.parse(previous.date+"T12:00:00")<3*86400000) return null;
  const messages=[
    "A little letter from Guardian: I'm happy you're here. Your pace is enough.",
    "Just a note to say: you deserve warmth, comfort and kindness every day.",
    "You're allowed to rest and enjoy something lovely, even on hard days.",
    "I'm cheering for every little effort you choose to make. No pressure."
  ];
  const index=Math.floor(current/86400000)%messages.length;
  return {date:today,text:resting?"A little letter from Guardian: Rest is welcome today. You don't have to earn it.":messages[index]};
}
