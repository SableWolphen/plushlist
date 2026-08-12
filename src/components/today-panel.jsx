import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";
import { BabyToday } from "./baby-today.jsx";
import { HabitCoach } from "./habit-intelligence.jsx";
import { HabitRetentionTools, LowScreenToday, useLowScreenMode } from "./habit-retention.jsx";
import { HabitResilienceSuite } from "./habit-resilience.jsx";

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  if (!props.open) return null;
  if (props.babyMode) return <BabyToday {...props} />;
  if (lowScreen) return <LowScreenToday {...props} />;

  // The core Today view historically moved a completed task into a collapsed
  // "Completed today" bucket after its short celebration. That made checking
  // a box feel like deleting the task. Treat every completed row as recently
  // completed while the full Today list is visible so it stays in place with
  // its checkmark and strikethrough and can be tapped again to undo.
  const crossedOffKeys = (props.rows || [])
    .filter((row) => !!props.viewDone?.[row.key])
    .map((row) => row.key);
  const visibleCompletedKeys = Array.from(new Set([
    ...(props.recentlyCompletedKeys || []),
    ...crossedOffKeys,
  ]));
  const habitRows = (props.rows || []).filter((row) => !row?.isBonus);
  const completedHabits = habitRows.filter((row) => !!props.viewDone?.[row.key]).length;
  const habitPercent = habitRows.length ? Math.round((completedHabits / habitRows.length) * 100) : 0;

  return (
    <>
      <HabitCoach {...props} />
      <section style={{ marginBottom: 14, padding: "12px 13px", borderRadius: 17, border: "1px solid #CFE8E1", background: "linear-gradient(145deg,#F4FBF9,#FFFDFC)" }}>
        <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#318C79" }}>🔎 HABIT INSIGHTS</div>
        <div style={{ marginTop: 4, fontSize: 13.5, fontWeight: 900, color: "#4F405C" }}>
          {habitRows.length ? `${completedHabits} of ${habitRows.length} habits complete today` : "Your patterns will appear here"}
        </div>
        <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: "#607A73" }}>
          {habitRows.length ? `${habitPercent}% complete. Keep the next step small and useful.` : "Add a habit when you are ready; PlushLife will learn what works over time."}
        </div>
        <button type="button" onClick={() => props.goToDashboard?.("progress")} style={{ marginTop: 8, padding: "7px 10px", borderRadius: 9, border: "1px solid #B9DDD4", background: "white", color: "#318C79", fontSize: 11.5, fontWeight: 900, cursor: "pointer" }}>See habit insights</button>
      </section>
      <details style={{ marginBottom: 14, borderRadius: 17, border: "1px solid #E6D4F2", background: "#FFFDFC", overflow: "hidden" }}>
        <summary style={{ padding: "12px 13px", cursor: "pointer", color: "#76558A", fontSize: 13.5, fontWeight: 900 }}>
          ⚙️ Advanced habit tools
          <span style={{ display: "block", marginTop: 3, color: "#8C7A98", fontSize: 11, fontWeight: 500 }}>Coaching, rescue tools, experiments, reminders and routine settings</span>
        </summary>
        <div style={{ padding: "0 10px 1px" }}>
          <HabitRetentionTools {...props} />
          <HabitResilienceSuite {...props} />
        </div>
      </details>
      <TodayPanelCore {...props} recentlyCompletedKeys={visibleCompletedKeys} />
      <DailyCompanion {...props} />
    </>
  );
}
