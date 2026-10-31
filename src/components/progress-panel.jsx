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
