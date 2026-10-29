import { calendarOccurrences } from "../gentle-calendar.mjs";

const storeKey = "plushlife:device-calendar:v1";
function load() { try { const value = JSON.parse(localStorage.getItem(storeKey) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
const isoDate = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
function shift(date, days) { const copy = new Date(date+"T12:00:00"); copy.setDate(copy.getDate()+days); return isoDate(copy); }

export function GentleCalendar() {
  const [items,setItems] = React.useState(load);
  const [date,setDate] = React.useState(() => isoDate(new Date()));
  const [title,setTitle] = React.useState("");
  const [repeat,setRepeat] = React.useState("monthly");
  const [time,setTime] = React.useState("");
  const [view,setView] = React.useState("month");
  const [notice,setNotice] = React.useState("");
  const [done,setDone] = React.useState({});
  const selected = new Date(date+"T12:00:00");
  const first = view === "day" ? date : view === "week" ? shift(date,-selected.getDay()) : isoDate(new Date(selected.getFullYear(),selected.getMonth(),1));
  const last = view === "day" ? date : view === "week" ? shift(first,6) : isoDate(new Date(selected.getFullYear(),selected.getMonth()+1,0));
  const events = calendarOccurrences(items,first,last);
  const move = n => setDate(view === "day" ? shift(date,n) : view === "week" ? shift(date,n*7) : isoDate(new Date(selected.getFullYear(),selected.getMonth()+n,Math.min(selected.getDate(),28))));
  const save = () => {
    if (!title.trim()) { setNotice("Add a name for your reminder."); return; }
    const next = [...items,{ id: String(Date.now())+"-"+Math.random().toString(36).slice(2,7),title:title.trim().slice(0,120),date,repeat,time }];
    try { localStorage.setItem(storeKey,JSON.stringify(next)); setItems(next); setTitle(""); setNotice("Saved on this device. No notification has been scheduled."); }
    catch { setNotice("This device could not save the reminder."); }
  };
  const remove = id => {
    const next=items.filter(item=>item.id!==id);
    try { localStorage.setItem(storeKey,JSON.stringify(next)); setItems(next); setNotice("Reminder removed from this device."); }
    catch { setNotice("Unable to remove reminder."); }
  };
  return <section className="schedule-card" aria-label="Gentle recurring calendar" style={{display:"grid",gap:9}}>
    <strong style={{fontSize:17}}>📅 Gentle calendar</strong>
    <div className="schedule-helper">Keep track of bills, appointments and little routines. This version saves only on this device; it does not sync or send notifications.</div>
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
            <input type="checkbox" checked={Boolean(done[event.id+event.occurrence])} onChange={e=>setDone(old=>({...old,[event.id+event.occurrence]:e.target.checked}))} />
            <span style={{flex:1}}>{event.occurrence} · {event.title}{event.time?" · "+event.time:""} <small>({event.repeat})</small></span>
          </label>
          <button type="button" className="schedule-remove-link" onClick={()=>remove(event.id)} aria-label={"Remove all occurrences of "+event.title}>Remove series</button>
        </li>)}
      </ul>}
    <div style={{borderTop:"1px solid var(--pl-theme-line,#ddd)",paddingTop:9,display:"grid",gap:7}}>
      <strong style={{fontSize:12}}>Add a reminder</strong>
      <input aria-label="Reminder name" maxLength={120} placeholder="e.g. Pay rent" value={title} onChange={e=>setTitle(e.target.value)} />
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        <select aria-label="Repeat frequency" value={repeat} onChange={e=>setRepeat(e.target.value)} style={{flex:1,minHeight:44}}>
          <option value="once">One time</option><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option>
        </select>
        <input aria-label="Optional reminder time" type="time" value={time} onChange={e=>setTime(e.target.value)} style={{flex:1,minWidth:110}} />
      </div>
      <button type="button" className="schedule-btn primary" onClick={save}>Save calendar reminder</button>
      {notice&&<div role="status" className="schedule-helper">{notice}</div>}
      <div className="schedule-helper">Checking an item is a temporary visual marker, not a saved payment record. Mark bills paid in your billing provider too. Dates on the 29th–31st repeat on the last day of shorter months.</div>
    </div>
  </section>;
}
