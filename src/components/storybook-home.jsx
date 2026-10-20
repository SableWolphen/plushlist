import { useGuardianState } from "./plush-guardian.jsx";
import { ThemeScene, ThemeWorldContext } from "./theme-world.jsx";
import { buildCozyDayPlan, weeklyCozyStory } from "../cozy-day-plan.mjs";
import { themeAtmosphere } from "../theme-atmosphere.js";
import { HabitTypeIcon, habitTypeForRow } from "./shared.jsx";
import { HabitGoalCaption } from "./habit-studio.jsx";

export const STORYBOOK_MOODS = [
  ["happy","Happy","🥰"],["calm","Calm","😌"],["okay","Okay","🙂"],["tired","Tired","😴"],["stressed","Stressed","🥺"]
];
const THEME_COPY = {
  none:{tag:"",detail:"Your space, at your own pace.",ending:"A little care counts.",symbol:""},
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
export const storybookTheme = world => THEME_COPY[world] || THEME_COPY.none;
export function homeTaskPriority(row, nowMinutes = 12*60) {
  const task = row?.sourceTask || {};
  let score = task.essential || task.is_essential || task.essential_on_low_capacity ? 100 : 0;
  const clock = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(task.reminder_time || ""));
  if (clock) {
    const minutes = Number(clock[1])*60 + Number(clock[2]);
    const diff = minutes - nowMinutes;
    if (diff >= -120 && diff <= 120) score += 55 - Math.floor(Math.abs(diff) / 10);
  }
  const estimated = Number(task.estimated_minutes);
  if (Number.isFinite(estimated) && estimated > 0 && estimated <= 10) score += 8;
  if (habitTypeForRow(row) !== "regular") score += 3;
  return score;
}
export function storybookRows(rows=[],viewDone={},limit=3,nowMinutes = 12*60) {
  const active = rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at);
  const pending = active.filter(row=>!viewDone[row.key]);
  const pool = pending.length ? pending : active;
  return pool.map((row,index)=>({row,index,score:homeTaskPriority(row,nowMinutes)}))
    .sort((a,b)=>b.score-a.score || a.index-b.index)
    .slice(0,limit).map(({row})=>({key:row.key,label:String(row.label),done:!!viewDone[row.key],habitType:habitTypeForRow(row),sourceTask:row.sourceTask,goal:row.goal}));
}
export function storybookGreeting(hour = new Date().getHours()) {
  return hour < 12 ? "Good morning, Cozy!" : hour < 18 ? "Good afternoon, Cozy!" : "Good evening, Cozy!";
}
export function StorybookHome({userId,world="soft",rows=[],viewDone={},period,pct=0,toggle,openTaskManager,openDailyCheckIn,openTodayJournal,goToDashboard,setSettingsOpen,selectedOutfit,darkMode=false,syncStatus,online,tomorrowPreviewRows=[],tomorrowDateString="",dayType="full",weeklyHistory=[],dailyCheckInHistory=[]}) {
  const companion=useGuardianState(userId);
  const cardStyle=id=>({order:companion.home.order.indexOf(id)+1,display:companion.home.hidden.includes(id)?"none":undefined});
  const context=React.useContext(ThemeWorldContext);
  const nursery=world === "baby" || world === "baby-night";
  const caregiver=context.voice === "fatherly" ? "Daddy" : "Mommy";
  const copy=nursery ? {...storybookTheme(world),tag:caregiver+" Mode",detail:`${caregiver}’s here, ${caregiver === "Mommy" ? "sweetheart" : "kiddo"}. One little job at a time.`,ending:`${caregiver}’s proud of your little steps.`} : storybookTheme(world);
  const atmosphere=nursery ? {...themeAtmosphere(world),heading:`${caregiver}’s little plan`,hint:`We can do your little jobs together, ${caregiver === "Mommy" ? "sweetheart" : "kiddo"}.`} : themeAtmosphere(world);
  const now=new Date();
  const previewSize = dayType === "rest" ? 0 : dayType === "tiny" ? 1 : ["soft","recovery"].includes(dayType) ? 2 : 3;
  const visible=storybookRows(rows,viewDone,previewSize,now.getHours()*60+now.getMinutes());
  const weekStory=weeklyCozyStory({history:weeklyHistory,checkIns:dailyCheckInHistory,today:period?.date || ""});
  const hasWeeklyStory=weekStory && (weekStory.stepCount > 0 || weekStory.checkIns > 0);
  const completed=rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at && viewDone[row.key]).length;
  const total=rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at).length;
  const progress=total?Math.round(completed/total*100):0;
  const habitCount=rows.filter(row=>row && row.key && row.label && !row.isBonus && !row.sourceTask?.archived_at && habitTypeForRow(row)!=="regular").length;
  const dayLabel=period?.date && /^\d{4}-\d{2}-\d{2}$/.test(period.date)
    ? new Date(period.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})
    : "Today";
  const focus=()=>{
    try{sessionStorage.setItem("plushlife:focus-open:v1","1");}catch(_error){}
    window.dispatchEvent(new Event("plushlife:focus-one-step"));
  };
  return <div className={darkMode ? "pl-storybook pl-storybook-dark" : "pl-storybook"} data-storybook-world={world}>
    <header className="pl-storybook-banner">
      <div className="pl-storybook-brand"><span>PlushLife</span></div>
      <button type="button" className="pl-storybook-settings" aria-label="Open settings" onClick={()=>setSettingsOpen?.(true)}>⚙</button>
      {atmosphere.scene && <div className="pl-storybook-sky" aria-hidden="true"><img src={`./assets/worlds/${atmosphere.scene}.svg`} alt="" width="640" height="240" /></div>}
      <div className="pl-storybook-greeting">{copy.tag && <p className={nursery ? "pl-storybook-small pl-nursery-mode-label" : "pl-storybook-small"}>{copy.symbol} {copy.tag}</p>}<h1>{nursery ? storybookGreeting().replace("Cozy!",caregiver === "Mommy" ? "sweetheart!" : "kiddo!") : storybookGreeting()}</h1><p>{copy.detail}</p></div>
      <div className="pl-storybook-mascot" aria-label="Your original PlushLife teddy bear"><ThemeScene decorative focus outfit={selectedOutfit} /></div>
      {(online===false || syncStatus==="error" || syncStatus==="syncing") && <span className="pl-companion-sync" role="status">{online===false?"Offline · changes will sync later":syncStatus==="error"?"Sync needs attention":"Saving…"}</span>}
    </header>
    <section style={cardStyle("tasks")} className="pl-storybook-today" aria-label="Today's checklist">
      <div className="pl-storybook-topline"><span>TODAY</span><button type="button" onClick={()=>goToDashboard?.("week")} aria-label="Open calendar">{dayLabel} <span aria-hidden="true">▦</span></button></div>
      <div className="pl-storybook-intro"><div><h2>{dayType === "rest" ? "Today is for rest" : completed === total && total ? "Your little wins" : atmosphere.heading}</h2><p>{dayType === "rest" ? "Your tasks are safe. You can come back when you are ready." : dayType === "tiny" ? "One small step is enough for today." : ["soft","recovery"].includes(dayType) ? "Just two gentle steps to focus on." : total ? atmosphere.hint : "Your page is ready. Start with one little thing."}</p></div></div>
      <div className="pl-storybook-progress-label"><strong>{dayType === "rest" ? "Rest is a valid choice" : `${completed} / ${total} completed`}</strong><span>{dayType === "rest" ? "Rest Day" : total ? progress+"%" : "Fresh start"}</span></div>
      {total > 0 && completed === total && <div className="pl-storybook-world-win" role="status"><span aria-hidden="true">{atmosphere.check}</span> {atmosphere.celebrate || "Your little wins are worth celebrating."}</div>}
      {dayType !== "rest" && <div className="pl-storybook-progress" role="progressbar" aria-label="Today's tasks completed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:progress+"%"}} /></div>}
      {habitCount>0 && <button type="button" className="pl-storybook-habits-link" aria-label={`View ${habitCount} habits for today`} onClick={()=>openTaskManager?.(period?.date,"habits")}><span aria-hidden="true">🌱</span> {habitCount} {habitCount===1 ? "habit" : "habits"} in today’s list <span aria-hidden="true">›</span></button>}
      {visible.length ? <ul className="pl-storybook-list">{visible.map(row=><li key={row.key} data-habit-kind={row.habitType}><button className="pl-storybook-check" type="button" aria-label={(row.done?"Undo ":"Complete ")+row.label} aria-pressed={row.done} onClick={()=>toggle?.(row.key)}><span aria-hidden="true">{row.done?"✓":""}</span></button><span className="pl-storybook-task-copy"><HabitTypeIcon task={row.sourceTask} habitType={row.habitType}/><span className={row.done?"pl-storybook-complete":""}>{row.label}</span>{row.done && <span className="pl-storybook-world-motif" aria-hidden="true">{atmosphere.check}</span>}{row.habitType!=="regular" && <HabitGoalCaption taskKey={row.key} fallbackGoal={row.goal}/>}</span><button type="button" className="pl-storybook-detail" aria-label={"Edit "+row.label} onClick={()=>openTaskManager?.(period?.date)}>›</button></li>)}</ul> : dayType === "rest" ? <div className="pl-storybook-empty"><p>💜 Your little jobs can wait. Rest counts.</p></div> : <div className="pl-storybook-empty"><p>A fresh page, just for you. 🌷</p><button type="button" onClick={()=>openTaskManager?.(period?.date)}>＋ Add your first little task</button></div>}
      {dayType !== "rest" && total>visible.length&&<button type="button" className="pl-storybook-more" onClick={()=>openTaskManager?.(period?.date)}>See my full list · {total} {atmosphere.noun} ›</button>}
      {total > 0 && <button type="button" className="pl-storybook-add-task" onClick={()=>openTaskManager?.(period?.date)}>＋ Add a task</button>}
    </section>
    <nav style={cardStyle("shortcuts")} className="pl-storybook-doors" aria-label="Your everyday actions">
      <button type="button" className="pl-storybook-door pl-door-checkin" onClick={()=>openDailyCheckIn?.()}><span className="pl-storybook-door-emoji" aria-hidden="true">💗</span><strong>Check in</strong></button>
      <button type="button" className="pl-storybook-door pl-door-journal" onClick={()=>openTodayJournal?.()}><span className="pl-storybook-door-emoji" aria-hidden="true">📝</span><strong>Journal</strong></button>
      <button type="button" className="pl-storybook-door pl-door-guardian" onClick={()=>goToDashboard?.("guardian")}><span className="pl-storybook-door-emoji" aria-hidden="true">🧸</span><strong>Guardian</strong></button>
      <button type="button" className="pl-storybook-door pl-door-focus" onClick={focus}><span className="pl-storybook-door-emoji" aria-hidden="true">⏱</span><strong>Focus</strong></button>
    </nav>
    {world === "baby-night" && <button type="button" className="pl-storybook-bedtime" onClick={()=>goToDashboard?.("guardian")}>🌙 Ready for my bedtime routine? <span aria-hidden="true">›</span></button>}
    {(tomorrowPreviewRows.length > 0 || hasWeeklyStory) && <details className="pl-storybook-lookahead" style={{order:companion.home.order.length + 1}}>
      <summary>📅 Looking ahead <span>Tomorrow & my week</span></summary>
      {tomorrowPreviewRows.length > 0 && <section className="pl-storybook-tomorrow">
        <h3>Tomorrow's little plan</h3>
        <ul>{tomorrowPreviewRows.map(row=><li key={row.key}>{row.label}</li>)}</ul>
        <button type="button" onClick={()=>openTaskManager?.(tomorrowDateString)}>View tomorrow's tasks ›</button>
      </section>}
      {hasWeeklyStory && <section className="pl-storybook-week">
        <h3>📖 Our little week · {weekStory.caringDays} caring {weekStory.caringDays===1?"day":"days"}</h3>
        <div className="pl-storybook-week-body">
          <strong>{weekStory.heading}</strong>
          <p>{weekStory.line}</p>
          <button type="button" onClick={()=>goToDashboard?.("progress")}>See my progress & little wins ›</button>
        </div>
      </section>}
    </details>}

    <p style={cardStyle("kindness")} className="pl-storybook-kind-note">{copy.ending} ♡</p>
  </div>;
}
