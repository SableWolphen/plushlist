import { buildCozyDayPlan, ROUTINE_TEMPLATES, weeklyCozyStory, shareableCozyStory, safeHomeMode } from "../cozy-day-plan.mjs";
import { companionAccountKey } from "../companion-account-storage.mjs";
import { ThemeScene } from "./theme-world.jsx";
import { startFocusTimer } from "./focus-timer.jsx";

const card={border:"1px solid var(--pl-theme-line)",borderRadius:18,background:"var(--pl-theme-surface)",color:"var(--pl-theme-ink)",padding:14};
const btn={minHeight:44,padding:"9px 12px",borderRadius:13,border:"1px solid var(--pl-theme-line)",background:"var(--pl-theme-surface-2)",color:"var(--pl-theme-ink)",font:"inherit",fontSize:13,fontWeight:800,cursor:"pointer"};
const action={...btn,background:"var(--pl-theme-accent)",color:"var(--pl-theme-on-accent,#fff)",border:"1px solid transparent"};
function readHomeMode(userId) {const key=companionAccountKey("plushlife:home-mode:v1",userId);try{return safeHomeMode(key&&localStorage.getItem(key));}catch(_error){return"minimal";}}
function storeHomeMode(userId,mode) {const key=companionAccountKey("plushlife:home-mode:v1",userId);if(!key)return false;try{localStorage.setItem(key,safeHomeMode(mode));return true;}catch(_error){return false;}}

export function CozyDayHome({userId,rows=[],viewDone={},period,mode="full",pct=0,toggle,openTaskManager,openDailyCheckIn,openTodayJournal,onComfort,onDayType,babyMode=false}) {
  const [layout,setLayout]=React.useState(()=>readHomeMode(userId));
  const [minutes,setMinutes]=React.useState(30);
  const [focus,setFocus]=React.useState(null);
  const [tiny,setTiny]=React.useState(false);
  const [celebrate,setCelebrate]=React.useState(false);
  const [notice,setNotice]=React.useState("");
  const [viewChoices,setViewChoices]=React.useState(false);
  React.useEffect(()=>{setLayout(readHomeMode(userId));setFocus(null);},[userId]);
  React.useEffect(()=>{setFocus(null);setTiny(false);},[period?.date]);
  React.useEffect(()=>{
    if(!focus)return undefined;
    const previous=document.activeElement;
    const onKey=event=>{if(event.key==="Escape"){event.preventDefault();setFocus(null);} if(event.key==="Tab"){
      const root=document.getElementById("plushlife-one-step-dialog");
      const controls=[...(root?.querySelectorAll("button:not(:disabled)")||[])];
      if(!controls.length)return;
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===root)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===root)){event.preventDefault();first.focus();}
    }};
    document.addEventListener("keydown",onKey);
    document.getElementById("plushlife-one-step-dialog")?.focus();
    return()=>{document.removeEventListener("keydown",onKey);previous?.focus?.();};
  },[focus]);
  const plan=buildCozyDayPlan({rows,viewDone,mode,minutesAvailable:minutes});
  React.useEffect(()=>{
    if(!userId)return undefined;
    const openShortcutFocus=()=>{
      let requested=false;
      try {requested=sessionStorage.getItem("plushlife:focus-open:v1")==="1"; if(requested)sessionStorage.removeItem("plushlife:focus-open:v1");}catch(_error){}
      if(requested && plan.essentials[0]){setFocus(plan.essentials[0]);setTiny(false);}
    };
    window.addEventListener("plushlife:focus-one-step",openShortcutFocus);
    openShortcutFocus();
    return()=>window.removeEventListener("plushlife:focus-one-step",openShortcutFocus);
  },[userId,mode,period?.date,JSON.stringify(plan.essentials.map(item=>item.key))]);
  if(!userId)return null;
  const finished=rows.filter(row=>row&&!row.isBonus&&viewDone[row.key]).length;
  const essentialCount=rows.filter(row=>row&&!row.isBonus).length;
  const first=plan.essentials[0];
  const setMode=value=>{if(storeHomeMode(userId,value)){setLayout(value);setNotice("");}else setNotice("Couldn't save this view on this device.");};
  const highFive=()=>{setCelebrate(true); if(!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)navigator.vibrate?.(12);window.setTimeout(()=>setCelebrate(false),650);};
  return <section aria-label="Your gentle daily plan" style={{display:"grid",gap:9}}>
    <div style={{...card,padding:"11px 13px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <div><strong style={{fontSize:14}}>Your little plan</strong><div style={{fontSize:11.5,color:"var(--pl-theme-muted)",marginTop:3}}>{finished} of {essentialCount} essentials finished · at your own pace</div></div>
        <button type="button" onClick={()=>setViewChoices(v=>!v)} aria-expanded={viewChoices} style={{...btn,minHeight:36,padding:"7px 10px",fontSize:12}}>View · {layout} ▾</button>
      </div>
      {viewChoices&&<div role="group" aria-label="Home layout" style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
        {[["minimal","Minimal"],["routine","Routine"],["companion","Companion"]].map(([value,label])=><button type="button" key={value} aria-pressed={layout===value} onClick={()=>{setMode(value);setViewChoices(false);}} style={{...btn,minHeight:40,borderWidth:layout===value?2:1}}>{label}</button>)}
      </div>}
      <div role="progressbar" aria-label="Today's essentials progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,Math.round(Number(pct)||0)))} style={{marginTop:10,height:8,borderRadius:99,background:"var(--pl-theme-surface-2)",overflow:"hidden"}}><div style={{height:"100%",width:Math.max(0,Math.min(100,Number(pct)||0))+"%",background:"var(--pl-theme-accent)",borderRadius:99}}/></div>
      {layout==="companion"&&<div style={{marginTop:9,display:"grid",gridTemplateColumns:"62px 1fr",gap:10,alignItems:"center",padding:8,background:"var(--pl-theme-surface-2)",borderRadius:14}}>
        <button type="button" onClick={highFive} aria-label="Give your Plush a high-five" className={celebrate?"pl-day-companion-hop":""} style={{border:0,background:"transparent",width:58,height:60,padding:0,cursor:"pointer",overflow:"hidden"}}><ThemeScene focus decorative mood={celebrate?"happy":"neutral"}/></button>
        <div style={{fontSize:13,lineHeight:1.5}}>💜 {mode==="rest"?"I'm happy to rest here with you.":first?"We can do one little step together.":"You've done plenty. I'm proud of you."}<div style={{fontSize:11.5,color:"var(--pl-theme-muted)"}}>Tap your Plush for a high-five. No streak pressure.</div></div>
      </div>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
        <button type="button" onClick={()=>openTaskManager?.(period?.date)} style={{...btn,flex:1}}>＋ Add task</button>
        <button type="button" onClick={()=>openDailyCheckIn?.()} style={{...btn,flex:1}}>♡ Check in</button>
        <button type="button" onClick={()=>openTodayJournal?.()} style={{...btn,flex:1}}>📝 Journal</button>
      </div>
    </div>
    <div style={{...card,padding:"12px 13px"}}>
      <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
        <div><strong style={{fontSize:14}}>✨ One step at a time</strong><div style={{fontSize:11.5,color:"var(--pl-theme-muted)",marginTop:3}}>Suggestions only · nothing moves without you</div></div>
        {mode!=="rest"&&<label style={{fontSize:12,color:"var(--pl-theme-muted)",display:"flex",alignItems:"center",gap:5}}>Time I have
          <select value={minutes} onChange={e=>setMinutes(Number(e.target.value))} style={{...btn,minHeight:37,padding:"5px 7px",fontSize:12}}>{[10,20,30,60].map(n=><option value={n} key={n}>{n} min</option>)}</select>
        </label>}
      </div>
      {plan.rest?<p style={{fontSize:13,lineHeight:1.5}}>Rest is today's plan. Your tasks and checkmarks are still here whenever you're ready.</p>:!first?<p style={{fontSize:13,lineHeight:1.5}}>You're caught up with your essentials. That's something to celebrate. ✨</p>:<>
        <div style={{display:"grid",gap:8,marginTop:10}}>
          {plan.essentials.map((item,i)=><div key={item.key} style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
            <button type="button" aria-label={"Complete "+item.label} onClick={()=>toggle?.(item.key)} style={{...btn,minWidth:44,padding:"7px",fontSize:20}}>○</button>
            <button type="button" onClick={()=>{setFocus(item);setTiny(false);}} style={{border:0,background:"transparent",color:"var(--pl-theme-ink)",textAlign:"left",flex:1,minWidth:0,padding:0,cursor:"pointer",font:"inherit"}}>
              <span style={{display:"block",fontWeight:i===0?900:750,fontSize:13.5,overflowWrap:"anywhere"}}>{item.label}</span><span style={{fontSize:11,color:"var(--pl-theme-muted)"}}>About {item.minutes} minutes · Focus →</span>
            </button>
          </div>)}
        </div>
        {layout!=="minimal"&&plan.optional.length>0&&<details style={{marginTop:10}}><summary style={{cursor:"pointer",minHeight:34,fontSize:12,fontWeight:800,color:"var(--pl-theme-muted)"}}>Extra steps, only if you want ({plan.optional.length})</summary>{plan.optional.map(item=><button type="button" key={item.key} onClick={()=>{setFocus(item);setTiny(false);}} style={{...btn,display:"block",width:"100%",textAlign:"left",marginTop:6}}>{item.label} · {item.minutes}m</button>)}</details>}
        <div style={{marginTop:10,color:"var(--pl-theme-muted)",fontSize:12,lineHeight:1.45}}>Suggested steps: ~{plan.suggestedMinutes} min. Your full remaining list: ~{plan.totalMinutes} min. Estimates are adjustable on each task.</div>
        {plan.overloaded&&<div role="status" style={{fontSize:12,marginTop:7,lineHeight:1.4}}>This might be more than your {plan.budget}-minute window. Try Tiny Day, or move an item when you're ready.</div>}
        <button type="button" onClick={()=>{setFocus(first);setTiny(false);}} style={{...action,width:"100%",marginTop:10}}>Start with {babyMode?"one little job":"one tiny thing"} →</button>
      </>}
      {layout==="routine"&&<button type="button" onClick={()=>openTaskManager?.(period?.date)} style={{...btn,width:"100%",marginTop:8}}>Edit my routine and repeating tasks</button>}
      <button type="button" onClick={onComfort} style={{...btn,width:"100%",marginTop:8}}>✿ Take a calming pause</button>
    </div>
    {notice&&<p role="status" style={{fontSize:12,margin:0}}>{notice}</p>}
    <style>{'@media(prefers-reduced-motion:no-preference){.pl-day-companion-hop{animation:pl-day-hop .55s ease-in-out}}@keyframes pl-day-hop{50%{transform:translateY(-8px) rotate(5deg)}}'}</style>
    {focus&&<div id="plushlife-one-step-dialog" role="dialog" aria-modal="true" aria-label="One-step focus" tabIndex={-1} style={{position:"fixed",inset:0,zIndex:210,background:"rgba(27,17,37,.77)",backdropFilter:"blur(10px)",display:"grid",placeItems:"center",padding:18,boxSizing:"border-box"}}>
      <div style={{...card,width:"min(100%,430px)",boxSizing:"border-box",padding:22,maxHeight:"calc(100dvh - 36px)",overflowY:"auto",textAlign:"center",boxShadow:"0 24px 70px rgba(0,0,0,.28)"}}>
        <div style={{display:"flex",justifyContent:"flex-end"}}><button type="button" style={btn} onClick={()=>setFocus(null)} aria-label="Close focus mode">✕ Close</button></div>
        <div aria-hidden="true" style={{maxWidth:90,margin:"0 auto"}}><ThemeScene focus decorative /></div>
        <div style={{fontSize:11,fontWeight:850,letterSpacing:".12em",color:"var(--pl-theme-muted)"}}>JUST THIS ONE THING</div>
        <h2 style={{fontSize:22,lineHeight:1.2,overflowWrap:"anywhere",margin:"10px 0"}}>{tiny?(focus.tiny||focus.soft||"Start with the first tiny part of this task."):focus.label}</h2>
        <p style={{fontSize:13,color:"var(--pl-theme-muted)",lineHeight:1.5}}>You don't have to finish everything. Just give yourself a small beginning.</p>
        <button type="button" onClick={()=>{const item=focus;setFocus(null);startFocusTimer({minutes:Math.min(25,[2,5,10,25].find(n=>n>=item.minutes)||25),taskLabel:tiny?(item.tiny||item.soft||item.label):item.label,step:tiny?"A tiny version counts as effort.":""});}} style={{...action,width:"100%",marginTop:10}}>◷ Start a gentle timer</button>
        <button type="button" onClick={()=>{toggle?.(focus.key);setFocus(null);}} style={{...btn,width:"100%",marginTop:9}}>✓ Mark task complete</button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:9}}>
          <button type="button" onClick={()=>setTiny(v=>!v)} style={btn}>{tiny?"Full step":"Tiny version"}</button>
          <button type="button" onClick={()=>{setFocus(null);openTaskManager?.(period?.date);}} style={btn}>Move / edit later</button>
        </div>
      </div>
    </div>}
  </section>;
}

export function RoutineStarter({ onChoose }) {
  return <details style={{...card,marginBottom:12}}>
    <summary style={{cursor:"pointer",fontWeight:850,minHeight:42,alignContent:"center"}}>🌷 Browse ready-made routines</summary>
    <p style={{fontSize:12.5,color:"var(--pl-theme-muted)",lineHeight:1.45}}>Pick a routine, review the suggested tasks, and choose your schedule before saving. Nothing replaces your existing tasks.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
      {ROUTINE_TEMPLATES.map(template=><button key={template.id} type="button" style={{...btn,textAlign:"left",minWidth:0,height:"100%",whiteSpace:"normal"}} onClick={()=>onChoose?.(template)}><strong style={{display:"block"}}>{template.icon} {template.name}</strong><span style={{display:"block",fontWeight:500,fontSize:11.5,marginTop:4,lineHeight:1.4}}>{template.tasks.slice(0,2).join(" · ")}…</span></button>)}
    </div>
  </details>;
}

export function CozyWeeklyStory({history=[],checkIns=[],period,userId}){
  const story=weeklyCozyStory({history,checkIns,today:period?.date});
  const [status,setStatus]=React.useState("");
  React.useEffect(()=>setStatus(""),[userId,period?.date]);
  if(!story||!userId)return null;
  const share=async()=>{const text=shareableCozyStory(story);try{
    if(navigator.share)await navigator.share({title:"A PlushLife little win",text});
    else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);setStatus("Copied your privacy-safe week summary.");}
    else setStatus("Sharing isn't supported here.");
  }catch(error){if(error?.name!=="AbortError")setStatus("Couldn't share this time.");}};
  return <details style={{...card,marginBottom:12}}>
    <summary style={{cursor:"pointer",fontWeight:900,minHeight:42,alignContent:"center"}}>📖 Your week, as a little story</summary>
    <div style={{background:"var(--pl-theme-surface-2)",borderRadius:14,padding:14,marginTop:10,lineHeight:1.55}}>
      <div style={{fontSize:11,color:"var(--pl-theme-muted)",letterSpacing:".08em",fontWeight:850}}>A PLUSH STORY · {story.start} – {story.end}</div>
      <h3 style={{fontSize:17,margin:"8px 0"}}>✨ {story.heading}</h3>
      <p style={{margin:0,fontSize:14}}>{story.line}</p>
      <p style={{margin:"8px 0 0",fontSize:13}}>You've earned every small moment of care. Rest never erases it.</p>
    </div>
    <button type="button" style={{...btn,width:"100%",marginTop:10}} onClick={share}>♡ Share my weekly win</button>
    <p style={{fontSize:11.5,color:"var(--pl-theme-muted)",margin:"6px 0 0"}}>Sharing includes counts only, never task names, journal notes or personal feelings. Nothing posts automatically.</p>
    {status&&<p role="status" style={{fontSize:12}}>{status}</p>}
  </details>;
}
