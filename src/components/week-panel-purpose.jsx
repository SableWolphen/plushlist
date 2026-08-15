import { HabitTypeIcon } from "./shared.jsx";

const card = { borderRadius: 14, border: "1px solid #D9C8EA", background: "rgba(255,255,255,.78)", boxShadow: "0 3px 10px rgba(151,112,173,.05)" };

function Tabs({ weekCardIndex, setWeekCardIndex }) {
  const tabs = [[0,"📅 Month"],[1,"🗓️ Week"],[2,"📆 Day"]];
  return <div role="tablist" aria-label="Calendar view" style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:4, padding:4, borderRadius:12, background:"#F0E4F7", marginBottom:9 }}>
    {tabs.map(([index,label]) => <button key={index} type="button" role="tab" aria-selected={weekCardIndex===index} onClick={()=>setWeekCardIndex(index)} style={{ minHeight:44, minWidth:0, padding:"7px 4px", borderRadius:9, border:weekCardIndex===index?"2px solid #9850BC":"1px solid transparent", background:weekCardIndex===index?"white":"transparent", color:weekCardIndex===index?"#633478":"#8C6B9E", fontWeight:900, fontSize:11, cursor:"pointer" }}>{label}</button>)}
  </div>;
}

function moodFor(date, dailyCheckInHistory, CHECKIN_MOODS) {
  const checkIn = dailyCheckInHistory.find((entry)=>entry.check_date===date) || null;
  const mood = CHECKIN_MOODS.find(([value])=>value===checkIn?.mood) || null;
  return { checkIn, mood, emoji:mood?.[1] || null, label:mood?.[2] || null };
}

function WeekPurpose(props) {
  const { offsetDate, taskIsScheduledForDate } = window.PlushLifeSchedule;
  const viewedWeekStart = offsetDate(props.period.weekStart, props.calendarWeekOffset * 7);
  const dates = Array.from({length:7},(_,i)=>offsetDate(viewedWeekStart,i));
  const pastDates = dates.filter((date)=>date<=props.period.date);
  const dayStats = pastDates.map((date)=>({ date, pct:props.dayCompletionPct(date), ...moodFor(date,props.dailyCheckInHistory,props.CHECKIN_MOODS) }));
  const scored = dayStats.filter((day)=>day.pct!=null);
  const average = scored.length ? Math.round(scored.reduce((sum,day)=>sum+day.pct,0)/scored.length) : null;
  const strongest = scored.slice().sort((a,b)=>b.pct-a.pct)[0] || null;
  const gentlest = scored.slice().sort((a,b)=>a.pct-b.pct)[0] || null;
  const careDays = scored.filter((day)=>day.pct>0).length;
  const moodCounts = new Map();
  dayStats.forEach((day)=>{ if(day.label) moodCounts.set(day.label,(moodCounts.get(day.label)||0)+1); });
  const commonMood = Array.from(moodCounts.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
  const intention = props.weeklyIntentionHistory.find((entry)=>entry.week_start===viewedWeekStart) || null;
  const isCurrentWeek = props.calendarWeekOffset===0;
  const isFutureWeek = viewedWeekStart>props.period.date;

  const recommendation = isFutureWeek
    ? "Keep the week roomy. Planned tasks are a map, not a contract."
    : gentlest && gentlest.pct < 40
      ? `Make ${new Date(`${gentlest.date}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"})} a little lighter next time. It was the week’s hardest starting point.`
      : strongest
        ? `Protect what worked on ${new Date(`${strongest.date}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"})}. One steady cue is more useful than adding more.`
        : "Keep the next week simple enough to begin.";

  return <>
    <section style={{...card,padding:"12px 13px"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
        <div><div style={{fontSize:10.5,letterSpacing:".13em",fontWeight:900,color:"#8E4EAA"}}>🗓️ WEEKLY REVIEW</div><div style={{marginTop:3,fontSize:10.4,color:"#8C6B9E"}}>See the rhythm, then choose one small adjustment.</div></div>
        <div style={{display:"flex",gap:5}}><button type="button" aria-label="Previous week" onClick={()=>props.setCalendarWeekOffset((v)=>v-1)}>←</button><button type="button" aria-label="Next week" onClick={()=>props.setCalendarWeekOffset((v)=>v+1)}>→</button></div>
      </div>
      <div style={{marginTop:8,fontSize:13,fontWeight:900,color:"#5B4B6B"}}>{isCurrentWeek?"This week":`${new Date(`${viewedWeekStart}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${new Date(`${offsetDate(viewedWeekStart,6)}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:4,marginTop:9}}>{dates.map((date)=>{
        const future=date>props.period.date; const pct=future?null:props.dayCompletionPct(date); const {emoji}=moodFor(date,props.dailyCheckInHistory,props.CHECKIN_MOODS); const selected=props.dayViewDate===date;
        return <button key={date} type="button" onClick={()=>{props.setDayViewDate(date);props.setSelectedProgressDate(date);props.setWeekCardIndex(2);}} style={{minHeight:54,padding:"5px 2px",borderRadius:9,border:selected?"2px solid #A65DC1":"1px solid #E8DDEC",background:future?"#FBF7FD":pct>=75?"#A65DC1":pct>=40?"#D7A2E3":"#F6EDF9",color:!future&&pct>=75?"white":"#6D5A7C",cursor:"pointer"}}><div style={{fontSize:8.8,fontWeight:900}}>{new Date(`${date}T12:00:00`).toLocaleDateString("en-US",{weekday:"short"}).slice(0,1)}</div><div style={{fontSize:12,fontWeight:900}}>{Number(date.slice(8,10))}</div><div style={{fontSize:9}}>{future?"plan":pct==null?"—":`${pct}%`} {emoji||""}</div></button>;
      })}</div>
    </section>

    {!isFutureWeek && <section style={{...card,marginTop:9,padding:"11px 12px",background:"linear-gradient(145deg,#F8F4FC,#FFFFFF)"}}>
      <div style={{fontSize:11.7,fontWeight:900,color:"#654A75"}}>✨ Week at a glance</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6,marginTop:8}}>
        <div style={{padding:8,borderRadius:10,background:"white",textAlign:"center"}}><strong style={{display:"block",fontSize:16,color:"#9850BC"}}>{average==null?"—":`${average}%`}</strong><span style={{fontSize:9.4,color:"#806B8D"}}>average</span></div>
        <div style={{padding:8,borderRadius:10,background:"white",textAlign:"center"}}><strong style={{display:"block",fontSize:16,color:"#318C79"}}>{careDays}</strong><span style={{fontSize:9.4,color:"#806B8D"}}>caring days</span></div>
        <div style={{padding:8,borderRadius:10,background:"white",textAlign:"center"}}><strong style={{display:"block",fontSize:13,color:"#C07A00"}}>{commonMood||"—"}</strong><span style={{fontSize:9.4,color:"#806B8D"}}>common feeling</span></div>
      </div>
      {strongest && <div style={{marginTop:8,fontSize:10.5,lineHeight:1.4,color:"#6D6075"}}>🌱 <strong>Strongest day:</strong> {new Date(`${strongest.date}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"})} at {strongest.pct}%.</div>}
      {gentlest && strongest?.date!==gentlest.date && <div style={{marginTop:4,fontSize:10.5,lineHeight:1.4,color:"#6D6075"}}>🪶 <strong>Harder day:</strong> {new Date(`${gentlest.date}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"})} at {gentlest.pct}%.</div>}
    </section>}

    <section style={{...card,marginTop:9,padding:"11px 12px",background:"linear-gradient(145deg,#F2FFF8,#FBFFFD)",borderColor:"#CFE8E1"}}>
      <div style={{fontSize:11.7,fontWeight:900,color:"#318C79"}}>🌱 One thing to carry forward</div><div style={{marginTop:5,fontSize:10.7,lineHeight:1.45,color:"#5E766F"}}>{recommendation}</div>
      {intention && <div style={{marginTop:8,paddingTop:7,borderTop:"1px solid #D8EEE5",fontSize:10.4,color:"#5E766F"}}>📝 <strong>Your intention:</strong> {intention.body}</div>}
    </section>
  </>;
}

function DayPurpose(props) {
  const { offsetDate, taskIsScheduledForDate, taskIsOptional } = window.PlushLifeSchedule;
  const date=props.dayViewDate; const future=date>props.period.date; const pct=future?null:props.dayCompletionPct(date); const {checkIn,mood,label:moodLabel,emoji}=moodFor(date,props.dailyCheckInHistory,props.CHECKIN_MOODS);
  const tasks=props.trackerTasks.filter((task)=>!task.archived_at&&taskIsScheduledForDate(task,date));
  const completed=props.longHistoryByDate.get(date)||new Set(); const isToday=date===props.period.date;
  const doneCount=tasks.filter((task)=>isToday?!!props.done[task.task_key]:completed.has(task.task_key)).length;
  const reflection=props.reflectionHistory.find((entry)=>entry.note_date===date)||null;
  const unfinished=!future&&!isToday?tasks.filter((task)=>!props.isTaskPausedOnDate(task,date)&&!completed.has(task.task_key)):[];
  const supports=[moodLabel?`${emoji||""} ${moodLabel}`:null,checkIn?.energy?`⚡ ${checkIn.energy} energy`:null,checkIn?.day_type?`🫶 ${checkIn.day_type} day`:null].filter(Boolean);
  return <>
    <section style={{...card,padding:"12px 13px"}}>
      <div style={{fontSize:10.5,letterSpacing:".13em",fontWeight:900,color:"#8E4EAA"}}>📆 DAY REPLAY</div><div style={{marginTop:3,fontSize:10.4,color:"#8C6B9E"}}>What happened that day — not just a percentage.</div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:9,flexWrap:"wrap"}}><button type="button" aria-label="Previous day" onClick={()=>{const d=offsetDate(date,-1);props.setDayViewDate(d);props.setSelectedProgressDate(d);}}>←</button><input type="date" value={date} onChange={(e)=>{const d=e.target.value||props.period.date;props.setDayViewDate(d);props.setSelectedProgressDate(d);}}/><button type="button" aria-label="Next day" onClick={()=>{const d=offsetDate(date,1);props.setDayViewDate(d);props.setSelectedProgressDate(d);}}>→</button>{date!==props.period.date&&<button type="button" onClick={()=>{props.setDayViewDate(props.period.date);props.setSelectedProgressDate(props.period.date);}}>Today</button>}</div>
      <div style={{marginTop:8,fontSize:13,fontWeight:900,color:"#5B4B6B"}}>{new Date(`${date}T12:00:00`).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6,marginTop:8}}><div style={{padding:8,borderRadius:10,background:"#FAF4FD",textAlign:"center"}}><strong style={{display:"block",fontSize:15,color:"#9850BC"}}>{future?"Plan":pct==null?"—":`${pct}%`}</strong><span style={{fontSize:9.2,color:"#806B8D"}}>completion</span></div><div style={{padding:8,borderRadius:10,background:"#F2FAFF",textAlign:"center"}}><strong style={{display:"block",fontSize:15,color:"#4C8FE8"}}>{doneCount}/{tasks.length}</strong><span style={{fontSize:9.2,color:"#806B8D"}}>tasks</span></div><div style={{padding:8,borderRadius:10,background:"#FFF9EA",textAlign:"center"}}><strong style={{display:"block",fontSize:15}}>{emoji||"—"}</strong><span style={{fontSize:9.2,color:"#806B8D"}}>check-in</span></div></div>
      {supports.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>{supports.map((item)=><span key={item} style={{padding:"4px 7px",borderRadius:999,background:"#F8F2FB",fontSize:9.6,color:"#765D84"}}>{item}</span>)}</div>}
    </section>

    {reflection && <button type="button" onClick={()=>props.setReflectionViewerDate(date)} style={{...card,marginTop:9,width:"100%",padding:"10px 11px",textAlign:"left",cursor:"pointer"}}><div style={{fontSize:10.8,fontWeight:900,color:"#8E4EAA"}}>📖 PlushJournal from this day</div><div style={{marginTop:4,fontSize:10.5,lineHeight:1.4,color:"#6D6075"}}>{reflection.body.length>150?`${reflection.body.slice(0,150).trim()}…`:reflection.body}</div></button>}

    <section style={{...card,marginTop:9,padding:"11px 12px"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong style={{fontSize:11.5,color:"#5B4B6B"}}>📋 What happened</strong><span style={{fontSize:9.7,color:"#8C6B9E"}}>{tasks.length} scheduled</span></div><div style={{display:"grid",gap:5,marginTop:8}}>{tasks.length?tasks.map((task)=>{const paused=props.isTaskPausedOnDate(task,date);const isDone=!future&&(isToday?!!props.done[task.task_key]:completed.has(task.task_key));const status=paused?"⏸ Paused":future?"Planned":isDone?"✓ Done":isToday?"Open":"Missed";return <label key={task.task_key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:9,background:"#FFFFFFAA",border:"1px solid #EADDE2",fontSize:10.7,color:"#5B4B6B"}}><span>{!future&&!paused&&<input type="checkbox" checked={isDone} onChange={()=>props.toggle(task.task_key,date)} style={{marginRight:6}}/>}<HabitTypeIcon task={task}/>{taskIsOptional(task)?"⭐ ":""}{task.task}</span><strong style={{fontSize:9.5,color:isDone?"#318C79":"#8C6B9E"}}>{status}</strong></label>;}) : <div style={{fontSize:10.5,color:"#8C6B9E"}}>Nothing scheduled for this day.</div>}</div>{unfinished.length>0&&<button type="button" onClick={()=>props.markPastTasksDone(date,unfinished.map((task)=>task.task_key))} style={{marginTop:8,width:"100%",minHeight:44,borderRadius:10,border:"1px solid #A9DCCD",background:"#F4FFF9",color:"#318C79",fontWeight:900}}>✓ Mark {unfinished.length} remaining as done</button>}</section>

    {!future && <section style={{...card,marginTop:9,padding:"11px 12px",background:"linear-gradient(145deg,#F2FFF8,#FBFFFD)",borderColor:"#CFE8E1"}}><div style={{fontSize:11.5,fontWeight:900,color:"#318C79"}}>🌱 What this day tells you</div><div style={{marginTop:5,fontSize:10.6,lineHeight:1.45,color:"#5E766F"}}>{pct==null?"There is not enough task data to read this day yet.":pct>=75?"This was a relatively steady day. Notice what made starting easier rather than adding more next time.":pct>=40?"Some care happened and some things stayed open. That middle ground is useful — look for the one task or cue that helped you get moving.":"This was a lighter day. Treat it as a clue about capacity, timing, or friction — not a failure to catch up from."}</div></section>}
  </>;
}

export function PurposeCalendarViews(props) {
  if (!props.open || props.weekCardIndex===0) return null;
  return <><button type="button" onClick={props.openTodayJournal} style={{width:"100%",marginBottom:9,minHeight:44,borderRadius:12,border:"1px solid #D9B8E8",background:"linear-gradient(135deg,#FBF3FE,#FFF9FD)",color:"#8E4EAA",fontWeight:900,cursor:"pointer"}}>📝 Open today&apos;s PlushJournal</button><Tabs weekCardIndex={props.weekCardIndex} setWeekCardIndex={props.setWeekCardIndex}/>{props.weekCardIndex===1?<WeekPurpose {...props}/>:<DayPurpose {...props}/>}</>;
}
