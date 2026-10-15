export const SURPRISE_BOX_CHOICES = [
  {id:"movie",label:"🎬 A cozy movie night"},
  {id:"storybook",label:"📖 Favorite story time"},
  {id:"color",label:"🖍️ Coloring or sticker play"},
  {id:"plush",label:"🧸 A plushie picnic"},
  {id:"game",label:"🎮 A comfy game session"},
  {id:"music",label:"🎵 Soft music and relaxation"}
];
export function nextSurpriseBox(state={},date="") {
  const prefs=state.prefs||{}, history=Array.isArray(state.surpriseBoxHistory)?state.surpriseBoxHistory:[];
  if (prefs.guardianPaused || !prefs.surpriseBox || !prefs.automaticReminders || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const selected=SURPRISE_BOX_CHOICES.filter(x=>(prefs.surpriseBoxChoices||[]).includes(x.id));
  if (!selected.length || history.some(x=>x.date===date)) return null;
  const day=Math.floor(Date.parse(date+"T12:00:00")/86400000);
  const latest=history.at(-1);
  if (latest && day-Math.floor(Date.parse(latest.date+"T12:00:00")/86400000)<Number(prefs.surpriseFrequencyDays||3)) return null;
  const lastId=latest?.id;
  const pool=selected.filter(x=>x.id!==lastId);
  const possible=pool.length?pool:selected;
  const choice=possible[day%possible.length];
  return {date,id:choice.id,label:choice.label};
}
export function smartCarePlan(rows=[], done={}, energy="some", resting=false, now=new Date(), little=false) {
  const current=now.getHours()*60+now.getMinutes();
  const pending=(Array.isArray(rows)?rows:[]).filter(r=>r?.key && !done[r.key] && !r.isBonus && !r.sourceTask?.archived_at);
  const clock=r=>String(r.time||r.sourceTask?.reminder_time||"");
  const mins=r=>{const v=clock(r);return /^([01]\d|2[0-3]):[0-5]\d$/.test(v)?Number(v.slice(0,2))*60+Number(v.slice(3,5)):null;};
  const timed=pending.map(r=>({r,time:mins(r)})).filter(x=>x.time!==null).sort((a,b)=>a.time-b.time);
  const next=timed.find(x=>x.time>=current)||timed[0];
  const untimed=pending.find(r=>mins(r)===null);
  const task=next?.r||untimed;
  const time=next?clock(task)+" · ":"";
  const immediate=resting?"Rest day: tasks can wait.":energy==="low"?"Keep it tiny today: choose one step or rest.":task?time+"Next: "+String(task.label).slice(0,90):"You're caught up. Enjoy a moment for yourself.";
  const nextClock=timed.find(x=>x.time>current)?.time;
  const available=nextClock===undefined?"No timed task is coming up.":"Your next scheduled job is in "+Math.max(1,Math.round((nextClock-current)/5)*5)+" minutes.";
  return [
    {icon:"🌤️",label:"Now",detail:immediate},
    {icon:"🧸",label:"Comfort",detail:(little?"Cartoon, plushie cuddle or coloring. ":"Stretch, rest or enjoy a favorite activity. ")+(resting?"Take all the time you need.":available)},
    {icon:"🌙",label:"Later",detail:now.getHours()>=18?"Choose a calm bedtime routine when ready.":"Save some space this evening to unwind."}
  ];
}
export function surpriseLetter(state={}, today="", resting=false) {
  const prefs=state.prefs||{};
  if (prefs.guardianPaused || !prefs.surpriseLetters || !prefs.automaticReminders || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
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

export const GUARDIAN_STORIES = [
 {title:"The Little Star",text:"A little star learned that its glow mattered even when it rested. Tomorrow was another day."},
 {title:"The Cozy Dinosaur",text:"A dinosaur made a nest of blankets, and all its friends came by for a quiet story."},
 {title:"The Gentle Cloud",text:"The cloud moved slowly. No one asked it to hurry, and it found a beautiful sunset."}
];
export function guardianDayExtras(date,prefs={},rest=false) {
 const n=Math.max(0,Math.floor(Date.parse(date+"T12:00:00")/86400000)||0);
 const themes=["Plushie Picnic","Pajama Day","Dino Day","Art Day","Storybook Day"];
 const story=GUARDIAN_STORIES[n%GUARDIAN_STORIES.length];
 return {story,theme:prefs.careMode&&prefs.littleMode?themes[n%themes.length]:null,
 morning:rest?"Rest is welcome today.":"Good morning! One little step at a time.",
 evening:"You've done enough to deserve a peaceful evening.",
 comfort:prefs.comfortPreference==="quiet"?"Take quiet space whenever you need.":prefs.comfortPreference==="practical"?"Choose one manageable step, or rest.":"You deserve warmth and kindness, always.",
 weekend:[0,6].includes(new Date(date+"T12:00:00").getDay())
 };
}
