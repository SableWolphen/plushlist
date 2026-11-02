import { WorkspaceNavigation } from "./workspace-navigation.jsx";
import { HabitStudio } from "./habit-studio.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const LazyExistingProgressPanel = React.lazy(() => import("./progress-panel-existing.jsx").then((module) => ({ default: module.ProgressPanel })));
const LazyGoldStoryView = React.lazy(() => import("./progress-gold-experience.jsx").then((module) => ({ default: module.GoldStoryExperience })));
const LazyGoldSpacesView = React.lazy(() => import("./progress-gold-experience.jsx").then((module) => ({ default: module.GoldSpacesExperience })));
const LazyGrowthMoments = React.lazy(() => import("./growth-moments.jsx").then((module) => ({ default: module.GrowthMoments })));

function GrowthFallback() {
  return <div role="status" style={{ minHeight: 88, display: "grid", placeItems: "center", color: "var(--pl-theme-ink)", fontSize: 11.5 }}>✨ Loading PlushGrowth…</div>;
}

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// This week at a glance: how many days you showed up, one bar per day, rest days shown kindly.
export function weekSummary(weekDays = [], startDate = "") {
  const all = (Array.isArray(weekDays) ? weekDays : []).filter((day) => day && /^\d{4}-\d{2}-\d{2}$/.test(day.date));
  // Days before someone joined are not counted against them.
  const joined = /^\d{4}-\d{2}-\d{2}$/.test(String(startDate || "")) ? String(startDate) : "";
  const days = joined ? all.filter((day) => day.date >= joined) : all;
  const shown = days.filter((day) => day.done > 0).length;
  const rested = days.filter((day) => day.rest && !(day.done > 0)).length;
  const before = all.filter((day) => !days.includes(day)).map((day) => ({ ...day, letter: WEEKDAY_LETTERS[new Date(day.date + "T12:00:00").getDay()], height: 8, kind: "before" }));
  const bars = [...before, ...days.map((day) => {
    const ratio = day.possible > 0 ? Math.min(1, day.done / day.possible) : day.done > 0 ? 1 : 0;
    return { ...day, letter: WEEKDAY_LETTERS[new Date(day.date + "T12:00:00").getDay()], height: day.rest && !(day.done > 0) ? 14 : 12 + Math.round(ratio * 64), kind: day.rest && !(day.done > 0) ? "rest" : day.done > 0 ? "done" : "empty" };
  })];
  if (bars.length) {
    let cursor = bars[bars.length - 1].date;
    while (bars.length < 7) {
      const next = new Date(cursor + "T12:00:00");
      next.setDate(next.getDate() + 1);
      cursor = [next.getFullYear(), String(next.getMonth() + 1).padStart(2, "0"), String(next.getDate()).padStart(2, "0")].join("-");
      bars.push({ date: cursor, letter: WEEKDAY_LETTERS[next.getDay()], height: 8, kind: "ahead" });
    }
  }
  const headline = !days.length ? "A fresh week. Any little thing counts." : shown === 0 ? "A fresh week. Any little thing counts." : `You showed up ${shown} of ${days.length} ${days.length === 1 ? "day" : "days"}`;
  const note = rested ? `Rest counts too. You took ${rested} rest ${rested === 1 ? "day" : "days"}.` : shown ? "Every return counts, big or small." : "Your week starts whenever you do.";
  return { headline, note, bars };
}

function localDate(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return [parsed.getFullYear(), String(parsed.getMonth() + 1).padStart(2, "0"), String(parsed.getDate()).padStart(2, "0")].join("-");
}

function WeekSummary({ weekDays, joinedAt }) {
  const summary = weekSummary(weekDays, localDate(joinedAt));
  if (!summary.bars.length) return null;
  return <section className="pl3-week-summary" aria-label="This week">
    <p className="pl3-week-summary-label">This week</p>
    <h1>{summary.headline}</h1>
    <div className="pl3-week-bars" role="img" aria-label={summary.bars.filter((bar) => bar.kind !== "ahead").map((bar) => `${bar.date}: ${bar.kind === "rest" ? "rest day" : bar.kind === "done" ? `${bar.done} done` : "nothing yet"}`).join(", ")}>
      {summary.bars.map((bar) => <span key={bar.date} className={`pl3-week-bar is-${bar.kind}`}><i style={{ height: bar.height }} /><b>{bar.letter}</b></span>)}
    </div>
    <p className="pl3-week-summary-note">{summary.note}</p>
  </section>;
}

// Product-quality contract lives in progress-panel-existing.jsx and remains active:
// <GrowthNextMove /> · Why PlushLife thinks this: · insightsOpen
// LazyWeeklyHabitReview was retired: Habit Studio › My week below is the one weekly review.
export function ProgressPanel(props) {
  if (!props.open) return null;
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  const content = goldInsights && props.progressView === "story" ? <LazyGoldStoryView {...props} hideNavigation />
    : goldInsights && props.progressView === "areas" ? <LazyGoldSpacesView {...props} hideNavigation />
    : <LazyExistingProgressPanel {...props} hideNavigation />;
  return <div className="pl-progress-page">
    {props.progressView === "overview" && <WeekSummary weekDays={props.weekDays} joinedAt={props.user?.created_at} />}
    <WorkspaceNavigation label="Progress sections" items={[["overview","Overview"],["story","My story"],["areas","Care areas"]]} value={props.progressView} onChange={props.setProgressView} />
    <button type="button" className="pl-progress-plush-link" onClick={() => props.onOpenPlush?.()}>🧸 My Plush & Rewards <span aria-hidden="true">›</span></button>
    <React.Suspense fallback={<GrowthFallback />}>{content}</React.Suspense>
    {props.progressView === "overview" && <details className="pl-progress-extras">
      <summary>Habits & memories</summary>
      <div className="pl-progress-extras-body">
        <HabitStudio compact initialTab="week"/>
        <React.Suspense fallback={null}><LazyGrowthMoments user={props.user} /></React.Suspense>
      </div>
    </details>}
  </div>;
}
