import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";
import { BabyToday } from "./baby-today.jsx";
import { HabitCoach } from "./habit-intelligence.jsx";
import { HabitRetentionTools, LowScreenToday, useLowScreenMode } from "./habit-retention.jsx";

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  if (!props.open) return null;
  if (props.babyMode) return <BabyToday {...props} />;
  if (lowScreen) return <LowScreenToday {...props} />;
  return (
    <>
      <HabitCoach {...props} />
      <HabitRetentionTools {...props} />
      <TodayPanelCore {...props} />
      <DailyCompanion {...props} />
    </>
  );
}
