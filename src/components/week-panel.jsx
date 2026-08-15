import { WeekPanel as ExistingWeekPanel } from "./week-panel-existing.jsx";
import { PurposeCalendarViews } from "./week-panel-purpose.jsx";

export function WeekPanel(props) {
  if (!props.open) return null;
  if (props.weekCardIndex === 0) return <ExistingWeekPanel {...props} />;
  return <PurposeCalendarViews {...props} />;
}
