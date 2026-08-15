import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { CompactAnchor } from "./compact-anchor.jsx";
import { useLowScreenMode } from "./low-screen-mode.jsx";
import { CompletedTaskArea, useCompletedTaskFlow } from "./completed-task-flow.jsx";
import { useSmartNextStep } from "./smart-next-step.jsx";
import { HabitSuggestions } from "./habit-suggestions.jsx";
import { PlushKnowsMe } from "./plush-knows-me.jsx";

const LazyDailyCompanion = React.lazy(() => import("./daily-companion.jsx").then((module) => ({ default: module.DailyCompanion })));
const LazyBabyToday = React.lazy(() => import("./baby-today.jsx").then((module) => ({ default: module.BabyToday })));
const LazyLowScreenToday = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.LowScreenToday })));
const LazyHabitBackgroundEngine = React.lazy(() => import("./habit-background-engine.jsx").then((module) => ({ default: module.HabitBackgroundEngine })));
const LazySmartAdaptationPanel = React.lazy(() => import("./plush-knows-me-smart.jsx").then((module) => ({ default: module.SmartAdaptationPanel })));

function FirstDaysGuide({ activityDaysTotal = 0, rows = [], viewDone = {}, goToDashboard, openTaskManager }) {
  if (activityDaysTotal >= 7) return null;
  const dayNumber = Math.min(7, Math.max(1, Number(activityDaysTotal || 0) + 1));
  const required = rows.filter((row) => !row.isBonus);
  const completed = required.filter((row) => !!viewDone?.[row.key]).length;
  const guides = [
    { title: "Start small", text: "Three to five useful habits are plenty for week one. A smaller routine is easier to trust and repeat.", action: required.length < 3 ? "Add a few habits" : "" },
    { title: "Choose your Focus Habit", text: "Pick one real habit you especially want to build right now. PlushLife will remember it across days and quietly give it extra weight when choosing your next step.", action: "Choose Focus Habit" },
    { title: "Give PlushLife one real check-in", text: "Mood and energy help PlushLife tell the difference between a normal day and a day that needs less pressure." },
    { title: "Keep reminders selective", text: "One useful reminder beats a wall of notifications. Keep only the times that genuinely help you start." },
    { title: "Try a gentler day on purpose", text: "Soft and Tiny days are part of the system, not a failure state. Using them teaches PlushLife what survives low-energy days." },
    { title: "See what is actually working", text: "PlushGrowth turns your real history into one useful adjustment instead of making you interpret a pile of charts.", action: "Open PlushGrowth" },
    { title: "Make the app yours", text: "Keep what helps, hide what does not, and let your normal routine—not setup screens—be the thing you see most." },
  ];
  const guide = guides[dayNumber - 1];
  return (
    <section aria-label={`Getting started, day ${dayNumber}`} style={{ marginBottom: 14, padding: 14, borderRadius: 17, border: "1px solid #D7E8E3", background: "linear-gradient(145deg,#F5FCF9,#FFF9FD)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#38816F" }}>🌱 FIRST WEEK · DAY {dayNumber}</div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 900, color: "#4F405C" }}>{guide.title}</div>
      <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.5, color: "#71857F" }}>{guide.text}</div>
      {completed > 0 && dayNumber <= 2 && <div style={{ marginTop: 6, fontSize: 11, color: "#4D8174", fontWeight: 800 }}>✓ You already completed {completed} today. That is enough data to start learning from.</div>}
      {guide.action && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
        {guide.action === "Add a few habits" && <button type="button" onClick={() => openTaskManager?.()} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: 0, background: "#38816F", color: "white", fontWeight: 900, cursor: "pointer" }}>Add a few habits</button>}
        {guide.action === "Choose Focus Habit" && <button type="button" onClick={() => { try { window.dispatchEvent(new CustomEvent("plushlife:open-focus-habit-picker")); document.getElementById("plushlife-focus-habit")?.scrollIntoView?.({ behavior: "smooth", block: "center" }); } catch (_error) {} }} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Choose Focus Habit</button>}
        {guide.action === "Open PlushGrowth" && <button type="button" onClick={() => goToDashboard?.("progress")} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: "1px solid #BFDCD3", background: "white", color: "#38816F", fontWeight: 900, cursor: "pointer" }}>Open PlushGrowth</button>}
      </div>}
    </section>
  );
}

function LowScreenJustCompleted({ rows = [], viewDone = {}, lingerKeys = [], toggle }) {
  const lingering = new Set(lingerKeys || []);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key] && lingering.has(row.key));
  if (!completed.length) return null;
  return (
    <section aria-label="Just completed" style={{ margin: "-4px 0 10px", padding: 10, borderRadius: 14, border: "1px solid #D8E7E2", background: "#F7FCFA" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#4D8174" }}>✓ JUST COMPLETED</div>
      <div style={{ display: "grid", gap: 6, marginTop: 7 }}>
        {completed.map((task) => <button key={task.key} type="button" onClick={() => toggle?.(task.key)} aria-label={`Mark ${task.label} incomplete`} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center", padding: "8px 9px", borderRadius: 11, border: "1px solid #D7E8E3", background: "white", color: "#748A84", textAlign: "left", cursor: "pointer" }}><span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#4D9A86", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>✓</span><span style={{ fontSize: 12.5, lineHeight: 1.35, fontWeight: 800, textDecoration: "line-through" }}>{task.label}</span></button>)}
      </div>
    </section>
  );
}

function BackgroundIntelligence(props) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!props.open) { setReady(false); return undefined; }
    let cancelled = false;
    let handle = null;
    const show = () => { if (cancelled) return; try { window.PlushLifeRuntime?.metric("background-intelligence-start", performance.now()); } catch (_error) {} setReady(true); };
    if (typeof window.requestIdleCallback === "function") handle = window.requestIdleCallback(show, { timeout: 1800 });
    else handle = window.setTimeout(show, 900);
    return () => { cancelled = true; if (typeof window.cancelIdleCallback === "function" && typeof handle === "number") window.cancelIdleCallback(handle); else if (handle) window.clearTimeout(handle); };
  }, [props.open]);
  if (!ready) return null;
  return <React.Suspense fallback={null}><LazyHabitBackgroundEngine {...props} /></React.Suspense>;
}

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  const readinessReportedRef = React.useRef(false);
  const [smartNextStepHidden, setSmartNextStepHidden] = React.useState(false);
  const [moreForTodayOpen, setMoreForTodayOpen] = React.useState(false);
  const { unifiedToggle, lingerKeys, announcement } = useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || []);
  const recentlyCompletedKeys = Array.from(new Set([...(props.recentlyCompletedKeys || []), ...lingerKeys]));
  const smartNextStep = useSmartNextStep({ rows: props.rows || [], viewDone: props.viewDone || {}, period: props.period, dailyCheckIn: props.dailyCheckIn || {}, fallbackTask: props.nextStepTask, recentlyCompletedKeys });

  React.useEffect(() => { setSmartNextStepHidden(false); setMoreForTodayOpen(false); }, [props.period?.date]);
  const setNextStepDismissedToday = (hidden) => { props.setNextStepDismissedToday?.(hidden); setSmartNextStepHidden(Boolean(hidden)); };
  const modeProps = { ...props, toggle: unifiedToggle, recentlyCompletedKeys, completedLingerKeys: lingerKeys, nextStepTask: smartNextStepHidden ? null : (smartNextStep.task || props.nextStepTask), nextStepReason: smartNextStepHidden ? "" : smartNextStep.reason, setNextStepDismissedToday };
  const liveRegion = <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</div>;
  const backgroundEngine = <BackgroundIntelligence {...modeProps} />;
  const plushMemory = <><PlushKnowsMe {...modeProps} /><React.Suspense fallback={null}><LazySmartAdaptationPanel {...modeProps} /></React.Suspense></>;

  React.useEffect(() => {
    if (!props.open || readinessReportedRef.current) return;
    readinessReportedRef.current = true;
    const report = () => { try { window.PlushLifeRuntime?.metric("today-interactive", performance.now(), `${props.rows?.length || 0} rows`); } catch (_error) {} };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(report); else report();
  }, [props.open, props.rows?.length]);

  if (!props.open) return null;
  if (props.babyMode) return <>{backgroundEngine}{liveRegion}{plushMemory}<React.Suspense fallback={null}><LazyBabyToday {...modeProps} /></React.Suspense></>;
  if (lowScreen) return <>{backgroundEngine}{liveRegion}{plushMemory}<React.Suspense fallback={null}><LazyLowScreenToday {...modeProps} /></React.Suspense><LowScreenJustCompleted rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} /><CompletedTaskArea rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} compact /></>;

  return <>
    {backgroundEngine}
    {liveRegion}
    <TodayPanelCore {...modeProps} />
    {plushMemory}
    <button type="button" onClick={() => setMoreForTodayOpen((open) => !open)} aria-expanded={moreForTodayOpen} style={{ width: "100%", minHeight: 46, margin: "10px 0 8px", padding: "10px 12px", borderRadius: 13, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.78)", color: "#765F84", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>{moreForTodayOpen ? "Hide extra tools" : "More for today"} {moreForTodayOpen ? "⌃" : "⌄"}</button>
    <div style={{ display: moreForTodayOpen ? "block" : "none" }} aria-hidden={!moreForTodayOpen}>
      {moreForTodayOpen && <HabitSuggestions rows={props.rows || []} openTaskManager={props.openTaskManager} />}
      <FirstDaysGuide activityDaysTotal={props.activityDaysTotal} rows={props.rows} viewDone={props.viewDone} goToDashboard={props.goToDashboard} openTaskManager={props.openTaskManager} />
      <CompactAnchor {...modeProps} />
      {moreForTodayOpen && <React.Suspense fallback={null}><LazyDailyCompanion {...modeProps} /></React.Suspense>}
    </div>
  </>;
}
