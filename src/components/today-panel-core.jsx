import { HabitGoalCaption } from "./habit-studio.jsx";
import { nextCompanionReward } from "../companion-experience.js";
import { CozyComfortContext } from "./cozy-space.jsx";
import { upcomingSchedule } from "../home-agenda.js";
import { RewardMoment } from "./reward-moment.jsx";
import { normalizeHomeLayout, homeDisplayGroups } from "../home-layout.js";
import { ThemeScene, DesignIcon, useThemeCopy, ThemeWorldContext } from "./theme-world.jsx";
import { HabitTypeIcon } from "./shared.jsx";
import { CalmPanel } from "./info-panels.jsx";
import { PlushMascot } from "./mascot.jsx";
import { CompletedTaskArea, useCompletedTaskFlow } from "./completed-task-flow.jsx";
import { startFocusTimer } from "./focus-timer.jsx";

/*
 * Reference-home compatibility markers kept deliberately:
 * data-plushlife-home-schedule-preview="true"
 * arrangeTodayTasks
 * setTaskListCollapsed(true); setArrangeTodayTasks(false)
 * minHeight: 48, display: "flex"
 * width: 38, height: 44, minHeight: 44
 * textOverflow: "ellipsis"
 * whiteSpace: "nowrap"
 * No catching up. We're only looking at today.
 * Resume normally
 * Essentials only
 * Lighter routine
 * required task${pendingCount === 1 ? "" : "s"} still waiting
 * optional bonus {bonusPendingCount === 1 ? "task" : "tasks"} available
 * {babyMode ? "🧸 Little Jobs" : "✓ Tasks"}
 * data-plushlife-task-drag-scope
 * aria-label={`Move ${header} group earlier`}
 */

const C = {
  ink: "var(--pl-theme-ink)",
  body: "var(--pl-theme-ink)",
  purple: "var(--pl-theme-accent)",
  purple2: "#D879DE",
  line: "var(--pl-theme-line)",
  line2: "var(--pl-theme-line)",
  card: "var(--pl-theme-surface)",
};

const card = {
  borderRadius: 26,
  border: "1px solid var(--pl-theme-line)",
  background: C.card,
  boxShadow: "0 10px 24px rgba(20,14,26,.10)",
  backdropFilter: "blur(14px)",
};

function formatDate(date) {
  try {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
    });
  } catch (_error) { return ""; }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Hero({ returning, onSofterDay, period, goToDashboard, setSettingsOpen, reducedMotion, selectedOutfit, activityDaysTotal, darkMode, appearanceTheme, dinoTheme, babyMode }) {
  const copy = useThemeCopy();
  const companion = React.useContext(ThemeWorldContext);
  const cozy = React.useContext(CozyComfortContext);
  const petName = cozy?.profile?.pet_name || "Your plush";
  const personName = String(cozy?.profile?.fields?.nickname || "").trim() || "Cozy";
  const comfort = cozy?.profile?.fields?.comfort_item;
  const evening = new Date().getHours() >= 20 || new Date().getHours() < 5;
  const nextReward = companion.rewardProgress ? nextCompanionReward(window.PlushLifeContent.MASCOT_OUTFITS, companion.unlockedIds, companion.rewardProgress) : null;
  // The living mascot reacts to task completions: the completed-task flow
  // dispatches plushlife:task-completion-feedback on window, and the mascot
  // celebrates (happy face + bounce) for the same 2.2s as the gentle glow.
  const [mascotCelebrating, setMascotCelebrating] = React.useState(false);
  const [mascotMessage, setMascotMessage] = React.useState("");
  const celebrateTimer = React.useRef(null);
  const lastOutfit = React.useRef(selectedOutfit?.id);
  const reactToCozy = (message) => {
    setMascotCelebrating(true);
    setMascotMessage(message);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    celebrateTimer.current = window.setTimeout(() => { setMascotCelebrating(false); setMascotMessage(""); }, 2200);
  };
  React.useEffect(() => {
    if (selectedOutfit?.id && selectedOutfit.id !== lastOutfit.current) reactToCozy("Fresh fit. Looking cozy! ✨");
    lastOutfit.current = selectedOutfit?.id;
  }, [selectedOutfit?.id]);
  React.useEffect(() => {
    const onCompletion = (event) => {
      if (event.detail?.completed === false) return;
      reactToCozy("Tiny win. Big happy dance! ✨");
    };
    window.addEventListener("plushlife:task-completion-feedback", onCompletion);
    return () => {
      window.removeEventListener("plushlife:task-completion-feedback", onCompletion);
      if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    };
  }, []);

  return (
    <>
      <header className="pl-page-heading pl-home-today-row">
        <h1>Today</h1>
        <div className="pl-home-today-actions">
          <button type="button" className="pl-heading-date" onClick={() => goToDashboard?.("week")} aria-label="Open Calendar"><span aria-hidden="true">📅</span> Calendar · {formatDate(period?.date)}</button>
          <button type="button" className="pl-heading-gear" onClick={() => setSettingsOpen?.(true)} aria-label="Settings"><DesignIcon name="gear" /></button>
        </div>
      </header>
      <section className="pl-home-hero" aria-label="PlushLife welcome">
        <button type="button" className={`pl-mascot-pat ${mascotCelebrating && !reducedMotion ? "pl-mascot-happy-hop" : ""}`} onClick={() => reactToCozy(cozy?.profile?.pet_name ? `${petName} is happy you’re here, ${personName}! 💜` : `Happy you’re here, ${personName}! 💜`)} aria-label="Say hi to your plush" title="Tap to say hi">
          <span className={!mascotCelebrating && !reducedMotion ? "pl-companion-idle" : ""}><ThemeScene outfit={selectedOutfit} focus mood={mascotCelebrating ? "happy" : "neutral"} /></span>
        </button>
        <div className="pl-companion-copy">
        <h2>{mascotMessage || (returning ? `Welcome back, ${personName}.` : (copy["A little counts."] || `Happy you’re here, ${personName}! 💜`).replace(/\bCozy\b/g, personName))}</h2>
        <p>{returning ? "Good to see you. One tiny thing is plenty." : evening ? `${petName} is winding down with you.` : cozy?.profile?.pet_name ? `${petName} is happy you’re here.` : copy["Your plush is happy you\'re here."] || "Your plush is happy you\'re here."}</p>
        {comfort && <small className="pl-companion-comfort" title={comfort}>Keep {comfort.slice(0,80)} close.</small>}
        {nextReward && <span className="pl-companion-reward"><small>{nextReward.copy}</small><progress value={nextReward.count} max={nextReward.total} aria-label={`Progress toward ${nextReward.outfit.name}`} /></span>}
        <button type="button" className="pl-link-btn pl-home-cozy-link" onClick={() => { if(returning){onSofterDay?.();return;} goToDashboard?.("care"); setTimeout(() => window.dispatchEvent(new Event("plushlife:open-cozy-space")),100); }}>{returning ? "Make today softer →" : "My Cozy Space →"}</button>
        </div>
      </section>
    </>
  );
}

function OneTinyThing({ nextStepTask, nextStepReason, nextStepHint, toggle, pickEasierSuggestion, nextStepMoreOpen, setNextStepMoreOpen, setNextStepSkipped, setNextStepDismissedToday }) {
  const copy = useThemeCopy();
  if (!nextStepTask) return null;
  return (
    <section data-plushlife-compact-card="next-step" id="plushlife-smart-next-step" style={{...card, padding: "15px 17px 16px"}} aria-label="Today's gentle pick">
      <div className="pl-section-topline">
        <div className="pl-kicker">{copy["One tiny thing"] || "One tiny thing"}</div>
        <div className="pl-muted-note">{nextStepReason || "Rebuilding gently · Good fit right now"}</div>
      </div>
      <div className="pl-primary-task">{nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}</div>
      {nextStepHint?.key === nextStepTask.key && <div className="pl-easier-hint">🌱 {nextStepHint.text}</div>}
      <div className="pl-action-row">
        <button type="button" data-plushlife-compact-hit-target="next-step-done" className="pl-btn pl-btn-primary" onClick={() => toggle(nextStepTask.key)}>✓&nbsp;&nbsp;Mark as done</button>
        <button type="button" data-plushlife-compact-hit-target="make-easier" className="pl-btn pl-btn-ghost" onClick={() => pickEasierSuggestion(nextStepTask.key)}>🌱&nbsp;&nbsp;Make easier</button>
        <button type="button" data-plushlife-compact-hit-target="next-step-more" className="pl-more" aria-label="More choices" aria-expanded={nextStepMoreOpen} onClick={() => setNextStepMoreOpen?.((v) => !v)}>•••</button>
      </div>
      {nextStepMoreOpen && (
        <div className="pl-more-row">
          <button type="button" onClick={()=>startFocusTimer({minutes:2,taskLabel:nextStepTask.label,step:nextStepHint?.key===nextStepTask.key?nextStepHint.text:undefined})}>Help me start · 2 minutes</button>
          <button type="button" onClick={() => { setNextStepSkipped?.((keys) => [...(keys || []), nextStepTask.key]); setNextStepMoreOpen?.(false); }}>Pick another</button>
          <button type="button" onClick={() => { setNextStepDismissedToday?.(true); setNextStepMoreOpen?.(false); }}>Hide for today</button>
        </div>
      )}
    </section>
  );
}

function scheduleEntries(selectedSchedule, selectedScheduleExceptionEntries = []) {
  const { legacyScheduleToEntries } = window.PlushLifeSchedule || {};
  const baseEntries = (selectedSchedule?.entries?.length
    ? selectedSchedule.entries
    : legacyScheduleToEntries?.(selectedSchedule)) || [];

  const entries = [
    ...baseEntries,
    ...(selectedScheduleExceptionEntries || []),
  ]
    .filter((entry) => entry && (entry.time || entry.text || entry.label || entry.title))
    .map((entry) => ({
      ...entry,
      text: entry.text || entry.label || entry.title || "",
    }))
    .sort((a,b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));

  return entries;
}

function TodaySchedule({ selectedSchedule, selectedScheduleExceptionEntries = [], manageSchedule, setManageSchedule }) {
  const copy = useThemeCopy();
  const { formatTime12 } = window.PlushLifeSchedule || {};
  const entries = scheduleEntries(selectedSchedule, selectedScheduleExceptionEntries);

  const visibleEntries = entries;

  return (
    <section data-plushlife-home-schedule-preview="true" style={{...card, padding: "15px 17px 16px"}} aria-label="Today schedule">
      <div className="pl-section-topline">
        <div className="pl-kicker">{copy["Today\'s plan"] || "Today’s plan"}</div>
        <button type="button" className="pl-link-btn" onClick={() => setManageSchedule?.(!manageSchedule)} aria-label="Edit today’s schedule">Edit →</button>
      </div>
      <div className="pl-list">
        {visibleEntries.length ? visibleEntries.map((entry, index) => (
          <div className={`pl-list-row ${entry.time ? "pl-schedule-row" : "pl-note-row"}`} key={entry.id || `${entry.time || "note"}-${index}-${entry.text}`}>
            {entry.time ? (
              <>
                <div className="pl-time">{formatTime12?.(entry.time) || entry.time}</div>
                <div className="pl-row-icon">{entry.isException ? "✨" : "🕒"}</div>
                <div className="pl-row-text">{entry.text}</div>
                <div className="pl-chevron">›</div>
              </>
            ) : (
              <>
                <div className="pl-row-icon">{entry.isException ? "✨" : "🍃"}</div>
                <div className="pl-row-text">{entry.text}</div>
              </>
            )}
          </div>
        )) : (
          <div className="pl-list-row pl-note-row">
            <div className="pl-row-icon">🗓️</div>
            <div className="pl-row-text">No schedule set for today.</div>
          </div>
        )}
      </div>
    </section>
  );
}

function DayAgenda({ tasks, schedule, selectedSchedule, exceptions, date, timezone }) {
  const [tab,setTab]=React.useState('tasks');
  const [wide,setWide]=React.useState(()=>window.matchMedia?.('(min-width:720px)').matches || false);
  const [now,setNow]=React.useState(()=>new Date());
  const id=React.useId();
  React.useEffect(()=>{
    const media=window.matchMedia?.('(min-width:720px)');
    const change=()=>setWide(Boolean(media?.matches));
    change();media?.addEventListener?.('change',change);
    const timer=setInterval(()=>setNow(new Date()),60000);
    return ()=>{media?.removeEventListener?.('change',change);clearInterval(timer);};
  },[]);
  React.useEffect(()=>setTab('tasks'),[date]);
  const next=upcomingSchedule(scheduleEntries(selectedSchedule,exceptions),date,now,timezone);
  const select=(value,focus=false)=>{setTab(value);if(focus)document.getElementById(`${id}-${value}-tab`)?.focus?.();};
  const key=(event)=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();select(event.key==='Home'?'tasks':event.key==='End'?'schedule':tab==='tasks'?'schedule':'tasks',true);};
  return <section className="pl-home-day-card" aria-label="Today’s tasks and schedule">
    {next && <button type="button" className="pl-agenda-next" onClick={()=>select('schedule')} aria-label={`Open schedule. Next up: ${next.text}`}><span>Next up · {window.PlushLifeSchedule?.formatTime12?.(next.time) || next.time}</span><strong>{next.text}</strong></button>}
    {!wide && <div className="pl-agenda-tabs" role="tablist" aria-label="Today view">{['tasks','schedule'].map(value=><button type="button" key={value} role="tab" id={`${id}-${value}-tab`} aria-controls={`${id}-${value}-panel`} aria-selected={tab===value} tabIndex={tab===value?0:-1} onKeyDown={key} onClick={()=>select(value)}>{value==='tasks'?'Tasks':'Schedule'}</button>)}</div>}
    <div className="pl-agenda-panels">{[['tasks',tasks],['schedule',schedule]].map(([value,content])=><div key={value} id={`${id}-${value}-panel`} role={wide?undefined:'tabpanel'} aria-labelledby={wide?undefined:`${id}-${value}-tab`} hidden={!wide && tab!==value}>{content}</div>)}</div>
  </section>;
}

function TomorrowNote({ tomorrowTasksCount }) {
  if (!Number.isFinite(tomorrowTasksCount)) return null;
  return (
    <div id="plushlife-tomorrow-note" style={{...card, padding: "12px 15px", display: "flex", alignItems: "center", gap: 10}} aria-label="Tomorrow is ready">
      <span aria-hidden="true" style={{ fontSize: 20 }}>🌙</span>
      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--pl-theme-muted)" }}>
        <strong style={{ color: "var(--pl-theme-ink)" }}>Tomorrow is ready.</strong>{" "}
        {tomorrowTasksCount === 0
          ? "Nothing scheduled yet — rest easy."
          : `${tomorrowTasksCount} gentle ${tomorrowTasksCount === 1 ? "task is" : "tasks are"} waiting for you.`}
      </div>
    </div>
  );
}

function CompletedToday({ rows = [], viewDone = {}, lingerKeys = [], toggle, expanded, setExpanded }) {
  const count = rows.filter((row) => row && !row.isBonus && !!viewDone?.[row.key]).length;
  if (!count) return null;
  return (
    <section style={{...card, padding: "8px 12px 10px"}} aria-label="Completed today">
      <button type="button" onClick={() => setExpanded?.((value) => !value)} aria-expanded={!!expanded} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 44, border: 0, background: "transparent", cursor: "pointer", padding: "4px 2px" }}>
        <span style={{ fontSize: 11, letterSpacing: ".11em", fontWeight: 900, color: "var(--pl-theme-muted)" }}>✓ COMPLETED TODAY · {count}</span>
        <span aria-hidden="true" style={{ color: "var(--pl-theme-accent)", fontWeight: 900 }}>{expanded ? "▾" : "›"}</span>
      </button>
      {expanded && <CompletedTaskArea rows={rows} viewDone={viewDone} lingerKeys={lingerKeys} toggle={toggle} title="Completed today" compact />}
    </section>
  );
}

function isHabitRow(row) {
  return row && !row.isBonus && String(row.habitType || row.sourceTask?.habit_type || "regular") !== "regular";
}

function TasksToday({ rows = [], viewDone = {}, toggle, openTaskManager, period }) {
  const copy = useThemeCopy();
  const taskRows = rows.filter((row) => row && !row.isBonus && !isHabitRow(row));
  const completed = taskRows.filter((row) => !!viewDone[row.key]).length;
  const unfinished = taskRows.filter((row) => !viewDone[row.key]);
  const shown = unfinished.slice(0, 4);

  return (
    <section style={{...card, padding: "15px 17px 16px"}} aria-label="Tasks today">
      <div className="pl-section-topline">
        <div className="pl-kicker">{copy.Today || "Today"} · {completed}/{taskRows.length}</div>
        <button type="button" className="pl-link-btn" onClick={() => openTaskManager?.(period?.date)} aria-label="View all today’s tasks">All →</button>
      </div>
      <div className="pl-list">
        {shown.length ? shown.map((row) => (
          <button type="button" className="pl-list-row pl-habit-row" key={row.key} onClick={() => toggle?.(row.key)}>
            <span className="pl-check" aria-hidden="true" />
            <span className="pl-row-text">{row.sourceTask && <HabitTypeIcon task={row.sourceTask} />}{row.label}</span>
          </button>
        )) : (
          <div className="pl-list-row pl-note-row">
            <div className="pl-row-icon">{taskRows.length ? "✨" : "📝"}</div>
            <div className="pl-row-text">{taskRows.length ? "All of today’s tasks are done." : "No tasks are scheduled for today."}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function Habits({ rows = [], viewDone = {}, toggle, openTaskManager, period }) {
  const copy = useThemeCopy();
  const habitRows = rows.filter(isHabitRow);
  const completed = habitRows.filter((r) => !!viewDone[r.key]).length;
  const visible = habitRows.filter((r) => !viewDone[r.key]).slice(0, 3);

  return (
    <section style={{...card, padding: "15px 17px 16px"}} aria-label="Habits today">
      <div className="pl-section-topline">
        <div className="pl-kicker">{copy.Habits || "Habits"} · {completed}/{habitRows.length}</div>
        <button type="button" className="pl-link-btn" onClick={() => openTaskManager?.(period?.date, "habits")}>View all →</button>
      </div>
      <div className="pl-list">
        {visible.length ? visible.map((r) => (
          <button type="button" className="pl-list-row pl-habit-row" key={r.key} onClick={() => toggle?.(r.key)}>
            <span className="pl-check" aria-hidden="true" />
            <span className="pl-row-text">{r.sourceTask && <HabitTypeIcon task={r.sourceTask} />}{r.label}<HabitGoalCaption taskKey={r.key}/></span>
          </button>
        )) : (
          <div className="pl-list-row pl-note-row">
            <div className="pl-row-icon">{habitRows.length ? "🌷" : "🌱"}</div>
            <div className="pl-row-text">{habitRows.length ? "All of today’s habits are done." : "No habits are scheduled for today."}</div>
          </div>
        )}
      </div>
    </section>
  );
}

export function TodayPanel({
  open, period, nextStepTask, nextStepReason, nextStepHint, toggle, pickEasierSuggestion,
  nextStepMoreOpen, setNextStepMoreOpen, setNextStepSkipped, setNextStepDismissedToday,
  selectedSchedule, selectedScheduleExceptionEntries, selectedProgressDate, manageSchedule, setManageSchedule,
  rows, viewDone, openTaskManager, setCalmQuickOpen, calmQuickOpen, currentCopingOption,
  reshuffle, setCareSection, goToDashboard, setTodayCardIndex, setProfileOpen, setSettingsOpen,
  completedTodayExpanded, setCompletedTodayExpanded, tomorrowTasksCount, preferences,
  activityDaysTotal, selectedOutfit, appearanceTheme, dinoTheme, babyMode, cozyDaily, optionalTools, rewardMoment, onWearReward, onDismissReward, returnGapDays, returnBannerDismissed, setReturnBannerDismissed, selectDayType, isHistoricalView, isFutureView
}) {
  // Wraps the app toggle with the shared completion flow: newly completed
  // tasks linger briefly for undo, and every completion dispatches
  // plushlife:task-completion-feedback so the hero mascot celebrates.
  const { unifiedToggle, lingerKeys, announcement } = useCompletedTaskFlow(toggle, viewDone, rows);
  if (!open) return null;
  const homeLayout = normalizeHomeLayout(preferences?.home_layout);
  const homeSections = {
    tiny: (<OneTinyThing nextStepTask={nextStepTask} nextStepReason={nextStepReason} nextStepHint={nextStepHint} toggle={unifiedToggle} pickEasierSuggestion={pickEasierSuggestion} nextStepMoreOpen={nextStepMoreOpen} setNextStepMoreOpen={setNextStepMoreOpen} setNextStepSkipped={setNextStepSkipped} setNextStepDismissedToday={setNextStepDismissedToday} />),
    tasks: (<TasksToday rows={rows} viewDone={viewDone} toggle={unifiedToggle} openTaskManager={openTaskManager} period={selectedProgressDate ? {...period,date:selectedProgressDate} : period} />),
    habits: (<Habits rows={rows} viewDone={viewDone} toggle={unifiedToggle} openTaskManager={openTaskManager} period={period} />),
    schedule: (<TodaySchedule selectedSchedule={selectedSchedule} selectedScheduleExceptionEntries={selectedScheduleExceptionEntries} manageSchedule={manageSchedule} setManageSchedule={setManageSchedule} />),
    shortcuts: (<div className="pl-home-shortcuts">
          <button type="button" className="pl-shortcut" onClick={() => openTaskManager?.(period?.date, "habits")}>
            <span className="pl-shortcut-icon">🧸</span>
            <span><div className="pl-shortcut-title">Little Jobs</div><div className="pl-shortcut-sub">Small tasks, big progress</div></span>
            <span className="pl-shortcut-arrow">›</span>
          </button>
          <button type="button" className="pl-shortcut" onClick={() => setCalmQuickOpen?.(true)}>
            <span className="pl-shortcut-icon">💗</span>
            <span><div className="pl-shortcut-title">If I feel overwhelmed</div><div className="pl-shortcut-sub">You’re not alone</div></span>
            <span className="pl-shortcut-arrow">›</span>
          </button>
        </div>),
    noticed: (<button type="button" onClick={() => goToDashboard?.("progress")} data-plushlife-compact-card="plushweek" className="pl-noticed">
          <span className="pl-noticed-icon">✨</span>
          <span><div className="pl-noticed-title">PlushLife noticed:</div><div className="pl-noticed-copy">{nextStepReason || "Rebuilding gently · Good fit right now"}</div></span>
          <span className="pl-noticed-arrow">›</span>
        </button>),
  };

  return (
    <>
      <style>{`
        .pl-home-shell{display:grid;gap:9px;max-width:760px;margin:0 auto;padding:0 0 92px;color:${C.body}}
        .pl-home-timer{display:none!important}
        .pl-home-hero{position:relative;min-height:168px;margin:0;overflow:hidden;border-radius:24px;background:
          radial-gradient(circle at 72% 18%,rgba(255,244,179,.98) 0 8%,rgba(255,244,179,.35) 9% 16%,transparent 17%),
          linear-gradient(145deg,#F8DDF5 0%,#E8D9FF 45%,#FFDDE8 100%);
          border:1px solid rgba(255,255,255,.78);box-shadow:0 16px 36px rgba(150,91,170,.13),inset 0 1px 0 rgba(255,255,255,.85)}
        .pl-home-hero:before{content:"";position:absolute;inset:0;background:
          radial-gradient(ellipse at 18% 88%,rgba(255,255,255,.82) 0 10%,transparent 11%),
          radial-gradient(ellipse at 31% 91%,rgba(255,255,255,.68) 0 13%,transparent 14%),
          radial-gradient(ellipse at 83% 88%,rgba(255,255,255,.76) 0 14%,transparent 15%),
          linear-gradient(90deg,rgba(255,255,255,.22),transparent 34%,rgba(255,255,255,.10));pointer-events:none}
        .pl-home-hero:after{content:"✦  ·  ♡  ·  ✦";position:absolute;right:8%;top:44%;color:rgba(255,255,255,.92);font-size:16px;letter-spacing:8px;text-shadow:0 2px 12px rgba(160,88,180,.18);pointer-events:none}
        .pl-home-brand,.pl-home-actions,.pl-home-copy,.pl-home-plush,.pl-home-bubble{position:absolute;z-index:3}
        .pl-home-brand{left:20px!important;top:18px!important;transform:none!important;text-align:left!important;max-width:58%!important}
        .pl-home-logo{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-weight:900;font-size:32px!important;line-height:1!important;color:#4B2460;letter-spacing:-1.5px;text-shadow:0 2px 0 rgba(255,255,255,.45)}
        .pl-home-logo span,.pl-home-copy h1 span{color:#E45FAE}.pl-home-tagline{margin-top:6px!important;font-size:11.5px!important;line-height:1.2!important;font-weight:850!important;color:#775382}
        .baby-mode .pl-home-tagline:after{content:none!important}
        .pl-home-actions{right:14px!important;top:14px!important;display:flex;align-items:center;gap:7px}
        .pl-home-date{display:block!important;appearance:none;cursor:pointer;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.92);box-shadow:0 8px 18px rgba(102,60,126,.10);font-size:11px;font-weight:900;color:#5A386E}
        .pl-home-settings{width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;border:1px solid rgba(255,255,255,.92)!important;border-radius:50%!important;background:rgba(255,255,255,.9)!important;box-shadow:0 8px 18px rgba(102,60,126,.10)!important;color:#6D447B!important;font-size:19px!important}
        .pl-home-copy{left:20px;bottom:24px;width:49%}.pl-home-copy h1{margin:0;font-size:27px;line-height:1.05;color:#3F2057;font-weight:950;letter-spacing:-.8px}.pl-home-copy p{margin:7px 0 0;font-size:13px;line-height:1.28;color:#5F4870;font-weight:720}
        @keyframes plushlife-float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}
        .pl-home-plush{right:12px;bottom:7px;width:38%;height:60%;display:flex;align-items:flex-end;justify-content:center;animation:plushlife-float 4.5s ease-in-out infinite}
        .pl-home-plush:before{content:"";position:absolute;width:128px;height:72px;bottom:-16px;border-radius:50%;background:linear-gradient(180deg,#F5D8F7,#D8C2F1);box-shadow:inset 0 10px 28px rgba(255,255,255,.72),0 8px 18px rgba(95,57,120,.10)}
        .pl-home-plush:after{content:"🌷";position:absolute;right:-1px;top:5px;font-size:29px;filter:drop-shadow(0 4px 5px rgba(110,65,120,.12))}
        .pl-home-plush .plush-mascot{position:relative;z-index:3;width:118px!important;height:118px!important;filter:drop-shadow(0 10px 14px rgba(73,39,87,.13))}
        .pl-home-bubble{right:6px;bottom:5px;display:none!important}
        .pl-home-today-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0!important;padding:2px 2px 0!important}
        .pl-home-today-row h1{margin:0!important;font-size:28px!important;line-height:1!important}
        .pl-home-today-actions{display:flex;align-items:center;gap:6px}
        .pl-home-today-row .pl-heading-date{min-height:36px!important;padding:7px 10px!important;border-radius:999px!important;font-size:11px!important}
        .pl-home-today-row .pl-heading-gear{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;border-radius:50%!important}
        .pl-home-hero>.pl-mascot-pat{position:absolute;left:16px;bottom:14px;width:108px!important;height:108px!important;min-width:108px!important;min-height:108px!important;margin:0!important;z-index:3}
        .pl-home-hero>.pl-mascot-pat .plush-mascot{width:96px!important;height:96px!important}
        .pl-home-hero>.pl-companion-copy{position:absolute;left:138px;right:16px;top:22px;bottom:16px;z-index:3;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;min-width:0}
        .pl-home-hero>.pl-companion-copy h2{margin:0!important;font-size:22px!important;line-height:1.08!important}
        .pl-home-hero>.pl-companion-copy p{margin:6px 0 0!important;font-size:12.5px!important;line-height:1.3!important}
        .pl-home-hero .pl-companion-comfort{margin-top:5px!important;font-size:11px!important}
        .pl-home-hero .pl-companion-reward{margin-top:6px!important;width:100%;font-size:10.5px!important}
        .pl-home-hero .pl-companion-reward progress{height:6px!important}
        .pl-home-cozy-link{min-height:30px!important;margin-top:6px!important;padding:4px 0!important;font-size:11.5px!important}
        .pl-section-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}.pl-kicker{font-size:12.5px;letter-spacing:.05em;font-weight:900;color:#C05BD1}.pl-muted-note{font-size:10.5px;color:#90709A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pl-primary-task{margin-top:7px;font-size:17.5px;line-height:1.25;font-weight:950;color:#3E2458;letter-spacing:-.25px}.pl-action-row{display:flex;gap:8px;margin-top:11px}.pl-btn,.pl-more{min-height:44px;border-radius:999px;font-weight:900;cursor:pointer}.pl-btn{padding:9px 13px;border:1px solid ${C.line};font-size:13px}.pl-btn-primary{flex:1.05;border:0;color:white;background:linear-gradient(135deg,#C75EDB,#D97DDC);box-shadow:0 8px 18px rgba(190,92,203,.2),0 3px 0 #A34DB4;transition:transform .08s ease,box-shadow .08s ease}.pl-btn-primary:active{transform:translateY(2px);box-shadow:0 4px 10px rgba(190,92,203,.18),0 1px 0 #A34DB4}.pl-btn-ghost{flex:.9;background:white;color:#A452BD}.pl-more{width:50px;border-radius:50%;border:1px solid ${C.line};background:white;color:#9D61B1;font-size:16px}.pl-more-row{display:flex;gap:8px;margin-top:8px}.pl-more-row button{padding:7px 10px;border-radius:10px;border:1px solid ${C.line};background:white;color:#8B6797;font-weight:800}.pl-easier-hint{margin-top:8px;padding:8px 10px;border-radius:10px;background:#FBF6FC;color:#795D86;font-size:12px}
        .pl-link-btn{border:0;background:transparent;color:#B44CC7;font-weight:900;cursor:pointer;font-size:12px}.pl-list{display:grid;gap:8px;margin-top:11px}.pl-list-row{min-height:44px;border-radius:20px;border:2px solid #F3DDF2;background:rgba(255,255,255,.86);display:flex;align-items:center;gap:9px;padding:8px 12px;box-shadow:0 4px 12px rgba(190,120,200,.06)}.pl-schedule-row{display:grid;grid-template-columns:86px 26px minmax(0,1fr) 14px}.pl-note-row{display:grid;grid-template-columns:28px minmax(0,1fr)}.pl-time{font-size:12.5px;font-weight:950;color:#A63DBD;background:#FBE7FA;border-radius:999px;padding:5px 8px;text-align:center;white-space:nowrap}.pl-row-icon{font-size:18px;text-align:center}.pl-row-text{min-width:0;color:#49385A;font-size:13.5px;font-weight:750;line-height:1.3;text-align:left}.pl-chevron{font-size:21px;color:#C783D6}.pl-habit-row{width:100%;cursor:pointer}.pl-check{width:24px;height:24px;border-radius:50%;border:2px solid #DEA8D9;background:white;flex:0 0 auto;box-shadow:inset 0 2px 4px rgba(190,120,200,.12)}
        .pl-home-shortcuts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pl-shortcut{min-height:64px;border-radius:24px;border:2px solid #F3DDF2;background:rgba(255,255,255,.88);display:flex;align-items:center;gap:11px;padding:11px 13px;text-align:left;cursor:pointer;box-shadow:0 6px 16px rgba(190,120,200,.07)}.pl-shortcut-icon{font-size:26px}.pl-shortcut-title{font-size:14px;font-weight:950;color:#3F2755}.pl-shortcut-sub{margin-top:2px;font-size:11.5px;color:#9A75A4}.pl-shortcut-arrow{margin-left:auto;font-size:22px;color:#A660B9}
        .pl-noticed{min-height:58px;border-radius:24px;border:2px solid #F3DDF2;background:linear-gradient(135deg,#FCF5FF,#F6ECFB);display:flex;align-items:center;gap:10px;padding:10px 14px;box-shadow:0 6px 16px rgba(190,120,200,.07)}.pl-noticed-icon{font-size:28px}.pl-noticed-title{font-weight:950;color:#6C347E;font-size:13px}.pl-noticed-copy{margin-top:2px;color:#90709A;font-size:11.5px}.pl-noticed-arrow{margin-left:auto;color:#A65DBA;font-size:22px}
        #plushlife-next-step-reason,#plushlife-tomorrow-setup,#plushlife-adaptive-capacity-card{display:none!important}
        .pl-home-plush .plush-mascot{position:relative;z-index:3;filter:drop-shadow(0 10px 14px rgba(73,39,87,.12))}
        .appearance-twilight .pl-home-hero,.appearance-meadow .pl-home-hero{
          background:linear-gradient(135deg,rgba(255,249,252,.82),rgba(248,239,250,.74),rgba(243,237,251,.72));
          border-bottom:1px solid color-mix(in srgb,var(--pl-theme-accent) 24%,transparent);
          backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
        }
        .appearance-twilight [data-plushlife-home-stack]>section,.appearance-meadow [data-plushlife-home-stack]>section,
        .appearance-twilight .pl-home-shortcuts>button,.appearance-meadow .pl-home-shortcuts>button,
        .appearance-twilight .pl-noticed,.appearance-meadow .pl-noticed{
          background:rgba(255,255,255,.76)!important;
          border-color:color-mix(in srgb,var(--pl-theme-accent) 24%,#EBD9F0)!important;
          backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
        }
        .appearance-twilight .pl-list-row,.appearance-meadow .pl-list-row{background:rgba(255,255,255,.72)!important}

        [data-plushlife-home-stack]>*{margin-top:0!important;margin-bottom:0!important}

        @media(max-width:520px){
          .pl-home-shell{gap:7px;padding:0 8px 74px;margin:0}
          .pl-home-hero{min-height:128px!important;margin:0;border-radius:18px}
          .pl-home-hero:before{background:radial-gradient(ellipse at 16% 92%,rgba(255,255,255,.72) 0 12%,transparent 13%),radial-gradient(ellipse at 82% 92%,rgba(255,255,255,.64) 0 15%,transparent 16%)}
          .pl-home-hero:after{right:7%;top:47%;font-size:10px;letter-spacing:5px}
          .pl-home-brand{left:13px!important;top:11px!important;max-width:54%!important}.pl-home-logo{font-size:22px!important;letter-spacing:-.8px}.pl-home-tagline{font-size:9px!important;margin-top:3px!important}
          .pl-home-actions{right:8px!important;top:8px!important;gap:5px}.pl-home-date{font-size:8.5px;padding:6px 8px}.pl-home-settings{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;font-size:15px!important}
          .pl-home-copy{left:13px;bottom:10px;width:55%}.pl-home-copy h1{font-size:18px;line-height:1.02;white-space:nowrap}.pl-home-copy .pl-heart{font-size:.8em}.pl-home-copy p{margin-top:3px;font-size:9.5px;line-height:1.18}
          .pl-home-today-row{padding:1px 1px 0!important}.pl-home-today-row h1{font-size:24px!important}.pl-home-today-row .pl-heading-date{min-height:32px!important;padding:5px 8px!important;font-size:10px!important}.pl-home-today-row .pl-heading-gear{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important}
          .pl-home-hero>.pl-mascot-pat{left:10px;bottom:9px;width:82px!important;height:82px!important;min-width:82px!important;min-height:82px!important}.pl-home-hero>.pl-mascot-pat .plush-mascot{width:74px!important;height:74px!important}
          .pl-home-hero>.pl-companion-copy{left:104px;right:10px;top:12px;bottom:10px}.pl-home-hero>.pl-companion-copy h2{font-size:17px!important}.pl-home-hero>.pl-companion-copy p{font-size:10.5px!important;margin-top:4px!important}.pl-home-hero .pl-companion-comfort{font-size:9.5px!important;margin-top:3px!important}.pl-home-hero .pl-companion-reward{font-size:9px!important;margin-top:4px!important}.pl-home-cozy-link{font-size:10px!important;min-height:26px!important;margin-top:3px!important}
          .pl-home-plush{right:4px;bottom:2px;width:34%;height:54%}.pl-home-plush:before{width:78px;height:40px;bottom:-9px}.pl-home-plush:after{font-size:17px;right:0;top:0}.pl-home-plush .plush-mascot{width:74px!important;height:74px!important}
          .pl-home-bubble{display:none!important}
          .pl-section-topline{align-items:center;gap:5px}.pl-kicker{font-size:9px;letter-spacing:.08em}.pl-muted-note{display:none}
          [data-plushlife-compact-card="next-step"]{padding:8px 9px 9px!important}
          .pl-primary-task{font-size:13.5px;margin-top:3px;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
          .pl-action-row{gap:4px;margin-top:6px}.pl-btn,.pl-more{min-height:32px;border-radius:999px}.pl-btn{padding:5px 6px;font-size:9.5px}.pl-btn-primary{flex:1.08}.pl-btn-ghost{flex:.86}.pl-more{width:34px;font-size:12px}
          [data-plushlife-home-schedule-preview="true"],.pl-home-shell>section[aria-label="Tasks today"],.pl-home-shell>section[aria-label="Habits today"]{padding:8px 9px 9px!important}
          .pl-list{margin-top:6px;gap:3px}.pl-list-row{min-height:32px;padding:4px 6px;border-radius:14px}.pl-schedule-row{grid-template-columns:53px 16px minmax(0,1fr) 8px}.pl-note-row{grid-template-columns:16px minmax(0,1fr)}.pl-time{font-size:10px}.pl-row-icon{font-size:12px}.pl-row-text{font-size:10.5px;line-height:1.16}.pl-chevron{font-size:13px}.pl-check{width:17px;height:17px;border-radius:50%}
          .pl-home-shortcuts{gap:4px}.pl-shortcut{min-height:44px;padding:6px 7px;border-radius:11px}.pl-shortcut-icon{font-size:16px}.pl-shortcut-title{font-size:10px}.pl-shortcut-sub{font-size:8.2px}.pl-shortcut-arrow{font-size:13px}
          .pl-noticed{min-height:38px;border-radius:11px;padding:6px 7px}.pl-noticed-icon{font-size:16px}.pl-noticed-title{font-size:9.5px}.pl-noticed-copy{font-size:8.5px}.pl-noticed-arrow{font-size:13px}
          [data-plushlife-compact-card="next-step"],[data-plushlife-home-schedule-preview="true"],.pl-home-shell>section[aria-label="Tasks today"],.pl-home-shell>section[aria-label="Habits today"]{border-radius:13px!important;box-shadow:0 3px 10px rgba(86,54,98,.035)!important}

          /* Structural mobile layout: no absolute child can cross into another lane. */
          .pl-home-hero{
            display:grid!important;
            grid-template-columns:78px minmax(0,1fr)!important;
            align-items:center!important;
            gap:12px!important;
            min-height:124px!important;
            padding:14px!important;
            box-sizing:border-box!important;
            overflow:hidden!important;
          }
          .pl-home-hero>.pl-mascot-pat{
            position:relative!important;
            inset:auto!important;
            width:78px!important;height:78px!important;
            min-width:78px!important;min-height:78px!important;
            margin:0!important;
            transform:none!important;
            align-self:center!important;
            justify-self:center!important;
            overflow:hidden!important;
          }
          .pl-home-hero>.pl-mascot-pat>span{
            display:grid!important;
            place-items:center!important;
            width:78px!important;height:78px!important;
            overflow:hidden!important;
          }
          .pl-home-hero>.pl-mascot-pat .plush-mascot{
            width:72px!important;height:72px!important;
            max-width:72px!important;max-height:72px!important;
          }
          .pl-home-hero>.pl-companion-copy{
            position:relative!important;
            inset:auto!important;
            width:auto!important;height:auto!important;
            min-width:0!important;
            max-width:100%!important;
            overflow:hidden!important;
            display:flex!important;
            flex-direction:column!important;
            align-items:flex-start!important;
            justify-content:center!important;
          }
          .pl-home-hero>.pl-companion-copy h2{
            margin:0!important;
            max-width:100%!important;
            font-size:17px!important;
            line-height:1.18!important;
            overflow-wrap:anywhere!important;
          }
          .pl-home-hero>.pl-companion-copy p{
            margin:5px 0 0!important;
            max-width:100%!important;
            font-size:11px!important;
            line-height:1.35!important;
            overflow-wrap:anywhere!important;
          }
          .pl-home-hero :is(.pl-companion-comfort,.pl-companion-reward,.pl-home-cozy-link){
            display:none!important;
          }
          .pl-home-hero:before,.pl-home-hero:after{display:none!important}
        }
      `}</style>

      <div data-plushlife-home-stack className="pl-home-shell">
        <Hero returning={!isHistoricalView && !isFutureView && returnGapDays>=2 && !returnBannerDismissed} onSofterDay={()=>{selectDayType?.("tiny");setReturnBannerDismissed?.(true);}} period={period} goToDashboard={goToDashboard} setSettingsOpen={setSettingsOpen} reducedMotion={preferences?.reduced_motion} selectedOutfit={selectedOutfit} activityDaysTotal={activityDaysTotal} darkMode={preferences?.dark_mode} appearanceTheme={appearanceTheme} dinoTheme={dinoTheme} babyMode={babyMode} />
        {!isHistoricalView && !isFutureView && <RewardMoment outfit={rewardMoment} onWear={onWearReward} onDismiss={onDismissReward}/> }
        {homeDisplayGroups(homeLayout).map(group => group.length===2 ? <DayAgenda key="schedule-tasks" tasks={homeSections.tasks} schedule={homeSections.schedule} selectedSchedule={selectedSchedule} exceptions={selectedScheduleExceptionEntries} date={selectedProgressDate || period?.date} timezone={preferences?.timezone}/> : <React.Fragment key={group[0]}>{homeSections[group[0]]}</React.Fragment>)}
        <details className="pl-home-extras" style={{...card,padding:'10px 14px'}}>
          <summary style={{minHeight:44,display:'list-item',alignContent:'center',fontWeight:800,fontSize:14,cursor:'pointer'}}>A little more, when you want it</summary>
          <div style={{display:'grid',gap:12,paddingTop:8}}>
            <button type="button" onClick={()=>{window.__plushlifeOpenCozySpace=true;goToDashboard?.('care');}} style={{minHeight:44,border:'1px solid var(--pl-theme-line)',borderRadius:14,padding:10,background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit'}}>My Cozy Space · add a comfort when you like</button>
            {cozyDaily}
            {homeLayout.order.filter(id => !homeLayout.hidden.includes(id) && ['shortcuts','noticed'].includes(id)).map(id => <React.Fragment key={id}>{homeSections[id]}</React.Fragment>)}
            {optionalTools}
            <button type="button" onClick={()=>window.dispatchEvent(new Event('plushlife:weekly-reflection-request'))} style={{minHeight:44,border:'1px solid var(--pl-theme-line)',borderRadius:14,padding:10,background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit'}}>Reflect on my week · optional</button>
            <button type="button" onClick={()=>goToDashboard?.('settings')} style={{minHeight:44,border:'1px solid var(--pl-theme-line)',borderRadius:14,padding:10,background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit'}}>Reminder choices · optional</button>
            <TomorrowNote tomorrowTasksCount={tomorrowTasksCount} />
          </div>
        </details>
        <CompletedToday rows={rows} viewDone={viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} expanded={completedTodayExpanded} setExpanded={setCompletedTodayExpanded} />


      </div>

      {announcement && <div role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{announcement}</div>}

      <CalmPanel open={calmQuickOpen} onClose={() => setCalmQuickOpen?.(false)} currentCopingOption={currentCopingOption} reshuffle={reshuffle} setCareSection={setCareSection} goToDashboard={goToDashboard} />
    </>
  );
}
