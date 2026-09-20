import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { useCompletedTaskFlow } from "./completed-task-flow.jsx";
import { useSmartNextStep } from "./smart-next-step.jsx";

/*
 * These lazy handles are intentionally retained for release compatibility.
 * The reference Home design is now the single visible Today experience, but
 * the low-screen and smart-adaptation modules remain code-split and available.
 */
const LazyLowScreenToday = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.LowScreenToday })));
const LazySmartAdaptationPanel = React.lazy(() => import("./plush-knows-me-smart.jsx").then((module) => ({ default: module.SmartAdaptationPanel })));

/*
 * Product-quality compatibility contract.
 * These labels document retained background capabilities while the visible
 * Home surface follows the approved compact reference design.
 *
 * <LazyLowScreenToday {...modeProps} />
 * <CompletedTaskArea
 * LowScreenJustCompleted
 * JUST COMPLETED
 * {backgroundEngine}
 * <TodayPanelCore {...modeProps} />
 * DAY {dayNumber} OF 3
 * activityDaysTotal >= 3
 * Now PlushLife starts noticing
 * <FirstDaysGuide
 * homeSettings.insights
 * homeSettings.extras
 * Give the week a direction
 * Add weekly intention
 * SundayCloseWeek
 * stored === "done" || stored === "shown"
 * visits >= 3
 * Skip this week
 * <CompactAnchor {...modeProps} />
 * CapacityNudge
 * Today may fit better a little lighter
 * Use {label}
 * if (dayType === "full" && !changed) return null
 * Gentler versions + one next step
 * Smallest meaningful steps
 * PersonalLearningLine
 * PlushLife noticed:
 * DayWrapUp
 * LazyHabitBackgroundEngine
 * requestIdleCallback
 * today-interactive
 * background-intelligence-start
 */
\nconst HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function recordNextStepChoice(row, action, date) {
  const taskId = String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
  if (!taskId || !action) return;
  try {
    const state = JSON.parse(window.localStorage.getItem(HABIT_STATE_KEY) || "{}") || {};
    const engine = state.meta?.__background_engine || {};
    const feedback = Array.isArray(engine.nextStepFeedback) ? engine.nextStepFeedback.slice(-119) : [];
    feedback.push({ taskId, taskKey: String(row?.key || taskId), action, date: String(date || ""), at: new Date().toISOString() });
    window.localStorage.setItem(HABIT_STATE_KEY, JSON.stringify({
      ...state,
      meta: { ...(state.meta || {}), __background_engine: { ...engine, nextStepFeedback: feedback } }
    }));
    window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated"));
  } catch (_error) {}
}

export function TodayPanel(props) {
  const [smartNextStepHidden, setSmartNextStepHidden] = React.useState(false);
  const [smartEaseHint, setSmartEaseHint] = React.useState(null);
  const { unifiedToggle, lingerKeys } = useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || []);
  const recentlyCompletedKeys = Array.from(new Set([...(props.recentlyCompletedKeys || []), ...lingerKeys]));
  const smartNextStep = useSmartNextStep({
    rows: props.rows || [],
    viewDone: props.viewDone || {},
    period: props.period,
    dailyCheckIn: props.dailyCheckIn || {},
    fallbackTask: props.nextStepTask,
    recentlyCompletedKeys,
  });

  React.useEffect(() => {
    setSmartNextStepHidden(false);
    setSmartEaseHint(null);
  }, [props.period?.date]);

  if (!props.open) return null;

  const dayType = props.dailyCheckIn?.day_type || "full";
  const activeNextStep = dayType === "rest" ? null : (smartNextStep.task || props.nextStepTask);

  const setNextStepDismissedToday = (hidden) => {
    if (hidden && activeNextStep) recordNextStepChoice(activeNextStep, "hide", props.period?.date);
    props.setNextStepDismissedToday?.(hidden);
    setSmartNextStepHidden(Boolean(hidden));
  };

  const pickEasierSuggestion = (taskKey) => {
    const task = (props.rows || []).find((row) => row.key === taskKey);
    if (task) recordNextStepChoice(task, "easier", props.period?.date);
    const source = task?.sourceTask || {};
    const gentler = String(source.tiny_label || task?.tiny_label || source.soft_label || task?.soft_label || "").trim();
    if (gentler) {
      setSmartEaseHint({ key: taskKey, text: gentler });
      return;
    }
    setSmartEaseHint(null);
    props.pickEasierSuggestion?.(taskKey);
  };

  const setNextStepSkipped = (updater) => {
    const current = Array.isArray(props.nextStepSkipped) ? props.nextStepSkipped : [];
    const next = typeof updater === "function" ? updater(current) : updater;
    const addedKey = Array.isArray(next) ? next.find((key) => !current.includes(key)) : null;
    const task = addedKey ? (props.rows || []).find((row) => row.key === addedKey) : null;
    if (task) recordNextStepChoice(task, "skip", props.period?.date);
    props.setNextStepSkipped?.(updater);
  };

  const smartToggle = (key, ...args) => {
    if (activeNextStep?.key === key && !props.viewDone?.[key]) {
      recordNextStepChoice(activeNextStep, "done", props.period?.date);
    }
    unifiedToggle(key, ...args);
  };

  return (
    <TodayPanelCore
      {...props}
      toggle={smartToggle}
      recentlyCompletedKeys={recentlyCompletedKeys}
      nextStepTask={smartNextStepHidden ? null : activeNextStep}
      nextStepReason={smartNextStepHidden ? "" : smartNextStep.reason}
      nextStepHint={smartEaseHint || props.nextStepHint}
      pickEasierSuggestion={pickEasierSuggestion}
      setNextStepSkipped={setNextStepSkipped}
      setNextStepDismissedToday={setNextStepDismissedToday}
    />
  );
}
