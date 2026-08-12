import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { DailyCompanion } from "./daily-companion.jsx";
import { BabyToday } from "./baby-today.jsx";
import { HabitCoach } from "./habit-intelligence.jsx";
import { HabitRetentionTools, LowScreenToday, useLowScreenMode } from "./habit-retention.jsx";
import { HabitResilienceSuite } from "./habit-resilience.jsx";

const COMPLETED_LINGER_MS = 2600;

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  const [lingerKeys, setLingerKeys] = React.useState([]);
  const timersRef = React.useRef(new Map());

  React.useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const unifiedToggle = (key, ...args) => {
    const wasDone = !!props.viewDone?.[key];
    const previousTimer = timersRef.current.get(key);
    if (previousTimer) window.clearTimeout(previousTimer);

    if (wasDone) {
      setLingerKeys((keys) => keys.filter((item) => item !== key));
      timersRef.current.delete(key);
    } else {
      setLingerKeys((keys) => keys.includes(key) ? keys : [...keys, key]);
      const timer = window.setTimeout(() => {
        setLingerKeys((keys) => keys.filter((item) => item !== key));
        timersRef.current.delete(key);
      }, COMPLETED_LINGER_MS);
      timersRef.current.set(key, timer);
    }

    return props.toggle?.(key, ...args);
  };

  const recentlyCompletedKeys = Array.from(new Set([
    ...(props.recentlyCompletedKeys || []),
    ...lingerKeys,
  ]));
  const modeProps = { ...props, toggle: unifiedToggle, recentlyCompletedKeys };

  if (!props.open) return null;
  if (props.babyMode) return <BabyToday {...modeProps} />;
  if (lowScreen) return <LowScreenToday {...modeProps} />;
  return (
    <>
      <HabitCoach {...modeProps} />
      <HabitRetentionTools {...modeProps} />
      <HabitResilienceSuite {...modeProps} />
      <TodayPanelCore {...modeProps} />
      <DailyCompanion {...modeProps} />
    </>
  );
}
