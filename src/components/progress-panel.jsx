import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitTypeIcon } from "./shared.jsx";
import { hasGoldFeature } from "../plush-gold.js";

const GrowthNextMove = React.lazy(() => import("./growth-next-move.jsx").then((module) => ({ default: module.GrowthNextMove })));
const HabitHealth = React.lazy(() => import("./habit-health.jsx").then((module) => ({ default: module.HabitHealth })));
const LazyWeeklyHabitReview = React.lazy(() => import("./habit-intelligence.jsx").then((module) => ({ default: module.WeeklyHabitReview })));
const LazyWhatWorksForMe = React.lazy(() => import("./habit-retention.jsx").then((module) => ({ default: module.WhatWorksForMe })));
const LazyResilienceProgress = React.lazy(() => import("./habit-resilience.jsx").then((module) => ({ default: module.ResilienceProgress })));

function InsightToolsFallback() {
  return <div role="status" style={{ padding: "10px", color: "#71857F", fontSize: 11.5 }}>Loading deeper habit insights…</div>;
}

const card = {
  borderRadius: 20,
  border: "1px solid #E6D4F2",
  background: "rgba(255,255,255,.82)",
  boxShadow: "0 10px 26px rgba(183,143,224,.10)",
};

function PlushGrowthMonster() {
  return <svg aria-hidden="true" viewBox="0 0 180 170" style={{ width: "100%", maxWidth: 126, height: "auto", display: "block", filter: "drop-shadow(0 8px 10px rgba(125,91,145,.12))" }}>
    <defs>
      <radialGradient id="fur" cx="42%" cy="32%" r="72%"><stop offset="0" stopColor="#F4DFFC"/><stop offset=".55" stopColor="#DDBAF0"/><stop offset="1" stopColor="#C695DD"/></radialGradient>
      <linearGradient id="heart" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFB7C9"/><stop offset="1" stopColor="#F47FA4"/></linearGradient>
    </defs>
    <g fill="#8BCB62" opacity=".9"><ellipse cx="27" cy="143" rx="13" ry="5" transform="rotate(-22 27 143)"/><ellipse cx="151" cy="143" rx="13" ry="5" transform="rotate(22 151 143)"/></g>
    <g fill="#F4C55E" opacity=".9"><path d="M22 74l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M158 80l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>
    <ellipse cx="90" cy="140" rx="58" ry="12" fill="#B893C8" opacity=".12"/>
    <path d="M46 75c0-34 18-55 44-55 27 0 45 21 45 55v33c0 31-20 49-45 49-25 0-44-18-44-49z" fill="url(#fur)" stroke="#C48BDB" strokeWidth="2"/>
    <g fill="#E8C6F6" opacity=".8"><circle cx="55" cy="63" r="10"/><circle cx="126" cy="66" r="11"/><circle cx="52" cy="92" r="9"/><circle cx="130" cy="95" r="9"/><circle cx="68" cy="36" r="8"/><circle cx="112" cy="37" r="8"/></g>
    <ellipse cx="70" cy="145" rx="18" ry="13" fill="#D9B2EB"/><ellipse cx="111" cy="145" rx="18" ry="13" fill="#D9B2EB"/>
    <path d="M76 82c0 5-4 8-8 8s-8-3-8-8" fill="none" stroke="#71507F" strokeWidth="3" strokeLinecap="round"/><path d="M120 82c0 5-4 8-8 8s-8-3-8-8" fill="none" stroke="#71507F" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="62" cy="99" r="7" fill="#F4A8BF" opacity=".7"/><circle cx="118" cy="99" r="7" fill="#F4A8BF" opacity=".7"/>
    <path d="M84 96c4 5 8 5 12 0" fill="none" stroke="#71507F" strokeWidth="3" strokeLinecap="round"/>
    <path d="M90 127c-25-15-31-27-24-36 7-9 18-4 24 4 6-8 17-13 24-4 7 9 1 21-24 36z" fill="url(#heart)" stroke="#E66F94" strokeWidth="2"/>
    <ellipse cx="57" cy="111" rx="13" ry="9" fill="#D4A6E6" transform="rotate(-25 57 111)"/><ellipse cx="123" cy="111" rx="13" ry="9" fill="#D4A6E6" transform="rotate(25 123 111)"/>
    <path d="M90 20c2-12 9-17 19-15-2 10-8 16-19 15z" fill="#6ABF5C"/><path d="M91 20c-7-8-13-8-19-3 5 7 11 9 19 3z" fill="#8BD56D"/>
  </svg>;
}

function ProgressTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "PlushView", icon: "📊" },
    { id: "story", label: "PlushStory", icon: "📖" },
    { id: "areas", label: "PlushSpaces", icon: "🪴" },
  ];
  return <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, padding: 6, borderRadius: 18, background: "linear-gradient(135deg,#F7EDFB,#FAF2FF)", border: "1px solid #E7D5F0", boxShadow: "0 8px 20px rgba(183,143,224,.07)" }}>
    {tabs.map((item) => {
      const selected = progressView === item.id;
      return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minHeight: 50, minWidth: 0, padding: "9px 4px", borderRadius: 14, border: selected ? "2px solid #9A50BD" : "1px solid rgba(230,212,242,.8)", background: selected ? "#FFFFFF" : "rgba(255,255,255,.48)", color: selected ? "#6F3E82" : "#8C6B9E", boxShadow: selected ? "0 5px 14px rgba(166,93,193,.12)" : "none", fontSize: 11, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.icon} {item.label}</button>;
    })}
  </div>;
}

function CompactGrowthOverview(props) {
  const [monthlyOpen, setMonthlyOpen] = React.useState(false);
  const [insightsOpen, setInsightsOpen] = React.useState(false);
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  const firstInsight = props.patternInsightCards?.[props.insightCardIndex % Math.max(1, props.patternInsightCards?.length || 1)] || null;
  const highlights = props.weeklyHighlights || {};

  return <div data-plushlife-growth-focus="true" style={{ display: "grid", gap: 13 }}>
    <section style={{ ...card, padding: "19px 17px 17px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".16em", fontWeight: 900, color: "#A65DC1" }}>THIS WEEK · MON–SUN</div>
          <div style={{ marginTop: 5, fontSize: 22, lineHeight: 1.15, fontWeight: 900, color: "#493950" }}>PlushGrowth ✨</div>
        </div>
        <div style={{ flexShrink: 0, fontSize: 32, lineHeight: 1, fontWeight: 900, color: "#9948BD" }}>{props.weeklyOverallPct || 0}%</div>
      </div>
      <div style={{ height: 12, marginTop: 16, overflow: "hidden", borderRadius: 99, background: "#F0E6F7" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%`, borderRadius: 99, background: "linear-gradient(90deg,#B85FCF,#69BDF5)" }} /></div>
      <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.5, color: "#765F84" }}>You cared for your essentials on <strong style={{ color: "#8E4EAA" }}>{props.caringDays || 0} caring {Number(props.caringDays) === 1 ? "day" : "days"}</strong> this week.</div>
    </section>

    <ProgressTabs progressView={props.progressView} setProgressView={props.setProgressView} />

    <section aria-label="Weekly growth summary" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
      {[
        ["💜", `${props.weeklyEssentialPct || 0}%`, "Essentials", "#FCF7FF", "#A65DC1"],
        ["🗓️", `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, "Core + scheduled", "#F4FAFF", "#4C8FE8"],
        ["⭐", `${props.weeklyBonusDone || 0}`, "Bonus wins", "#FFFAF1", "#D59A08"],
      ].map(([icon, value, label, background, accent]) => <div key={label} style={{ minWidth: 0, padding: "14px 6px 13px", borderRadius: 19, border: "1px solid #E7DDEB", background, textAlign: "center", boxShadow: "0 7px 18px rgba(183,143,224,.06)" }}>
        <div style={{ fontSize: 22 }}>{icon}</div><div style={{ marginTop: 5, fontSize: 19, fontWeight: 900, color: accent }}>{value}</div><div style={{ marginTop: 3, fontSize: 10, lineHeight: 1.25, color: "#806B8D", fontWeight: 800 }}>{label}</div>
      </div>)}
    </section>

    <section style={{ ...card, padding: 16, background: "linear-gradient(145deg,#F4FFF8,#FFFDF9)", borderColor: "#C9E6D2", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(92px,34%)", gap: 8, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 900, color: "#318C79" }}>🌱 PlushInsights</div>
          <div style={{ display: "grid", gap: 8, marginTop: 9, color: "#596B65", fontSize: 11.8, lineHeight: 1.48 }}>
            {firstInsight ? <div style={{ padding: "9px 10px", borderRadius: 12, background: "rgba(255,255,255,.62)" }}>{firstInsight.node}</div> : <div>• PlushLife is still learning what helps your days feel easier.</div>}
            <div>• Keeping about 4 important things visible may make the day easier to start.</div>
          </div>
        </div>
        <div style={{ alignSelf: "end", justifySelf: "end", width: "100%", display: "flex", justifyContent: "center" }}><PlushGrowthMonster /></div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #DCEBE2", color: "#6F998C", fontSize: 10.5 }}>✨ Patterns, not pressure.</div>
    </section>

    {(highlights.mostConsistent || highlights.topMood || highlights.topTool) && <section style={{ ...card, padding: 15, background: "linear-gradient(145deg,#FFFDF7,#FFF9FD)", borderColor: "#ECDDB5" }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#A96E04" }}>✨ Plush highlights</div>
      <div style={{ display: "grid", gap: 7, marginTop: 9, fontSize: 11.7, lineHeight: 1.45, color: "#6B5A7D" }}>
        {highlights.mostConsistent && <div>☕ Most consistent routine: <strong><HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</strong></div>}
        {highlights.topMood && <div>😊 Most common feeling this week: <strong>{highlights.topMood}</strong></div>}
        {highlights.topTool && <div>{highlights.topTool.icon || "🧸"} Most helpful comfort tool: <strong>{highlights.topTool.name || highlights.topTool.title}</strong></div>}
      </div>
    </section>}

    <section style={{ ...card, padding: 14, background: "linear-gradient(135deg,#FBF7FE,#FFFDFE)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 11.5, fontWeight: 900, color: "#8E4EAA" }}>📝 PlushWeek · Weekly intention</div><div style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.35, color: "#54465E", overflowWrap: "anywhere" }}>{props.weeklyIntentionText || "Set one gentle direction for the week"}</div></div>
        <button type="button" onClick={() => { props.setWeeklyIntentionDraft(props.weeklyIntentionText || ""); props.setWeeklyIntentionEditing(true); }} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 12, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer" }}>{props.weeklyIntentionText ? "Edit" : "Add"}</button>
      </div>
      {props.weeklyIntentionEditing && <div style={{ marginTop: 9 }}><textarea value={props.weeklyIntentionDraft} onChange={(event) => props.setWeeklyIntentionDraft(event.target.value)} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", minHeight: 70, padding: 10, borderRadius: 10, border: "1px solid #D9B8E8", resize: "vertical" }} /><div style={{ display: "flex", gap: 7, marginTop: 7 }}><button type="button" onClick={props.saveWeeklyIntentionEdit} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Save</button><button type="button" onClick={() => props.setWeeklyIntentionEditing(false)} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900 }}>Cancel</button></div></div>}
    </section>

    <button type="button" aria-expanded={monthlyOpen} onClick={() => setMonthlyOpen((open) => !open)} style={{ minHeight: 50, width: "100%", border: "1px solid #E2CDEB", borderRadius: 16, background: "rgba(255,255,255,.86)", color: "#8E4EAA", boxShadow: "0 8px 20px rgba(183,143,224,.07)", fontSize: 12.8, fontWeight: 900, cursor: "pointer" }}>🗓️ {monthlyOpen ? "Hide monthly details" : "View monthly details"}</button>

    {monthlyOpen && <section style={{ ...card, padding: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}><div><div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#8E4EAA" }}>MONTH SO FAR</div><div style={{ marginTop: 3, fontSize: 16, fontWeight: 900, color: "#4F405C" }}>Monthly growth</div></div><strong style={{ fontSize: 23, color: "#A65DC1" }}>{props.monthlyOverallPct || 0}%</strong></div>
      <div style={{ height: 9, marginTop: 10, overflow: "hidden", borderRadius: 99, background: "#F2E8F8" }}><div style={{ width: `${Math.max(0, Math.min(100, Number(props.monthlyOverallPct) || 0))}%`, height: "100%", background: "linear-gradient(90deg,#C77DD6,#7FC8F8)" }} /></div>
      <div style={{ marginTop: 9, fontSize: 11.5, lineHeight: 1.45, color: "#806B8D" }}>{props.monthOverMonthDelta == null ? "Your month is still taking shape." : props.monthOverMonthDelta > 0 ? `${props.monthOverMonthDelta}% ahead of this point last month.` : props.monthOverMonthDelta < 0 ? `${Math.abs(props.monthOverMonthDelta)}% behind this point last month — that’s okay.` : "About the same as this point last month."}</div>

      {goldInsights && <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid #EDE2F2" }}>
        <React.Suspense fallback={<InsightToolsFallback />}>
          <GrowthNextMove />
        </React.Suspense>
        <details onToggle={(event) => setInsightsOpen(event.currentTarget.open)} style={{ marginTop: 10, borderRadius: 14, border: "1px solid #CFE8E1", background: "#F6FCFA", overflow: "hidden" }}>
          <summary style={{ minHeight: 44, padding: "11px 12px", cursor: "pointer", color: "#3E746A", fontWeight: 900, listStyle: "none" }}>🌱 Deeper PlushInsights</summary>
          <div style={{ padding: "0 10px 10px" }}>
            <div style={{ marginBottom: 8, padding: "9px 10px", borderRadius: 10, background: "white", border: "1px solid #DDECE7", color: "#637B74", fontSize: 11, lineHeight: 1.5 }}><strong style={{ color: "#3E746A" }}>Why PlushLife thinks this:</strong> insights use your own recent habit and check-in history, and stay in learning mode when there is not enough evidence.</div>
            <React.Suspense fallback={<InsightToolsFallback />}>
              <HabitHealth weeklyOverallPct={props.weeklyOverallPct} weeklyEssentialPct={props.weeklyEssentialPct} caringDays={props.caringDays} weekOverWeekDelta={props.weekOverWeekDelta} preferences={props.preferences} goToDashboard={props.goToDashboard} openTaskManager={props.openTaskManager} />
            </React.Suspense>
            {insightsOpen && <React.Suspense fallback={<InsightToolsFallback />}>
              <LazyWeeklyHabitReview open={props.open} openTaskManager={props.openTaskManager} goToDashboard={props.goToDashboard} />
              <LazyWhatWorksForMe open={props.open} openTaskManager={props.openTaskManager} />
              <LazyResilienceProgress open={props.open} openTaskManager={props.openTaskManager} />
            </React.Suspense>}
          </div>
        </details>
      </div>}

      <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}><button type="button" onClick={() => props.setShareCardOpen(true)} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 11, border: "1px solid #E2CDEB", background: "white", color: "#8E4EAA", fontWeight: 900 }}>📸 Share my week</button>{props.habitTasks?.length > 0 && <span style={{ alignSelf: "center", fontSize: 10.5, color: "#7D8C86" }}>🌱 {props.habitTasks.length} habits · {props.habitGardenTotalCheckIns || 0} caring check-ins</span>}</div>
    </section>}

    {!props.hasWeeklyActivity && <section style={{ ...card, padding: 14, background: "#F2FFFB", borderColor: "#C8E8DE" }}><div style={{ fontSize: 13, fontWeight: 900, color: "#3E746A" }}>🌱 Your progress can start tiny</div><div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.5, color: "#5E766F" }}>One little task, check-in, or kind pause is enough.</div><button type="button" onClick={() => props.goToDashboard("today")} style={{ marginTop: 9, minHeight: 44, padding: "8px 11px", borderRadius: 11, border: "1px solid #84C9B7", background: "white", color: "#318C79", fontWeight: 900 }}>Show me today&apos;s tiny thing</button></section>}
  </div>;
}

export function ProgressPanel(props) {
  if (!props.open) return null;
  if (props.progressView === "overview") return <CompactGrowthOverview {...props} />;
  return <ProgressPanelCore {...props} />;
}
