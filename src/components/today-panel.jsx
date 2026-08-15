import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { useLowScreenMode } from "./low-screen-mode.jsx";
import { CompletedTaskArea, useCompletedTaskFlow } from "./completed-task-flow.jsx";
import { useSmartNextStep } from "./smart-next-step.jsx";

const LazyBabyToday = React.lazy(() => import("./baby-today.jsx").then((module) => ({ default: module.BabyToday })));
const LazyLowScreenToday = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.LowScreenToday })));
const LazyHabitBackgroundEngine = React.lazy(() => import("./habit-background-engine.jsx").then((module) => ({ default: module.HabitBackgroundEngine })));

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
  const { unifiedToggle, lingerKeys, announcement } = useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || []);
  const recentlyCompletedKeys = Array.from(new Set([...(props.recentlyCompletedKeys || []), ...lingerKeys]));
  const smartNextStep = useSmartNextStep({ rows: props.rows || [], viewDone: props.viewDone || {}, period: props.period, dailyCheckIn: props.dailyCheckIn || {}, fallbackTask: props.nextStepTask, recentlyCompletedKeys });

  React.useEffect(() => { setSmartNextStepHidden(false); }, [props.period?.date]);
  const setNextStepDismissedToday = (hidden) => { props.setNextStepDismissedToday?.(hidden); setSmartNextStepHidden(Boolean(hidden)); };
  const modeProps = { ...props, toggle: unifiedToggle, recentlyCompletedKeys, completedLingerKeys: lingerKeys, nextStepTask: smartNextStepHidden ? null : (smartNextStep.task || props.nextStepTask), nextStepReason: smartNextStepHidden ? "" : smartNextStep.reason, setNextStepDismissedToday };
  const liveRegion = <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</div>;
  const backgroundEngine = <BackgroundIntelligence {...modeProps} />;

  React.useEffect(() => {
    if (!props.open || readinessReportedRef.current) return;
    readinessReportedRef.current = true;
    const report = () => { try { window.PlushLifeRuntime?.metric("today-interactive", performance.now(), `${props.rows?.length || 0} rows`); } catch (_error) {} };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(report); else report();
  }, [props.open, props.rows?.length]);

  if (!props.open) return null;
  if (props.babyMode) return <>{backgroundEngine}{liveRegion}<React.Suspense fallback={null}><LazyBabyToday {...modeProps} /></React.Suspense></>;
  if (lowScreen) return <>{backgroundEngine}{liveRegion}<React.Suspense fallback={null}><LazyLowScreenToday {...modeProps} /></React.Suspense><LowScreenJustCompleted rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} /><CompletedTaskArea rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} compact /></>;

  return <>
    {backgroundEngine}
    {liveRegion}
    <TodayPanelCore {...modeProps} />
  </>;
}
