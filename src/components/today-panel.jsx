import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";
import { BabyToday } from "./baby-today.jsx";
import { HabitCoach } from "./habit-intelligence.jsx";

export function TodayPanel(props) {
  if (!props.open) return null;
  if (props.babyMode) return <BabyToday {...props} />;
  return (
    <>
      <HabitCoach {...props} />
      <TodayPanelCore {...props} />
      <DailyCompanion {...props} />
    </>
  );
}