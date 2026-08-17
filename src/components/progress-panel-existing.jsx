import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitTypeIcon } from "./shared.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const GrowthNextMove = React.lazy(() => import("./growth-next-move.jsx").then((module) => ({ default: module.GrowthNextMove })));
const HabitHealth = React.lazy(() => import("./habit-health.jsx").then((module) => ({ default: module.HabitHealth })));
const LazyWeeklyHabitReview = React.lazy(() => import("./habit-intelligence.jsx").then((module) => ({ default: module.WeeklyHabitReview })));
const LazyWhatWorksForMe = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.WhatWorksForMe })));
const LazyResilienceProgress = React.lazy(() => import("./habit-resilience.jsx").then((module) => ({ default: module.ResilienceProgress })));

function InsightToolsFallback() {
  return <div role="status" style={{ padding: 10, color: "#71857F", fontSize: 11.5 }}>Loading deeper habit insights…</div>;
}

const card = {
  borderRadius: 14,
  border: "1px solid rgba(220,204,230,.88)",
  background: "rgba(255,255,255,.88)",
  boxShadow: "0 3px 10px rgba(151,112,173,.05)",
};

function ProgressTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "story", label: "Your story", icon: "📖" },
    { id: "areas", label: "Care areas", icon: "🪴" },
  ];
  return <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 4, padding: 4, borderRadius: 13, background: "rgba(246,235,251,.68)", border: "1px solid #E5D4EE" }}>
    {tabs.map((item) => {
      const selected = progressView === item.id;
      return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minHeight: 42, minWidth: 0, padding: "6px 4px", borderRadius: 10, border: selected ? "2px solid #9850BC" : "1px solid transparent", background: selected ? "#FFFFFF" : "transparent", color: selected ? "#53365F" : "#866895", boxShadow: selected ? "0 2px 7px rgba(154,80,189,.08)" : "none", fontSize: 10.2, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.icon} {item.label}</button>;
    })}
  </div>;
}

function buildTakeaways(props) {
  const highlights = props.weeklyHighlights || {};
  const areas = Array.isArray(props.careAreas) ? props.careAreas.filter((area) => Number(area.possible) > 0) : [];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const gentlest = areas.slice().sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0))[0];
  const items = [];

  if (highlights.mostConsistent?.task?.task) items.push({ icon: "🌱", label: "Helped", text: `${highlights.mostConsistent.task.task} was your steadiest routine.` });
  else if (strongest) items.push({ icon: "🌱", label: "Helped", text: `${strongest.label} was your steadiest care area at ${strongest.pct}%.` });

  if (gentlest && Number(gentlest.pct) < 60) items.push({ icon: "🪶", label: "Harder", text: `${gentlest.label} was the heaviest area this week. Keeping it lighter may fit better.` });

  if (props.weekOverWeekDelta != null) {
    const delta = Number(props.weekOverWeekDelta) || 0;
    items.push(delta < 0
      ? { icon: "💜", label: "Notice", text: `This week was ${Math.abs(delta)}% lighter than last week. A softer week is still useful data.` }
      : delta > 0
        ? { icon: "✨", label: "Notice", text: `Your overall care was ${delta}% higher than last week. Notice the pattern without turning it into pressure.` }
        : { icon: "🌙", label: "Notice", text: "Your rhythm was close to last week. Steady can be useful progress too." });
  }

  if (!items.length) items.push({ icon: "✨", label: "Learning", text: "PlushLife is still gathering enough history to make this more personal." });
  return items.slice(0, 3);
}

function CompactGrowthOverview(props) {
  const [monthlyOpen, setMonthlyOpen] = React.useState(false);
  const [insightsOpen, setInsightsOpen] = React.useState(false);
  const [selectedMetric, setSelectedMetric] = React.useState(null);
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  const highlights = props.weeklyHighlights || {};
  const takeaways = buildTakeaways(props);
  const metricDetails = {
    essentials: { icon: "💜", title: "Essentials", value: `${props.weeklyEssentialPct || 0}%`, tone: "#8F46AF", text: `You completed ${props.weeklyEssentialPct || 0}% of the things marked essential. Bonus items never lower this number.` },
    core: { icon: "🗓️", title: "Core + scheduled", value: `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, tone: "#347FCF", text: `${props.weeklyOverallDone || 0} of ${props.weeklyOverallPossible || 0} core and scheduled items were completed this week.` },
    bonus: { icon: "⭐", title: "Bonus wins", value: `${props.weeklyBonusDone || 0}`, tone: "#C88A00", text: `${props.weeklyBonusDone || 0} bonus ${Number(props.weeklyBonusDone) === 1 ? "win" : "wins"}. Bonus tasks are extra care and never count against you.` },
  };

  return <div data-plushlife-growth-focus="true" style={{ display: "grid", gap: 8, width: "100%", margin: 0 }}>
    <section style={{ ...card, padding: "13px 14px 12px", background: "linear-gradient(145deg,rgba(255,255,255,.95),rgba(252,247,255,.92))" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, letterSpacing: ".14em", fontWeight: 900, color: "#9850BC" }}>THIS WEEK · MON–SUN</div>
          <div style={{ marginTop: 3, fontSize: 18, lineHeight: 1.08, fontWeight: 900, color: "#34283D" }}>PlushGrowth ✨</div>
        </div>
        <strong style={{ flexShrink: 0, fontSize: 29, lineHeight: .95, color: "#9442BC" }}>{props.weeklyOverallPct || 0}%</strong>
      </div>
      <div style={{ height: 7, marginTop: 10, overflow: "hidden", borderRadius: 99, background: "#EEE3F4" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%`, borderRadius: 99, background: "linear-gradient(90deg,#A84DCA,#55B9EF)" }} /></div>
      <div style={{ marginTop: 8, fontSize: 11.2, lineHeight: 1.4, color: "#665473" }}>You made room for essentials on <strong style={{ color: "#8E4EAA" }}>{props.caringDays || 0} caring {Number(props.caringDays) === 1 ? "day" : "days"}</strong>.</div>
      {(highlights.mostConsistent || highlights.topMood) && <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 7, paddingTop: 7, borderTop: "1px solid #EEE3F1", fontSize: 9.9, lineHeight: 1.35, color: "#786682" }}>
        {highlights.mostConsistent && <span>🌱 Steady: <strong><HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</strong></span>}
        {highlights.topMood && <span>🙂 Check-in: <strong>{highlights.topMood}</strong></span>}
      </div>}
    </section>

    <ProgressTabs progressView={props.progressView} setProgressView={props.setProgressView} />

    <section aria-label="Weekly growth summary" style={{ ...card, padding: "5px 7px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 4 }}>
      {[
        ["essentials", "💜", `${props.weeklyEssentialPct || 0}%`, "Essentials", "#A24BC7"],
        ["core", "🗓️", `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, "Core", "#3E8EEB"],
        ["bonus", "⭐", `${props.weeklyBonusDone || 0}`, "Bonus", "#D89900"],
      ].map(([id, icon, value, label, accent]) => {
        const selected = selectedMetric === id;
        return <button key={id} type="button" aria-expanded={selected} aria-controls="plushgrowth-metric-detail" onClick={() => setSelectedMetric((current) => current === id ? null : id)} style={{ minWidth: 0, minHeight: 62, padding: "6px 3px", borderRadius: 10, border: selected ? `1px solid ${accent}` : "1px solid transparent", background: selected ? `${accent}0D` : "transparent", textAlign: "center", cursor: "pointer", font: "inherit" }}>
          <div style={{ fontSize: 14 }}>{icon}</div><div style={{ marginTop: 2, fontSize: 16, lineHeight: 1, fontWeight: 900, color: accent }}>{value}</div><div style={{ marginTop: 4, fontSize: 9.1, color: "#6F5D7B", fontWeight: 800 }}>{label}</div>
        </button>;
      })}
    </section>

    {selectedMetric && (() => {
      const detail = metricDetails[selectedMetric];
      return <section id="plushgrowth-metric-detail" aria-live="polite" style={{ ...card, padding: "9px 11px", borderColor: `${detail.tone}44` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}><div><strong style={{ fontSize: 10.5, color: detail.tone }}>{detail.icon} {detail.title} · {detail.value}</strong><div style={{ marginTop: 3, fontSize: 10.4, lineHeight: 1.4, color: "#675873" }}>{detail.text}</div></div><button type="button" aria-label="Close metric details" onClick={() => setSelectedMetric(null)} style={{ minWidth: 44, minHeight: 44, margin: "-8px -8px -8px 0", border: 0, background: "transparent", color: detail.tone, fontSize: 16, cursor: "pointer" }}>×</button></div>
      </section>;
    })()}

    <section style={{ ...card, padding: "11px 12px", background: "linear-gradient(145deg,#F5FCF8,#FFFDF7)", borderColor: "#D4E7DB" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "#347B69" }}>✨ What PlushLife noticed</div>
      <div style={{ display: "grid", gap: 7, marginTop: 7 }}>
        {takeaways.map((item) => <div key={`${item.label}-${item.text}`} style={{ display: "grid", gridTemplateColumns: "19px 1fr", gap: 5, alignItems: "start" }}><span aria-hidden="true">{item.icon}</span><div style={{ fontSize: 10.6, lineHeight: 1.4, color: "#56645F" }}><strong style={{ color: "#3F544D" }}>{item.label}:</strong> {item.text}</div></div>)}
      </div>
      <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px solid #DDE9E1", fontSize: 9.5, color: "#6B8E82" }}>Patterns, not pressure.</div>
    </section>

    <section style={{ ...card, padding: "8px 10px", background: "rgba(252,248,255,.9)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 9.8, fontWeight: 900, color: "#8A48A6" }}>📝 Weekly intention</div><div style={{ marginTop: 2, fontSize: 11.7, lineHeight: 1.25, color: "#3E3347", overflowWrap: "anywhere" }}>{props.weeklyIntentionText || "Set one gentle direction for the week"}</div></div>
        <button type="button" onClick={() => { props.setWeeklyIntentionDraft(props.weeklyIntentionText || ""); props.setWeeklyIntentionEditing(true); }} style={{ minHeight: 40, padding: "6px 9px", borderRadius: 9, border: "1px solid #D7BCE3", background: "white", color: "#8948A6", fontWeight: 900, cursor: "pointer" }}>{props.weeklyIntentionText ? "Edit" : "Add"}</button>
      </div>
      {props.weeklyIntentionEditing && <div style={{ marginTop: 8 }}><textarea value={props.weeklyIntentionDraft} onChange={(event) => props.setWeeklyIntentionDraft(event.target.value)} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", minHeight: 66, padding: 9, borderRadius: 10, border: "1px solid #D9B8E8", resize: "vertical" }} /><div style={{ display: "flex", gap: 7, marginTop: 7 }}><button type="button" onClick={props.saveWeeklyIntentionEdit} style={{ minHeight: 42, padding: "7px 11px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Save</button><button type="button" onClick={() => props.setWeeklyIntentionEditing(false)} style={{ minHeight: 42, padding: "7px 11px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900 }}>Cancel</button></div></div>}
    </section>

    <details onToggle={(event) => setMonthlyOpen(event.currentTarget.open)} style={{ ...card, overflow: "hidden" }}>
      <summary style={{ minHeight: 44, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", listStyle: "none", color: "#8847A5", fontSize: 10.8, fontWeight: 900 }}><span>🗓️ Month so far</span><span style={{ fontSize: 15 }}>{props.monthlyOverallPct || 0}% {monthlyOpen ? "▴" : "▾"}</span></summary>
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ height: 7, overflow: "hidden", borderRadius: 99, background: "#F2E8F8" }}><div style={{ width: `${Math.max(0, Math.min(100, Number(props.monthlyOverallPct) || 0))}%`, height: "100%", background: "linear-gradient(90deg,#C77DD6,#7FC8F8)" }} /></div>
        <div style={{ marginTop: 7, fontSize: 10.4, lineHeight: 1.4, color: "#806B8D" }}>{props.monthOverMonthDelta == null ? "Your month is still taking shape." : props.monthOverMonthDelta > 0 ? `${props.monthOverMonthDelta}% ahead of this point last month.` : props.monthOverMonthDelta < 0 ? `${Math.abs(props.monthOverMonthDelta)}% lighter than this point last month.` : "About the same as this point last month."}</div>
        {goldInsights && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #EDE2F2" }}>
          <React.Suspense fallback={<InsightToolsFallback />}><GrowthNextMove /></React.Suspense>
          <details onToggle={(event) => setInsightsOpen(event.currentTarget.open)} style={{ marginTop: 8, borderRadius: 11, border: "1px solid #CFE8E1", background: "#F6FCFA", overflow: "hidden" }}>
            <summary style={{ minHeight: 42, padding: "9px 10px", cursor: "pointer", color: "#3E746A", fontWeight: 900, listStyle: "none", fontSize: 10.4 }}>🌱 Deeper insights</summary>
            <div style={{ padding: "0 9px 9px" }}>
              <div style={{ marginBottom: 7, padding: "8px 9px", borderRadius: 9, background: "white", border: "1px solid #DDECE7", color: "#637B74", fontSize: 10.2, lineHeight: 1.42 }}><strong style={{ color: "#3E746A" }}>Why PlushLife thinks this:</strong> it uses your own recent habit and check-in history and stays in learning mode when evidence is thin.</div>
              <React.Suspense fallback={<InsightToolsFallback />}><HabitHealth weeklyOverallPct={props.weeklyOverallPct} weeklyEssentialPct={props.weeklyEssentialPct} caringDays={props.caringDays} weekOverWeekDelta={props.weekOverWeekDelta} preferences={props.preferences} goToDashboard={props.goToDashboard} openTaskManager={props.openTaskManager} /></React.Suspense>
              {insightsOpen && <React.Suspense fallback={<InsightToolsFallback />}><LazyWeeklyHabitReview open={props.open} openTaskManager={props.openTaskManager} goToDashboard={props.goToDashboard} /><LazyWhatWorksForMe open={props.open} openTaskManager={props.openTaskManager} /><LazyResilienceProgress open={props.open} /></React.Suspense>}
            </div>
          </details>
        </div>}
      </div>
    </details>
  </div>;
}

// Product-quality contract: <GrowthNextMove /> · Why PlushLife thinks this: · LazyWeeklyHabitReview · insightsOpen
export function ProgressPanel(props) {
  if (!props.open) return null;
  if (props.progressView === "overview") return <CompactGrowthOverview {...props} />;
  return <ProgressPanelCore {...props} />;
}
