import { chooseRescueMode, searchPrivateEveryday, buildLittleWins, shouldReviewQuickSchedule } from "../everyday-upgrades.mjs";
import { companionAccountKey } from "../companion-account-storage.mjs";
import { QuickCapture } from "./quick-capture.jsx";

const surface = { background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line)", borderRadius: 16, color: "var(--pl-theme-ink)" };
const button = { background: "var(--pl-theme-surface-2)", border: "1px solid var(--pl-theme-line)", color: "var(--pl-theme-ink)", minHeight: 44, borderRadius: 12, padding: "8px 12px", font: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" };

export function DayRescue({ currentMode = "full", onSelect, openTaskManager }) {
  const [expanded, setExpanded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [previous, setPrevious] = React.useState(null);
  const choose = async (mode, restoring = false) => {
    const option = chooseRescueMode(mode);
    if (!option || busy || typeof onSelect !== "function") return;
    setBusy(true); setMessage("");
    const old = currentMode || "full";
    try {
      const saved = await onSelect(mode);
      if (saved === false) { setMessage("Couldn’t save this change. Your previous day plan is still here."); return; }
      setPrevious(restoring ? null : old);
      setMessage(option.message);
      setExpanded(false);
    } catch (_error) {
      setMessage("Couldn't change your day just now. Please try again.");
    } finally { setBusy(false); }
  };
  return <section style={{ ...surface, padding: "11px 13px", marginTop: 9 }} aria-label="Make today easier">
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} style={{ ...button, width: "100%", textAlign: "left", display: "flex", gap: 8, alignItems: "center" }}>
      <span aria-hidden="true">🌷</span><span style={{ flex: 1 }}>Make today easier</span><span aria-hidden="true">{expanded ? "▾" : "›"}</span>
    </button>
    {expanded && <div style={{ paddingTop: 9, display: "grid", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--pl-theme-muted)" }}>Change today's pace without deleting tasks, checkmarks, or history. Your normal list stays available.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
        {[["soft","🌿","Soft"],["tiny","✨","Tiny"],["rest","🛌","Rest"]].map(([id,icon,label])=>
          <button type="button" key={id} disabled={busy} aria-pressed={currentMode === id} onClick={() => choose(id)} style={{...button, minWidth:0, padding:8, borderWidth: currentMode === id ? 2 : 1 }}>{icon}<span style={{display:"block"}}>{label}</span></button>)}
      </div>
      <button type="button" onClick={() => { setExpanded(false); openTaskManager?.(); }} style={button}>Move or edit individual tasks →</button>
      {currentMode !== "full" && <button type="button" disabled={busy} onClick={() => choose("full")} style={button}>Return to my usual day</button>}
    </div>}
    {message && <div role="status" style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.4 }}>{message}
      {previous && previous !== currentMode && <button type="button" disabled={busy} onClick={() => {const mode = previous;setPrevious(null);choose(mode, true);}} style={{...button,marginLeft:8,minHeight:32}}>Undo</button>}
    </div>}
  </section>;
}

export function EverydayActions({ userId, client, tasks = [], schedules = [], onQuickAdd, quickAddMessage,
  onMoreOptions, onOpenTask, onOpenSchedule, onOpenNote, onOpenProgress, onOpenGuardian, onReviewScheduledTask }) {
  const [panel, setPanel] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [notes, setNotes] = React.useState([]);
  const [loadState, setLoadState] = React.useState("");
  React.useEffect(() => {
    if (panel !== "search" || !userId || !client) return;
    let active = true;
    setLoadState("loading"); setNotes([]);
    client.from("private_notes").select("note_date, body, prompt").eq("user_id", userId)
      .order("note_date", { ascending: false }).limit(90)
      .then(({ data, error }) => {
        if (!active) return;
        setNotes(!error && Array.isArray(data) ? data : []);
        setLoadState(error ? "error" : "ready");
      }).catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, [panel, userId, client]);
  React.useEffect(() => { setPanel(""); setQuery(""); setNotes([]); }, [userId]);
  const results = searchPrivateEveryday({ query, tasks, schedules, notes });
  const fastAdd = (name, when) => {
    if (shouldReviewQuickSchedule(name) && onReviewScheduledTask) { onReviewScheduledTask(name); return false; }
    return onQuickAdd?.(name, when);
  };
  const choose = result => {
    setPanel(""); setQuery("");
    if (result.type === "task") onOpenTask?.(result.source);
    else if (result.type === "schedule") onOpenSchedule?.(result.source);
    else if (result.type === "journal") onOpenNote?.(result.source);
  };
  return <div style={{ margin: "2px 0 12px", minWidth: 0 }}>
    <div role="group" aria-label="Find or add quickly" style={{display:"flex",gap:8}}>
      <button type="button" aria-expanded={panel === "quick"} onClick={()=>setPanel(v=>v==="quick"?"":"quick")} style={{...button, flex:1}}>＋ Quick add</button>
      <button type="button" aria-expanded={panel === "search"} onClick={()=>setPanel(v=>v==="search"?"":"search")} style={{...button, flex:1}}>⌕ Find anything</button>
    </div>
    {panel === "quick" && <div style={{ marginTop: 9 }}>
      <QuickCapture onQuickAdd={fastAdd} quickAddMessage={quickAddMessage} onMoreOptions={draft=>{setPanel("");onMoreOptions?.(draft);}} />
      <p style={{margin:"4px 2px",fontSize:12,color:"var(--pl-theme-muted)"}}>For repeating tasks and exact reminder times, use More options to review the schedule before saving.</p>
    </div>}
    {panel === "search" && <div style={{ ...surface, padding: 12, marginTop: 9 }}>
      <label htmlFor="pl-everyday-search" style={{fontSize:13,fontWeight:850}}>Search your private PlushLife</label>
      <input id="pl-everyday-search" autoFocus value={query} onChange={event=>setQuery(event.target.value)} type="search" placeholder="Tasks, schedules, journal entries…" style={{display:"block",width:"100%",minWidth:0,boxSizing:"border-box",fontSize:16,padding:10,borderRadius:10,background:"var(--pl-theme-surface-2)",color:"var(--pl-theme-ink)",border:"1px solid var(--pl-theme-line)",marginTop:8}} />
      <p style={{margin:"6px 0",fontSize:11.5,color:"var(--pl-theme-muted)"}}>Search happens on your device. Journal entries load only while this panel is open.</p>
      {loadState === "error" && <p role="status" style={{fontSize:12}}>Couldn't load journals. Tasks and schedules remain searchable.</p>}
      {query.trim().length >= 2 ? <div style={{display:"grid",gap:6,maxHeight:320,overflowY:"auto",marginTop:8}}>
        {results.slice(0,12).map(result => <button key={result.id} type="button" onClick={()=>choose(result)} style={{...button,textAlign:"left",minWidth:0,overflowWrap:"anywhere"}}>
          <span style={{fontSize:11,color:"var(--pl-theme-muted)"}}>{result.type==="task"?"✓ Task":result.type==="schedule"?"📅 Schedule":"📝 Journal"} · {result.hint}</span>
          <span style={{display:"block",fontSize:14,marginTop:3}}>{result.title}</span>
        </button>)}
        {!results.length && <p role="status" style={{fontSize:13,color:"var(--pl-theme-muted)"}}>{loadState==="loading"?"Looking through your journal…":"No matches yet."}</p>}
      </div> : <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:8}}>
        <button type="button" style={button} onClick={()=>{setPanel("");onOpenProgress?.();}}>📊 Progress</button>
        <button type="button" style={button} onClick={()=>{setPanel("");onOpenGuardian?.();}}>💛 Guardian</button>
        <button type="button" style={button} onClick={()=>{setPanel("");onOpenSchedule?.();}}>📅 Calendar</button>
      </div>}
      <button type="button" onClick={()=>setPanel("")} style={{...button,width:"100%",marginTop:10}}>Close search</button>
    </div>}
  </div>;
}

function savedLittleWins(key) {
  if (!key) return [];
  try { const result = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(result) ? result.slice(0, 25) : []; }
  catch (_error) { return []; }
}
export function LittleWins({ userId, period, history = [], checkIns = [] }) {
  const key = companionAccountKey("plushlife:little-wins:v1", userId);
  const [notes, setNotes] = React.useState(() => savedLittleWins(key));
  const [text, setText] = React.useState("");
  const [message, setMessage] = React.useState("");
  React.useEffect(() => { setNotes(savedLittleWins(key));setText("");setMessage(""); }, [key]);
  const snapshots = buildLittleWins({history,checkIns,today:period?.date || ""});
  const persist = items => {
    if (!key) { setMessage("Sign in to save your private wins."); return false; }
    try { localStorage.setItem(key, JSON.stringify(items));setNotes(items);setMessage("Saved on this device 💜");return true; }
    catch (_error) { setMessage("Couldn't save on this device; your text is still here.");return false; }
  };
  const save = () => {
    const value = text.trim();if (!value) return;
    const entry = {id: Date.now().toString(36),date:period?.date || "",text:value.slice(0,240)};
    if (persist([entry,...notes].slice(0,25))) setText("");
  };
  return <details style={{...surface, padding: "12px 14px", marginBottom: 12}}>
    <summary style={{cursor:"pointer",fontWeight:900,minHeight:42,alignContent:"center"}}>🌟 My Little Wins <span style={{fontSize:12,color:"var(--pl-theme-muted)"}}>· private scrapbook</span></summary>
    <div style={{display:"grid",gap:9,paddingTop:8}}>
      <p style={{fontSize:13,lineHeight:1.5,margin:0,color:"var(--pl-theme-muted)"}}>The little steps you took are worth remembering. Finished tasks and check-ins appear automatically; personal memories stay on this device.</p>
      {snapshots.length ? snapshots.slice(0,5).map(item=><div key={item.date} style={{...surface,padding:"10px 12px",background:"var(--pl-theme-surface-2)"}}>
        <strong style={{display:"block",fontSize:13}}>✨ {item.title}</strong><span style={{fontSize:11.5,color:"var(--pl-theme-muted)"}}>{item.date} · {item.description}</span>
      </div>) : <p style={{fontSize:13,margin:0}}>Your first little win will appear here after a check-in or completed task.</p>}
      <label htmlFor="pl-win-note" style={{fontSize:13,fontWeight:800}}>Something else that counted</label>
      <textarea id="pl-win-note" value={text} onChange={event=>setText(event.target.value)} maxLength={240} rows={2} placeholder="One thing I’m glad I did…" style={{background:"var(--pl-theme-surface-2)",color:"var(--pl-theme-ink)",border:"1px solid var(--pl-theme-line)",borderRadius:11,padding:10,width:"100%",boxSizing:"border-box",font:"inherit",fontSize:14}}/>
      <button type="button" disabled={!text.trim()} onClick={save} style={button}>Save my little win</button>
      {notes.map(item=><div key={item.id} style={{...surface,padding:11,display:"flex",gap:9,alignItems:"start"}}>
        <div style={{flex:1,minWidth:0,overflowWrap:"anywhere",fontSize:13}}>💜 {item.text}<div style={{fontSize:11,color:"var(--pl-theme-muted)",marginTop:3}}>{item.date}</div></div>
        <button type="button" onClick={()=>persist(notes.filter(note=>note.id!==item.id))} aria-label="Remove little win" style={{...button,minHeight:35,padding:"5px 9px"}}>Remove</button>
      </div>)}
      {message && <p role="status" style={{margin:0,fontSize:12}}>{message}</p>}
    </div>
  </details>;
}
