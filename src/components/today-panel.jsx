import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { CompactAnchor } from "./compact-anchor.jsx";
import { useLowScreenMode } from "./low-screen-mode.jsx";
import { CompletedTaskArea, useCompletedTaskFlow } from "./completed-task-flow.jsx";

const LazyDailyCompanion = React.lazy(() => import("./daily-companion.jsx").then((module) => ({ default: module.DailyCompanion })));
const LazyBabyToday = React.lazy(() => import("./baby-today.jsx").then((module) => ({ default: module.BabyToday })));
const LazyLowScreenToday = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.LowScreenToday })));
const LazyHabitBackgroundEngine = React.lazy(() => import("./habit-background-engine.jsx").then((module) => ({ default: module.HabitBackgroundEngine })));

function FirstDaysGuide({ activityDaysTotal = 0, rows = [], viewDone = {}, goToDashboard, openTaskManager }) {
  if (activityDaysTotal >= 3) return null;
  const required = rows.filter((row) => !row.isBonus);
  const completed = required.filter((row) => !!viewDone?.[row.key]).length;
  const step = completed > 0 ? 3 : required.length > 0 ? 2 : 1;
  return (
    <section aria-label="Getting started" style={{ marginBottom: 14, padding: 14, borderRadius: 17, border: "1px solid #D7E8E3", background: "linear-gradient(145deg,#F5FCF9,#FFF9FD)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#38816F" }}>🌱 YOUR FIRST FEW DAYS</div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 900, color: "#4F405C" }}>{step === 1 ? "Start with just a few habits" : step === 2 ? "Pick one thing that matters today" : "Nice — now let PlushLife learn what works"}</div>
      <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.5, color: "#71857F" }}>{step === 1 ? "Three useful habits are plenty. You can always add more after they feel stable." : step === 2 ? "Use Today’s Anchor as the one habit that makes the day count, even if the rest changes." : "Keep checking things off normally. After a few real days, Habit Insights becomes more specific instead of guessing."}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
        {step === 1 && <button type="button" onClick={() => openTaskManager?.()} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: 0, background: "#38816F", color: "white", fontWeight: 900, cursor: "pointer" }}>Add my first habits</button>}
        {step === 3 && <button type="button" onClick={() => goToDashboard?.("progress")} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: "1px solid #BFDCD3", background: "white", color: "#38816F", fontWeight: 900, cursor: "pointer" }}>See what PlushLife learns</button>}
      </div>
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
    if (!props.open) {
      setReady(false);
      return undefined;
    }
    let cancelled = false;
    let handle = null;
    const show = () => { if (!cancelled) setReady(true); };
    if (typeof window.requestIdleCallback === "function") handle = window.requestIdleCallback(show, { timeout: 1800 });
    else handle = window.setTimeout(show, 900);
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function" && typeof handle === "number") window.cancelIdleCallback(handle);
      else if (handle) window.clearTimeout(handle);
    };
  }, [props.open]);
  if (!ready) return null;
  return <React.Suspense fallback={null}><LazyHabitBackgroundEngine {...props} /></React.Suspense>;
}

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  const { unifiedToggle, lingerKeys, announcement } = useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || []);
  const recentlyCompletedKeys = Array.from(new Set([
    ...(props.recentlyCompletedKeys || []),
    ...lingerKeys,
  ]));
  const modeProps = { ...props, toggle: unifiedToggle, recentlyCompletedKeys, completedLingerKeys: lingerKeys };
  const liveRegion = <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</div>;
  const backgroundEngine = <BackgroundIntelligence {...modeProps} />;

  if (!props.open) return null;
  if (props.babyMode) return <>{backgroundEngine}{liveRegion}<React.Suspense fallback={null}><LazyBabyToday {...modeProps} /></React.Suspense></>;
  if (lowScreen) {
    return (
      <>
        {backgroundEngine}
        {liveRegion}
        <React.Suspense fallback={null}><LazyLowScreenToday {...modeProps} /></React.Suspense>
        <LowScreenJustCompleted rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} />
        <CompletedTaskArea rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} compact />
      </>
    );
  }

  return (
    <>
      {backgroundEngine}
      {liveRegion}
      <FirstDaysGuide activityDaysTotal={props.activityDaysTotal} rows={props.rows} viewDone={props.viewDone} goToDashboard={props.goToDashboard} openTaskManager={props.openTaskManager} />
      <CompactAnchor {...modeProps} />
      <TodayPanelCore {...modeProps} />
      <React.Suspense fallback={null}><LazyDailyCompanion {...modeProps} /></React.Suspense>
    </>
  );
}
