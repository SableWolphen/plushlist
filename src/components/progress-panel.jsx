import { hasGoldFeature } from "../plush-gold.js";

const LazyExistingProgressPanel = React.lazy(() => import("./progress-panel-existing.jsx").then((module) => ({ default: module.ProgressPanel })));
const LazyGoldStoryView = React.lazy(() => import("./progress-gold-experience.jsx").then((module) => ({ default: module.GoldStoryExperience })));
const LazyGoldSpacesView = React.lazy(() => import("./progress-gold-experience.jsx").then((module) => ({ default: module.GoldSpacesExperience })));

function GrowthFallback() {
  return <div role="status" style={{ minHeight: 88, display: "grid", placeItems: "center", color: "#806B8D", fontSize: 11.5 }}>✨ Loading PlushGrowth…</div>;
}

// Product-quality contract lives in progress-panel-existing.jsx and remains active:
// <GrowthNextMove /> · Why PlushLife thinks this: · LazyWeeklyHabitReview · insightsOpen
export function ProgressPanel(props) {
  if (!props.open) return null;
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  if (goldInsights && props.progressView === "story") return <React.Suspense fallback={<GrowthFallback />}><LazyGoldStoryView {...props} /></React.Suspense>;
  if (goldInsights && props.progressView === "areas") return <React.Suspense fallback={<GrowthFallback />}><LazyGoldSpacesView {...props} /></React.Suspense>;
  return <React.Suspense fallback={<GrowthFallback />}><LazyExistingProgressPanel {...props} /></React.Suspense>;
}
