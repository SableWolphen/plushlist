import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitHealth } from "./habit-health.jsx";
import { WeeklyHabitReview } from "./habit-intelligence.jsx";
import { WhatWorksForMe } from "./habit-retention.jsx";
import { ResilienceProgress } from "./habit-resilience.jsx";

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
      <WeeklyHabitReview open={props.open} openTaskManager={props.openTaskManager} goToDashboard={props.goToDashboard} />
      <WhatWorksForMe open={props.open} openTaskManager={props.openTaskManager} />
      <ResilienceProgress open={props.open} openTaskManager={props.openTaskManager} />
      <ProgressPanelCore {...props} />
    </>
  );
}
