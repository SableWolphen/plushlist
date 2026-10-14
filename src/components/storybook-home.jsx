import { ThemeScene } from "./theme-world.jsx";
import { buildCozyDayPlan } from "../cozy-day-plan.mjs";

export const STORYBOOK_MOODS = [
  ["happy","Happy","🥰"],["calm","Calm","😌"],["okay","Okay","🙂"],["tired","Tired","😴"],["stressed","Stressed","🥺"]
];
const THEME_COPY = {
  baby:{tag:"Nursery",greeting:"A softer, brighter day awaits",detail:"One little step at a time. Your plush is cheering for you.",ending:"Little things deserve big hugs.",symbol:"🍼"},
  "baby-night":{tag:"Nursery",greeting:"A softer, brighter day awaits",detail:"One little step at a time. Your plush is cheering for you.",ending:"Little things deserve big hugs.",symbol:"🌙"},
  dino:{tag:"Dino adventure",greeting:"Small steps, big adventures",detail:"One little stomp at a time. Your plush is exploring with you.",ending:"Every little stomp counts.",symbol:"🦕"},
  soft:{tag:"Lavender",greeting:"A kinder, brighter you",detail:"Your little steps make room for a softer tomorrow.",ending:"Even quiet progress counts.",symbol:"💜"},
  meadow:{tag:"Mint",greeting:"You're doing great!",detail:"A fresh and cozy day, at your own pace.",ending:"You're enough, just as you are.",symbol:"🌿"},
  strawberry:{tag:"Strawberry",greeting:"A sweeter, brighter day",detail:"Every tiny win is worth celebrating.",ending:"Small steps lead to lovely days.",symbol:"🍓"},
  twilight:{tag:"Cozy night",greeting:"You made it through today",detail:"Rest counts too. You don't have to finish everything.",ending:"You did enough for today.",symbol:"🌙"},
  pink:{tag:"Pink petals",greeting:"A little kindness blooms",detail:"Grow gently and celebrate the little things.",ending:"You deserve kindness, too.",symbol:"🌸"},
  peach:{tag:"Peach",greeting:"A warm little moment",detail:"Take things in your own sweet time.",ending:"Little moments add up.",symbol:"🍑"},
  "soft-light":{tag:"Cloud",greeting:"A little breathing room",detail:"Your cozy corner is waiting.",ending:"Gentle progress is still progress.",symbol:"☁️"},
  garden:{tag:"Garden",greeting:"Give yourself room to grow",detail:"One little seed of progress today.",ending:"You're growing at your own pace.",symbol:"🌱"}
};
export const storybookTheme = world => THEME_COPY[world] || THEME_COPY.soft;
export function storybookRows(rows=[],viewDone={},limit=3) {
  const active = rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at);
  const pending = active.filter(row=>!viewDone[row.key]);
  return (pending.length ? pending : active)
    .slice(0,limit).map(row=>({key:row.key,label:String(row.label),done:!!viewDone[row.key]}));
}
export function storybookGreeting(hour = new Date().getHours()) {
  return hour < 12 ? "Good morning, Cozy!" : hour < 18 ? "Good afternoon, Cozy!" : "Good evening, Cozy!";
}
export function StorybookHome({world="soft",rows=[],viewDone={},period,pct=0,toggle,openTaskManager,openDailyCheckIn,openTodayJournal,goToDashboard,setSettingsOpen,selectedOutfit,darkMode=false}) {
  const copy=storybookTheme(world);
  const visible=storybookRows(rows,viewDone);
  const completed=rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at && viewDone[row.key]).length;
  const total=rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at).length;
  const progress=total?Math.round(completed/total*100):0;
  const dayLabel=period?.date && /^\d{4}-\d{2}-\d{2}$/.test(period.date)
    ? new Date(period.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})
    : "Today";
  const focus=()=>{
    try{sessionStorage.setItem("plushlife:focus-open:v1","1");}catch(_error){}
    window.dispatchEvent(new Event("plushlife:focus-one-step"));
  };
  return <div className={darkMode ? "pl-storybook pl-storybook-dark" : "pl-storybook"} data-storybook-world={world}>
    <header className="pl-storybook-banner">
      <div className="pl-storybook-brand"><span aria-hidden="true" className="pl-storybook-brand-bear">🧸</span><span>PlushLife</span></div>
      <button type="button" className="pl-storybook-settings" aria-label="Open settings" onClick={()=>setSettingsOpen?.(true)}>⚙</button>
      <div className="pl-storybook-sky" aria-hidden="true"><span className="pl-storybook-moon">☾</span><span className="pl-storybook-star">✦</span><span className="pl-storybook-cloud">☁</span></div>
      <div className="pl-storybook-greeting"><p className="pl-storybook-small">{copy.symbol} {copy.tag}</p><h1>{storybookGreeting()}</h1><p>{copy.detail}</p></div>
      <div className="pl-storybook-mascot" aria-label="Your original PlushLife teddy bear"><ThemeScene decorative focus outfit={selectedOutfit} /></div>
    </header>
    <section className="pl-storybook-today" aria-label="Today's checklist">
      <div className="pl-storybook-topline"><span>TODAY</span><button type="button" onClick={()=>goToDashboard?.("week")} aria-label="Open calendar">{dayLabel} <span aria-hidden="true">▦</span></button></div>
      <div className="pl-storybook-intro"><div><h2>{completed === total && total ? "Your little wins" : "One little thing at a time"}</h2><p>{total ? "Go at your own pace." : "Your page is ready. Start with one little thing."}</p></div></div>
      <div className="pl-storybook-progress-label"><strong>{completed} / {total} completed</strong><span>{total ? progress+"%" : "Fresh start"}</span></div>
      <div className="pl-storybook-progress" role="progressbar" aria-label="Today's tasks completed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:progress+"%"}} /></div>
      {visible.length ? <ul className="pl-storybook-list">{visible.map(row=><li key={row.key}><button className="pl-storybook-check" type="button" aria-label={(row.done?"Undo ":"Complete ")+row.label} aria-pressed={row.done} onClick={()=>toggle?.(row.key)}><span aria-hidden="true">{row.done?"✓":""}</span></button><span className={row.done?"pl-storybook-complete":""}>{row.label}</span><button type="button" className="pl-storybook-detail" aria-label={"Edit "+row.label} onClick={()=>openTaskManager?.(period?.date)}>›</button></li>)}</ul> : <div className="pl-storybook-empty"><p>A fresh page, just for you. 🌷</p><button type="button" onClick={()=>openTaskManager?.(period?.date)}>＋ Add your first little task</button></div>}
      {total>visible.length&&<button type="button" className="pl-storybook-more" onClick={()=>openTaskManager?.(period?.date)}>View all {total} tasks ›</button>}
    </section>
    <nav className="pl-storybook-doors" aria-label="Your cozy shortcuts">
      <button type="button" className="pl-storybook-door pl-door-checkin" onClick={()=>openDailyCheckIn?.()}><span className="pl-storybook-door-emoji" aria-hidden="true">♡</span><strong>Check In</strong></button>
      <button type="button" className="pl-storybook-door pl-door-journal" onClick={()=>openTodayJournal?.()}><span className="pl-storybook-door-emoji" aria-hidden="true">📖</span><strong>Journal</strong></button>
      <button type="button" className="pl-storybook-door pl-door-focus" onClick={focus}><span className="pl-storybook-door-emoji" aria-hidden="true">🌙</span><strong>Focus</strong></button>
    </nav>
    <details className="pl-storybook-moods"><summary>How are you feeling?</summary><div className="pl-storybook-mood-head"><div><p>A little room to check in.</p></div><button type="button" onClick={()=>goToDashboard?.("care")}>My Care ›</button></div>
      <div className="pl-storybook-mood-grid">{STORYBOOK_MOODS.map(([id,label,emoji])=><button type="button" key={id} onClick={()=>openDailyCheckIn?.()} aria-label={"Check in feeling "+label}><span className="pl-storybook-face" aria-hidden="true">{emoji}</span><span>{label}</span></button>)}</div>
      <p className="pl-storybook-mood-help">Tap a feeling to open your private check-in.</p>
    </details>
    <p className="pl-storybook-kind-note">{copy.ending} ♡</p>
  </div>;
}
