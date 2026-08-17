const HABIT_STATE_KEY = "plushlife:habit-coach:v1";

function readState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function chooseMove(state) {
  const engine = state.meta?.__background_engine || {};
  const dayModel = engine.dayModel || null;
  const profiles = Object.values(engine.habitProfiles || {});
  const load = engine.load || {};
  const recovery = engine.recovery || {};
  const cross = engine.crossPatterns || {};

  if (dayModel?.intervention && dayModel.intervention.kind !== "steady") {
    const confidence = dayModel.confidence === "learning" ? "Still learning from your real days." : `${dayModel.evidence || 0}% evidence confidence · ${dayModel.state || "today's pattern"}.`;
    return {
      icon: dayModel.intervention.kind === "comeback" ? "↺" : dayModel.intervention.kind === "trim" ? "🪶" : dayModel.intervention.kind === "smaller" ? "🌱" : "🧭",
      title: dayModel.intervention.title,
      text: dayModel.intervention.text,
      evidence: `${confidence} ${dayModel.uncertainty || ""}`.trim(),
    };
  }

  if (recovery.recentGap >= 2) {
    const label = recovery.suggestedRamp === "essentials" ? "restart with essentials only" : recovery.suggestedRamp === "lighter" ? "use a lighter routine for a couple of days" : "resume normally";
    return { icon: "↺", title: "Make the restart easy", text: `Your recent gap suggests you may do better if you ${label}.`, evidence: recovery.usualReturnDays ? `Based on your previous return gaps; your usual return is about ${recovery.usualReturnDays} days.` : "Based on your recent return pattern." };
  }

  if (load.level === "overloaded") {
    return { icon: "🪶", title: "Reduce today's load", text: `Your current plan looks crowded. Keeping about ${Math.max(1, Number(load.suggestedVisibleCount) || 4)} important things visible may make the day easier to start.`, evidence: `Based on ${load.active || 0} active items, ${load.incomplete || 0} unfinished items, and today's energy/capacity.` };
  }

  const struggling = profiles
    .filter((profile) => profile && profile.confidence !== "learning" && ["Fragile", "Recovering"].includes(profile.stability))
    .sort((a, b) => (b.evidence || 0) - (a.evidence || 0))[0];
  if (struggling) {
    const timing = struggling.preferredPeriod ? ` Moving it toward ${struggling.preferredPeriod} may help.` : "";
    const friction = struggling.dominantMissReason ? ` The most common friction PlushLife has seen is “${String(struggling.dominantMissReason).replaceAll("_", " ")}.”` : "";
    return { icon: "🌱", title: `Make “${struggling.label}” easier`, text: `This habit looks ${struggling.stability.toLowerCase()} right now.${timing}${friction}`, evidence: `Based on ${struggling.observedDays || 0} observed days${struggling.evidence ? ` · ${struggling.evidence}% evidence confidence` : ""}.` };
  }

  if (cross.confidence !== "learning" && Number.isFinite(cross.lowEnergyCompletion) && Number.isFinite(cross.usualEnergyCompletion) && cross.usualEnergyCompletion - cross.lowEnergyCompletion >= 15) {
    return { icon: "🌙", title: "Protect low-energy days", text: "Your routines tend to land less often when energy is low. Consider using Tiny versions or fewer essentials before the day gets overloaded.", evidence: `Low-energy completion ${cross.lowEnergyCompletion}% vs. usual-energy completion ${cross.usualEnergyCompletion}%.` };
  }

  const timed = profiles
    .filter((profile) => profile && profile.confidence === "strong" && profile.preferredPeriod)
    .sort((a, b) => (b.evidence || 0) - (a.evidence || 0))[0];
  if (timed) {
    return { icon: "🕒", title: `Keep “${timed.label}” near ${timed.preferredPeriod}`, text: `That is when this habit most often gets completed.`, evidence: `Based on ${timed.completionEvents || 0} completion-time observations and ${timed.observedDays || 0} habit days.` };
  }

  return { icon: "🧭", title: "Keep collecting real days", text: "PlushLife is still learning which changes would actually help. Keep using the app normally; it will get more specific instead of guessing.", evidence: "Recommendations stay conservative until there is enough history." };
}

export function GrowthNextMove() {
  const [state, setState] = React.useState(() => readState());
  React.useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => {
      window.removeEventListener("plushlife:habit-coach-updated", refresh);
      window.removeEventListener("plushlife:habit-coach-hydrated", refresh);
    };
  }, []);

  const move = React.useMemo(() => chooseMove(state), [state]);
  return (
    <section aria-label="Best next adjustment" style={{ marginBottom: 12, padding: "13px 14px", borderRadius: 16, border: "1px solid #D8E7E2", background: "linear-gradient(145deg,#F6FCFA,#FFF9FD)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#3E746A" }}>{move.icon} BEST NEXT ADJUSTMENT</div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 900, color: "#4F405C" }}>{move.title}</div>
      <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5, color: "#637B74" }}>{move.text}</div>
      <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.45, color: "#8A9A95" }}>{move.evidence}</div>
    </section>
  );
}
