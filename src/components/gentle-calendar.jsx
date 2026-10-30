import { calendarOccurrences, importantUpcoming, occurrenceKey, brainDumpLines, GENTLE_TEMPLATES } from "../gentle-calendar.mjs";

// Per-account device storage. Legacy unscoped keys are deliberately not imported:
 // their owner cannot be established safely on shared devices.
const keyFor = (userId,part) => `plushlife:gentle-calendar:v2:${userId}:${part}`;
function readScope(userId,part,fallback) { if (!userId) return fallback; try { const v=JSON.parse(localStorage.getItem(keyFor(userId,part))||"null"); return v!==null && typeof v==="object" && !Array.isArray(v) === !Array.isArray(fallback) ? v : fallback; } catch { return fallback; } }
function writeScope(userId,part,value) { if (!userId) throw Error("Sign in before changing calendar data."); localStorage.setItem(keyFor(userId,part),JSON.stringify(value)); }
const isoDate = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
function shift(date, days) { const copy = new Date(date+"T12:00:00"); copy.setDate(copy.getDate()+days); return isoDate(copy); }

export function GentleCalendar({ userId }) {
  const [items,setItems] = React.useState(() => readScope(userId,"items",[]));
  React.useEffect(()=>{setItems(readScope(userId,"items",[]));setDone(readScope(userId,"done",{}));setEditingId(null);setTitle("");setNotice("");},[userId]);
  const [date,setDate] = React.useState(() => isoDate(new Date()));
  const [title,setTitle] = React.useState("");
  const [editingId,setEditingId] = React.useState(null);
  const [repeat,setRepeat] = React.useState("monthly");
  const [time,setTime] = React.useState("");
  const [view,setView] = React.useState("month");
  const [notice,setNotice] = React.useState("");
  const [done,setDone] = React.useState(() => readScope(userId,"done",{}));
  const [dump,setDump] = React.useState("");
  const [category,setCategory] = React.useState("life");
  const [important,setImportant] = React.useState(false);
  const [focusMinutes,setFocusMinutes] = React.useState(5);
  const [focusActive,setFocusActive] = React.useState(false);
  const [now,setNow] = React.useState(() => Date.now());
  const [focusEnd,setFocusEnd] = React.useState(null);
  React.useEffect(() => { if (!focusActive) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [focusActive]);
  const secondsLeft = focusEnd === null ? 0 : Math.max(0,Math.ceil((focusEnd-now)/1000));
  const selected = new Date(date+"T12:00:00");
  const first = view === "day" ? date : view === "week" ? shift(date,-selected.getDay()) : isoDate(new Date(selected.getFullYear(),selected.getMonth(),1));
  const last = view === "day" ? date : view === "week" ? shift(first,6) : isoDate(new Date(selected.getFullYear(),selected.getMonth()+1,0));
  const events = calendarOccurrences(items,first,last);
  const upcoming = importantUpcoming(items,isoDate(new Date())).filter(item=>!done[occurrenceKey(item)]);
  const move = n => setDate(view === "day" ? shift(date,n) : view === "week" ? shift(date,n*7) : isoDate(new Date(selected.getFullYear(),selected.getMonth()+n,Math.min(selected.getDate(),28))));
  const save = () => {
    if (!title.trim()) { setNotice("Add a name for your reminder."); return; }
    const entry = { id: editingId || String(Date.now())+"-"+Math.random().toString(36).slice(2,7),title:title.trim().slice(0,120),date,repeat,time,category,important };
    const next = editingId ? items.map(item=>item.id===editingId?entry:item) : [...items,entry];
    try { writeScope(userId,"items",next); setItems(next); setTitle(""); setEditingId(null); setNotice("Saved on this device. No notification has been scheduled."); }
    catch { setNotice("This device could not save the reminder."); }
  };
  const edit = item => { setEditingId(item.id);setTitle(item.title);setDate(item.date);setRepeat(item.repeat);setTime(item.time||"");setCategory(item.category||"life");setImportant(Boolean(item.important));setNotice("Editing this series. Save to keep your changes."); };
  const toggleDone = (key,checked) => { const next={...done,[key]:checked}; try {writeScope(userId,"done",next);setDone(next);} catch {setNotice("Could not save completion on this device.");} };
  const saveBatch = values => { if(!values.length)return;const next=[...items,...values.map((name,i)=>({id:String(Date.now())+"-"+i,title:name,date,repeat:"once",time:"",category:"life",important:false}))];try{writeScope(userId,"items",next);setItems(next);setDump("");setNotice(`${values.length} gentle reminders added.`);}catch{setNotice("Could not save these reminders.");} };
  const remove = id => {
    const next=items.filter(item=>item.id!==id);
    try { writeScope(userId,"items",next); setItems(next); setNotice("Reminder removed from this device."); }
    catch { setNotice("Unable to remove reminder."); }
  };
  if (!userId) return <section className="schedule-card">Sign in to use your private calendar.</section>;
  return <section className="schedule-card" aria-label="Gentle recurring calendar" style={{display:"grid",gap:9}}>
    <strong style={{fontSize:17}}>📅 Gentle calendar</strong>
    <div className="schedule-helper">Keep track of bills, appointments and little routines. Reminders are private to this signed-in account on this device. Cloud syncing and notifications are not enabled yet.</div>
    {upcoming.length>0 && <details><summary style={{cursor:"pointer",minHeight:44,fontWeight:800}}>📌 Important dates coming up ({upcoming.length})</summary><ul style={{fontSize:12}}>{upcoming.slice(0,8).map(event=><li key={occurrenceKey(event)}>{event.occurrence}: {event.title}</li>)}</ul></details>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {["day","week","month"].map(mode=><button className="schedule-btn add" type="button" key={mode} aria-pressed={view===mode} style={view===mode?{background:"#EFE0F6",borderColor:"#AE7AC6"}:{}} onClick={()=>setView(mode)}>{mode[0].toUpperCase()+mode.slice(1)}</button>)}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <button type="button" className="schedule-btn add" onClick={()=>move(-1)} aria-label="Previous period">‹</button>
      <input type="date" value={date} onChange={event=>setDate(event.target.value)} aria-label="Calendar selected date" style={{flex:1,minWidth:0}} />
      <button type="button" className="schedule-btn add" onClick={()=>move(1)} aria-label="Next period">›</button>
    </div>
    <div style={{fontSize:12,fontWeight:800}}>{first} {first!==last?"– "+last:""}</div>
    {events.length===0?<div className="schedule-helper">Nothing scheduled here. A clear calendar is okay, too. 💜</div>:
      <ul style={{listStyle:"none",margin:0,padding:0,display:"grid",gap:6}}>
        {events.map(event=><li key={event.id+event.occurrence} style={{padding:9,border:"1px solid var(--pl-theme-line,#ddd)",borderRadius:10}}>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
            <input type="checkbox" checked={Boolean(done[occurrenceKey(event)])} onChange={e=>toggleDone(occurrenceKey(event),e.target.checked)} />
            <span style={{flex:1}}>{event.occurrence} · {event.title}{event.time?" · "+event.time:""} <small>({event.repeat})</small></span>
          </label>
          <button type="button" className="schedule-btn add" onClick={()=>edit(event)} aria-label={"Edit series "+event.title}>Edit series</button>
          <button type="button" className="schedule-remove-link" onClick={()=>remove(event.id)} aria-label={"Remove all occurrences of "+event.title}>Remove series</button>
        </li>)}
      </ul>}
    <div style={{borderTop:"1px solid var(--pl-theme-line,#ddd)",paddingTop:9,display:"grid",gap:7}}>
      <strong style={{fontSize:12}}>{editingId?"Edit recurring reminder":"Add a reminder"}</strong>
      <input aria-label="Reminder name" maxLength={120} placeholder="e.g. Pay rent" value={title} onChange={e=>setTitle(e.target.value)} />
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        <select aria-label="Repeat frequency" value={repeat} onChange={e=>setRepeat(e.target.value)} style={{flex:1,minHeight:44}}>
          <option value="once">One time</option><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option>
        </select>
        <input aria-label="Optional reminder time" type="time" value={time} onChange={e=>setTime(e.target.value)} style={{flex:1,minWidth:110}} />
      </div>
      <select aria-label="Reminder category" value={category} onChange={e=>setCategory(e.target.value)} style={{minHeight:44}}><option value="life">Life</option><option value="bill">Bill or deadline</option><option value="home">Home</option><option value="care">Self care</option><option value="leaving">Leaving home</option></select>
      <label style={{fontSize:12}}><input type="checkbox" checked={important} onChange={e=>setImportant(e.target.checked)} /> Important deadline — keep visible</label>
      <button type="button" className="schedule-btn primary" onClick={save}>{editingId?"Save series changes":"Save calendar reminder"}</button>
      {editingId&&<button type="button" className="schedule-btn add" onClick={()=>{setEditingId(null);setTitle("");setNotice("Editing canceled.");}}>Cancel editing</button>}
      {notice&&<div role="status" className="schedule-helper">{notice}</div>}
      <div className="schedule-helper">Completion markers now persist on this device, but they do not verify a payment. Check with your bill provider. Dates on the 29th–31st repeat on the last day of shorter months.</div>
    </div>
    <details><summary style={{minHeight:44,cursor:"pointer",fontWeight:850}}>🧠 Brain dump — get it out of your head</summary>
      <p className="schedule-helper">Write one idea per line. Review before adding; no automatic changes.</p>
      <textarea aria-label="Brain dump" rows={4} value={dump} onChange={e=>setDump(e.target.value)} placeholder={"Call dentist\nWash dishes\nBuy dog food"} style={{width:"100%",padding:10,borderRadius:10}} />
      <div className="schedule-helper">{brainDumpLines(dump).length} items ready</div>
      <button type="button" className="schedule-btn primary" disabled={!brainDumpLines(dump).length} onClick={()=>saveBatch(brainDumpLines(dump))}>Add these to selected day</button>
    </details>
    <details><summary style={{minHeight:44,cursor:"pointer",fontWeight:850}}>✨ Quick routine templates</summary>
      <div style={{display:"grid",gap:6}}>{GENTLE_TEMPLATES.map(template=><button key={template.title} type="button" className="schedule-btn add" onClick={()=>{const next=[...items,{...template,id:String(Date.now())+"-"+Math.random().toString(36).slice(2,6),date,time:""}];try{writeScope(userId,"items",next);setItems(next);setNotice("Template added — edit or remove whenever you like.");}catch{setNotice("Could not save template.");}}}>＋ {template.title} · {template.repeat}</button>)}</div>
    </details>
    <details><summary style={{minHeight:44,cursor:"pointer",fontWeight:850}}>🧸 Focus buddy</summary>
      <p className="schedule-helper">A quiet visual countdown that runs while this screen is open. It never tracks productivity or starts a background service.</p>
      <select aria-label="Focus duration" value={focusMinutes} onChange={e=>setFocusMinutes(Number(e.target.value))} disabled={focusActive}><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={25}>25 minutes</option></select>
      <button type="button" className="schedule-btn primary" onClick={()=>{if(focusActive){setFocusActive(false);setFocusEnd(null);}else{setNow(Date.now());setFocusEnd(Date.now()+focusMinutes*60000);setFocusActive(true);}}}>{focusActive?"End focus session":"Start a gentle focus moment"}</button>
      {focusActive&&<p role="timer" aria-live="off" style={{fontWeight:800}}>🧸 {Math.floor(secondsLeft/60)}:{String(secondsLeft%60).padStart(2,"0")} remaining. You can stop whenever you need. 💜</p>}
      {focusActive && secondsLeft===0 && <p role="status">Your focus moment is complete. Even trying counts!</p>}
    </details>
  </section>;
}
