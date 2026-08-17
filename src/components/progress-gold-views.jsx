import { HabitTypeIcon } from "./shared.jsx";

const goldCard = {
  borderRadius: 14,
  border: "1px solid rgba(220,204,230,.88)",
  background: "rgba(255,255,255,.88)",
  boxShadow: "0 3px 10px rgba(151,112,173,.05)",
};

function GrowthTabs({ progressView, setProgressView }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "story", label: "Your story", icon: "📖" },
    { id: "areas", label: "Care areas", icon: "🪴" },
  ];
  return <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 4, padding: 4, borderRadius: 13, background: "rgba(246,235,251,.68)", border: "1px solid #E5D4EE", marginBottom: 9 }}>
    {tabs.map((item) => {
      const selected = progressView === item.id;
      return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minHeight: 42, minWidth: 0, padding: "6px 4px", borderRadius: 10, border: selected ? "2px solid #9850BC" : "1px solid transparent", background: selected ? "#FFFFFF" : "transparent", color: selected ? "#53365F" : "#866895", boxShadow: selected ? "0 2px 7px rgba(154,80,189,.08)" : "none", fontSize: 10.2, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.icon} {item.label}</button>;
    })}
  </div>;
}

function storyInsights(props) {
  const insights = [];
  const highlights = props.weeklyHighlights || {};
  const areas = Array.isArray(props.careAreas) ? props.careAreas : [];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const gentlest = areas.slice().sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0))[0];

  if (highlights.mostConsistent?.task?.task) {
    insights.push({ icon: "🌱", title: "What helped", text: `${highlights.mostConsistent.task.task} was your steadiest routine this week. It may be a useful anchor for another small task.` });
  } else if (strongest) {
    insights.push({ icon: "🌱", title: "What helped", text: `${strongest.label} was your strongest care area at ${strongest.pct}%. That part of your routine is giving you a reliable foothold.` });
  }

  if (gentlest && Number(gentlest.possible) > 0) {
    const remaining = Math.max(0, Number(gentlest.possible) - Number(gentlest.done));
    insights.push({ icon: "🪶", title: "What felt harder", text: `${gentlest.label} landed at ${gentlest.pct}%${remaining ? `, with ${remaining} item${remaining === 1 ? "" : "s"} still waiting` : ""}. Keeping this area lighter may fit better than adding pressure.` });
  }

  if (props.weekOverWeekDelta != null) {
    const delta = Number(props.weekOverWeekDelta) || 0;
    insights.push(delta > 0
      ? { icon: "✨", title: "What changed", text: `Your overall care was ${delta}% higher than last week. That is a pattern worth noticing, not a new minimum to maintain.` }
      : delta < 0
        ? { icon: "💜", title: "Recovery matters too", text: `This week was ${Math.abs(delta)}% lighter than last week. A softer week is still useful data and does not erase the care you managed.` }
        : { icon: "🌙", title: "A steady week", text: "Your overall rhythm was close to last week. Stability is useful progress too." });
  }

  if (!insights.length && highlights.topMood) {
    insights.push({ icon: "😊", title: "Check-in pattern", text: `${highlights.topMood} was your most common check-in feeling. PlushLife is still learning how that lines up with your daily rhythm.` });
  }
  return insights.slice(0, 3);
}

export function GoldStoryView(props) {
  const insights = storyInsights(props);
  const highlights = props.weeklyHighlights || {};
  const story = Array.isArray(props.careStory) ? props.careStory : [];
  return <>
    <GrowthTabs progressView={props.progressView} setProgressView={props.setProgressView} />

    <section style={{ ...goldCard, padding: "13px 14px", background: "linear-gradient(145deg,#F5FBF8,#FFFDF7)", borderColor: "#D6E7D9" }}>
      <div style={{ fontSize: 10.3, letterSpacing: ".13em", fontWeight: 900, color: "#318C79" }}>📖 THIS WEEK IN ONE GLANCE</div>
      {story.length > 0 && <div style={{ marginTop: 7, fontSize: 11.8, lineHeight: 1.48, color: "#526F67" }}>{story.slice(0, 2).map((line, index) => <div key={index} style={{ marginTop: index ? 4 : 0 }}>{line}</div>)}</div>}
      {(highlights.mostConsistent || highlights.topMood) && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 9, paddingTop: 8, borderTop: "1px solid #D8EEE5", fontSize: 9.8, color: "#687B75" }}>
        {highlights.mostConsistent && <span>🌱 Steady: <strong><HabitTypeIcon task={highlights.mostConsistent.task} />{highlights.mostConsistent.task.task}</strong></span>}
        {highlights.topMood && <span>🙂 Check-in: <strong>{highlights.topMood}</strong></span>}
      </div>}
    </section>

    <section style={{ ...goldCard, marginTop: 9, padding: "12px 13px", background: "linear-gradient(145deg,#FFFDF3,#FFF9E9)", borderColor: "#ECDCA9" }}>
      <div style={{ fontSize: 12.8, fontWeight: 900, color: "#9C7200" }}>✨ What PlushLife noticed</div>
      <div style={{ marginTop: 3, fontSize: 9.7, color: "#8B7950" }}>The useful parts of the week, without turning them into a score.</div>
      <div style={{ display: "grid", gap: 1, marginTop: 8 }}>
        {insights.length ? insights.map((item, index) => <div key={item.title} style={{ padding: "8px 2px", borderTop: index ? "1px solid #EFE4BC" : 0 }}><div style={{ fontSize: 10.7, fontWeight: 900, color: "#6A5730" }}>{item.icon} {item.title}</div><div style={{ marginTop: 2, fontSize: 10.5, lineHeight: 1.4, color: "#736549" }}>{item.text}</div></div>) : <div style={{ padding: "8px 0", fontSize: 10.6, color: "#7A6E55" }}>Still learning. A few more caring days will make this more personal.</div>}
      </div>
    </section>

    <button type="button" onClick={props.goWriteWeeklyIntention} style={{ marginTop: 9, width: "100%", minHeight: 44, padding: "8px 11px", borderRadius: 11, border: "1px solid #A9DCCD", background: "rgba(255,255,255,.9)", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>📝 Set next week&apos;s intention</button>
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
  if (!possible) return "PlushLife is still learning this area.";
  if ((Number(area.pct) || 0) >= 75) return "This area is working well. Keep it repeatable instead of adding more just because it is going well.";
  if (strongest && strongest.label !== area.label && (Number(strongest.pct) || 0) >= 60) return `Borrow one cue from ${strongest.label}, your steadier area this week.`;
  if (remaining <= 2) return `Keep the next step tiny; only ${remaining || "a couple of"} item${remaining === 1 ? " is" : "s are"} still waiting.`;
  return `Try fewer visible decisions here rather than pushing through all ${remaining} unfinished items.`;
}

export function GoldSpacesView(props) {
  const [selectedArea, setSelectedArea] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);
  const areas = Array.isArray(props.careAreas) ? props.careAreas : [];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const weakest = areas.slice().sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0))[0];
  const average = areas.length ? Math.round(areas.reduce((sum, area) => sum + (Number(area.pct) || 0), 0) / areas.length) : 0;
  const visibleAreas = showAll ? areas : areas.slice(0, 4);

  return <>
    <GrowthTabs progressView={props.progressView} setProgressView={props.setProgressView} />
    <section style={{ ...goldCard, padding: "12px 13px", background: "linear-gradient(145deg,#F7F9FF,#FBFCFF)", borderColor: "#D9E6F6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 10.3, letterSpacing: ".13em", fontWeight: 900, color: "#4C78A8" }}>🪴 CARE AREAS</div><div style={{ marginTop: 3, fontSize: 10.4, lineHeight: 1.35, color: "#6B7C99" }}>Your rhythm by part of the day. Tap a row for one useful adjustment.</div></div>
        <button type="button" onClick={() => props.openTaskManager()} style={{ minHeight: 40, padding: "6px 8px", borderRadius: 9, border: "1px solid #B9DCF6", background: "white", color: "#3D70A3", fontWeight: 900, fontSize: 9.8, cursor: "pointer", flexShrink: 0 }}>Edit</button>
      </div>

      {areas.length > 0 && <div style={{ marginTop: 8, padding: "7px 9px", borderRadius: 9, background: "rgba(255,255,255,.72)", border: "1px solid #E0EBF7", fontSize: 10, lineHeight: 1.35, color: "#61758E" }}><strong>{strongest?.label || "Strongest area"}</strong> is leading at {strongest?.pct || 0}%.{weakest && weakest.label !== strongest?.label ? ` ${weakest.label} may need the gentlest plan.` : ""}</div>}

      {visibleAreas.length ? <div style={{ display: "grid", gap: 5, marginTop: 8 }}>{visibleAreas.map((area) => {
        const selected = selectedArea === area.label;
        const health = areaHealth(area.pct);
        return <div key={area.label}>
          <button type="button" aria-expanded={selected} onClick={() => setSelectedArea((current) => current === area.label ? null : area.label)} style={{ width: "100%", minHeight: 50, padding: "8px 9px", borderRadius: 10, background: "rgba(255,255,255,.92)", border: selected ? `2px solid ${health.color}88` : "1px solid #DCEAF8", cursor: "pointer", textAlign: "left", font: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><strong style={{ fontSize: 10.9, color: "#536C89" }}>{area.label}</strong><span style={{ fontSize: 9.9, color: "#536C89" }}>{area.done}/{area.possible} · {area.pct}% {selected ? "▴" : "▾"}</span></div>
            <div style={{ height: 5, marginTop: 6, overflow: "hidden", borderRadius: 99, background: "#E6EFF9" }}><div style={{ height: "100%", width: `${Math.max(0, Math.min(100, Number(area.pct) || 0))}%`, borderRadius: 99, background: "linear-gradient(90deg,#7FC8F8,#4C8FE8)" }} /></div>
          </button>
          {selected && <div aria-live="polite" style={{ margin: "4px 4px 0", padding: "8px 9px", borderRadius: 9, background: health.background, border: `1px solid ${health.color}33` }}>
            <strong style={{ fontSize: 10.3, color: health.color }}>{health.icon} {health.label}</strong>
            <div style={{ marginTop: 3, fontSize: 10.2, lineHeight: 1.38, color: "#617083" }}>{area.done} of {area.possible} planned items landed here this week. {area.label === strongest?.label ? "This is your strongest care area right now." : `Your care-area average is ${average}%.`}</div>
            <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${health.color}22`, fontSize: 10.2, lineHeight: 1.38, color: "#5C6D7D" }}><strong>Try:</strong> {areaSuggestion(area, strongest)}</div>
          </div>}
        </div>;
      })}</div> : <div style={{ marginTop: 9, padding: 9, borderRadius: 9, background: "white", color: "#6B7C99", fontSize: 10.6 }}>Add a few task groups and your care areas will appear here.</div>}

      {areas.length > 4 && <button type="button" onClick={() => setShowAll((value) => !value)} style={{ marginTop: 7, minHeight: 40, width: "100%", border: 0, background: "transparent", color: "#4C78A8", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>{showAll ? "Show fewer areas" : `Show all ${areas.length} areas`}</button>}
      <div style={{ marginTop: 7, fontSize: 9.3, lineHeight: 1.35, color: "#8190A3" }}>Compared with your own current rhythm, never with other people.</div>
    </section>
  </>;
}