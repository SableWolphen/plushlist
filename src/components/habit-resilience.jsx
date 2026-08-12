const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const RESILIENCE_KEY = "__resilience";

function readState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; } catch (_error) { return {}; }
}
function resilienceFrom(state) {
  return state?.meta?.[RESILIENCE_KEY] || {
    version: 1,
    missReasons: {},
    restartPlans: {},
    tomorrowPlans: {},
    weeklyDecisions: {},
    interventions: {},
    offlineCare: {},
    guardianEffort: false,
    badDays: {},
  };
}
function writeResilience(patch) {
  const state = readState();
  const current = resilienceFrom(state);
  const nextResilience = { ...current, ...patch, version: 1, updated_at: new Date().toISOString() };
  const next = { ...state, meta: { ...(state.meta || {}), [RESILIENCE_KEY]: nextResilience } };
  try { localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(next)); } catch (_error) {}
  try { window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated")); } catch (_error) {}
  return nextResilience;
}
function habitId(row) { return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || ""); }
function habitLabel(row) { return String(row?.label || row?.sourceTask?.label || row?.sourceTask?.name || "Habit"); }
function dateKey(value) { return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10); }
function addDays(value, count) { const d = new Date(`${dateKey(value)}T12:00:00`); d.setDate(d.getDate() + count); return d.toISOString().slice(0, 10); }
function daysAgo(date, from) { return Math.max(0, Math.round((new Date(`${from}T12:00:00`) - new Date(`${date}T12:00:00`)) / 86400000)); }
function historyFor(state, id) {
  return Object.entries(state.history || {}).sort(([a],[b]) => a.localeCompare(b)).flatMap(([date, day]) => day?.[id] ? [{ date, ...day[id] }] : []);
}
function statsFor(state, row) {
  const id = habitId(row); const history = historyFor(state, id).slice(-42); const total = history.length; const done = history.filter(x => x.done).length;
  const recent = history.slice(-7); const prior = history.slice(-14,-7); const recentRate = recent.length ? recent.filter(x=>x.done).length/recent.length : null; const priorRate = prior.length ? prior.filter(x=>x.done).length/prior.length : null;
  const weekdays = {};
  history.forEach(item => { const w = new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", {weekday:"short"}); weekdays[w] ||= { total:0, done:0 }; weekdays[w].total++; if (item.done) weekdays[w].done++; });
  const bestDay = Object.entries(weekdays).filter(([,v])=>v.total>=2).map(([day,v])=>({day,rate:v.done/v.total,total:v.total})).sort((a,b)=>b.rate-a.rate||b.total-a.total)[0] || null;
  return { total, done, rate: total ? done/total : null, recentRate, priorRate, bestDay };
}
function frictionScore(state, row, resilience) {
  const stats = statsFor(state,row); if (stats.total < 3) return { score:null, label:"Learning", note:"A few more real days will make this useful." };
  const id=habitId(row); const reasons=Object.entries(resilience.missReasons||{}).filter(([key])=>key.endsWith(`:${id}`)).map(([,value])=>value);
  const reasonWeight = reasons.reduce((sum,reason)=>sum + ({too_big:18,too_tired:14,bad_time:12,forgot:8,didnt_matter:4,other:6}[reason]||5),0) / Math.max(1,reasons.length);
  const missRate = 1-(stats.rate||0); const trendPenalty = stats.recentRate !== null && stats.priorRate !== null && stats.recentRate < stats.priorRate ? 12 : 0;
  const score=Math.min(100,Math.round(missRate*72+reasonWeight+trendPenalty));
  return { score, label:score>=70?"High friction":score>=40?"Fragile":"Steady", note:score>=70?"This habit is asking for too much effort right now.":score>=40?"This habit may need a better cue, size, or time.":"This habit is fitting your life fairly well." };
}
function firstSeenMap(state) {
  const map={}; Object.entries(state.history||{}).sort(([a],[b])=>a.localeCompare(b)).forEach(([date,day])=>Object.keys(day||{}).forEach(id=>{ if(!map[id]) map[id]=date; })); return map;
}
function button(active=false) { return { padding:"8px 10px", borderRadius:10, border:active?"2px solid #A65DC1":"1px solid #DCC9E8", background:active?"#FAF0FD":"white", color:"#6B5A7D", fontWeight:850, fontSize:11.5, cursor:"pointer" }; }
function card() { return { padding:11, borderRadius:12, background:"white", border:"1px solid #E6DFF0" }; }

const MISS_REASONS = [
  ["forgot","🫥","I forgot"], ["too_tired","😴","Too tired"], ["bad_time","🕒","Bad timing"],
  ["too_big","🪨","Too big"], ["didnt_matter","🤷","Didn't matter today"], ["other","…","Something else"],
];
const EASIER_FIX = {
  forgot: "Attach it to something you already do, or use one well-timed reminder.",
  too_tired: "Use the Tiny version on low-energy days and save the full version for higher-capacity days.",
  bad_time: "Move it to a time that already works better in your real history.",
  too_big: "Cut the starting step until it feels almost too easy.",
  didnt_matter: "Lower the frequency or pause it. A habit does not deserve space just because it was once a good idea.",
  other: "Try one small change for seven days instead of redesigning everything at once.",
};

export function HabitResilienceSuite({ open, rows=[], viewDone={}, period, toggle, nextStepTask, selectDayType, openTaskManager, goToDashboard, setCareSection, dailyCheckIn={}, returnGapDays=0 }) {
  const [state,setState]=React.useState(()=>readState());
  const [resilience,setResilience]=React.useState(()=>resilienceFrom(readState()));
  const [expanded,setExpanded]=React.useState(false);
  const [offlineOpen,setOfflineOpen]=React.useState(()=>!navigator.onLine);
  const date=dateKey(period?.date); const tomorrow=addDays(date,1); const current=rows.filter(r=>!r?.isBonus); const incomplete=current.filter(r=>!viewDone?.[r.key]);
  React.useEffect(()=>{ const refresh=()=>{const next=readState();setState(next);setResilience(resilienceFrom(next));}; window.addEventListener("plushlife:habit-coach-updated",refresh);window.addEventListener("plushlife:habit-coach-hydrated",refresh); const offline=()=>setOfflineOpen(true); window.addEventListener("offline",offline); return()=>{window.removeEventListener("plushlife:habit-coach-updated",refresh);window.removeEventListener("plushlife:habit-coach-hydrated",refresh);window.removeEventListener("offline",offline);};},[]);
  if(!open)return null;
  const save=(patch)=>{const next=writeResilience(patch);setResilience(next);setState(readState());};
  const ranked=incomplete.map(row=>({row,stats:statsFor(state,row),friction:frictionScore(state,row,resilience)})).sort((a,b)=>(b.friction.score??-1)-(a.friction.score??-1));
  const focus=ranked[0]?.row || nextStepTask || incomplete[0]; const focusId=focus?habitId(focus):""; const missKey=`${date}:${focusId}`; const reason=resilience.missReasons?.[missKey] || ""; const focusFriction=focus?frictionScore(state,focus,resilience):null;
  const energy=String(dailyCheckIn.energy||""); const capacity=String(dailyCheckIn.capacity||""); const lowEnergy=["empty","low"].includes(energy)||["very_low","low"].includes(capacity); const highEnergy=["high"].includes(energy)||capacity==="high";
  const hour=new Date().getHours(); const launchMode=hour<12?"Morning":hour>=18?"Evening":"Daytime";
  const launchTasks=(focus?[focus]:[]).concat(incomplete.filter(r=>!focus||habitId(r)!==focusId)).slice(0,3);
  const firstSeen=firstSeenMap(state); const newThisWeek=current.filter(row=>firstSeen[habitId(row)]&&daysAgo(firstSeen[habitId(row)],date)<=6).length; const overcommit=newThisWeek>=4;
  const restart=resilience.restartPlans?.[date];
  const tomorrowPlan=resilience.tomorrowPlans?.[tomorrow] || { must:[], nice:[], not:[] };
  const intervention=resilience.interventions?.[focusId];
  const badDay=!!resilience.badDays?.[date];

  const setMissReason=(value)=>save({missReasons:{...(resilience.missReasons||{}),[missKey]:value}});
  const startIntervention=()=>{ if(!focus)return; const chosen=reason||"other"; save({interventions:{...(resilience.interventions||{}),[focusId]:{habit_id:focusId,label:habitLabel(focus),reason:chosen,fix:EASIER_FIX[chosen],started_at:date,ends_at:addDays(date,6),status:"active"}}}); };
  const chooseRestart=(mode)=>save({restartPlans:{...(resilience.restartPlans||{}),[date]:{mode,started_at:date,ends_at:addDays(date,2)}}});
  const setTomorrow=(row,bucket)=>{ const id=habitId(row); const next={ must:(tomorrowPlan.must||[]).filter(x=>x!==id), nice:(tomorrowPlan.nice||[]).filter(x=>x!==id), not:(tomorrowPlan.not||[]).filter(x=>x!==id) }; next[bucket]=[...next[bucket],id]; save({tomorrowPlans:{...(resilience.tomorrowPlans||{}),[tomorrow]:next}}); };
  const enterBadDay=()=>{ save({badDays:{...(resilience.badDays||{}),[date]:true}}); selectDayType?.("tiny"); };
  const offlineItems=[["water","🥤","Drink something"],["food","🍞","Eat something easy"],["body","🧼","One body-care step"],["breathe","🌿","Breathe or ground"],["contact","🤝","Contact someone"],["rest","🌙","Rest without earning it"]]; const offlineState=resilience.offlineCare?.[date]||{};

  return <section style={{marginBottom:14,borderRadius:18,border:"1px solid #D7E7DE",background:"linear-gradient(145deg,#FAFFFC,#FFF9FD)",overflow:"hidden"}}>
    <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} style={{width:"100%",display:"grid",gridTemplateColumns:"1fr auto",gap:10,padding:"12px 13px",border:0,background:"transparent",textAlign:"left",cursor:"pointer"}}>
      <span><span style={{display:"block",fontSize:10.5,letterSpacing:".12em",fontWeight:900,color:"#318C79"}}>🌱 HABIT RESILIENCE</span><span style={{display:"block",marginTop:3,fontSize:13.5,fontWeight:900,color:"#4F405C"}}>Make the routine fit real life</span><span style={{display:"block",marginTop:2,fontSize:11,color:"#806B8D"}}>{launchMode} launch, restart ramps, easier versions, tomorrow planning and offline care.</span></span><span style={{fontSize:20,color:"#8C6B9E"}}>{expanded?"▾":"›"}</span>
    </button>
    {expanded&&<div style={{padding:"0 12px 12px",display:"grid",gap:9}}>
      <div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#318C79"}}>☀️ {launchMode.toUpperCase()} LAUNCH</div><div style={{marginTop:4,fontSize:11.5,color:"#6B5A7D"}}>{lowEnergy?"Your check-in says capacity is low. PlushLife is prioritizing easier wins.":highEnergy?"You have more energy today. Finish the important thing before adding extras.":"Three useful things are enough to get moving."}</div><div style={{display:"grid",gap:5,marginTop:8}}>{launchTasks.map((row,i)=><button key={habitId(row)} type="button" onClick={()=>toggle?.(row.key)} style={{...button(false),display:"flex",justifyContent:"space-between",textAlign:"left"}}><span>{i===0?"🎯 ":""}{habitLabel(row)}</span><span>Done</span></button>)}</div>{lowEnergy&&<button type="button" onClick={()=>selectDayType?.("tiny")} style={{...button(true),marginTop:7}}>🌱 Use Tiny Day</button>}</div>

      {returnGapDays>=2&&<div style={{...card(),borderColor:"#F0D99E",background:"#FFFDF5"}}><div style={{fontSize:10.5,fontWeight:900,color:"#9A6A20"}}>↺ 3-DAY RESTART RAMP</div><div style={{marginTop:4,fontSize:11.5,color:"#6B5A3D"}}>No backlog. Pick how gently you want to come back for the next three days.</div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}>{[["essentials","Essentials only"],["lighter","Lighter routine"],["normal","Normal routine"]].map(([id,label])=><button key={id} type="button" onClick={()=>chooseRestart(id)} style={button(restart?.mode===id)}>{label}</button>)}</div></div>}

      {focus&&<div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#A65DC1"}}>🧩 WHY DIDN'T THIS HAPPEN?</div><div style={{marginTop:4,fontWeight:900,fontSize:12.5,color:"#4F405C"}}>{habitLabel(focus)}</div><div style={{marginTop:3,fontSize:11,color:"#806B8D"}}>Friction: <strong>{focusFriction?.score===null?focusFriction?.label:`${focusFriction?.score}/100 · ${focusFriction?.label}`}</strong></div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}>{MISS_REASONS.map(([id,icon,label])=><button key={id} type="button" onClick={()=>setMissReason(id)} style={button(reason===id)}>{icon} {label}</button>)}</div>{reason&&<div style={{marginTop:8,padding:8,borderRadius:9,background:"#FAF7FC",fontSize:11.5,color:"#6B5A7D"}}><strong>Make it easier:</strong> {EASIER_FIX[reason]}<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}><button type="button" onClick={startIntervention} style={button(!!intervention)}>🧪 Try for 7 days</button><button type="button" onClick={()=>openTaskManager?.()} style={button(false)}>Edit habit</button></div>{intervention?.status==="active"&&<div style={{marginTop:6,fontSize:10.5,color:"#318C79"}}>Experiment active through {intervention.ends_at}.</div>}</div>}</div>}

      {overcommit&&<div style={{...card(),borderColor:"#F0D99E"}}><div style={{fontSize:10.5,fontWeight:900,color:"#A56D14"}}>🛡️ PROTECT THE ROUTINE</div><div style={{marginTop:4,fontSize:11.5,color:"#6B5A3D"}}>You appear to be learning {newThisWeek} newer habits this week. Stabilizing a few before adding more can make the whole routine easier to keep.</div><button type="button" onClick={()=>openTaskManager?.()} style={{...button(false),marginTop:7}}>Review my habits</button></div>}

      <div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#4A80B5"}}>🌙 PLAN TOMORROW IN 20 SECONDS</div><div style={{marginTop:4,fontSize:11.5,color:"#6B5A7D"}}>Mark a few habits as must, nice, or intentionally not tomorrow. Choosing “not” is planning—not failure.</div><div style={{display:"grid",gap:6,marginTop:8}}>{current.slice(0,6).map(row=>{const id=habitId(row);return <div key={id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:7,alignItems:"center"}}><span style={{fontSize:11.5,fontWeight:800,color:"#4F405C"}}>{habitLabel(row)}</span><span style={{display:"flex",gap:4}}>{[["must","Must"],["nice","Nice"],["not","Not"]].map(([bucket,label])=><button key={bucket} type="button" onClick={()=>setTomorrow(row,bucket)} style={{...button((tomorrowPlan[bucket]||[]).includes(id)),padding:"5px 7px",fontSize:10}}>{label}</button>)}</span></div>})}</div></div>

      <div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#C05B78"}}>🧸 BAD-DAY BUTTON</div><div style={{marginTop:4,fontSize:11.5,color:"#6B5A7D"}}>Hide the pressure, keep only the smallest meaningful care, and let today count differently.</div><button type="button" onClick={enterBadDay} disabled={badDay} style={{...button(badDay),marginTop:7}}>{badDay?"Tiny Day is protecting today":"Make today a bad-day-safe Tiny Day"}</button></div>

      <div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#318C79"}}>🤝 GUARDIAN ENCOURAGEMENT</div><label style={{display:"flex",gap:8,alignItems:"center",marginTop:6,fontSize:11.5,color:"#607A73"}}><input type="checkbox" checked={!!resilience.guardianEffort} onChange={e=>save({guardianEffort:e.target.checked})}/>Let Guardian support focus on effort and recovery, not perfect completion.</label>{resilience.guardianEffort&&<><div style={{marginTop:7,padding:8,borderRadius:9,background:"#F3FBF8",fontSize:11,color:"#4E7168"}}>Suggested share: “I’m working on showing up, adapting when things are hard, and keeping my important habits alive. Encouragement helps more than checking every box.”</div><button type="button" onClick={()=>goToDashboard?.("guardian")} style={{...button(false),marginTop:7}}>Open Guardian</button></>}</div>

      <div style={{...card(),background:!navigator.onLine?"#FFFDF5":"white"}}><button type="button" onClick={()=>setOfflineOpen(v=>!v)} style={{width:"100%",border:0,background:"transparent",padding:0,textAlign:"left",cursor:"pointer",color:"#4F405C",fontWeight:900,fontSize:11.5}}>📴 I’m struggling / offline care {offlineOpen?"▾":"›"}</button>{offlineOpen&&<><div style={{marginTop:5,fontSize:11,color:"#806B8D"}}>These basics work from the local app state even without a connection.</div><div style={{display:"grid",gap:5,marginTop:7}}>{offlineItems.map(([id,icon,label])=><label key={id} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 8px",borderRadius:9,background:"#FAFCFB",fontSize:11.5,color:"#4F625D"}}><input type="checkbox" checked={!!offlineState[id]} onChange={e=>save({offlineCare:{...(resilience.offlineCare||{}),[date]:{...offlineState,[id]:e.target.checked}}})}/>{icon} {label}</label>)}</div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}><button type="button" onClick={()=>{setCareSection?.("quick");goToDashboard?.("care");}} style={button(false)}>Open care tools</button><button type="button" onClick={()=>goToDashboard?.("guardian")} style={button(false)}>Ask someone</button></div></>}</div>
    </div>}
  </section>;
}

export function ResilienceProgress({ open, openTaskManager }) {
  const [state,setState]=React.useState(()=>readState()); const [resilience,setResilience]=React.useState(()=>resilienceFrom(readState())); const [expanded,setExpanded]=React.useState(false);
  React.useEffect(()=>{const f=()=>{const s=readState();setState(s);setResilience(resilienceFrom(s));};window.addEventListener("plushlife:habit-coach-updated",f);window.addEventListener("plushlife:habit-coach-hydrated",f);return()=>{window.removeEventListener("plushlife:habit-coach-updated",f);window.removeEventListener("plushlife:habit-coach-hydrated",f);};},[]);
  if(!open)return null;
  const ids={}; Object.entries(state.history||{}).forEach(([,day])=>Object.entries(day||{}).forEach(([id,item])=>{ids[id] ||= {id,label:item.label||"Habit"};}));
  const habits=Object.values(ids).map(row=>({row,stats:statsFor(state,row),friction:frictionScore(state,row,resilience)})).filter(x=>x.stats.total>=3).sort((a,b)=>(b.friction.score??0)-(a.friction.score??0));
  const steady=habits.filter(x=>(x.stats.rate||0)>=.75).slice(0,3); const improving=habits.filter(x=>x.stats.recentRate!==null&&x.stats.priorRate!==null&&x.stats.recentRate>x.stats.priorRate+.15).slice(0,3); const fragile=habits.filter(x=>(x.friction.score||0)>=55).slice(0,3);
  const weekStart=(()=>{const d=new Date();const day=d.getDay();d.setDate(d.getDate()-((day+6)%7));return d.toISOString().slice(0,10);})(); const decisions=resilience.weeklyDecisions?.[weekStart]||{};
  const saveDecision=(id,value)=>{const next=writeResilience({weeklyDecisions:{...(resilience.weeklyDecisions||{}),[weekStart]:{...decisions,[id]:value}}});setResilience(next);};
  const instruction=[]; if(steady[0])instruction.push(`Keep ${steady[0].row.label || steady[0].row.id} simple; consistency is already strong.`); if(fragile[0])instruction.push(`${fragile[0].row.label || fragile[0].row.id} has the most friction right now—shrink or reschedule before pushing harder.`); const best=habits.map(x=>x.stats.bestDay).filter(Boolean).sort((a,b)=>b.rate-a.rate)[0]; if(best)instruction.push(`${best.day} is one of your strongest observed habit days.`); if(!instruction.length)instruction.push("PlushLife is still learning your instruction manual. Keep checking in honestly; useful patterns need real days, not guesses.");
  const milestone=steady.length>=2?"You have more than one habit that is becoming dependable. That's a routine taking shape.":improving.length?`You improved ${improving.length} habit${improving.length===1?"":"s"} compared with the prior week.`:fragile.length&&Object.keys(decisions).length?"You adjusted the plan instead of treating difficulty like failure. That's behavior change.":"The next milestone is not a perfect streak—it's finding one version of a habit that fits your life.";
  return <section style={{margin:"0 0 12px",border:"1px solid #D7E7DE",borderRadius:16,background:"linear-gradient(145deg,#FAFFFC,#FFF9FD)",overflow:"hidden"}}><button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} style={{width:"100%",padding:"12px 13px",border:0,background:"transparent",display:"grid",gridTemplateColumns:"1fr auto",textAlign:"left",cursor:"pointer"}}><span><span style={{fontSize:10.5,fontWeight:900,letterSpacing:".12em",color:"#318C79"}}>📖 LONG-TERM GUIDE</span><span style={{display:"block",marginTop:3,fontSize:13.5,fontWeight:900,color:"#4F405C"}}>What helps your habits actually stick</span></span><span style={{color:"#8C6B9E",fontSize:20}}>{expanded?"▾":"›"}</span></button>{expanded&&<div style={{padding:"0 12px 12px",display:"grid",gap:9}}><div style={card()}>{instruction.map((text,i)=><div key={i} style={{fontSize:11.5,lineHeight:1.5,color:"#607A73",marginTop:i?6:0}}>🌱 {text}</div>)}</div><div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#A65DC1"}}>📮 MILESTONE STORY</div><div style={{marginTop:5,fontSize:11.5,lineHeight:1.5,color:"#6B5A7D"}}>{milestone}</div></div>{habits.length>0&&<div style={card()}><div style={{fontSize:10.5,fontWeight:900,color:"#4A80B5"}}>🧭 WEEKLY RESET · KEEP / CHANGE / PAUSE</div><div style={{marginTop:4,fontSize:11,color:"#806B8D"}}>Use the review to edit the plan, not just admire a chart.</div><div style={{display:"grid",gap:7,marginTop:8}}>{habits.slice(0,5).map(({row,friction})=><div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:7,alignItems:"center"}}><span style={{fontSize:11.5,color:"#4F405C"}}><strong>{row.label||row.id}</strong><br/><span style={{fontSize:10,color:"#8C6B9E"}}>{friction.score===null?"learning":`${friction.score}/100 friction`}</span></span><span style={{display:"flex",gap:4}}>{[["keep","Keep"],["change","Change"],["pause","Pause"]].map(([id,label])=><button key={id} type="button" onClick={()=>saveDecision(row.id,id)} style={{...button(decisions[row.id]===id),padding:"5px 6px",fontSize:9.5}}>{label}</button>)}</span></div>)}</div><button type="button" onClick={()=>openTaskManager?.()} style={{...button(false),marginTop:8}}>Apply changes to habits</button></div>}</div>}</section>;
}
