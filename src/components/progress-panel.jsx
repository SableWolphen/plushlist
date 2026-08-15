import { ProgressPanel as ExistingProgressPanel } from "./progress-panel-existing.jsx";
import { GoldStoryView, GoldSpacesView } from "./progress-gold-views.jsx";
import { hasGoldFeature } from "../plush-gold.js";

export function ProgressPanel(props) {
  if (!props.open) return null;
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  if (goldInsights && props.progressView === "story") return <GoldStoryView {...props} />;
  if (goldInsights && props.progressView === "areas") return <GoldSpacesView {...props} />;
  return <ExistingProgressPanel {...props} />;
}
