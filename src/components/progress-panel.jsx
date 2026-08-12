import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitHealth } from "./habit-health.jsx";
import { WeeklyHabitReview } from "./habit-intelligence.jsx";
import { WhatWorksForMe } from "./habit-retention.jsx";
import { ResilienceProgress } from "./habit-resilience.jsx";

export function ProgressPanel(props) {
  if (!props.open) return null;
  return (
    <>
      <section className="habit-insights-card" style={{ marginBottom: 14, borderRadius: 18, border: "1px solid #CFE8E1", background: "linear-gradient(145deg,#F4FBF9,#FFF9FD)", overflow: "hidden", boxShadow: "0 7px 22px rgba(49,140,121,.08)" }}>
        <details>
          <summary style={{ padding: "14px 15px", cursor: "pointer", color: "#3E746A", listStyle: "none" }}>
            <span style={{ display: "block", fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900 }}>🌱 HABIT INSIGHTS</span>
            <span style={{ display: "block", marginTop: 3, fontSize: 15, fontWeight: 900, color: "#4F405C" }}>What is working and what to try next</span>
            <span style={{ display: "block", marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: "#71857F" }}>{props.caringDays || 0} caring days · {props.weeklyEssentialPct || 0}% essentials this week</span>
          </summary>
          <div className="habit-insights-sections" style={{ padding: "0 12px 12px" }}>
            <HabitHealth
              weeklyOverallPct={props.weeklyOverallPct}
              weeklyEssentialPct={props.weeklyEssentialPct}
              caringDays={props.caringDays}
              weekOverWeekDelta={props.weekOverWeekDelta}
              preferences={props.preferences}
              goToDashboard={props.goToDashboard}
              openTaskManager={props.openTaskManager}
            />
            <WeeklyHabitReview open={props.open} openTaskManager={props.openTaskManager} goToDashboard={props.goToDashboard} />
            <WhatWorksForMe open={props.open} openTaskManager={props.openTaskManager} />
            <ResilienceProgress open={props.open} openTaskManager={props.openTaskManager} />
          </div>
        </details>
        <style>{`.habit-insights-sections > section { margin: 0 !important; border: 0 !important; border-top: 1px solid #E5EDE9 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; } .habit-insights-sections > section:first-child { border-top: 0 !important; }`}</style>
      </section>
      <ProgressPanelCore {...props} />
    </>
  );
}
