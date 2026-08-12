import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitHealth } from "./habit-health.jsx";

export function ProgressPanel(props) {
  if (!props.open) return null;
  return (
    <>
      <HabitHealth
        weeklyOverallPct={props.weeklyOverallPct}
        weeklyEssentialPct={props.weeklyEssentialPct}
        caringDays={props.caringDays}
        weekOverWeekDelta={props.weekOverWeekDelta}
        preferences={props.preferences}
        goToDashboard={props.goToDashboard}
        openTaskManager={props.openTaskManager}
      />
      <ProgressPanelCore {...props} />
    </>
  );
}
