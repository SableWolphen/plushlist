import { HabitTypeIcon } from "./shared.jsx";

const goldCard = {
  borderRadius: 14,
  border: "1px solid rgba(220,204,230,.88)",
  background: "rgba(255,255,255,.88)",
  boxShadow: "0 3px 10px rgba(151,112,173,.05)",
};

function GrowthTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "PlushView", icon: "📊" },
    { id: "story", label: "PlushStory", icon: "📖" },
    { id: "areas", label: "PlushSpaces", icon: "🪴" },
  ];
  return <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 5, padding: 4, borderRadius: 14, background: "rgba(246,235,251,.72)", border: "1px solid #E5D4EE", marginBottom: 9 }}>
    {tabs.map((item) => {
      const selected = progressView === item.id;
      return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minHeight: 44, minWidth: 0, padding: "6px 4px", borderRadius: 11, border: selected ? "2px solid #9850BC" : "1px solid rgba(227,211,235,.95)", background: selected ? "#FFFFFF" : "rgba(255,255,255,.58)", color: selected ? "#53365F" : "#866895", fontSize: 10.2, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.icon} {item.label}</button>;
    })}
  </div>;
}

function GoldBadge() {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 999, background: "#FFF6D8", border: "1px solid #E9D58B", color: "#9B7100", fontSize: 9.2, fontWeight: 900, whiteSpace: "nowrap" }}>✨ GOLD</span>;
}

function storyInsights(props) {
  const insights = [];
  const highlights = props.weeklyHighlights || {};
  const areas = Array.isArray(props.careAreas) ? props.careAreas : [];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const gentlest = areas.slice().sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0))[0];

  if (highlights.mostConsistent?.task?.task) {
    insights.push({ icon: "🌱", title: "What helped", text: `${highlights.mostConsistent.task.task} was your steadiest routine this week. That makes it a good anchor for another small task.` });
  } else if (strongest) {
    insights.push({ icon: "🌱", title: "What helped", text: `${strongest.label} was your strongest care area at ${strongest.pct}%. That part of your routine is giving you a reliable foothold.` });
  }

  if (gentlest && Number(gentlest.possible) > 0) {
    const remaining = Math.max(0, Number(gentlest.possible) - Number(gentlest.done));
    insights.push({ icon: "🪶", title: "What felt heavier", text: `${gentlest.label} landed at ${gentlest.pct}% this week${remaining ? `, with ${remaining} item${remaining === 1 ? "" : "s"} still waiting` : ""}. PlushLife can keep that space gentler instead of asking for more.` });
  }

  if (props.weekOverWeekDelta != null) {
    const delta = Number(props.weekOverWeekDelta) || 0;
    insights.push(delta > 0
      ? { icon: "✨", title: "Quiet change", text: `Your overall care was ${delta}% higher than last week. PlushLife treats that as a pattern worth noticing, not a new minimum to maintain.` }
      : delta < 0
        ? { icon: "💜", title: "Recovery matters too", text: `This week was ${Math.abs(delta)}% lighter than last week. A softer week is still useful data, and nothing about it erases the care you did manage.` }
        : { icon: "🌙", title: "A steady week", text: "Your overall rhythm was close to last week. Stability counts as useful progress too." });
  }

  if (highlights.topMood) {
    insights.push({ icon: "😊", title: "Your check-in pattern", text: `${highlights.topMood} was your most common check-in feeling. PlushLife will keep learning how your energy and task rhythm line up with your check-ins.` });
  }

  return insights.slice(0, 3);
}

export function GoldStoryView(props) {
  const insights = storyInsights(props);
  const highlights = props.weeklyHighlights || {};
  return <>
    <GrowthTabs progressView={props.progressView} setProgressView={props.setProgressView} />
    <section style={{ ...goldCard, padding: "13px 14px", background: "linear-gradient(145deg,#F5FBF8,#FBFFFD)", borderColor: "#CFE8E1", color: "#526F67" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 10.3, letterSpacing: ".13em", fontWeight: 900, color: "#318C79" }}>📖 YOUR CARE STORY · THIS WEEK</div>
        <GoldBadge />
      </div>
      <div style={{ marginTop: 7, fontSize: 12.4, lineHeight: 1.52 }}>{(props.careStory || []).map((line, index) => <div key={index} style={{ marginTop: index ? 5 : 0 }}>{line}</div>)}</div>
      <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #D8EEE5", fontSize: 10.5, lineHeight: 1.45 }}>A reflection on the care you chose—not a score, diagnosis, or rule for next week.</div>
    </section>

    <section style={{ ...goldCard, marginTop: 9, padding: "12px 13px", background: "linear-gradient(145deg,#FFFDF3,#FFF9E9)", borderColor: "#ECDCA9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><div style={{ fontSize: 12.8, fontWeight: 900, color: "#9C7200" }}>✨ What PlushLife learned</div><GoldBadge /></div>
      <div style={{ marginTop: 4, fontSize: 9.8, color: "#8B7950" }}>Personal patterns from your own week. Patterns, not pressure.</div>
      <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
        {insights.length ? insights.map((item) => <div key={item.title} style={{ padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,.78)", border: "1px solid #EEE1BB" }}><div style={{ fontSize: 10.7, fontWeight: 900, color: "#6A5730" }}>{item.icon} {item.title}</div><div style={{ marginTop: 3, fontSize: 10.6, lineHeight: 1.42, color: "#736549" }}>{item.text}</div></div>) : <div style={{ padding: 10, borderRadius: 11, background: "white", fontSize: 10.6, color: "#7A6E55" }}>PlushLife is still learning this pattern. A few more caring days will make this story more personal.</div>}
      </div>
    </section>

    {(highlights.mostConsistent || highlights.topTool || highlights.topMood) && <section style={{ ...goldCard, marginTop: 9, padding: "11px 12px" }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "#5A4B66" }}>🌟 Small highlights</div>
      <div style={{ display: "grid", gap: 4, marginTop: 6, fontSize: 10.7, lineHeight: 1.4, color: "#6D6075" }}>
        {highlights.mostConsistent && <div>Steady routine: <strong><HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</strong></div>}
        {highlights.topTool && <div>Helpful support: <strong>{highlights.topTool.icon} {highlights.topTool.name || highlights.topTool.title}</strong></div>}
        {highlights.topMood && <div>Most common check-in: <strong>{highlights.topMood}</strong></div>}
      </div>
    </section>}

    <button type="button" onClick={props.goWriteWeeklyIntention} style={{ marginTop: 9, width: "100%", minHeight: 44, padding: "8px 11px", borderRadius: 11, border: "1px solid #A9DCCD", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>📝 Set next week&apos;s intention</button>
  </>;
}

function areaHealth(pct) {
  const value = Number(pct) || 0;
  if (value >= 75) return { label: "Growing", icon: "🌱", color: "#318C79", background: "#EDF9F5" };
  if (value >= 55) return { label: "Steady", icon: "✨", color: "#4C78A8", background: "#EEF6FD" };
  if (value >= 35) return { label: "Needs a little support", icon: "🪶", color: "#8E6A38", background: "#FFF8EA" };
  return { label: "Still finding its rhythm", icon: "💜", color: "#8E4EAA", background: "#FAF2FD" };
}

function areaSuggestion(area, strongest) {
  const possible = Number(area.possible) || 0;
  const done = Number(area.done) || 0;
  const remaining = Math.max(0, possible - done);
  if (!possible) return "PlushLife is still learning this space.";
  if ((Number(area.pct) || 0) >= 75) return `This space is working well. Keep the routine small and repeatable instead of adding more just because it is going well.`;
  if (strongest && strongest.label !== area.label && (Number(strongest.pct) || 0) >= 60) return `Try borrowing one cue from ${strongest.label}, your steadier space this week. One familiar anchor can make this area easier to start.`;
  if (remaining <= 2) return `Only ${remaining || "a couple of"} item${remaining === 1 ? " is" : "s are"} separating this space from a fuller week. Keep the next step tiny.`;
  return `This space has ${remaining} unfinished items this week. A smaller visible list or gentler version may fit better than trying to push through all of them.`;
}

export function GoldSpacesView(props) {
  const [selectedArea, setSelectedArea] = React.useState(null);
  const areas = Array.isArray(props.careAreas) ? props.careAreas : [];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const average = areas.length ? Math.round(areas.reduce((sum, area) => sum + (Number(area.pct) || 0), 0) / areas.length) : 0;

  return <>
    <GrowthTabs progressView={props.progressView} setProgressView={props.setProgressView} />
    <section style={{ ...goldCard, padding: "13px 14px", background: "linear-gradient(145deg,#F7F9FF,#FBFCFF)", borderColor: "#D9E6F6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ fontSize: 10.3, letterSpacing: ".13em", fontWeight: 900, color: "#4C78A8" }}>🪴 YOUR CARE AREAS</div><GoldBadge /></div><div style={{ marginTop: 5, fontSize: 10.7, lineHeight: 1.42, color: "#6B7C99" }}>Tap a space to see what the numbers mean and one gentle adjustment.</div></div>
        <button type="button" onClick={() => props.openTaskManager()} style={{ minHeight: 44, padding: "7px 9px", borderRadius: 9, border: "1px solid #B9DCF6", background: "white", color: "#3D70A3", fontWeight: 900, fontSize: 10.2, cursor: "pointer", flexShrink: 0 }}>Edit groups</button>
      </div>
      {areas.length > 0 && <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,.72)", border: "1px solid #E0EBF7", fontSize: 10.3, color: "#61758E" }}><strong>This week:</strong> {strongest?.label || "Your strongest space"} is leading at {strongest?.pct || 0}% · average across spaces {average}%.</div>}
      {areas.length ? <div style={{ display: "grid", gap: 7, marginTop: 10 }}>{areas.map((area) => {
        const selected = selectedArea === area.label;
        const health = areaHealth(area.pct);
        return <div key={area.label}>
          <button type="button" aria-expanded={selected} onClick={() => setSelectedArea((current) => current === area.label ? null : area.label)} style={{ width: "100%", minHeight: 58, padding: "9px 10px", borderRadius: 11, background: "white", border: selected ? `2px solid ${health.color}88` : "1px solid #DCEAF8", cursor: "pointer", textAlign: "left", font: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><strong style={{ fontSize: 11.5, color: "#536C89" }}>{area.label}</strong><span style={{ fontSize: 10.4, color: "#536C89" }}>{area.done}/{area.possible} · {area.pct}% {selected ? "▴" : "▾"}</span></div>
            <div style={{ height: 6, marginTop: 7, overflow: "hidden", borderRadius: 99, background: "#E6EFF9" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, Number(area.pct) || 0))}%`, borderRadius: 99, background: "linear-gradient(90deg,#7FC8F8,#4C8FE8)" }} /></div>
          </button>
          {selected && <div aria-live="polite" style={{ margin: "5px 4px 0", padding: "9px 10px", borderRadius: 10, background: health.background, border: `1px solid ${health.color}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><strong style={{ fontSize: 10.6, color: health.color }}>{health.icon} {health.label}</strong><span style={{ fontSize: 9.4, color: "#74849A" }}>Gold insight</span></div>
            <div style={{ marginTop: 4, fontSize: 10.5, lineHeight: 1.4, color: "#617083" }}>{area.done} of {area.possible} planned items were completed here this week. {area.label === strongest?.label ? "This is your strongest care area right now." : `The average across your care areas is ${average}%.`}</div>
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${health.color}22`, fontSize: 10.5, lineHeight: 1.4, color: "#5C6D7D" }}><strong>🌱 Tiny adjustment:</strong> {areaSuggestion(area, strongest)}</div>
          </div>}
        </div>;
      })}</div> : <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "white", color: "#6B7C99", fontSize: 10.8 }}>Add a few task groups and your care areas will appear here.</div>}
      <div style={{ marginTop: 9, fontSize: 9.6, lineHeight: 1.4, color: "#8190A3" }}>Gold compares you with your own current rhythm—not with other people. More personal timing, energy, and recovery comparisons appear as PlushLife gathers enough reliable history.</div>
    </section>
  </>;
}
