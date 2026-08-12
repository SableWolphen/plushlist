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
  return (
    <>
      <HabitCoach {...props}>
        <div style={{ paddingTop: 4, borderTop: "1px solid #EDE3F2" }}>
          <HabitRetentionTools {...props} />
          <HabitResilienceSuite {...props} />
        </div>
      </HabitCoach>
      <TodayPanelCore {...props} recentlyCompletedKeys={visibleCompletedKeys} />
      <DailyCompanion {...props} />
    </>
  );
}
