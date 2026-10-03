const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const MOVE_HISTORY_KEY = "plushlife:growth-adjustment-history:v1";

function readState() {
  try { return JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function readMoveHistory() {
  try { return JSON.parse(localStorage.getItem(MOVE_HISTORY_KEY) || "[]") || []; }
  catch (_error) { return []; }
}

function writeMoveHistory(items) {
  try { localStorage.setItem(MOVE_HISTORY_KEY, JSON.stringify(items.slice(-12))); }
  catch (_error) {}
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
    return { icon: dayModel.intervention.kind === "comeback" ? "↺" : dayModel.intervention.kind === "trim" ? "🪶" : dayModel.intervention.kind === "smaller" ? "🌱" : "🧭", title: dayModel.intervention.title, text: dayModel.intervention.text, evidence: `${confidence} ${dayModel.uncertainty || ""}`.trim(), reason: "Your recent day pattern changed enough for PlushLife to recommend a different amount of effort." };
  }
  // Restart advice is gated behind stronger history: a computed usual return
  // from previous return gaps, not a single recent gap. Copy stays cautious —
  // one gap is never treated as a reliable pattern.
  if (recovery.recentGap >= 2 && recovery.usualReturnDays) {
    const label = recovery.suggestedRamp === "essentials" ? "restart with essentials only" : recovery.suggestedRamp === "lighter" ? "use a lighter routine for a couple of days" : "resume normally";
    return { icon: "↺", title: "Make the restart easy", text: `After a break, ${label} is a gentle way back in.`, evidence: `Based on your previous return gaps; your usual return is about ${recovery.usualReturnDays} days. One gap is not a pattern, so treat this as a suggestion, not a rule.`, reason: "PlushLife noticed a break in your usual rhythm and is avoiding catch-up pressure." };
  }
  if (load.level === "overloaded") return { icon: "🪶", title: "Reduce today's load", text: `Your current plan looks crowded. Keeping about ${Math.max(1, Number(load.suggestedVisibleCount) || 4)} important things visible may make the day easier to start.`, evidence: `Based on ${load.active || 0} active items, ${load.incomplete || 0} unfinished items, and today's energy/capacity.`, reason: "The amount still open today is higher than the load PlushLife thinks is comfortable right now." };

  const struggling = profiles.filter((profile) => profile && profile.confidence !== "learning" && ["Fragile", "Recovering"].includes(profile.stability)).sort((a, b) => (b.evidence || 0) - (a.evidence || 0))[0];
  if (struggling) {
    const timing = struggling.preferredPeriod ? ` Moving it toward ${struggling.preferredPeriod} may help.` : "";
    const friction = struggling.dominantMissReason ? ` The most common friction PlushLife has seen is “${String(struggling.dominantMissReason).replaceAll("_", " ")}.”` : "";
    return { icon: "🌱", title: `Make “${struggling.label}” easier`, text: `This habit looks ${struggling.stability.toLowerCase()} right now.${timing}${friction}`, evidence: `Based on ${struggling.observedDays || 0} observed days${struggling.evidence ? ` · ${struggling.evidence}% evidence confidence` : ""}.`, reason: `This habit has enough repeated history to look harder than your steadier habits${struggling.preferredPeriod ? `, with better results around ${struggling.preferredPeriod}` : ""}.` };
  }
  if (cross.confidence !== "learning" && Number.isFinite(cross.lowEnergyCompletion) && Number.isFinite(cross.usualEnergyCompletion) && cross.usualEnergyCompletion - cross.lowEnergyCompletion >= 15) return { icon: "🌙", title: "Protect low-energy days", text: "Your routines tend to land less often when energy is low. Consider using Tiny versions or fewer essentials before the day gets overloaded.", evidence: `Low-energy completion ${cross.lowEnergyCompletion}% vs. usual-energy completion ${cross.usualEnergyCompletion}%.`, reason: "Your own completion pattern changes noticeably when your energy is lower." };

  const timed = profiles.filter((profile) => profile && profile.confidence === "strong" && profile.preferredPeriod).sort((a, b) => (b.evidence || 0) - (a.evidence || 0))[0];
  if (timed) return { icon: "🕒", title: `Keep “${timed.label}” near ${timed.preferredPeriod}`, text: "That is when this habit most often gets completed.", evidence: `Based on ${timed.completionEvents || 0} completion-time observations and ${timed.observedDays || 0} habit days.`, reason: "PlushLife has seen the same timing advantage enough times to treat it as a useful clue." };

  return { icon: "🧭", title: "Keep collecting real days", text: "PlushLife is still learning which changes would actually help. Keep using the app normally; it will get more specific instead of guessing.", evidence: "Recommendations stay conservative until there is enough history.", reason: "There is not enough repeated evidence yet to justify changing your routine." };
}

function learningSummary(state) {
  const engine = state.meta?.__background_engine || {};
  const profiles = Object.values(engine.habitProfiles || {}).filter(Boolean);
  const strong = profiles.filter((profile) => profile.confidence === "strong");
  const growing = profiles.filter((profile) => profile.confidence && profile.confidence !== "learning" && profile.confidence !== "strong");
  const learning = profiles.filter((profile) => profile.confidence === "learning" || !profile.confidence);
  const lines = [];
  if (strong.length) lines.push(`${strong.length} habit pattern${strong.length === 1 ? " is" : "s are"} backed by stronger evidence.`);
  if (engine.crossPatterns?.confidence && engine.crossPatterns.confidence !== "learning") lines.push("Energy and completion patterns are becoming reliable enough to compare.");
  if (engine.recovery?.usualReturnDays) lines.push(`Your typical return after a break is about ${engine.recovery.usualReturnDays} day${engine.recovery.usualReturnDays === 1 ? "" : "s"}.`);
  if (!lines.length) lines.push("PlushLife is still collecting enough repeated days to separate a pattern from a one-off day.");
  const unsure = learning.length ? `${learning.length} habit${learning.length === 1 ? " is" : "s are"} still in the learning stage.` : "Nothing important is being treated as certain without evidence.";
  return { knows: lines.slice(0, 3), unsure, strong: strong.length, growing: growing.length, learning: learning.length, total: profiles.length };
}

function changeSinceYesterday(history) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const age = Date.now() - new Date(latest?.at || 0).getTime();
  if (!Number.isFinite(age) || age > 36 * 3600000) return null;
  if (!latest?.title || latest.title === previous?.title) return null;
  return { from: previous?.title || "the previous suggestion", to: latest.title, reason: latest.reason || latest.text || "Your recent pattern shifted." };
}

export function GrowthNextMove() {
  const [state, setState] = React.useState(() => readState());
  const [history, setHistory] = React.useState(() => readMoveHistory());
  React.useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => { window.removeEventListener("plushlife:habit-coach-updated", refresh); window.removeEventListener("plushlife:habit-coach-hydrated", refresh); };
  }, []);

  const move = React.useMemo(() => chooseMove(state), [state]);
  const summary = React.useMemo(() => learningSummary(state), [state]);
  const recentChange = React.useMemo(() => changeSinceYesterday(history), [history]);

  React.useEffect(() => {
    if (!move?.title) return;
    const current = readMoveHistory();
    const last = current[current.length - 1];
    if (last?.title === move.title && last?.text === move.text) return;
    const next = [...current, { title: move.title, text: move.text, reason: move.reason, at: new Date().toISOString() }].slice(-12);
    writeMoveHistory(next);
    setHistory(next);
  }, [move.title, move.text, move.reason]);

  return <>
    <section aria-label="Growth at a glance" style={{ marginBottom: 10, padding: "10px 11px", borderRadius: 14, border: "1px solid var(--pl-theme-line)", background: "var(--pl-theme-surface)" }}>
      <div style={{ fontSize: 9.8, letterSpacing: ".12em", fontWeight: 900, color: "var(--pl-theme-ink)" }}>10-SECOND GROWTH CHECK</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginTop: 7 }}>
        <div style={{ padding: "7px 8px", borderRadius: 10, background: "var(--pl-theme-surface)" }}><div style={{ fontSize: 15, fontWeight: 900, color: "var(--pl-theme-ink)" }}>{summary.strong}</div><div style={{ fontSize: 9.7, color: "var(--pl-theme-ink)" }}>strong clues</div></div>
        <div style={{ padding: "7px 8px", borderRadius: 10, background: "var(--pl-theme-surface)" }}><div style={{ fontSize: 15, fontWeight: 900, color: "var(--pl-theme-ink)" }}>{summary.growing}</div><div style={{ fontSize: 9.7, color: "var(--pl-theme-ink)" }}>growing clues</div></div>
        <div style={{ padding: "7px 8px", borderRadius: 10, background: "var(--pl-theme-surface)" }}><div style={{ fontSize: 15, fontWeight: 900, color: "var(--pl-theme-ink)" }}>{summary.learning}</div><div style={{ fontSize: 9.7, color: "var(--pl-theme-ink)" }}>still learning</div></div>
      </div>
    </section>

    {recentChange && <section aria-label="What changed since yesterday" style={{ marginBottom: 10, padding: "9px 10px", borderRadius: 13, border: "1px solid var(--pl-theme-line)", background: "var(--pl-theme-surface)" }}>
      <div style={{ fontSize: 9.8, letterSpacing: ".1em", fontWeight: 900, color: "var(--pl-theme-ink)" }}>↻ WHAT CHANGED SINCE YESTERDAY</div>
      <div style={{ marginTop: 3, fontSize: 11.2, lineHeight: 1.42, color: "var(--pl-theme-ink)" }}>PlushLife shifted from <strong>{recentChange.from}</strong> to <strong>{recentChange.to}</strong>.</div>
      <div style={{ marginTop: 3, fontSize: 10.2, lineHeight: 1.4, color: "var(--pl-theme-ink)" }}>{recentChange.reason}</div>
    </section>}

    <section aria-label="Plush Coach: best next adjustment" style={{ marginBottom: 12, padding: "13px 14px", borderRadius: 16, border: "1px solid var(--pl-theme-line)", background: "var(--pl-theme-surface)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "var(--pl-theme-ink)" }}>🧭 PLUSH COACH</div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 900, color: "var(--pl-theme-ink)" }}>{move.icon} {move.title}</div>
      <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5, color: "var(--pl-theme-ink)" }}>{move.text}</div>
      <details style={{ marginTop: 7 }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "var(--pl-theme-ink)", fontSize: 11, fontWeight: 900 }}>Why this suggestion?</summary><div style={{ padding: "7px 9px", borderRadius: 10, background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink)", fontSize: 10.7, lineHeight: 1.45 }}><strong>Why PlushLife changed this:</strong> {move.reason}<div style={{ marginTop: 4, color: "var(--pl-theme-ink)" }}>{move.evidence}</div></div></details>
    </section>

    <section aria-label="What PlushLife knows" style={{ marginBottom: 12, padding: "12px 13px", borderRadius: 16, border: "1px solid var(--pl-theme-line)", background: "var(--pl-theme-surface)" }}>
      <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "var(--pl-theme-ink)" }}>✨ WHAT PLUSHLIFE KNOWS LATELY</div>
      <div style={{ display: "grid", gap: 5, marginTop: 7 }}>{summary.knows.map((line) => <div key={line} style={{ fontSize: 11, lineHeight: 1.42, color: "var(--pl-theme-ink)" }}>• {line}</div>)}</div>
      <div style={{ marginTop: 8, paddingTop: 7, borderTop: "1px solid var(--pl-theme-line)", fontSize: 10.5, lineHeight: 1.4, color: "var(--pl-theme-ink)" }}><strong>Still learning:</strong> {summary.unsure}</div>
    </section>

    {history.length > 1 && <details style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 14, border: "1px solid var(--pl-theme-line)", background: "var(--pl-theme-surface)" }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "var(--pl-theme-ink)", fontSize: 11.2, fontWeight: 900 }}>🧭 What PlushLife changed and why</summary><div style={{ display: "grid", gap: 7, marginTop: 5 }}>{history.slice(-5).reverse().map((item, index) => <div key={`${item.at}-${index}`} style={{ padding: "8px 9px", borderRadius: 10, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line)" }}><div style={{ fontSize: 11, fontWeight: 900, color: "var(--pl-theme-ink)" }}>{item.title}</div><div style={{ marginTop: 2, fontSize: 10.3, lineHeight: 1.4, color: "var(--pl-theme-ink)" }}>{item.reason || item.text}</div></div>)}</div></details>}
  </>;
}
