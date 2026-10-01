const text = (value, limit = 240) => typeof value === 'string' ? value.trim().slice(0,limit) : '';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate()+days);
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
}
export function defaultGoal(task = {}) {
  return {minimum:task.habit_type==='reduce'?2:1,stretch:task.habit_type==='reduce'?1:5,unit:'times',direction:task.habit_type==='reduce'?'at_most':'at_least',cue:'',afterTask:'',reason:''};
}
export function validateGoal(goal, taskKey, goals = {}) {
  const min=Number(goal.minimum), stretch=Number(goal.stretch);
  if(!Number.isFinite(min)||!Number.isFinite(stretch)||min<0||stretch<0||min>100000||stretch>100000)return 'Use goal amounts between 0 and 100,000.';
  if(goal.direction==='at_most'?stretch>min:stretch<min)return goal.direction==='at_most'?'A stretch limit should be no higher than your achievable limit.':'A stretch goal should be at least your minimum goal.';
  if(!text(goal.unit,30))return 'Choose a unit, such as pages, minutes, or cups.';
  const seen=new Set([taskKey]);let next=goal.afterTask;
  while(next){if(seen.has(next))return 'Choose an anchor that does not circle back to this habit.';seen.add(next);next=goals[next]?.afterTask;}
  return '';
}
export function goalResult(goal, amount) {
  const value=Number(amount);
  if(!Number.isFinite(value)||value<0)return {minimum:false,stretch:false};
  const below=goal.direction==='at_most';
  return {minimum:below?value<=goal.minimum:value>=goal.minimum,stretch:below?value<=goal.stretch:value>=goal.stretch};
}
export function normalizeStudio(value = {}) {
  const source=value&&typeof value==='object'?value:{};
  const goals=Object.fromEntries(Object.entries(source.goals || {}).slice(0,250).filter(([key,g])=>key&&g&&typeof g==='object').map(([key,g])=>[key.slice(0,100),{minimum:Math.max(0,Math.min(100000,Number(g.minimum)||0)),stretch:Math.max(0,Math.min(100000,Number(g.stretch)||0)),unit:text(g.unit,30)||'times',direction:g.direction==='at_most'?'at_most':'at_least',cue:text(g.cue),afterTask:text(g.afterTask,100),reason:text(g.reason),created:text(g.created,10)}]));
  const logs=Object.fromEntries(Object.entries(source.logs || {}).filter(([date,items])=>datePattern.test(date)&&items&&typeof items==='object').sort(([a],[b])=>b.localeCompare(a)).slice(0,180).map(([date,items])=>[date,Object.fromEntries(Object.entries(items).slice(0,250).filter(([,v])=>v&&typeof v==='object').map(([key,v])=>[key.slice(0,100),{amount:Number.isFinite(Number(v.amount))?Math.max(0,Math.min(100000,Number(v.amount))):0,minimum:v.minimum===true,stretch:v.stretch===true,unit:text(v.unit,30),note:['timing','too_big','forgot','okay'].includes(v.note)?v.note:'',at:text(v.at,40)}]))]));
  const experiments=(Array.isArray(source.experiments)?source.experiments:[]).filter(e=>e&&datePattern.test(e.start)&&datePattern.test(e.end)).slice(0,60).map(e=>({id:text(e.id,100),taskKey:text(e.taskKey,100),change:text(e.change),start:e.start,end:e.end,status:['active','kept','stopped'].includes(e.status)?e.status:'active'}));
  return {version:1,goals,logs,experiments,reviews:Object.fromEntries(Object.entries(source.reviews || {}).slice(-60).filter(([key,v])=>datePattern.test(key)&&typeof v==='string').map(([key,v])=>[key,text(v,500)])),routine:(Array.isArray(source.routine)?source.routine:[]).filter(k=>typeof k==='string').slice(0,8)};
}
export function readStudio(storage, key) {
  try{return normalizeStudio(JSON.parse(storage?.getItem(key)||'{}'));}catch(_){return normalizeStudio();}
}
export function writeStudio(storage,key,value) {
  const clean=normalizeStudio(value);
  try{if(!storage)return null;storage.setItem(key,JSON.stringify(clean));return clean;}catch(_){return null;}
}
export function habitObservations(task, state, history, from, to, scheduled) {
  const map=new Map(history.filter(h=>datePattern.test(h.progress_date)).map(h=>[h.progress_date,new Set(h.completed_keys || [])]));
  const observations=[];
  for(let date=from,guard=0;date<=to&&guard<400;date=shiftDate(date,1),guard++){
    if(!scheduled(task,date))continue;
    const log=state.logs[date]?.[task.task_key];
    if(!map.has(date)&&!log)continue;
    observations.push({date,done:!!map.get(date)?.has(task.task_key)||log?.minimum===true,stretch:log?.stretch===true,note:log?.note||'',amount:log?.amount});
  }
  return observations;
}
export function weeklyHabitReview(tasks,state,history,date,scheduled) {
  const from=shiftDate(date,-6);
  return tasks.filter(t=>!t.archived_at).map(task=>{
    const observations=habitObservations(task,state,history,from,date,scheduled);
    const done=observations.filter(o=>o.done).length;
    const timing=observations.filter(o=>o.note==='timing').length, big=observations.filter(o=>o.note==='too_big').length;
    const suggestion=timing?'Try a different routine anchor.':big?'Try a smaller achievable goal.':observations.length>=3&&done<observations.length/2?'Try one smaller step for seven days.':observations.length>=3&&done>=observations.length*.75?'This is fitting your observed days. Keep it gentle.':'A few more observed days will help.';
    return {task,observations,done,stretch:observations.filter(o=>o.stretch).length,suggestion,rate:observations.length?Math.round(done/observations.length*100):null};
  }).filter(row=>row.observations.length||state.goals[row.task.task_key]);
}
export function experimentComparison(experiment,task,state,history,today,scheduled) {
  const before=habitObservations(task,state,history,shiftDate(experiment.start,-7),shiftDate(experiment.start,-1),scheduled);
  const after=habitObservations(task,state,history,experiment.start,experiment.end<today?experiment.end:today,scheduled);
  const rate=items=>items.length?Math.round(items.filter(o=>o.done).length/items.length*100):null;
  const ready=today>experiment.end&&before.length>=3&&after.length>=3;
  return {before:before.length,after:after.length,beforeRate:rate(before),afterRate:rate(after),ready,delta:ready?rate(after)-rate(before):null};
}
export function returnMilestones(history) {
  const dates=[...new Set(history.filter(h=>h.completed_keys?.length).map(h=>h.progress_date))].sort();
  let returns=0;for(let i=1;i<dates.length;i++)if(shiftDate(dates[i-1],1)<dates[i])returns++;
  return {careDays:dates.length,returns,next:[1,3,7,14,30,60,100,365].find(n=>n>dates.length)||null};
}
