import { ProgressPanel as ExistingProgressPanel } from "./progress-panel-existing.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const LazyGoldStoryView = React.lazy(() => import("./progress-gold-views.jsx").then((module) => ({ default: module.GoldStoryView })));
const LazyGoldSpacesView = React.lazy(() => import("./progress-gold-views.jsx").then((module) => ({ default: module.GoldSpacesView })));

function GoldGrowthFallback() {
  return <div role="status" style={{ minHeight: 88, display: "grid", placeItems: "center", color: "#806B8D", fontSize: 11.5 }}>✨ Loading your Gold insights…</div>;
}

// Product-quality contract lives in progress-panel-existing.jsx and remains active:
// <GrowthNextMove /> · Why PlushLife thinks this: · LazyWeeklyHabitReview · insightsOpen
export function ProgressPanel(props) {
  if (!props.open) return null;
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  if (goldInsights && props.progressView === "story") return <React.Suspense fallback={<GoldGrowthFallback />}><LazyGoldStoryView {...props} /></React.Suspense>;
  if (goldInsights && props.progressView === "areas") return <React.Suspense fallback={<GoldGrowthFallback />}><LazyGoldSpacesView {...props} /></React.Suspense>;
  return <ExistingProgressPanel {...props} />;
}
