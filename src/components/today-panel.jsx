import { TodayPanel as TodayPanelCore } from "./today-panel-core.jsx";
import { CompactAnchor } from "./compact-anchor.jsx";
import { useLowScreenMode } from "./low-screen-mode.jsx";
import { CompletedTaskArea, useCompletedTaskFlow } from "./completed-task-flow.jsx";
import { useSmartNextStep } from "./smart-next-step.jsx";
import { HabitSuggestions } from "./habit-suggestions.jsx";
import { PlushKnowsMe } from "./plush-knows-me.jsx";

const LazyDailyCompanion = React.lazy(() => import("./daily-companion.jsx").then((module) => ({ default: module.DailyCompanion })));
const LazyBabyToday = React.lazy(() => import("./baby-today.jsx").then((module) => ({ default: module.BabyToday })));
const LazyLowScreenToday = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.LowScreenToday })));
const LazyHabitBackgroundEngine = React.lazy(() => import("./habit-background-engine.jsx").then((module) => ({ default: module.HabitBackgroundEngine })));
const LazySmartAdaptationPanel = React.lazy(() => import("./plush-knows-me-smart.jsx").then((module) => ({ default: module.SmartAdaptationPanel })));
const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const WEEKLY_INTENTION_REMINDER_KEY = "plushlife:weekly-intention-reminder:v1";

function recordNextStepChoice(row, action, date) {
  const taskId = String(row?.sourceTask?.id || row?.task_id || row?.id || row?.key || "");
  if (!taskId || !action) return;
  try {
    const state = JSON.parse(window.localStorage.getItem(HABIT_STATE_KEY) || "{}") || {};
    const engine = state.meta?.__background_engine || {};
    const feedback = Array.isArray(engine.nextStepFeedback) ? engine.nextStepFeedback.slice(-119) : [];
    feedback.push({ taskId, taskKey: String(row?.key || taskId), action, date: String(date || ""), at: new Date().toISOString() });
    const next = { ...state, meta: { ...(state.meta || {}), __background_engine: { ...engine, nextStepFeedback: feedback } } };
    window.localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("plushlife:habit-coach-updated"));
  } catch (_error) {}
}

function StableFeatureTip({ id, text }) {
  const storageKey = `plushlife:feature-tip-dismissed:${id}`;
  const [locallyDismissed, setLocallyDismissed] = React.useState(() => {
    try { return window.localStorage.getItem(storageKey) === "1"; }
    catch (_error) { return false; }
  });
  const [open, setOpen] = React.useState(false);

  if (locallyDismissed) return null;
  return (
    <div style={{ marginBottom: 5 }}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ minHeight: 34, padding: "5px 8px", border: 0, background: "transparent", color: "#8C6B9E", fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>{open ? "Hide why" : "Why Next Step?"}</button>
      {open && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, padding: "7px 9px", borderRadius: 9, background: "#FFF9E9", border: "1px solid #F0D99E" }}>
          <span style={{ fontSize: 11, lineHeight: 1.4, color: "#6B5A3D" }}>💡 {text}</span>
          <button type="button" onClick={() => {
            try { window.localStorage.setItem(storageKey, "1"); } catch (_error) {}
            setLocallyDismissed(true);
          }} aria-label="Dismiss tip" style={{ padding: "2px 6px", borderRadius: 7, border: "1px solid #F0D99E", background: "white", color: "#A56D14", fontWeight: 900, fontSize: 10.5, cursor: "pointer", flexShrink: 0 }}>Got it</button>
        </div>
      )}
    </div>
  );
}

function FirstDaysGuide({ activityDaysTotal = 0, rows = [], viewDone = {}, setWeeklyIntentionDraft, setWeeklyIntentionEditing, weeklyIntentionText }) {
  if (activityDaysTotal >= 3) return null;
  const dayNumber = Math.min(3, Math.max(1, Number(activityDaysTotal || 0) + 1));
  const required = rows.filter((row) => !row.isBonus);
  const completed = required.filter((row) => !!viewDone?.[row.key]).length;
  const guides = [
    { icon: "🌱", title: "Just do today", text: "Pick one useful thing. PlushLife can learn the rest as you use it." },
    { icon: "📮", title: "Give the week a direction", text: "One intention keeps the week connected without turning it into another checklist.", action: "intention" },
    { icon: "✨", title: "Now PlushLife starts noticing", text: "Timing, gentler versions, and what you actually finish begin shaping future suggestions." },
  ];
  const guide = guides[dayNumber - 1];
  return (
    <section aria-label={`Getting started, day ${dayNumber}`} style={{ padding: "10px 11px", borderRadius: 14, border: "1px solid #D7E8E3", background: "linear-gradient(145deg,#F5FCF9,#FFF9FD)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true" style={{ fontSize: 17 }}>{guide.icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, letterSpacing: ".1em", fontWeight: 900, color: "#38816F" }}>DAY {dayNumber} OF 3</div>
          <div style={{ marginTop: 1, fontSize: 13, fontWeight: 900, color: "#4F405C" }}>{guide.title}</div>
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 10.8, lineHeight: 1.4, color: "#71857F" }}>{guide.text}</div>
      {completed > 0 && dayNumber === 1 && <div style={{ marginTop: 4, fontSize: 10.4, color: "#4D8174", fontWeight: 800 }}>✓ {completed} caring step{completed === 1 ? "" : "s"} already counts.</div>}
      {guide.action === "intention" && !String(weeklyIntentionText || "").trim() && <button type="button" onClick={() => { setWeeklyIntentionDraft?.(weeklyIntentionText || ""); setWeeklyIntentionEditing?.(true); }} style={{ minHeight: 44, marginTop: 7, padding: "7px 10px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Add weekly intention</button>}
    </section>
  );
}

function DayModeCue({ dayType = "full", changed = false }) {
  const modes = {
    full: { icon: "☀️", label: "Full Day", text: "Whole routine", bg: "#FFF9ED", border: "#F1DCA7", color: "#876724" },
    soft: { icon: "🌤️", label: "Soft Day", text: "Gentler versions + one next step", bg: "#F8F2FF", border: "#DDCDEA", color: "#755A91" },
    tiny: { icon: "🌱", label: "Tiny Day", text: "Smallest meaningful steps", bg: "#F1FBF7", border: "#CFE8DE", color: "#4D8174" },
    recovery: { icon: "↺", label: "Recovery Day", text: "Only what helps you rebuild", bg: "#F2F8FF", border: "#D2E2F1", color: "#55738C" },
    rest: { icon: "🌴", label: "Rest Day", text: "Rest is the plan", bg: "#F5F6FA", border: "#DEE1E8", color: "#6B7080" },
  };
  const mode = modes[dayType] || modes.full;
  return <div aria-live={changed ? "polite" : undefined} style={{ display: "flex", alignItems: "center", gap: 7, minHeight: 34, padding: "5px 9px", borderRadius: 11, border: `1px solid ${mode.border}`, background: mode.bg, color: mode.color, overflow: "hidden" }}>
    <span aria-hidden="true" style={{ fontSize: 15 }}>{mode.icon}</span>
    <strong style={{ flexShrink: 0, fontSize: 10.8 }}>{mode.label}</strong>
    <span aria-hidden="true" style={{ opacity: .45 }}>·</span>
    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10.5, fontWeight: 700 }}>{changed ? `I resized the rest of today — ${mode.text.toLowerCase()}.` : mode.text}</span>
  </div>;
}

function PersonalLearningLine({ reason, dayType, activityDaysTotal = 0 }) {
  const text = String(reason || "").trim();
  if (activityDaysTotal < 3 || dayType === "soft" || !text || /useful unfinished step/i.test(text)) return null;
  return <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 11, background: "rgba(255,255,255,.62)", border: "1px solid #E9DFF0", color: "#7B6886", fontSize: 10.5, lineHeight: 1.35 }}><span aria-hidden="true">✨</span><span><strong style={{ color: "#675573" }}>PlushLife noticed:</strong> {text}</span></div>;
}

function DayWrapUp({ rows = [], viewDone = {}, weeklyIntentionText = "" }) {
  const required = rows.filter((row) => !row.isBonus);
  const completed = required.filter((row) => !!viewDone?.[row.key]).length;
  if (!completed || completed < Math.max(1, Math.ceil(required.length * .6))) return null;
  const finished = required.length > 0 && completed >= required.length;
  return <div style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #D9E8E2", background: "linear-gradient(145deg,#F5FCF9,#FFF9FD)", color: "#60766F" }}>
    <div style={{ fontSize: 11.2, fontWeight: 900, color: "#4D8174" }}>{finished ? "💜 Today is tucked away." : `💜 You cared for yourself in ${completed} ways today.`}</div>
    <div style={{ marginTop: 2, fontSize: 10.3, lineHeight: 1.35 }}>{String(weeklyIntentionText || "").trim() ? "Your weekly intention will still be here tomorrow." : "Tomorrow starts fresh — nothing to catch up on."}</div>
  </div>;
}

function SundayCloseWeek({ date, weeklyIntentionText, goToDashboard }) {
  if (!date || new Date(`${date}T12:00:00Z`).getUTCDay() !== 0) return null;
  return <section aria-label="Close the week" style={{ padding: "9px 10px", borderRadius: 13, border: "1px solid #E2D4EA", background: "linear-gradient(145deg,#FFF9FD,#F7FCFA)" }}>
    <div style={{ fontSize: 10.8, fontWeight: 900, color: "#765F84" }}>🌙 Close the week</div>
    <div style={{ marginTop: 2, fontSize: 10.4, lineHeight: 1.38, color: "#83718D" }}>{String(weeklyIntentionText || "").trim() ? `You carried “${String(weeklyIntentionText).trim()}” this week. See what actually helped.` : "See what actually helped this week before Monday gives you a fresh direction."}</div>
    <button type="button" onClick={() => goToDashboard?.("progress")} style={{ minHeight: 44, marginTop: 6, padding: "7px 10px", borderRadius: 10, border: "1px solid #D9C7E4", background: "white", color: "#765F84", fontWeight: 900, fontSize: 10.8, cursor: "pointer" }}>See my week →</button>
  </section>;
}

function LowScreenJustCompleted({ rows = [], viewDone = {}, lingerKeys = [], toggle }) {
  const lingering = new Set(lingerKeys || []);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key] && lingering.has(row.key));
  if (!completed.length) return null;
  return (
    <section aria-label="Just completed" style={{ margin: "-4px 0 10px", padding: 10, borderRadius: 14, border: "1px solid #D8E7E2", background: "#F7FCFA" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#4D8174" }}>✓ JUST COMPLETED</div>
      <div style={{ display: "grid", gap: 6, marginTop: 7 }}>
        {completed.map((task) => <button key={task.key} type="button" onClick={() => toggle?.(task.key)} aria-label={`Mark ${task.label} incomplete`} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center", padding: "8px 9px", borderRadius: 11, border: "1px solid #D7E8E3", background: "white", color: "#748A84", textAlign: "left", cursor: "pointer" }}><span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#4D9A86", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>✓</span><span style={{ fontSize: 12.5, lineHeight: 1.35, fontWeight: 800, textDecoration: "line-through" }}>{task.label}</span></button>)}
      </div>
    </section>
  );
}

function BackgroundIntelligence(props) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!props.open) { setReady(false); return undefined; }
    let cancelled = false;
    let handle = null;
    const show = () => { if (cancelled) return; try { window.PlushLifeRuntime?.metric("background-intelligence-start", performance.now()); } catch (_error) {} setReady(true); };
    if (typeof window.requestIdleCallback === "function") handle = window.requestIdleCallback(show, { timeout: 1800 });
    else handle = window.setTimeout(show, 900);
    return () => { cancelled = true; if (typeof window.cancelIdleCallback === "function" && typeof handle === "number") window.cancelIdleCallback(handle); else if (handle) window.clearTimeout(handle); };
  }, [props.open]);
  if (!ready) return null;
  return <React.Suspense fallback={null}><LazyHabitBackgroundEngine {...props} /></React.Suspense>;
}

function WeeklyIntentionReminder({ open, onAdd, onDismiss }) {
  if (!open) return null;
  return <div role="dialog" aria-modal="true" aria-labelledby="weekly-intention-reminder-title" style={{ position: "fixed", inset: 0, zIndex: 58, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.42)", backdropFilter: "blur(5px)" }}>
    <div style={{ width: "min(100%,360px)", padding: 17, borderRadius: 18, background: "#FFFBFE", border: "1px solid #E3C9EC", boxShadow: "0 16px 45px rgba(64,39,80,.18)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#A65DC1" }}>📮 PLUSHWEEK</div>
      <div id="weekly-intention-reminder-title" style={{ marginTop: 5, fontSize: 17, lineHeight: 1.25, fontWeight: 900, color: "#54405F" }}>Want to set your intention for this week?</div>
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.48, color: "#7E6989" }}>You still haven’t added one. One gentle direction is enough — it doesn’t need to be a goal or another thing to finish.</div>
      <button type="button" onClick={onAdd} style={{ width: "100%", minHeight: 44, marginTop: 12, padding: "9px 12px", borderRadius: 11, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>📝 Add weekly intention</button>
      <button type="button" onClick={onDismiss} style={{ width: "100%", minHeight: 44, marginTop: 6, padding: "9px 12px", borderRadius: 11, border: "1px solid #D8C8E2", background: "transparent", color: "#8C6B9E", fontWeight: 800, cursor: "pointer" }}>Not right now</button>
    </div>
  </div>;
}

export function TodayPanel(props) {
  const lowScreen = useLowScreenMode();
  const readinessReportedRef = React.useRef(false);
  const previousDayTypeRef = React.useRef(props.dailyCheckIn?.day_type || "full");
  const [modeChanged, setModeChanged] = React.useState(false);
  const [smartNextStepHidden, setSmartNextStepHidden] = React.useState(false);
  const [smartEaseHint, setSmartEaseHint] = React.useState(null);
  const [moreForTodayOpen, setMoreForTodayOpen] = React.useState(false);
  const [weeklyIntentionReminderOpen, setWeeklyIntentionReminderOpen] = React.useState(false);
  const [homeSettings] = React.useState({ insights: false, extras: false });
  const { unifiedToggle, lingerKeys, announcement } = useCompletedTaskFlow(props.toggle, props.viewDone, props.rows || []);
  const recentlyCompletedKeys = Array.from(new Set([...(props.recentlyCompletedKeys || []), ...lingerKeys]));
  const smartNextStep = useSmartNextStep({ rows: props.rows || [], viewDone: props.viewDone || {}, period: props.period, dailyCheckIn: props.dailyCheckIn || {}, fallbackTask: props.nextStepTask, recentlyCompletedKeys });
  const dayType = props.dailyCheckIn?.day_type || "full";
  const activeNextStep = dayType === "soft" ? (smartNextStep.task || props.nextStepTask) : null;
  const StableTip = React.useMemo(() => function StableTipComponent({ id, text }) {
    return <StableFeatureTip id={id} text={text} />;
  }, []);

  React.useEffect(() => { setSmartNextStepHidden(false); setSmartEaseHint(null); setMoreForTodayOpen(false); setModeChanged(false); previousDayTypeRef.current = props.dailyCheckIn?.day_type || "full"; }, [props.period?.date]);
  React.useEffect(() => {
    const previous = previousDayTypeRef.current;
    if (previous && previous !== dayType) {
      setModeChanged(true);
      const timer = window.setTimeout(() => setModeChanged(false), 5000);
      previousDayTypeRef.current = dayType;
      return () => window.clearTimeout(timer);
    }
    previousDayTypeRef.current = dayType;
    return undefined;
  }, [dayType]);
  React.useEffect(() => {
    const intention = String(props.weeklyIntentionText || "").trim();
    const weekStart = String(props.period?.weekStart || "");
    const date = String(props.period?.date || "");
    const storageKey = `${WEEKLY_INTENTION_REMINDER_KEY}:${weekStart}`;
    if (intention) {
      setWeeklyIntentionReminderOpen(false);
      try { window.localStorage.removeItem(storageKey); } catch (_error) {}
      return;
    }
    if (!props.open || !weekStart || !date) {
      setWeeklyIntentionReminderOpen(false);
      return;
    }
    const isMonday = new Date(`${date}T12:00:00Z`).getUTCDay() === 1;
    if (isMonday) {
      setWeeklyIntentionReminderOpen(false);
      return;
    }
    try {
      const visits = Math.max(0, Number(window.localStorage.getItem(storageKey)) || 0) + 1;
      window.localStorage.setItem(storageKey, String(visits));
      setWeeklyIntentionReminderOpen(visits % 2 === 0);
    } catch (_error) {
      setWeeklyIntentionReminderOpen(false);
    }
  }, [props.open, props.weeklyIntentionText, props.period?.weekStart, props.period?.date]);

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
    if (activeNextStep?.key === key && !props.viewDone?.[key]) recordNextStepChoice(activeNextStep, "done", props.period?.date);
    unifiedToggle(key, ...args);
  };
  const modeProps = { ...props, FeatureTip: StableTip, toggle: smartToggle, recentlyCompletedKeys, completedLingerKeys: lingerKeys, nextStepTask: smartNextStepHidden ? null : activeNextStep, nextStepReason: smartNextStepHidden ? "" : smartNextStep.reason, nextStepHint: smartEaseHint || props.nextStepHint, pickEasierSuggestion, setNextStepSkipped, setNextStepDismissedToday };
  const liveRegion = <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{announcement}</div>;
  const backgroundEngine = <BackgroundIntelligence {...modeProps} />;
  const plushMemory = homeSettings.insights ? <><PlushKnowsMe {...modeProps} /><React.Suspense fallback={null}><LazySmartAdaptationPanel {...modeProps} /></React.Suspense></> : null;
  const weeklyReminder = <WeeklyIntentionReminder open={weeklyIntentionReminderOpen} onDismiss={() => setWeeklyIntentionReminderOpen(false)} onAdd={() => {
    props.setWeeklyIntentionDraft?.(props.weeklyIntentionText || "");
    props.setWeeklyIntentionEditing?.(true);
    setWeeklyIntentionReminderOpen(false);
  }} />;

  React.useEffect(() => {
    if (!props.open || readinessReportedRef.current) return;
    readinessReportedRef.current = true;
    const report = () => { try { window.PlushLifeRuntime?.metric("today-interactive", performance.now(), `${props.rows?.length || 0} rows`); } catch (_error) {} };
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(report); else report();
  }, [props.open, props.rows?.length]);

  if (!props.open) return null;
  if (props.babyMode) return <>{weeklyReminder}{backgroundEngine}{liveRegion}<React.Suspense fallback={null}><LazyBabyToday {...modeProps} /></React.Suspense></>;
  if (lowScreen) return <>{weeklyReminder}{backgroundEngine}{liveRegion}{plushMemory}<React.Suspense fallback={null}><LazyLowScreenToday {...modeProps} /></React.Suspense><LowScreenJustCompleted rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={smartToggle} /><CompletedTaskArea rows={props.rows} viewDone={props.viewDone} lingerKeys={lingerKeys} toggle={smartToggle} compact /></>;

  return <>
    {weeklyReminder}
    {backgroundEngine}
    {liveRegion}
    <style>{`[data-plushlife-home-stack] { display:grid; grid-template-columns:minmax(0,1fr); gap:7px; min-width:0; width:100%; max-width:100%; overflow:hidden; } [data-plushlife-home-stack] > * { min-width:0; width:100%; max-width:100%; box-sizing:border-box; margin-top:0 !important; margin-bottom:0 !important; } [data-plushlife-home-stack] [role="tablist"] { min-width:0; width:100%; max-width:100%; box-sizing:border-box; }`}</style>
    <div data-plushlife-home-stack>
      {(Number(props.activityDaysTotal || 0) < 3) && <FirstDaysGuide activityDaysTotal={props.activityDaysTotal} rows={props.rows} viewDone={props.viewDone} weeklyIntentionText={props.weeklyIntentionText} setWeeklyIntentionDraft={props.setWeeklyIntentionDraft} setWeeklyIntentionEditing={props.setWeeklyIntentionEditing} />}
      <DayModeCue dayType={dayType} changed={modeChanged} />
      <TodayPanelCore {...modeProps} />
      <PersonalLearningLine reason={smartNextStep.reason} dayType={dayType} activityDaysTotal={props.activityDaysTotal} />
      <DayWrapUp rows={props.rows} viewDone={props.viewDone} weeklyIntentionText={props.weeklyIntentionText} />
      <SundayCloseWeek date={props.period?.date} weeklyIntentionText={props.weeklyIntentionText} goToDashboard={props.goToDashboard} />
    </div>
    {plushMemory}
    {homeSettings.extras && <button type="button" onClick={() => setMoreForTodayOpen((open) => !open)} aria-expanded={moreForTodayOpen} style={{ width: "100%", minHeight: 46, margin: "8px 0 6px", padding: "9px 11px", borderRadius: 13, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.78)", color: "#765F84", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>{moreForTodayOpen ? "Hide extra tools" : "More for today"} {moreForTodayOpen ? "⌃" : "⌄"}</button>}
    <div style={{ display: homeSettings.extras && moreForTodayOpen ? "block" : "none" }} aria-hidden={!homeSettings.extras || !moreForTodayOpen}>
      {moreForTodayOpen && <HabitSuggestions rows={props.rows || []} openTaskManager={props.openTaskManager} />}
      <CompactAnchor {...modeProps} />
      {moreForTodayOpen && <React.Suspense fallback={null}><LazyDailyCompanion {...modeProps} /></React.Suspense>}
    </div>
  </>;
}