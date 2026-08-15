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
  borderRadius: 24,
  border: "1px solid rgba(220,204,230,.88)",
  background: "rgba(255,255,255,.86)",
  boxShadow: "0 10px 28px rgba(151,112,173,.10)",
};

function PlushGrowthMonster() {
  return <svg aria-hidden="true" viewBox="0 0 190 178" style={{ width: "100%", maxWidth: 142, height: "auto", display: "block", filter: "drop-shadow(0 10px 14px rgba(125,91,145,.14))" }}>
    <defs>
      <radialGradient id="growthFur" cx="42%" cy="30%" r="76%"><stop offset="0" stopColor="#FFF4FF"/><stop offset=".44" stopColor="#EAD4F7"/><stop offset="1" stopColor="#CDA4E1"/></radialGradient>
      <linearGradient id="growthHeart" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFC7D8"/><stop offset="1" stopColor="#F27FA7"/></linearGradient>
    </defs>
    <ellipse cx="96" cy="157" rx="58" ry="10" fill="#AA83BB" opacity=".11"/>
    <g fill="#82C95F" opacity=".95"><ellipse cx="28" cy="148" rx="13" ry="5" transform="rotate(-24 28 148)"/><ellipse cx="159" cy="149" rx="13" ry="5" transform="rotate(24 159 149)"/><ellipse cx="106" cy="15" rx="7" ry="15" transform="rotate(28 106 15)"/></g>
    <g fill="#F5C958"><path d="M24 72l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M165 78l2.6 6.5 6.5 2.6-6.5 2.6-2.6 6.5-2.6-6.5-6.5-2.6 6.5-2.6z"/></g>
    <g fill="url(#growthFur)" stroke="#C895DE" strokeWidth="1.2">
      <circle cx="61" cy="49" r="27"/><circle cx="91" cy="38" r="30"/><circle cx="123" cy="49" r="27"/>
      <circle cx="47" cy="76" r="25"/><circle cx="79" cy="69" r="32"/><circle cx="114" cy="69" r="33"/><circle cx="142" cy="79" r="25"/>
      <circle cx="49" cy="108" r="25"/><circle cx="79" cy="105" r="33"/><circle cx="115" cy="105" r="33"/><circle cx="142" cy="112" r="24"/>
      <circle cx="66" cy="135" r="25"/><circle cx="96" cy="138" r="30"/><circle cx="126" cy="135" r="25"/>
    </g>
    <ellipse cx="74" cy="151" rx="19" ry="13" fill="#D8B0EA"/><ellipse cx="119" cy="151" rx="19" ry="13" fill="#D8B0EA"/>
    <ellipse cx="96" cy="87" rx="39" ry="34" fill="#FAEDFE" opacity=".92"/>
    <path d="M78 81c0 5-4 8-8 8s-8-3-8-8" fill="none" stroke="#70507D" strokeWidth="3" strokeLinecap="round"/>
    <path d="M129 81c0 5-4 8-8 8s-8-3-8-8" fill="none" stroke="#70507D" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="68" cy="98" r="7" fill="#F6B2C7" opacity=".78"/><circle cx="124" cy="98" r="7" fill="#F6B2C7" opacity=".78"/>
    <path d="M89 96c4 5 10 5 14 0" fill="none" stroke="#70507D" strokeWidth="3" strokeLinecap="round"/>
    <path d="M96 132c-27-16-34-29-26-39 8-10 19-4 26 5 7-9 18-15 26-5 8 10 1 23-26 39z" fill="url(#growthHeart)" stroke="#E16F95" strokeWidth="2"/>
    <ellipse cx="61" cy="114" rx="15" ry="10" fill="#D6A8E8" transform="rotate(-25 61 114)"/><ellipse cx="131" cy="114" rx="15" ry="10" fill="#D6A8E8" transform="rotate(25 131 114)"/>
    <path d="M96 31c2-13 10-19 21-16-3 11-9 17-21 16z" fill="#62B956"/><path d="M96 31c-7-9-14-9-20-3 5 8 12 10 20 3z" fill="#8BD36C"/>
  </svg>;
}

function ProgressTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "PlushView", icon: "📊" },
    { id: "story", label: "PlushStory", icon: "📖" },
    { id: "areas", label: "PlushSpaces", icon: "🪴" },
  ];
  return <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, padding: 6, borderRadius: 22, background: "rgba(246,235,251,.78)", border: "1px solid #E5D4EE", boxShadow: "0 8px 22px rgba(157,118,178,.07)" }}>
    {tabs.map((item) => {
      const selected = progressView === item.id;
      return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minHeight: 58, minWidth: 0, padding: "10px 5px", borderRadius: 17, border: selected ? "3px solid #9850BC" : "1px solid rgba(227,211,235,.95)", background: selected ? "#FFFFFF" : "rgba(255,255,255,.58)", color: selected ? "#53365F" : "#866895", boxShadow: selected ? "0 6px 16px rgba(154,80,189,.12)" : "0 4px 11px rgba(145,108,165,.04)", fontSize: 11.3, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.icon} {item.label}</button>;
    })}
  </div>;
}

function CompactGrowthOverview(props) {
  const [monthlyOpen, setMonthlyOpen] = React.useState(false);
  const [insightsOpen, setInsightsOpen] = React.useState(false);
  const goldInsights = hasGoldFeature("advanced_growth_insights");
  const highlights = props.weeklyHighlights || {};

  return <div data-plushlife-growth-focus="true" style={{ display: "grid", gap: 14, width: "calc(100% - 28px)", maxWidth: 520, margin: "0 auto" }}>
    <section style={{ ...card, position: "relative", overflow: "hidden", padding: "24px 18px 21px" }}>
      <span aria-hidden="true" style={{ position: "absolute", right: 7, top: 54, color: "#F2C862", fontSize: 27, opacity: .82 }}>☆</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.8, letterSpacing: ".18em", fontWeight: 900, color: "#9850BC" }}>THIS WEEK · MON–SUN</div>
          <div style={{ marginTop: 6, fontSize: 24, lineHeight: 1.1, fontWeight: 900, color: "#34283D" }}>PlushGrowth ✨</div>
        </div>
        <div style={{ flexShrink: 0, paddingRight: 16, fontSize: 38, lineHeight: .95, fontWeight: 900, color: "#9442BC" }}>{props.weeklyOverallPct || 0}%</div>
      </div>
      <div style={{ height: 13, marginTop: 20, overflow: "hidden", borderRadius: 99, background: "#EEE3F4" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, Number(props.weeklyOverallPct) || 0))}%`, borderRadius: 99, background: "linear-gradient(90deg,#A84DCA 0%,#7D6DDE 46%,#55B9EF 100%)" }} /></div>
      <div style={{ marginTop: 18, fontSize: 12.8, lineHeight: 1.45, color: "#665473" }}>You cared for your essentials on <strong style={{ color: "#8E4EAA" }}>{props.caringDays || 0} caring {Number(props.caringDays) === 1 ? "day" : "days"}</strong> this week.</div>
    </section>

    <ProgressTabs progressView={props.progressView} setProgressView={props.setProgressView} />

    <section aria-label="Weekly growth summary" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
      {[
        ["💜", `${props.weeklyEssentialPct || 0}%`, "Essentials", "#FBF4FF", "#A24BC7", "rgba(232,210,244,.58)"],
        ["🗓️", `${props.weeklyOverallDone || 0}/${props.weeklyOverallPossible || 0}`, "Core + Scheduled", "#F2FAFF", "#3E8EEB", "rgba(199,224,247,.65)"],
        ["⭐", `${props.weeklyBonusDone || 0}`, "Bonus wins", "#FFF9EC", "#D89900", "rgba(246,222,169,.65)"],
      ].map(([icon, value, label, background, accent, halo]) => <div key={label} style={{ minWidth: 0, minHeight: 136, padding: "14px 7px 13px", borderRadius: 24, border: "1px solid #E5DCE8", background, textAlign: "center", boxShadow: "0 8px 22px rgba(149,113,168,.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: "50%", background: halo, fontSize: 22 }}>{icon}</div>
        <div style={{ marginTop: 8, fontSize: 22, lineHeight: 1, fontWeight: 900, color: accent }}>{value}</div>
        <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.25, color: "#6F5D7B", fontWeight: 800 }}>{label}</div>
      </div>)}
    </section>

    <section style={{ ...card, padding: "17px 16px 14px", background: "linear-gradient(145deg,#F2FFF6,#FBFFF8)", borderColor: "#C8E5D0", overflow: "hidden" }}>
      <div style={{ fontSize: 16.2, fontWeight: 900, color: "#20866E" }}>🌱 PlushInsights</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 132px", gap: 8, alignItems: "end", marginTop: 10 }}>
        <div style={{ display: "grid", gap: 11, minWidth: 0, color: "#4F615B", fontSize: 12.1, lineHeight: 1.48 }}>
          <div style={{ display: "flex", gap: 9 }}><span style={{ color: "#88CF69", fontSize: 17, lineHeight: 1, fontWeight: 900 }}>•</span><span>Higher-energy days tend to make task completion easier.</span></div>
          <div style={{ display: "flex", gap: 9 }}><span style={{ color: "#88CF69", fontSize: 17, lineHeight: 1, fontWeight: 900 }}>•</span><span>Keeping about 4 important things visible may make the day easier to start.</span></div>
        </div>
        <div style={{ justifySelf: "end", alignSelf: "end", width: 132 }}><PlushGrowthMonster /></div>
      </div>
      <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid #D7E9DD", color: "#4F947E", fontSize: 10.8 }}>✨ Patterns, not pressure.</div>
    </section>

    {(highlights.mostConsistent || highlights.topMood) && <section style={{ ...card, position: "relative", padding: "16px 16px 15px", background: "linear-gradient(145deg,#FFFDF7,#FFF9F2)", borderColor: "#ECDDB5" }}>
      <span aria-hidden="true" style={{ position: "absolute", right: 22, top: 18, color: "#F0C56B", fontSize: 20 }}>✧</span>
      <div style={{ fontSize: 15.7, fontWeight: 900, color: "#A56900" }}>✨ Plush highlights</div>
      <div style={{ display: "grid", gap: 8, marginTop: 10, fontSize: 11.8, lineHeight: 1.42, color: "#665477" }}>
        {highlights.mostConsistent && <div>☕ Most consistent routine: <strong style={{ color: "#493953" }}><HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</strong></div>}
        {highlights.topMood && <div>🙂 Most common feeling this week: <strong style={{ color: "#493953" }}>{highlights.topMood}</strong></div>}
      </div>
    </section>}

    <section style={{ ...card, padding: "14px 15px", background: "linear-gradient(135deg,#FBF6FE,#FFFBFF)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 11.8, fontWeight: 900, color: "#8A48A6" }}>📝 PlushWeek · Weekly intention</div><div style={{ marginTop: 5, fontSize: 13.7, lineHeight: 1.3, color: "#3E3347", overflowWrap: "anywhere" }}>{props.weeklyIntentionText || "Set one gentle direction for the week"}</div></div>
        <button type="button" onClick={() => { props.setWeeklyIntentionDraft(props.weeklyIntentionText || ""); props.setWeeklyIntentionEditing(true); }} style={{ minHeight: 44, padding: "8px 13px", borderRadius: 12, border: "1px solid #D7BCE3", background: "rgba(255,255,255,.92)", color: "#8948A6", fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 10px rgba(151,112,173,.07)" }}>{props.weeklyIntentionText ? "Edit" : "Add"}</button>
      </div>
      {props.weeklyIntentionEditing && <div style={{ marginTop: 9 }}><textarea value={props.weeklyIntentionDraft} onChange={(event) => props.setWeeklyIntentionDraft(event.target.value)} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", minHeight: 70, padding: 10, borderRadius: 10, border: "1px solid #D9B8E8", resize: "vertical" }} /><div style={{ display: "flex", gap: 7, marginTop: 7 }}><button type="button" onClick={props.saveWeeklyIntentionEdit} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Save</button><button type="button" onClick={() => props.setWeeklyIntentionEditing(false)} style={{ minHeight: 44, padding: "8px 12px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900 }}>Cancel</button></div></div>}
    </section>

    <button type="button" aria-expanded={monthlyOpen} onClick={() => setMonthlyOpen((open) => !open)} style={{ minHeight: 54, width: "100%", border: "1px solid #E1D0EA", borderRadius: 19, background: "rgba(255,255,255,.90)", color: "#8847A5", boxShadow: "0 9px 22px rgba(149,113,168,.08)", fontSize: 13.1, fontWeight: 900, cursor: "pointer" }}>🗓️ {monthlyOpen ? "Hide monthly details" : "View monthly details"}</button>

    {monthlyOpen && <section style={{ ...card, padding: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}><div><div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#8E4EAA" }}>MONTH SO FAR</div><div style={{ marginTop: 3, fontSize: 16, fontWeight: 900, color: "#4F405C" }}>Monthly growth</div></div><strong style={{ fontSize: 23, color: "#A65DC1" }}>{props.monthlyOverallPct || 0}%</strong></div>
      <div style={{ height: 9, marginTop: 10, overflow: "hidden", borderRadius: 99, background: "#F2E8F8" }}><div style={{ width: `${Math.max(0, Math.min(100, Number(props.monthlyOverallPct) || 0))}%`, height: "100%", background: "linear-gradient(90deg,#C77DD6,#7FC8F8)" }} /></div>
      <div style={{ marginTop: 9, fontSize: 11.5, lineHeight: 1.45, color: "#806B8D" }}>{props.monthOverMonthDelta == null ? "Your month is still taking shape." : props.monthOverMonthDelta > 0 ? `${props.monthOverMonthDelta}% ahead of this point last month.` : props.monthOverMonthDelta < 0 ? `${Math.abs(props.monthOverMonthDelta)}% behind this point last month — that’s okay.` : "About the same as this point last month."}</div>

      {goldInsights && <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid #EDE2F2" }}>
        <React.Suspense fallback={<InsightToolsFallback />}><GrowthNextMove /></React.Suspense>
        <details onToggle={(event) => setInsightsOpen(event.currentTarget.open)} style={{ marginTop: 10, borderRadius: 14, border: "1px solid #CFE8E1", background: "#F6FCFA", overflow: "hidden" }}>
          <summary style={{ minHeight: 44, padding: "11px 12px", cursor: "pointer", color: "#3E746A", fontWeight: 900, listStyle: "none" }}>🌱 Deeper PlushInsights</summary>
          <div style={{ padding: "0 10px 10px" }}>
            <div style={{ marginBottom: 8, padding: "9px 10px", borderRadius: 10, background: "white", border: "1px solid #DDECE7", color: "#637B74", fontSize: 11, lineHeight: 1.5 }}><strong style={{ color: "#3E746A" }}>Why PlushLife thinks this:</strong> insights use your own recent habit and check-in history, and stay in learning mode when there is not enough evidence.</div>
            <React.Suspense fallback={<InsightToolsFallback />}><HabitHealth weeklyOverallPct={props.weeklyOverallPct} weeklyEssentialPct={props.weeklyEssentialPct} caringDays={props.caringDays} weekOverWeekDelta={props.weekOverWeekDelta} preferences={props.preferences} goToDashboard={props.goToDashboard} openTaskManager={props.openTaskManager} /></React.Suspense>
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
