🛟const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const RETENTION_KEY = "__retention";

function readHabitState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; } catch (_error) { return {}; }
}
function retentionFrom(state) {
  return state?.meta?.[RETENTION_KEY] || {
    version: 1,
    lowScreen: false,
    completionStates: {},
    challenges: [],
    versions: {},
    reminderPlans: {},
    seasonal: null,
    setupDrafts: [],
    circle: { enabled: false, ask: "encouragement" },
  };
}
function writeRetention(nextRetention) {
  const state = readHabitState();
  const next = { ...state, meta: { ...(state.meta || {}), [RETENTION_KEY]: { ...nextRetention, version: 1, updated_at: new Date().toISOString() } } };
  try { localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(next)); } catch (_error) {}
  try { window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated")); } catch (_error) {}
  return next.meta[RETENTION_KEY];
}
function habitId(row) { return String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || ""); }
function habitLabel(row) { return String(row?.label || row?.sourceTask?.label || row?.sourceTask?.name || "Habit"); }
function dateKey(value) { return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10); }
function addDays(value, count) { const d = new Date(`${dateKey(value)}T12:00:00`); d.setDate(d.getDate() + count); return d.toISOString().slice(0, 10); }
function cardButton(active = false) { return { padding:"8px 10px", borderRadius:10, border:active?"2px solid #A65DC1":"1px solid #DCC9E8", background:active?"#FAF0FD":"white", color:"#6B5A7D", fontWeight:850, fontSize:11.5, cursor:"pointer" }; }
function historyFor(state, id) {
  return Object.entries(state.history || {}).sort(([a],[b])=>a.localeCompare(b)).flatMap(([date, day]) => day?.[id] ? [{ date, ...day[id] }] : []);
}
function statsFor(state, id) {
  const h = historyFor(state, id).slice(-42);
  const total = h.length; const done = h.filter(x=>x.done).length; const rate = total ? done/total : null;
  const weekdays = {};
  h.forEach(item => { const w = new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { weekday:"short" }); weekdays[w] ||= {t:0,d:0}; weekdays[w].t++; if(item.done) weekdays[w].d++; });
  const best = Object.entries(weekdays).filter(([,v])=>v.t>=2).map(([label,v])=>({label,rate:v.d/v.t,total:v.t})).sort((a,b)=>b.rate-a.rate||b.total-a.total)[0] || null;
  const last7 = h.slice(-7); const prior7 = h.slice(-14,-7);
  const lastRate = last7.length ? last7.filter(x=>x.done).length/last7.length : null;
  const priorRate = prior7.length ? prior7.filter(x=>x.done).length/prior7.length : null;
  return { total, done, rate, best, lastRate, priorRate };
}
function confidenceFor(state, row) {
  if (!row) return { pct: 0, label: "Learning", reason: "PlushLife needs a few real days before estimating this habit." };
  const s = statsFor(state, habitId(row));
  if (s.total < 4) return { pct: Math.min(55, 20 + s.total*8), label: "Learning", reason: "Not enough history yet to make a strong prediction." };
  let pct = Math.round((s.rate || 0) * 100);
  const today = new Date().toLocaleDateString("en-US", { weekday:"short" });
  if (s.best?.label === today && s.best.rate >= .7) pct = Math.min(95, pct + 10);
  return { pct, label: pct >= 75 ? "Likely" : pct >= 45 ? "Possible" : "Needs help", reason: pct < 45 ? "This habit has been hard to start lately." : s.best ? `Your strongest observed day is ${s.best.label}.` : "This estimate comes from your recent completion pattern." };
}
function rescueFor(state, row) {
  if (!row) return null;
  const id = habitId(row); const s = statsFor(state,id); const meta = state.meta?.[id] || {};
  if (s.total < 5 || s.rate === null || s.rate >= .45) return null;
  if (!meta.minimum) return { action:"shrink", text:"This habit is slipping. Give it a tiny minimum version before asking for more effort." };
  if (meta.friction === "wrong_time" || (s.best && s.best.rate >= .65)) return { action:"reschedule", text:s.best ? `This works better on ${s.best.label}s. Try moving or emphasizing it around that pattern.` : "The timing may be fighting you. Try another time for seven days." };
  if (meta.stackAfter) return { action:"stack", text:"The stack may not be firing reliably. Make the cue more obvious or choose a steadier anchor habit." };
  return { action:"pause", text:"This is still hard even with a smaller version. A short pause or replacement may protect the rest of your routine." };
}
function parseNaturalHabit(text) {
  const raw = String(text || "").trim(); if (!raw) return null;
  const daysMatch = raw.match(/(\d+)\s*(?:days?|times?)\s*(?:a|per)\s*week/i);
  const morning = /morning/i.test(raw), evening = /evening|night|bed/i.test(raw);
  const label = raw.replace(/^i\s+(?:want|need|would like)\s+to\s+/i, "").replace(/\s+\d+\s*(?:days?|times?)\s*(?:a|per)\s*week.*$/i, "").trim();
  const minimum = /run|walk|workout|exercise/i.test(raw) ? "Do 2 minutes" : /read|study|focus/i.test(raw) ? "Do 5 minutes" : /clean|tidy|dishes|laundry/i.test(raw) ? "Do one tiny piece" : `Do the smallest useful version of ${label || "this habit"}`;
  return { label: label || raw, daysPerWeek: daysMatch ? Number(daysMatch[1]) : 3, time: morning ? "morning" : evening ? "evening" : "flexible", minimum };
}
function seasonSuggestion() {
  const m = new Date().getMonth()+1;
  if ([11,12].includes(m)) return "Holiday season can scramble routines. Protect essentials and let optional habits flex.";
  if ([1,2].includes(m)) return "New-year energy can make plans too ambitious. Add slowly and keep minimum versions tiny.";
  if ([6,7,8].includes(m)) return "Summer schedules often move around. Consider a flexible-time version of habits that normally depend on a clock.";
  if ([8,9].includes(m)) return "Back-to-school and schedule changes can disrupt cues. Re-check timing before assuming a habit stopped working.";
  return "A schedule change is a reason to adapt the habit, not a reason to blame yourself.";
}

export function useLowScreenMode() {
  const [lowScreen, setLowScreen] = React.useState(() => !!retentionFrom(readHabitState()).lowScreen);
  React.useEffect(() => {
    const refresh = () => setLowScreen(!!retentionFrom(readHabitState()).lowScreen);
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => { window.removeEventListener("plushlife:habit-coach-updated", refresh); window.removeEventListener("plushlife:habit-coach-hydrated", refresh); };
  }, []);
  return lowScreen;
}

export function LowScreenToday({ open, rows = [], viewDone = {}, period, toggle, nextStepTask, selectDayType, goToDashboard, openTaskManager }) {
  const [state,setState] = React.useState(()=>readHabitState());
  React.useEffect(()=>{ const f=()=>setState(readHabitState()); window.addEventListener("plushlife:habit-coach-updated",f); return()=>window.removeEventListener("plushlife:habit-coach-updated",f);},[]);
  if (!open) return null;
  const date=dateKey(period?.date); const anchorId=state.anchors?.[date]; const anchor=(rows||[]).find(r=>habitId(r)===anchorId); const next=anchor&&!viewDone?.[anchor.key]?anchor:nextStepTask || (rows||[]).find(r=>!r.isBonus&&!viewDone?.[r.key]);
  const complete = next ? () => toggle?.(next.key) : null;
  return <div style={{display:"grid",gap:12,marginBottom:18}}>
    <section style={{padding:18,borderRadius:20,background:"linear-gradient(145deg,#FFF9FD,#F4FBFF)",border:"1px solid #E3C9EC",textAlign:"center"}}>
      <div style={{fontSize:11,letterSpacing:".14em",fontWeight:900,color:"#A65DC1"}}>🌿 LOW SCREEN TIME</div>
      <div style={{marginTop:8,fontSize:13,color:"#806B8D"}}>Open → know what matters → do it → leave.</div>
      <div style={{marginTop:14,fontSize:20,fontWeight:900,color:"#4F405C"}}>{next ? (next.label || habitLabel(next)) : "You’re done for now."}</div>
      {next && <button type="button" onClick={complete} style={{...cardButton(true),marginTop:14,padding:"11px 18px",border:0,background:"#A65DC1",color:"white"}}>✓ Done</button>}
      <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap",marginTop:10}}><button type="button" onClick={()=>selectDayType?.("soft")} style={cardButton(false)}>🌼 Make today softer</button><button type="button" onClick={()=>goToDashboard?.("progress")} style={cardButton(false)}>📊 Review</button></div>
    </section>
    <button type="button" onClick={()=>{ const r=retentionFrom(readHabitState()); writeRetention({...r,lowScreen:false}); }} style={cardButton(false)}>Show full Today</button>
  </div>;
}

export function HabitRetentionTools({ open, rows = [], viewDone = {}, period, toggle, nextStepTask, openTaskManager, selectDayType, goToDashboard, setCareSection, preferences }) {
  const [state,setState] = React.useState(()=>readHabitState());
  const [retention,setRetention] = React.useState(()=>retentionFrom(readHabitState()));
  const [openTools,setOpenTools] = React.useState(false);
  const [command,setCommand] = React.useState(""); const [setupText,setSetupText]=React.useState(""); const [setup,setSetup]=React.useState(null); const [message,setMessage]=React.useState("");
  const date=dateKey(period?.date); const current=(rows||[]).filter(r=>!r?.isBonus); const rowById=new Map(current.map(r=>[habitId(r),r]));
  React.useEffect(()=>{ const f=()=>{const s=readHabitState();setState(s);setRetention(retentionFrom(s));}; window.addEventListener("plushlife:habit-coach-updated",f); window.addEventListener("plushlife:habit-coach-hydrated",f); return()=>{window.removeEventListener("plushlife:habit-coach-updated",f);window.removeEventListener("plushlife:habit-coach-hydrated",f);};},[]);
  React.useEffect(()=>{ if(!open)return; const params=new URLSearchParams(location.search); const action=params.get("plushAction"); const id=params.get("habit"); const row=rowById.get(id); if(action==="done"&&row&&!viewDone?.[row.key]) toggle?.(row.key); if(action==="soft") selectDayType?.("soft"); if(action==="review") goToDashboard?.("progress"); },[open,date]);
  if(!open)return null;
  const saveRetention=(patch)=>{const next=writeRetention({...retention,...patch});setRetention(next);setState(readHabitState());};
  const waiting=current.filter(r=>!viewDone?.[r.key]);
  const risks=waiting.map(row=>({row,confidence:confidenceFor(state,row),rescue:rescueFor(state,row)})).sort((a,b)=>a.confidence.pct-b.confidence.pct);
  const atRisk=risks.find(x=>x.rescue)||risks[0];
  const markState=(row,type)=>{ const id=habitId(row); const key=`${date}:${id}`; saveRetention({completionStates:{...(retention.completionStates||{}),[key]:type}}); if(["full","tiny"].includes(type)&&!viewDone?.[row.key]) toggle?.(row.key); };
  const runCommand=()=>{ const q=command.trim().toLowerCase(); if(!q)return; if(/progress|review|what works/.test(q))goToDashboard?.("progress"); else if(/care|support|help/.test(q)){setCareSection?.("quick");goToDashboard?.("care");} else if(/soft|lighter/.test(q))selectDayType?.("soft"); else if(/tiny day/.test(q))selectDayType?.("tiny"); else if(/edit|pause|reschedule|task|habit/.test(q))openTaskManager?.(); else { const found=current.find(r=>habitLabel(r).toLowerCase().includes(q)); if(found){setMessage(`${habitLabel(found)} is ${viewDone?.[found.key]?"done":"still waiting"} today.`);} else setMessage("Try: progress, make today soft, edit habits, support, or part of a habit name."); } setCommand(""); };
  const reminderSuggestion = atRisk?.row ? (()=>{ const s=statsFor(state,habitId(atRisk.row)); return s.best ? `This habit works best on ${s.best.label}s. Keep reminders close to the cue instead of adding more alerts.` : "This habit may benefit from one reminder closer to the moment you can actually do it."; })() : "PlushLife will suggest reminder changes after it sees enough real habit history.";
  return <section style={{marginBottom:14,borderRadius:17,border:"1px solid #D9E5F1",background:"linear-gradient(145deg,#FBFDFF,#FFF9FD)",overflow:"hidden"}}>
    <button type="button" onClick={()=>setOpenTools(v=>!v)} aria-expanded={openTools} style={{width:"100%",display:"grid",gridTemplateColumns:"1fr auto",gap:10,padding:"12px 13px",border:0,background:"transparent",textAlign:"left",cursor:"pointer"}}><span><span style={{display:"block",fontSize:10.5,letterSpacing:".12em",fontWeight:900,color:"#4A80B5"}}>🧠 HABIT ASSIST</span><span style={{display:"block",marginTop:3,fontSize:13.5,fontWeight:900,color:"#4F405C"}}>Rescue slipping habits, reduce screen time & learn what works</span><span style={{display:"block",marginTop:2,fontSize:11,color:"#806B8D"}}>Smart reminders, confidence, challenges, setup help and gentle accountability.</span></span><span style={{fontSize:20,color:"#8C6B9E"}}>{openTools?"▾":"›"}</span></button>
    {openTools&&<div style={{padding:"0 12px 12px",display:"grid",gap:9}}>
      <div style={{padding:10,borderRadius:11,background:"white",border:"1px solid #E6DFF0"}}><div style={{fontSize:10.5,fontWeight:900,color:"#76558A"}}>⌨️ QUICK COMMAND</div><div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6,marginTop:6}}><input value={command} onChange={e=>setCommand(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")runCommand();}} placeholder="Try “make today soft” or “review habits”" style={{minWidth:0,padding:9,borderRadius:9,border:"1px solid #DCC9E8"}}/><button type="button" onClick={runCommand} style={cardButton(false)}>Go</button></div>{message&&<div role="status" style={{marginTop:5,fontSize:11,color:"#806B8D"}}>{message}</div>}</div>
      {atRisk?.row&&<div style={{padding:10,borderRadius:11,background:"#FFF9E9",border:"1px solid #F0D99E"}}><div style={{fontSize:10.5,fontWeight:900,color:"#A56D14"}}>🆘 HABIT RESCUE · {atRisk.confidence.label} {atRisk.confidence.pct}%</div><div style={{marginTop:4,fontSize:13,fontWeight:900,color:"#6B5A3D"}}>{habitLabel(atRisk.row)}</div><div style={{marginTop:3,fontSize:11.5,lineHeight:1.45,color:"#7B6B50"}}>{atRisk.rescue?.text || atRisk.confidence.reason}</div><div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}><button type="button" onClick={()=>markState(atRisk.row,"tiny")} style={cardButton(false)}>🌱 Tiny counts</button><button type="button" onClick={()=>openTaskManager?.()} style={cardButton(false)}>Reschedule / edit</button><button type="button" onClick={()=>markState(atRisk.row,"skipped_on_purpose")} style={cardButton(false)}>Skip on purpose</button></div></div>}
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>✅ Better completion states</summary><div style={{padding:"0 11px 11px"}}>{(nextStepTask?[current.find(r=>r.key===nextStepTask.key)||nextStepTask]:waiting.slice(0,1)).filter(Boolean).map(row=><div key={habitId(row)}><div style={{fontSize:12.5,fontWeight:900,color:"#5B4B6B"}}>{habitLabel(row)}</div><div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>{[["full","Full"],["tiny","Tiny"],["partial","Partial"],["skipped_on_purpose","Skipped on purpose"],["rested","Rested"]].map(([id,label])=><button key={id} type="button" onClick={()=>markState(row,id)} style={cardButton((retention.completionStates||{})[`${date}:${habitId(row)}`]===id)}>{label}</button>)}</div></div>)}</div></details>
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>🔔 Smarter reminders & notification actions</summary><div style={{padding:"0 11px 11px",fontSize:11.5,lineHeight:1.5,color:"#6B5A7D"}}><div>{reminderSuggestion}</div><div style={{marginTop:7,padding:8,borderRadius:9,background:"#F8F6FA"}}>When a PlushLife reminder opens the app, it can now carry actions for <strong>Done</strong>, <strong>Make today softer</strong>, and <strong>Open review</strong>. Existing notification permissions are unchanged.</div><button type="button" onClick={()=>goToDashboard?.("settings")} style={{...cardButton(false),marginTop:7}}>Open reminder settings</button></div></details>
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>🗣 Set up a habit in plain English</summary><div style={{padding:"0 11px 11px"}}><textarea value={setupText} onChange={e=>setSetupText(e.target.value)} placeholder="I want to start running three mornings a week" style={{width:"100%",boxSizing:"border-box",minHeight:64,padding:9,borderRadius:9,border:"1px solid #DCC9E8"}}/><button type="button" onClick={()=>{const p=parseNaturalHabit(setupText);setSetup(p); if(p) saveRetention({setupDrafts:[...(retention.setupDrafts||[]).slice(-9),{...p,created:new Date().toISOString()}]});}} style={{...cardButton(false),marginTop:6}}>Build a sensible starting plan</button>{setup&&<div style={{marginTop:7,padding:9,borderRadius:10,background:"#F2FFFB",color:"#3E746A",fontSize:11.5,lineHeight:1.5}}><strong>{setup.label}</strong><br/>{setup.daysPerWeek}×/week · {setup.time}<br/>Minimum: {setup.minimum}<br/><button type="button" onClick={()=>openTaskManager?.()} style={{...cardButton(false),marginTop:6}}>Open task setup with this plan in mind</button></div>}</div></details>
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>🏆 Gentle challenges</summary><div style={{padding:"0 11px 11px",display:"grid",gap:6}}>{["7 gentle mornings","Water 5 days this week","Bedtime wind-down 4 nights","One tiny reset every day"].map(name=>{const active=(retention.challenges||[]).some(c=>c.name===name&&!c.ended);return <button key={name} type="button" onClick={()=>saveRetention({challenges:active?(retention.challenges||[]).map(c=>c.name===name?{...c,ended:date}:c):[...(retention.challenges||[]),{name,started:date,ended:null}]})} style={{...cardButton(active),textAlign:"left"}}>{active?"✓ ":""}{name}</button>})}<div style={{fontSize:10.5,color:"#8C6B9E"}}>Personal challenges only. No leaderboard and no punishment for missing a day.</div></div></details>
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>🍂 Temporary routine adaptation</summary><div style={{padding:"0 11px 11px",fontSize:11.5,color:"#6B5A7D",lineHeight:1.5}}><div>{seasonSuggestion()}</div><div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>{["Travel","Illness / recovery","Busy week","School / work change","Weekend rhythm"].map(kind=><button key={kind} type="button" onClick={()=>saveRetention({seasonal:{kind,started:date,through:addDays(date,7)}})} style={cardButton(retention.seasonal?.kind===kind)}>{kind}</button>)}</div>{retention.seasonal&&<div style={{marginTop:7}}>Active through {retention.seasonal.through}: <strong>{retention.seasonal.kind}</strong>. PlushLife will favor flexibility and smaller defaults during this window.</div>}</div></details>
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>🤝 Accountability circle</summary><div style={{padding:"0 11px 11px",fontSize:11.5,color:"#6B5A7D",lineHeight:1.5}}>Keep it private and small: choose the kind of support you want, then use the existing Guardian/support flow.<div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>{["encouragement","check on me","celebrate a win","practical help"].map(ask=><button key={ask} type="button" onClick={()=>saveRetention({circle:{enabled:true,ask}})} style={cardButton(retention.circle?.ask===ask)}>{ask}</button>)}</div><button type="button" onClick={()=>goToDashboard?.("guardian")} style={{...cardButton(false),marginTop:7}}>Open Guardian</button></div></details>
      <details style={{borderRadius:11,border:"1px solid #E6DFF0",background:"white",overflow:"hidden"}}><summary style={{padding:"10px 11px",cursor:"pointer",fontSize:11.5,fontWeight:900,color:"#76558A"}}>🧬 Habit version history</summary><div style={{padding:"0 11px 11px",fontSize:11.5,color:"#6B5A7D"}}>Save a snapshot before changing a habit so progress reflects adaptation, not a fake story that the plan never changed.<div style={{display:"grid",gap:5,marginTop:7}}>{current.slice(0,6).map(row=>{const id=habitId(row);const versions=retention.versions?.[id]||[];return <div key={id} style={{padding:8,borderRadius:9,background:"#F8F6FA"}}><strong>{habitLabel(row)}</strong> · {versions.length} saved version{versions.length===1?"":"s"}<button type="button" onClick={()=>{const meta=state.meta?.[id]||{};saveRetention({versions:{...(retention.versions||{}),[id]:[...versions,{at:new Date().toISOString(),label:habitLabel(row),minimum:meta.minimum||"",friction:meta.friction||"",stackAfter:meta.stackAfter||""}].slice(-12)}})}} style={{...cardButton(false),marginLeft:6,padding:"5px 7px"}}>Save version</button></div>})}</div></div></details>
      <div style={{padding:10,borderRadius:11,background:"#F4FBF9",border:"1px solid #CFE8E1"}}><div style={{fontSize:10.5,fontWeight:900,color:"#318C79"}}>📱 LOW SCREEN TIME</div><div style={{marginTop:3,fontSize:11.5,color:"#607A73"}}>Turn Today into one next action plus two escape hatches. Great when the app itself starts feeling like another task.</div><button type="button" onClick={()=>saveRetention({lowScreen:!retention.lowScreen})} style={{...cardButton(retention.lowScreen),marginTop:7}}>{retention.lowScreen?"Turn off Low Screen Time":"Turn on Low Screen Time"}</button></div>
    </div>}
  </section>;
}

export function WhatWorksForMe({ open, openTaskManager }) {
  const [state,setState]=React.useState(()=>readHabitState());
  React.useEffect(()=>{const f=()=>setState(readHabitState());window.addEventListener("plushlife:habit-coach-updated",f);window.addEventListener("plushlife:habit-coach-hydrated",f);return()=>{window.removeEventListener("plushlife:habit-coach-updated",f);window.removeEventListener("plushlife:habit-coach-hydrated",f);};},[]);
  if(!open)return null;
  const ids=new Set();Object.values(state.history||{}).forEach(day=>Object.keys(day||{}).forEach(id=>ids.add(id)));
  const habits=[...ids].map(id=>{const s=statsFor(state,id);const label=state.meta?.[id]?.label||Object.values(state.history||{}).map(d=>d?.[id]?.label).find(Boolean)||"Habit";return{id,label,...s,meta:state.meta?.[id]||{}};}).filter(x=>x.total>=3).sort((a,b)=>(b.rate||0)-(a.rate||0));
  const steady=habits.filter(x=>(x.rate||0)>=.75).slice(0,3); const needs=habits.filter(x=>(x.rate||0)<.45).slice(0,3); const improved=habits.filter(x=>x.lastRate!==null&&x.priorRate!==null&&x.lastRate>x.priorRate+.15).slice(0,3);
  return <section style={{marginBottom:14,borderRadius:17,border:"1px solid #CFE8E1",background:"linear-gradient(145deg,#F4FBF9,#FFFDFC)",overflow:"hidden"}}><details><summary style={{padding:"12px 13px",cursor:"pointer",fontWeight:900,color:"#3E746A"}}>🔎 Patterns PlushLife Learned</summary><div style={{padding:"0 12px 12px",display:"grid",gap:8,fontSize:11.5,color:"#607A73"}}>
    <div>PlushLife turns your actual habit history into evidence you can use—not generic motivation.</div>
    {[ ["🌟 Steady habits",steady],["📈 Getting easier",improved],["🛟 Needs a redesign",needs] ].map(([title,list])=><div key={title} style={{padding:9,borderRadius:10,background:"white"}}><strong>{title}</strong>{list.length?list.map(x=><div key={x.id} style={{marginTop:5}}>{x.label} · {Math.round((x.rate||0)*100)}%{x.best?` · strongest on ${x.best.label}`:""}</div>):<div style={{marginTop:5,color:"#8CA09B"}}>Still learning.</div>}</div>)}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button type="button" onClick={()=>openTaskManager?.()} style={cardButton(false)}>Adjust habits from the evidence</button></div>
  </div></details></section>;
}
