// Read-only helpers for gentler daily plans. They never mutate the user's tasks.
export const ROUTINE_TEMPLATES = Object.freeze([
  { id:"morning", name:"Soft morning", icon:"🌤️", tasks:["Get out of bed","Drink a glass of water","Brush my teeth","Get dressed"] },
  { id:"bedtime", name:"Gentle bedtime", icon:"🌙", tasks:["Put my phone down","Brush my teeth","Prepare something for tomorrow","Take a quiet minute"] },
  { id:"tidy", name:"Ten-minute tidy", icon:"🧺", tasks:["Clear one surface","Put away five things","Empty a small bin","Celebrate the tidy spot"] },
  { id:"movement", name:"Move a little", icon:"🌱", tasks:["Put on comfortable shoes","Move for five minutes","Stretch gently","Notice how I feel"] },
  { id:"difficult", name:"Hard day basics", icon:"💜", tasks:["Take a sip of water","Eat something if I can","One small hygiene step","Rest without guilt"] },
  { id:"study", name:"Focus session", icon:"📚", tasks:["Choose my first tiny step","Set a ten-minute timer","Take a short break","Write down what is next"] },
]);

const safeMinutes = value => {
  const n=Number(value);
  return Number.isFinite(n) && n>=1 ? Math.min(180,Math.round(n)) : 5;
};
export function buildCozyDayPlan({ rows=[],viewDone={},mode="full",minutesAvailable=30,date="" }={}) {
  const valid = rows.filter(row=> {
    if(!row?.key || !row.label || viewDone[row.key] || row.sourceTask?.archived_at) return false;
    const task=row.sourceTask;
    if(task?.paused_since && date && date>=task.paused_since && (!task.paused_until || date<=task.paused_until)) return false;
    return true;
  });
  const essential=valid.filter(row=>!row.isBonus);
  const optional=valid.filter(row=>!!row.isBonus);
  const cap=mode==="rest"?0:mode==="tiny"?1:mode==="soft"||mode==="recovery"?2:3;
  const picked=essential.slice(0,cap);
  const suggestedMinutes=picked.reduce((n,row)=>n+safeMinutes(row.sourceTask?.estimated_minutes),0);
  const allMinutes=valid.reduce((n,row)=>n+safeMinutes(row.sourceTask?.estimated_minutes),0);
  const budget=Math.min(240,Math.max(5,Math.round(Number(minutesAvailable)||30)));
  return {
    essentials:picked.map(row=>({key:row.key,label:row.label,minutes:safeMinutes(row.sourceTask?.estimated_minutes),tiny:row.sourceTask?.tiny_label||"",soft:row.sourceTask?.soft_label||""})),
    optional:mode==="rest"?[]:[...essential.slice(cap),...optional].slice(0,2).map(row=>({key:row.key,label:row.label,minutes:safeMinutes(row.sourceTask?.estimated_minutes)})),
    remaining:valid.length,
    totalMinutes:allMinutes,
    suggestedMinutes,
    budget,
    overloaded:suggestedMinutes>budget,
    rest:mode==="rest"
  };
}
export function weeklyCozyStory({history=[],checkIns=[],today=""}={}){
  if(!/^\d{4}-\d\d-\d\d$/.test(today))return null;
  const end=new Date(today+"T12:00:00Z");
  if(!Number.isFinite(end.getTime()))return null;
  const start=new Date(end);start.setUTCDate(start.getUTCDate()-6);
  const cutoff=start.toISOString().slice(0,10);
  const completionDays=new Map();
  for(const day of history){if(!day?.progress_date||day.progress_date<cutoff||day.progress_date>today)continue;
    const keys=Array.isArray(day.completed_keys)?new Set(day.completed_keys):new Set();
    const existing=completionDays.get(day.progress_date)||new Set();
    for(const key of keys)existing.add(key);
    completionDays.set(day.progress_date,existing);
  }
  const checkinDays=new Set(checkIns.filter(day=>day?.check_date>=cutoff&&day?.check_date<=today&&day?.check_date).map(day=>day.check_date));
  const stepCount=[...completionDays.values()].reduce((sum,keys)=>sum+keys.size,0);
  const activeDates=new Set([...checkinDays,...[...completionDays].filter(([,keys])=>keys.size>0).map(([date])=>date)]);
  return {start:cutoff,end:today,stepCount,caringDays:activeDates.size,checkIns:checkinDays.size,
    heading:stepCount>0?"A week of little steps":checkinDays.size?"You made space to check in":"A fresh page is always here",
    line:stepCount>0 ? "You finished "+stepCount+" little step"+(stepCount===1?"":"s")+" across "+activeDates.size+" caring day"+(activeDates.size===1?"":"s")+"." :
      checkinDays.size>0?"You checked in "+checkinDays.size+" time"+(checkinDays.size===1?"":"s")+". Noticing your day counts too.":"There's no catching up to do. Your next small step is enough."
  };
}
export function shareableCozyStory(story) {
  if(!story)return"";
  return "A little PlushLife win 💜\n"+story.line+"\nGentle routines, no guilt. #PlushLife";
}
export function safeHomeMode(value){return ["minimal","routine","companion"].includes(value)?value:"minimal";}
