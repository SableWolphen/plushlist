import { ProgressPanel as ProgressPanelCore } from "./progress-panel-core.jsx";
import { HabitTypeIcon } from "./shared.jsx";

const card = {
  borderRadius: 18,
  border: "1px solid #E6D4F2",
  background: "rgba(255,255,255,.72)",
  boxShadow: "0 8px 24px rgba(183,143,224,.08)",
};

function ProgressTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "PlushView", icon: "📊" },
    { id: "story", label: "PlushStory", icon: "📖" },
    { id: "areas", label: "PlushSpaces", icon: "🪴" },
  ];
  return <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 5, padding: 5, borderRadius: 15, background: "#F3E8FA", border: "1px solid #E6D4F2" }}>
    {tabs.map((item) => {
      const selected = progressView === item.id;
      return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minHeight: 44, minWidth: 0, padding: "8px 4px", borderRadius: 11, border: selected ? "2px solid #A65DC1" : "1px solid transparent", background: selected ? "white" : "transparent", color: selected ? "#7A3D93" : "#8C6B9E", fontSize: 10.5, fontWeight: 900, cursor: "pointer" }}>{item.icon} {item.label}</button>;
    })}
  </div>;
}

function CompactGrowthOverview(props) {
  const [monthlyOpen, setMonthlyOpen] = React.useState(false);
  const firstInsight = props.patternInsightCards?.[props.insightCardIndex % Math.max(1, props.patternInsightCards?.length || 1)] || null;
  const highlights = props.weeklyHighlights || {};
  const totalDays = Math.max(1, Number(props.caringDays) || 0);

  return <div data-plushlife-growth-focus="true" style={{ display: "grid", gap: 12 }}>
    <section style={{ ...card, padding: 17 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".16em", fontWeight: 900, color: "#A65DC1" }}>THIS WEEK · MON–SUN</div>
          <div style={{ marginTop: 4, fontSize: 21, lineHeight: 1.2, fontWeight: 900, color: "#4F405C" }}>PlushGrowth ✨</div>
        </div>
        <div style={{ flexShrink: 0, fontSize: 31, lineHeight: 1, fontWeight: 900, color: "#A65DC1" }}>{props.weeklyOverallPct || 0}%</div>
      </div>
      <div style={{ height: 11, marginTop: 14, overflow: "hidden", borderRadius: 99, background: "#F2E8F8" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%`, borderRadius: 99, background: "linear-gradient(90deg,#C77DD6,#7FC8F8)" }} /></div>
      <div style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.5, color: "#765F84" }}>You cared for your essentials on <strong>{props.caringDays || 0} caring {Number(props.caringDays) === 1 ? "day" : "days"}</strong> this week.</div>
    </section>

    <section aria-label="Weekly growth summary" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
      {[
        ["💜", `${props.weeklyEssentialPct || 0}%`, "Essentials", "#FBF5FF"],
        ["🗓️", `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, "Core + scheduled", "#F5FAFF"],
        ["⭐", `${props.weeklyBonusDone || 0}`, "Bonus wins", "#FFF9EE"],
      ].map(([icon, value, label, background]) => <div key={label} style={{ padding: "12px 7px", borderRadius: 16, border: "1px solid #E8DDEB", background, textAlign: "center" }}>
        <div style={{ fontSize: 19 }}>{icon}</div><div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: label === "Bonus wins" ? "#C49416" : label === "Core + scheduled" ? "#4C8FE8" : "#A65DC1" }}>{value}</div><div style={{ marginTop: 2, fontSize: 9.8, lineHeight: 1.25, color: "#806B8D", fontWeight: 800 }}>{label}</div>
      </div>)}
    </section>

    <section style={{ ...card, padding: 15, background: "linear-gradient(145deg,#F3FFF8,#FFFDF9)", borderColor: "#CFE8D8" }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#3E746A" }}>🌱 PlushInsights</div>
      <div style={{ display: "grid", gap: 8, marginTop: 9, color: "#5D6F69", fontSize: 12, lineHeight: 1.5 }}>
        {firstInsight ? <div style={{ padding: "9px 10px", borderRadius: 12, background: "rgba(255,255,255,.66)" }}>{firstInsight.node}</div> : <div>PlushLife is still learning what helps your days feel easier.</div>}
        <div>• Keeping your visible list small can make starting feel lighter.</div>
      </div>
      <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #DCEBE2", color: "#779087", fontSize: 10.5 }}>✨ Patterns, not pressure.</div>
    </section>

    {(highlights.mostConsistent || highlights.topMood || highlights.topTool) && <section style={{ ...card, padding: 15, background: "linear-gradient(145deg,#FFFDF7,#FFF9FD)", borderColor: "#ECDDB5" }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#9B7312" }}>✨ Plush highlights</div>
      <div style={{ display: "grid", gap: 7, marginTop: 9, fontSize: 11.8, lineHeight: 1.45, color: "#6B5A7D" }}>
        {highlights.mostConsistent && <div>☕ Most consistent routine: <strong><HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</strong></div>}
        {highlights.topMood && <div>😊 Most common feeling this week: <strong>{highlights.topMood}</strong></div>}
        {highlights.topTool && <div>{highlights.topTool.icon || "🧸"} Most helpful comfort tool: <strong>{highlights.topTool.name || highlights.topTool.title}</strong></div>}
      </div>
    </section>}

    <section style={{ ...card, padding: 13, background: "#FBF7FE" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 900, color: "#8E4EAA" }}>📮 PlushWeek</div><div style={{ marginTop: 3, fontSize: 13.5, lineHeight: 1.35, color: "#5B4B6B", overflowWrap: "anywhere" }}>{props.weeklyIntentionText || "Set one gentle direction for the week"}</div></div>
        <button type="button" onClick={() => { props.setWeeklyIntentionDraft(props.weeklyIntentionText || ""); props.setWeeklyIntentionEditing(true); }} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 11, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer" }}>{props.weeklyIntentionText ? "Edit" : "Add"}</button>
      </div>
      {props.weeklyIntentionEditing && <div style={{ marginTop: 9 }}><textarea value={props.weeklyIntentionDraft} onChange={(event) => props.setWeeklyIntentionDraft(event.target.value)} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", minHeight: 70, padding: 10, borderRadius: 10, border: "1px solid #D9B8E8", resize: "vertical" }} /><div style={{ display: "flex", gap: 7, marginTop: 7 }}><button type="button" onClick={props.saveWeeklyIntentionEdit} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Save</button><button type="button" onClick={() => props.setWeeklyIntentionEditing(false)} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900 }}>Cancel</button></div></div>}
    </section>

    <ProgressTabs progressView={props.progressView} setProgressView={props.setProgressView} />

    <button type="button" onClick={props.goWriteWeeklyIntention} style={{ minHeight: 48, width: "100%", border: 0, borderRadius: 14, background: "linear-gradient(90deg,#A95ED0,#8B67E8)", color: "white", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>📝 Set next week&apos;s intention</button>
    <button type="button" aria-expanded={monthlyOpen} onClick={() => setMonthlyOpen((open) => !open)} style={{ minHeight: 48, width: "100%", border: "1px solid #E2CDEB", borderRadius: 14, background: "white", color: "#8E4EAA", fontSize: 12.5, fontWeight: 900, cursor: "pointer" }}>🗓️ {monthlyOpen ? "Hide monthly details" : "View monthly details"}</button>

    {monthlyOpen && <section style={{ ...card, padding: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}><div><div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#8E4EAA" }}>MONTH SO FAR</div><div style={{ marginTop: 3, fontSize: 16, fontWeight: 900, color: "#4F405C" }}>Monthly growth</div></div><strong style={{ fontSize: 23, color: "#A65DC1" }}>{props.monthlyOverallPct || 0}%</strong></div>
      <div style={{ height: 9, marginTop: 10, overflow: "hidden", borderRadius: 99, background: "#F2E8F8" }}><div style={{ width: `${Math.max(0, Math.min(100, Number(props.monthlyOverallPct) || 0))}%`, height: "100%", background: "linear-gradient(90deg,#C77DD6,#7FC8F8)" }} /></div>
      <div style={{ marginTop: 9, fontSize: 11.5, lineHeight: 1.45, color: "#806B8D" }}>{props.monthOverMonthDelta == null ? "Your month is still taking shape." : props.monthOverMonthDelta > 0 ? `${props.monthOverMonthDelta}% ahead of this point last month.` : props.monthOverMonthDelta < 0 ? `${Math.abs(props.monthOverMonthDelta)}% behind this point last month — that’s okay.` : "About the same as this point last month."}</div>
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
