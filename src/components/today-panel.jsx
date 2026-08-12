import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";
import { BabyToday } from "./baby-today.jsx";
import { HabitCoach } from "./habit-intelligence.jsx";
import { HabitRetentionTools, LowScreenToday, useLowScreenMode } from "./habit-retention.jsx";
import { HabitResilienceSuite } from "./habit-resilience.jsx";
import { CompletedTaskArea, useCompletedTaskFlow } from "./completed-task-flow.jsx";

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  const { unifiedToggle, lingerKeys } = useCompletedTaskFlow(props.toggle, props.viewDone);
  const recentlyCompletedKeys = Array.from(new Set([
    ...(props.recentlyCompletedKeys || []),
    ...lingerKeys,
  ]));
  const modeProps = { ...props, toggle: unifiedToggle, recentlyCompletedKeys, completedLingerKeys: lingerKeys };

  if (!props.open) return null;
  if (props.babyMode) return <BabyToday {...modeProps} />;
  if (lowScreen) {
    return (
      <>
        <LowScreenToday {...modeProps} />
        <CompletedTaskArea rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={unifiedToggle} compact />
      </>
    );
  }

  return (
    <>
      <HabitCoach {...modeProps}>
        <div style={{ paddingTop: 4, borderTop: "1px solid #EDE3F2" }}>
          <HabitRetentionTools {...modeProps} />
          <HabitResilienceSuite {...modeProps} />
        </div>
      </HabitCoach>
      <TodayPanelCore {...modeProps} />
      <DailyCompanion {...modeProps} />
    </>
  );
}
