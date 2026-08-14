import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitHealth } from "./habit-health.jsx";
import { GrowthNextMove } from "./growth-next-move.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const LazyWeeklyHabitReview = React.lazy(() => import("./habit-intelligence.jsx").then((module) => ({ default: module.WeeklyHabitReview })));
const LazyWhatWorksForMe = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.WhatWorksForMe })));
const LazyResilienceProgress = React.lazy(() => import("./habit-resilience.jsx").then((module) => ({ default: module.ResilienceProgress })));

function InsightToolsFallback() {
  return <div role="status" style={{ padding: "12px 10px", color: "#71857F", fontSize: 11.5 }}>Loading deeper habit insights…</div>;
}

function MeasuredGoalsSummary() {
  const [state, setState] = React.useState(() => { try { return JSON.parse(localStorage.getItem("plushlife:habit-coach:v1") || "{}") || {}; } catch (_error) { return {}; } });
  React.useEffect(() => {
    const refresh = () => { try { setState(JSON.parse(localStorage.getItem("plushlife:habit-coach:v1") || "{}") || {}); } catch (_error) {} };
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => { window.removeEventListener("plushlife:habit-coach-updated", refresh); window.removeEventListener("plushlife:habit-coach-hydrated", refresh); };
  }, []);
  const goals = Object.entries(state.meta || {}).filter(([id, meta]) => !id.startsWith("__") && Number(meta?.goalTarget) > 0);
  if (!goals.length) return null;
  const dates = Object.keys(state.measurements || {}).sort();
  const latestDate = dates[dates.length - 1] || "";
  return <section style={{ marginBottom: 14, padding: 13, borderRadius: 16, border: "1px solid #D9E6F6", background: "#F7FBFF" }}>
    <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#4C78A8" }}>MEASURABLE GOALS</div>
    <div style={{ display: "grid", gap: 7, marginTop: 8 }}>{goals.slice(0, 4).map(([id, meta]) => {
      const value = Number(state.measurements?.[latestDate]?.[id] || 0);
      const pct = Math.min(100, Math.round(value * 100 / Number(meta.goalTarget)));
      return <div key={id}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: "#536C89" }}><strong>{meta.label || "Measured habit"}</strong><span>{value}/{meta.goalTarget} {meta.goalUnit || "times"}</span></div><div style={{ height: 6, marginTop: 4, borderRadius: 99, overflow: "hidden", background: "#E6EFF9" }}><div style={{ height: "100%", width: `${pct}%`, background: "#4C8FE8" }} /></div></div>;
    })}</div>
  </section>;
}

export function ProgressPanel(props) {
  const [insightsOpen, setInsightsOpen] = React.useState(false);
  if (!props.open) return null;
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  return (
    <>
      <MeasuredGoalsSummary />
      {goldInsights && <GrowthNextMove />}
      {goldInsights && <section className="habit-insights-card" style={{ marginBottom: 14, borderRadius: 18, border: "1px solid #CFE8E1", background: "linear-gradient(145deg,#F4FBF9,#FFF9FD)", overflow: "hidden", boxShadow: "0 7px 22px rgba(49,140,121,.08)" }}>
        <details onToggle={(event) => setInsightsOpen(event.currentTarget.open)}>
          <summary style={{ minHeight: 48, padding: "14px 15px", cursor: "pointer", color: "#3E746A", listStyle: "none" }}>
            <span style={{ display: "block", fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900 }}>🌱 HABIT INSIGHTS</span>
            <span style={{ display: "block", marginTop: 3, fontSize: 15, fontWeight: 900, color: "#4F405C" }}>What is working and what to try next</span>
            <span style={{ display: "block", marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: "#71857F" }}>{props.caringDays || 0} caring days · {props.weeklyEssentialPct || 0}% essentials this week</span>
          </summary>
          <div className="habit-insights-sections" style={{ padding: "0 12px 12px" }}>
            <div style={{ margin: "0 0 8px", padding: "10px 11px", borderRadius: 11, background: "rgba(255,255,255,.74)", border: "1px solid #DDECE7", color: "#637B74", fontSize: 11, lineHeight: 1.5 }}>
              <strong style={{ color: "#3E746A" }}>Why PlushLife thinks this:</strong> insights use your own recent habit/check-in history and only get specific when there is enough evidence. When there is not enough history, PlushLife stays in “learning” mode instead of pretending to know.
            </div>
            <HabitHealth
              weeklyOverallPct={props.weeklyOverallPct}
              weeklyEssentialPct={props.weeklyEssentialPct}
              caringDays={props.caringDays}
              weekOverWeekDelta={props.weekOverWeekDelta}
              preferences={props.preferences}
              goToDashboard={props.goToDashboard}
              openTaskManager={props.openTaskManager}
            />
            {insightsOpen && (
              <React.Suspense fallback={<InsightToolsFallback />}>
                <LazyWeeklyHabitReview open={props.open} openTaskManager={props.openTaskManager} goToDashboard={props.goToDashboard} />
                <LazyWhatWorksForMe open={props.open} openTaskManager={props.openTaskManager} />
                <LazyResilienceProgress open={props.open} openTaskManager={props.openTaskManager} />
              </React.Suspense>
            )}
          </div>
        </details>
        <style>{`.habit-insights-sections > section { margin: 0 !important; border: 0 !important; border-top: 1px solid #E5EDE9 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; } .habit-insights-sections > section:first-of-type { border-top: 0 !important; }`}</style>
      </section>}
      <ProgressPanelCore {...props} />
    </>
  );
}
