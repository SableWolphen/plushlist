import { ThemeScene } from "./theme-world.jsx";
/*
 * Progress regression markers retained while the visible copy stays friendlier:
 * ✨ What PlushLife noticed
 * 🗓️ Month so far
 */
import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const GrowthNextMove = React.lazy(() => import("./growth-next-move.jsx").then((module) => ({ default: module.GrowthNextMove })));
const HabitHealth = React.lazy(() => import("./habit-health.jsx").then((module) => ({ default: module.HabitHealth })));
const LazyWeeklyHabitReview = React.lazy(() => import("./habit-intelligence.jsx").then((module) => ({ default: module.WeeklyHabitReview })));
const LazyWhatWorksForMe = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.WhatWorksForMe })));
const LazyResilienceProgress = React.lazy(() => import("./habit-resilience.jsx").then((module) => ({ default: module.ResilienceProgress })));

function InsightToolsFallback() {
  return <div role="status" style={{ padding: 10, color: "var(--pl-theme-muted,#8B7394)", fontSize: 11 }}>✨ Getting your little wins ready…</div>;
}

const card = {
  borderRadius: 24,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "var(--pl-theme-surface)",
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
  const [morePatterns, setMorePatterns] = React.useState(false);
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
        .pl-growth-shell{display:grid;gap:9px}
        .pl-growth-card{position:relative;overflow:hidden;border:1px solid rgba(225,204,233,.78);border-radius:24px;background:var(--pl-theme-surface);box-shadow:0 10px 26px rgba(101,63,115,.07),inset 0 1px 0 rgba(255,255,255,.88);padding:13px}
        .pl-growth-card:before{content:"";position:absolute;width:72px;height:72px;border-radius:50%;right:-30px;top:-34px;background:radial-gradient(circle,rgba(239,178,226,.18),rgba(213,200,255,.08) 60%,transparent 72%);pointer-events:none}
        .pl-growth-kicker{position:relative;font-size:9px;letter-spacing:.15em;font-weight:950;color:var(--pl-theme-ink)}
        .pl-growth-heading{margin-top:3px;font-size:17px;font-weight:950;line-height:1.08;color:var(--pl-theme-ink);letter-spacing:-.02em}
        .pl-growth-copy{position:relative;margin-top:4px;font-size:10px;line-height:1.45;color:var(--pl-theme-ink)}
        .pl-growth-highlight-row{display:flex;gap:6px;flex-wrap:wrap}
        .pl-growth-highlight-row span{padding:5px 9px;border-radius:999px;background:var(--pl-theme-surface);border:1px solid var(--pl-theme-line);color:var(--pl-theme-ink);font-size:9.4px;font-weight:900;box-shadow:0 4px 10px rgba(112,73,130,.04)}
        .pl-growth-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:4px;border-radius:20px;background:var(--pl-theme-surface-2);border:1px solid var(--pl-theme-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.82)}
        .pl-growth-tabs button{min-height:44px;border-radius:16px;border:1px solid transparent;background:transparent;color:var(--pl-theme-ink);font-size:9.6px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}
        .pl-growth-tabs button.selected{background:var(--pl-theme-surface);border-color:var(--pl-theme-line);color:var(--pl-theme-ink);box-shadow:0 5px 14px rgba(154,80,189,.08)}
        .pl-growth-weekbar{padding:10px 11px;border-radius:19px;border:1px solid var(--pl-theme-line);background:var(--pl-theme-surface);box-shadow:0 7px 18px rgba(106,72,132,.045)}
        .pl-growth-weekbar-head{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:9.8px;font-weight:950;color:var(--pl-theme-ink)}
        .pl-growth-weekbar-track{height:9px;margin-top:8px;border-radius:999px;background:var(--pl-theme-surface-2);overflow:hidden;box-shadow:inset 0 1px 2px rgba(106,74,122,.06)}
        .pl-growth-weekbar-fill{height:100%;border-radius:inherit;background:var(--pl-theme-accent);box-shadow:0 0 10px rgba(211,104,208,.18);transition:width .25s ease}
        .pl-growth-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
        .pl-growth-stat{min-height:54px;padding:9px 5px;border-radius:19px;border:1px solid var(--pl-theme-line);background:var(--pl-theme-surface);text-align:center;cursor:pointer;box-shadow:0 7px 18px rgba(109,73,132,.05);transition:transform .16s ease}
        .pl-growth-stat:nth-child(1){background:var(--pl-theme-surface)}
        .pl-growth-stat .emoji{font-size:21px}.pl-growth-stat .value{margin-top:4px;font-size:16px;font-weight:950;color:var(--pl-theme-ink)}.pl-growth-stat .label{margin-top:3px;font-size:8.7px;font-weight:900;color:var(--pl-theme-ink);line-height:1.15}
        .pl-growth-notice{display:grid;gap:7px;margin-top:9px}
        .pl-growth-note{display:grid;grid-template-columns:31px 1fr;align-items:center;gap:8px;padding:9px 10px;border-radius:17px;background:var(--pl-theme-surface);border:1px solid var(--pl-theme-line);box-shadow:0 4px 12px rgba(111,75,128,.035)}
        .pl-growth-note .icon{display:grid;place-items:center;width:31px;height:31px;border-radius:12px;background:rgba(255,255,255,.72);font-size:18px}
        .pl-growth-note strong{display:block;color:var(--pl-theme-ink);font-size:9.8px}.pl-growth-note span{display:block;margin-top:2px;color:var(--pl-theme-ink);font-size:9.2px;line-height:1.32}
        .pl-growth-soft-btn{min-height:44px;padding:7px 10px;border-radius:15px;border:1px solid var(--pl-theme-line);background:var(--pl-theme-surface);color:var(--pl-theme-ink);font-weight:950;cursor:pointer}
        .pl-growth-primary{min-height:44px;padding:8px 13px;border-radius:16px;border:0;background:var(--pl-theme-surface);color:white;font-weight:950;cursor:pointer;box-shadow:0 8px 18px rgba(190,92,203,.18)}
        .pl-growth-card textarea{box-shadow:inset 0 1px 3px rgba(104,72,120,.045)}
        .pl-growth-card summary{background:transparent!important}
        @media(max-width:520px){
          .pl-growth-shell{gap:6px}.pl-growth-card{padding:10px;border-radius:16px}.pl-growth-heading{margin-top:2px;font-size:16px}
          .pl-growth-tabs button{font-size:9.2px;min-height:44px}.pl-growth-stat{min-height:60px;border-radius:13px;padding:7px 4px}
          .pl-growth-note{padding:8px 9px;border-radius:16px}.pl-growth-copy{font-size:9.8px}.pl-growth-weekbar-head{font-size:9.5px}
        }
      `}</style>

      <header className="pl-progress-controls" aria-label="Progress highlights and views">
      {(highlights.mostConsistent || highlights.topMood) && (
        <div className="pl-growth-highlight-row" aria-label="Weekly highlights">
          {highlights.mostConsistent && <div className="pl-growth-badge"><span className="pl-badge-icon" aria-hidden="true">🌱</span><strong>{highlights.mostConsistent.task.task}</strong></div>}
          {highlights.topMood && <div className="pl-growth-badge"><span className="pl-badge-icon" aria-hidden="true">🙂</span><strong>{highlights.topMood}</strong></div>}
        </div>
      )}

      <ProgressTabs progressView={props.progressView} setProgressView={props.setProgressView} />
      </header>

      <section className="pl-growth-weekbar pl-growth-week-summary" aria-label="Weekly progress">
        <div className="pl-growth-weekbar-head">
          <span>🌷 This week</span>
          <span>{Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%</span>
        </div>
        <div className="pl-growth-weekbar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}>
          <div className="pl-growth-weekbar-fill" style={{ width: `${Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%` }} />
        </div>
        <div className="pl-growth-companion">
          <span className="pl-growth-companion-art"><ThemeScene focus decorative /></span>
          <span className="pl-growth-companion-copy"><strong>Every return counts.</strong><span>Returning counts. Your care stays yours.</span></span>
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
                <div style={{ fontWeight: 950, color: "var(--pl-theme-ink,#5C4067)" }}>{detail.title} · {detail.value}</div>
                <div className="pl-growth-copy">{detail.text}</div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSelectedMetric(null)} style={{ border: 0, background: "transparent", color: "var(--pl-theme-muted,#A768B5)", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
          </section>
        );
      })()}

      <section className="pl-growth-card">
        <div className="pl-growth-kicker">🧸 WHAT PLUSHLIFE NOTICED</div>
        <div className="pl-growth-copy">Little patterns, not grades.</div>
        <div className="pl-growth-notice">
          {(morePatterns ? takeaways : takeaways.slice(0, 1)).map((item) => (
            <div className="pl-growth-note" key={`${item.label}-${item.text}`}>
              <div className="icon">{item.icon}</div>
              <div><strong>{item.label}</strong><span>{item.text}</span></div>
            </div>
          ))}
        </div>
        {takeaways.length > 1 && <button type="button" className="pl-collection-more" aria-expanded={morePatterns} onClick={() => setMorePatterns(value => !value)}>{morePatterns ? "Show less" : "More little patterns"}</button>}
      </section>

      <section className="pl-growth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 26 }}>📝</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: "var(--pl-theme-ink,#744A80)" }}>A gentle direction for the week</div>
            <div className="pl-growth-copy" style={{ marginTop: 2 }}>{props.weeklyIntentionText || "Choose one tiny thing you want this week to feel like."}</div>
          </div>
          <button type="button" className="pl-growth-soft-btn" onClick={() => { props.setWeeklyIntentionDraft(props.weeklyIntentionText || ""); props.setWeeklyIntentionEditing(true); }}>{props.weeklyIntentionText ? "Edit" : "Add"}</button>
        </div>
        {props.weeklyIntentionEditing && (
          <div style={{ marginTop: 9 }}>
            <textarea value={props.weeklyIntentionDraft} onChange={(event) => props.setWeeklyIntentionDraft(event.target.value)} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", minHeight: 68, padding: 10, borderRadius: 14, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFFDFE)", color: "var(--pl-theme-ink,#5F4868)", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
              <button type="button" className="pl-growth-primary" onClick={props.saveWeeklyIntentionEdit}>Save</button>
              <button type="button" className="pl-growth-soft-btn" onClick={() => props.setWeeklyIntentionEditing(false)}>Not now</button>
            </div>
          </div>
        )}
      </section>

      <details onToggle={(event) => setMonthlyOpen(event.currentTarget.open)} className="pl-growth-card" style={{ padding: 0, overflow: "hidden" }}>
        <summary style={{ minHeight: 48, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", listStyle: "none", color: "var(--pl-theme-ink,#7E568A)", fontSize: 11.2, fontWeight: 900 }}>
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
              <details onToggle={(event) => setInsightsOpen(event.currentTarget.open)} style={{ marginTop: 8, borderRadius: 16, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFF9FD)", overflow: "hidden" }}>
                <summary style={{ minHeight: 44, padding: "10px 12px", cursor: "pointer", color: "var(--pl-theme-ink,#7B5684)", fontWeight: 900, listStyle: "none", fontSize: 10.7 }}>✨ More things PlushLife noticed</summary>
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
        .pl-growth-deeper section{border-radius:22px!important;border-color:var(--pl-theme-line)!important;background:var(--pl-theme-surface)!important;box-shadow:0 8px 22px rgba(101,63,115,.045)!important}
        .pl-growth-deeper [role="tablist"]{background:var(--pl-theme-surface)!important;border-color:var(--pl-theme-line)!important;border-radius:18px!important}
        .pl-growth-deeper button{border-radius:14px!important}
      `}</style>
      <ProgressPanelCore {...props} />
    </div>
  );
}
