import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";

export function TodayPanel(props) {
  if (!props.open) return null;
  return (
    <>
      <TodayPanelCore {...props} />
      <DailyCompanion {...props} />
    </>
  );
}
