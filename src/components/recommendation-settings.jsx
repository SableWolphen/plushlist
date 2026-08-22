import { forgetPattern, getBoundaries, plushProfileSummary, setBoundary } from "../plush-profile.js";

const boundaryOptions = [
  ["noCatchUpPressure", "Never frame missed days as catch-up debt"],
  ["gentlerFirstLowEnergy", "Prefer gentler options first on low-energy days"],
  ["avoidAddingOnLowEnergy", "Do not suggest adding habits when energy is low"],
];

function patternName(item) {
  const names = { care: "Care", sleep: "Sleep", rescue: "Gentle day", forecast: "Day forecast", path: "PlushPath" };
  const detail = String(item?.recommendationId || "support").replace(/^.*?·\s*/, "").replace(/[-_]+/g, " ");
  return `${names[item?.kind] || "Recommendation"} · ${detail}`;
}

function evidenceLine(item) {
  const parts = [`${item.total || 0} rating${item.total === 1 ? "" : "s"}`];
  if (item.context) parts.push(`often around ${item.context}`);
  return parts.join(" · ");
}

export function RecommendationSettings({ user }) {
  const userId = user?.id || "local";
  const [version, setVersion] = React.useState(0);
  const [boundaries, setBoundaries] = React.useState(() => getBoundaries(userId));
  const profile = plushProfileSummary(userId);
  void version;

  const changeBoundary = (name, enabled) => setBoundaries({ ...setBoundary(userId, name, enabled) });
  const forget = (item) => {
    forgetPattern(userId, item.kind, item.recommendationId);
    setVersion((value) => value + 1);
  };

  return <>
    <div style={{ padding: 15, marginBottom: 12, borderRadius: 18, background: "linear-gradient(145deg,#F8FCFA,#FFF9FD)", border: "1px solid #DDE8E4" }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#4D746A" }}>🧭 HOW PLUSHLIFE LEARNS</div>
      <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.46, color: "#72827E" }}>Suggestions come from repeated feedback and patterns on this device. A one-off day is not treated like a rule.</div>
      <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
        <div style={{ padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,.75)", border: "1px solid #E2ECE8" }}><div style={{ fontSize: 10.5, fontWeight: 900, color: "#4D746A" }}>What PlushLife thinks it knows</div><div style={{ marginTop: 2, fontSize: 10.5, lineHeight: 1.4, color: "#7A8985" }}>{profile.working.length ? `${profile.working.length} repeated pattern${profile.working.length === 1 ? " has" : "s have"} enough support to influence suggestions.` : "Nothing yet. PlushLife is still waiting for repeated evidence before calling anything a pattern."}</div></div>
        <div style={{ padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,.75)", border: "1px solid #EEE5D8" }}><div style={{ fontSize: 10.5, fontWeight: 900, color: "#8A6A27" }}>What it is still unsure about</div><div style={{ marginTop: 2, fontSize: 10.5, lineHeight: 1.4, color: "#8C816A" }}>{profile.learning.length ? `${profile.learning.length} clue${profile.learning.length === 1 ? " is" : "s are"} still being tested and will not be treated as certain.` : "There are no uncertain learned patterns saved right now."}</div></div>
      </div>
    </div>

    <div style={{ padding: 15, marginBottom: 12, borderRadius: 18, background: "rgba(255,255,255,.86)", border: "1px solid #E8DCEB" }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#665474" }}>RECOMMENDATION BOUNDARIES</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8A7895" }}>These guide suggestions without changing your tasks or deleting history.</div>
      {boundaryOptions.map(([name, label]) => <label key={name} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1EAF3", color: "#5B4B6B", fontSize: 12.5, cursor: "pointer" }}><span>{label}</span><input type="checkbox" checked={Boolean(boundaries[name])} onChange={(event) => changeBoundary(name, event.target.checked)} style={{ width: 22, height: 22, accentColor: "#9660AF" }} /></label>)}
    </div>

    <div style={{ padding: 15, borderRadius: 18, background: "rgba(255,255,255,.86)", border: "1px solid #E8DCEB" }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#665474" }}>CORRECT WHAT PLUSHLIFE LEARNED</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8A7895" }}>You can see the evidence behind a pattern and tell PlushLife to stop using it.</div>
      {profile.working.length ? <div style={{ display: "grid", gap: 8, marginTop: 10 }}>{profile.working.map((item) => <div key={item.id} style={{ padding: "10px 11px", borderRadius: 11, background: "#FAF7FC", border: "1px solid #E7DDEF" }}><div style={{ fontSize: 12, fontWeight: 900, color: "#66536F", textTransform: "capitalize" }}>{patternName(item)}</div><div style={{ marginTop: 3, fontSize: 10.5, color: "#8C7A96" }}>Learned from {evidenceLine(item)}. {item.helped} of {item.total} ratings were helpful.</div><button type="button" onClick={() => forget(item)} style={{ minHeight: 44, marginTop: 6, padding: "7px 10px", borderRadius: 10, border: "1px solid #D8C5E3", background: "white", color: "#765F84", fontWeight: 850, cursor: "pointer" }}>That changed · forget this pattern</button></div>)}</div> : <div style={{ marginTop: 10, padding: 11, borderRadius: 11, background: "#FAF7FC", color: "#8A7895", fontSize: 11.5, lineHeight: 1.45 }}>Nothing needs correcting yet. Keep using PlushLife normally and answering the occasional “did that help?” prompt; repeated feedback is what turns a clue into a learned suggestion.</div>}

      {profile.learning.length > 0 && <details style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #EEE6F1" }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", fontSize: 11.2, fontWeight: 900, color: "#8A7895" }}>Still learning · {profile.learning.length}</summary><div style={{ display: "grid", gap: 7, marginTop: 5 }}>{profile.learning.map((item) => <div key={item.id} style={{ padding: "8px 9px", borderRadius: 10, background: "#FFFDF8", border: "1px solid #EFE7D8" }}><div style={{ fontSize: 10.8, fontWeight: 900, color: "#78694C", textTransform: "capitalize" }}>{patternName(item)}</div><div style={{ marginTop: 2, fontSize: 10.2, lineHeight: 1.4, color: "#95866C" }}>{evidenceLine(item)} so far. PlushLife is not treating this as a rule yet.</div></div>)}</div></details>}
    </div>
  </>;
}
