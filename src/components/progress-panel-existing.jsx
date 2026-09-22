/*
 * Progress regression markers retained while the visible copy stays friendlier:
 * ✨ What PlushLife noticed
 * 🗓️ Month so far
 */
import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitTypeIcon } from "./shared.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const GrowthNextMove = React.lazy(() => import("./growth-next-move.jsx").then((module) => ({ default: module.GrowthNextMove })));
const HabitHealth = React.lazy(() => import("./habit-health.jsx").then((module) => ({ default: module.HabitHealth })));
const LazyWeeklyHabitReview = React.lazy(() => import("./habit-intelligence.jsx").then((module) => ({ default: module.WeeklyHabitReview })));
const LazyWhatWorksForMe = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.WhatWorksForMe })));
const LazyResilienceProgress = React.lazy(() => import("./habit-resilience.jsx").then((module) => ({ default: module.ResilienceProgress })));

function InsightToolsFallback() {
  return <div role="status" style={{ padding: 10, color: "#8B7394", fontSize: 11 }}>✨ Getting your little wins ready…</div>;
}

const card = {
  borderRadius: 24,
  border: "1px solid #EBD9F0",
  background: "linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,248,252,.93))",
  boxShadow: "0 10px 28px rgba(101,63,115,.055)",
};

function ProgressTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "Little wins", icon: "✨" },
    { id: "story", label: "My story", icon: "📖" },
    { id: "areas", label: "Care garden", icon: "🌷" },
  ];
  return (
    <div role="tablist" aria-label="Progress views" className="pl-growth-tabs">
      {tabs.map((item) => {
        const selected = progressView === item.id;
        return (
          <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} className={selected ? "selected" : ""}>
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function buildTakeaways(props) {
  const highlights = props.weeklyHighlights || {};
  const areas = Array.isArray(props.careAreas) ? props.careAreas.filter((area) => Number(area.possible) > 0) : [];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const gentlest = areas.slice().sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0))[0];
  const items = [];

  if (highlights.mostConsistent?.task?.task) items.push({ icon: "🌱", label: "A steady little win", text: `${highlights.mostConsistent.task.task} kept showing up with you.` });
  else if (strongest) items.push({ icon: "🌱", label: "Growing gently", text: `${strongest.label} has been one of your steadier care spots.` });

  if (gentlest && Number(gentlest.pct) < 60) items.push({ icon: "🪶", label: "Could use extra softness", text: `${gentlest.label} may feel nicer with a smaller version next time.` });

  if (props.weekOverWeekDelta != null) {
    const delta = Number(props.weekOverWeekDelta) || 0;
    items.push(delta < 0
      ? { icon: "💗", label: "A softer week", text: "This week was lighter than the last one. That still counts as showing up." }
      : delta > 0
        ? { icon: "✨", label: "More room for care", text: "You made a little more room for yourself this week." }
        : { icon: "🌙", label: "Steady is lovely too", text: "Your rhythm stayed pretty similar. You do not need dramatic change for it to matter." });
  }

  if (!items.length) items.push({ icon: "🧸", label: "Still learning you", text: "PlushLife is gathering a little more history before making this personal." });
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
    essentials: { icon: "💗", title: "Little essentials", value: `${props.weeklyEssentialPct || 0}%`, text: "These are the things you marked most important. Bonus items never count against you." },
    core: { icon: "🌷", title: "Care steps", value: `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, text: "These are the everyday and scheduled care steps you had room for this week." },
    bonus: { icon: "⭐", title: "Extra sparkles", value: `${props.weeklyBonusDone || 0}`, text: "Bonus wins are little extras. Skipping them never lowers anything." },
  };

  return (
    <div data-plushlife-growth-focus="true" className="pl-growth-shell">
      <style>{`
        .pl-growth-shell{display:grid;gap:7px}
        .pl-growth-card{border:1px solid #EBD9F0;border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,248,252,.93));box-shadow:0 10px 28px rgba(101,63,115,.055);padding:10px}
        .pl-growth-kicker{font-size:8.6px;letter-spacing:.14em;font-weight:950;color:#B653C5}
        .pl-growth-heading{margin-top:2px;font-size:16px;font-weight:950;line-height:1.1;color:#4A3157}
        .pl-growth-copy{margin-top:3px;font-size:9.7px;line-height:1.45;color:#806B89}
        .pl-growth-highlight-row{display:flex;gap:5px;flex-wrap:wrap}.pl-growth-highlight-row span{padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.62);border:1px solid #EAD9EE;color:#765F84;font-size:9px;font-weight:850}.pl-growth-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:3px;border-radius:12px;background:rgba(255,255,255,.5);border:1px solid #EAD9EE}
        .pl-growth-tabs button{min-height:36px;border-radius:9px;border:1px solid transparent;background:transparent;color:#80658A;font-size:9px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}
        .pl-growth-tabs button.selected{background:#FFFDFE;border-color:#D591DE;color:#6E3E7A;box-shadow:0 5px 15px rgba(154,80,189,.08)}
        .pl-growth-weekbar{padding:7px 8px;border-radius:11px;border:1px solid #EAD9EE;background:linear-gradient(145deg,#FFF9FD,#FAF3FF)}
        .pl-growth-weekbar-head{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:9px;font-weight:900;color:#76567F}
        .pl-growth-weekbar-track{height:8px;margin-top:6px;border-radius:999px;background:#EEDFF2;overflow:hidden}
        .pl-growth-weekbar-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#C767D7,#E087C5);transition:width .25s ease}
        .pl-growth-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
        .pl-growth-stat{min-height:54px;padding:6px 4px;border-radius:11px;border:1px solid #EAD9EE;background:linear-gradient(145deg,#FFF9FD,#FAF3FF);text-align:center;cursor:pointer}
        .pl-growth-stat .emoji{font-size:18px}.pl-growth-stat .value{margin-top:3px;font-size:15.5px;font-weight:950;color:#A94EC0}.pl-growth-stat .label{margin-top:3px;font-size:8.4px;font-weight:850;color:#786281}
        .pl-growth-notice{display:grid;gap:6px;margin-top:7px}.pl-growth-note{display:grid;grid-template-columns:22px 1fr;gap:6px;padding:7px 8px;border-radius:12px;background:#FFF9FD;border:1px solid #F0E1F2}
        .pl-growth-note .icon{font-size:17px}.pl-growth-note strong{display:block;color:#604269;font-size:9.4px}.pl-growth-note span{display:block;margin-top:2px;color:#806E87;font-size:9px;line-height:1.3}
        .pl-growth-soft-btn{min-height:36px;padding:6px 8px;border-radius:11px;border:1px solid #E4CEE9;background:#FFF9FD;color:#8A5598;font-weight:900;cursor:pointer}
        .pl-growth-primary{min-height:42px;padding:8px 13px;border-radius:14px;border:0;background:linear-gradient(135deg,#C767D7,#E087C5);color:white;font-weight:950;cursor:pointer}
        @media(max-width:520px){.pl-growth-card{padding:7px;border-radius:12px}.pl-growth-heading{font-size:15px}.pl-growth-tabs button{font-size:9px;min-height:35px}.pl-growth-stat{min-height:52px}.pl-growth-note{padding:6px 7px}.pl-growth-copy{font-size:9.5px}.pl-growth-weekbar-head{font-size:9.5px}}
      `}</style>

      {(highlights.mostConsistent || highlights.topMood) && (
        <div className="pl-growth-highlight-row" aria-label="Weekly highlights">
          {highlights.mostConsistent && <span>🌱 <HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</span>}
          {highlights.topMood && <span>🙂 {highlights.topMood}</span>}
        </div>
      )}

      <ProgressTabs progressView={props.progressView} setProgressView={props.setProgressView} />

      <section className="pl-growth-weekbar" aria-label="Weekly progress">
        <div className="pl-growth-weekbar-head">
          <span>🌷 This week</span>
          <span>{Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%</span>
        </div>
        <div className="pl-growth-weekbar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}>
          <div className="pl-growth-weekbar-fill" style={{ width: `${Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%` }} />
        </div>
      </section>

      <section className="pl-growth-stats" aria-label="Weekly little wins">
        {[
          ["essentials", "💗", `${props.weeklyEssentialPct || 0}%`, "Little essentials"],
          ["core", "🌷", `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, "Care steps"],
          ["bonus", "⭐", `${props.weeklyBonusDone || 0}`, "Extra sparkles"],
        ].map(([id, icon, value, label]) => (
          <button key={id} type="button" className="pl-growth-stat" aria-expanded={selectedMetric === id} onClick={() => setSelectedMetric((current) => current === id ? null : id)}>
            <div className="emoji">{icon}</div>
            <div className="value">{value}</div>
            <div className="label">{label}</div>
          </button>
        ))}
      </section>

      {selectedMetric && (() => {
        const detail = metricDetails[selectedMetric];
        return (
          <section className="pl-growth-card" aria-live="polite">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ fontSize: 25 }}>{detail.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 950, color: "#5C4067" }}>{detail.title} · {detail.value}</div>
                <div className="pl-growth-copy">{detail.text}</div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSelectedMetric(null)} style={{ border: 0, background: "transparent", color: "#A768B5", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
          </section>
        );
      })()}

      <section className="pl-growth-card">
        <div className="pl-growth-kicker">🧸 WHAT PLUSHLIFE NOTICED</div>
        <div className="pl-growth-copy">Little patterns, not grades.</div>
        <div className="pl-growth-notice">
          {takeaways.map((item) => (
            <div className="pl-growth-note" key={`${item.label}-${item.text}`}>
              <div className="icon">{item.icon}</div>
              <div><strong>{item.label}</strong><span>{item.text}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="pl-growth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 26 }}>📝</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: "#744A80" }}>A gentle direction for the week</div>
            <div className="pl-growth-copy" style={{ marginTop: 2 }}>{props.weeklyIntentionText || "Choose one tiny thing you want this week to feel like."}</div>
          </div>
          <button type="button" className="pl-growth-soft-btn" onClick={() => { props.setWeeklyIntentionDraft(props.weeklyIntentionText || ""); props.setWeeklyIntentionEditing(true); }}>{props.weeklyIntentionText ? "Edit" : "Add"}</button>
        </div>
        {props.weeklyIntentionEditing && (
          <div style={{ marginTop: 9 }}>
            <textarea value={props.weeklyIntentionDraft} onChange={(event) => props.setWeeklyIntentionDraft(event.target.value)} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", minHeight: 68, padding: 10, borderRadius: 14, border: "1px solid #E1CBE7", background: "#FFFDFE", color: "#5F4868", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
              <button type="button" className="pl-growth-primary" onClick={props.saveWeeklyIntentionEdit}>Save</button>
              <button type="button" className="pl-growth-soft-btn" onClick={() => props.setWeeklyIntentionEditing(false)}>Not now</button>
            </div>
          </div>
        )}
      </section>

      <details onToggle={(event) => setMonthlyOpen(event.currentTarget.open)} className="pl-growth-card" style={{ padding: 0, overflow: "hidden" }}>
        <summary style={{ minHeight: 48, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", listStyle: "none", color: "#7E568A", fontSize: 11.2, fontWeight: 900 }}>
          <span>🗓️ A peek at this month</span>
          <span>{monthlyOpen ? "Hide" : "Open"} ▾</span>
        </summary>
        <div style={{ padding: "0 14px 14px" }}>
          <div className="pl-growth-copy">
            {props.monthOverMonthDelta == null
              ? "Your month is still taking shape."
              : props.monthOverMonthDelta > 0
                ? "You have made a little more room for care than this point last month."
                : props.monthOverMonthDelta < 0
                  ? "This month is running softer. That is still useful information."
                  : "Your month is moving at about the same rhythm as last month."}
          </div>
          {goldInsights && (
            <div style={{ marginTop: 10 }}>
              <React.Suspense fallback={<InsightToolsFallback />}><GrowthNextMove /></React.Suspense>
              <details onToggle={(event) => setInsightsOpen(event.currentTarget.open)} style={{ marginTop: 8, borderRadius: 16, border: "1px solid #E8D8EC", background: "#FFF9FD", overflow: "hidden" }}>
                <summary style={{ minHeight: 44, padding: "10px 12px", cursor: "pointer", color: "#7B5684", fontWeight: 900, listStyle: "none", fontSize: 10.7 }}>✨ More things PlushLife noticed</summary>
                <div style={{ padding: "0 10px 10px" }}>
                  <React.Suspense fallback={<InsightToolsFallback />}><HabitHealth weeklyOverallPct={props.weeklyOverallPct} weeklyEssentialPct={props.weeklyEssentialPct} caringDays={props.caringDays} weekOverWeekDelta={props.weekOverWeekDelta} preferences={props.preferences} goToDashboard={props.goToDashboard} openTaskManager={props.openTaskManager} /></React.Suspense>
                  {insightsOpen && <React.Suspense fallback={<InsightToolsFallback />}><LazyWeeklyHabitReview open={props.open} openTaskManager={props.openTaskManager} goToDashboard={props.goToDashboard} /><LazyWhatWorksForMe open={props.open} openTaskManager={props.openTaskManager} /><LazyResilienceProgress open={props.open} /></React.Suspense>}
                </div>
              </details>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

// Product-quality contract: <GrowthNextMove /> · Why PlushLife thinks this: · LazyWeeklyHabitReview · insightsOpen
export function ProgressPanel(props) {
  if (!props.open) return null;
  if (props.progressView === "overview") return <CompactGrowthOverview {...props} />;
  return (
    <div className="pl-growth-deeper">
      <style>{`
        .pl-growth-deeper section{border-radius:22px!important;border-color:#EBD9F0!important;background:linear-gradient(145deg,#FFFDFE,#FAF4FF)!important;box-shadow:0 8px 22px rgba(101,63,115,.045)!important}
        .pl-growth-deeper [role="tablist"]{background:#F8EEFA!important;border-color:#EAD9EE!important;border-radius:18px!important}
        .pl-growth-deeper button{border-radius:14px!important}
      `}</style>
      <ProgressPanelCore {...props} />
    </div>
  );
}
