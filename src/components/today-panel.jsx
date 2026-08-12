import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";
import { BabyToday } from "./baby-today.jsx";

export function TodayPanel(props) {
  if (!props.open) return null;
  if (props.babyMode) return <BabyToday {...props} />;
  return (
    <>
      <TodayPanelCore {...props} />
      <DailyCompanion {...props} />
    </>
  );
}
