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
    <div style={{ padding: 15, marginBottom: 12, borderRadius: 18, background: "rgba(255,255,255,.86)", border: "1px solid #E8DCEB" }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#665474" }}>RECOMMENDATION BOUNDARIES</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8A7895" }}>These guide suggestions without changing your tasks or deleting history.</div>
      {boundaryOptions.map(([name, label]) => <label key={name} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1EAF3", color: "#5B4B6B", fontSize: 12.5, cursor: "pointer" }}><span>{label}</span><input type="checkbox" checked={Boolean(boundaries[name])} onChange={(event) => changeBoundary(name, event.target.checked)} style={{ width: 22, height: 22, accentColor: "#9660AF" }} /></label>)}
    </div>
    <div style={{ padding: 15, borderRadius: 18, background: "rgba(255,255,255,.86)", border: "1px solid #E8DCEB" }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#665474" }}>CORRECT LEARNED SUGGESTIONS</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8A7895" }}>Only patterns backed by repeated feedback appear here.</div>
      {profile.working.length ? <div style={{ display: "grid", gap: 8, marginTop: 10 }}>{profile.working.map((item) => <div key={item.id} style={{ padding: "10px 11px", borderRadius: 11, background: "#FAF7FC", border: "1px solid #E7DDEF" }}><div style={{ fontSize: 12, fontWeight: 900, color: "#66536F", textTransform: "capitalize" }}>{patternName(item)}</div><div style={{ marginTop: 3, fontSize: 10.5, color: "#8C7A96" }}>{item.helped} of {item.total} ratings were helpful.</div><button type="button" onClick={() => forget(item)} style={{ minHeight: 44, marginTop: 6, padding: "7px 10px", borderRadius: 10, border: "1px solid #D8C5E3", background: "white", color: "#765F84", fontWeight: 850, cursor: "pointer" }}>That changed · forget this</button></div>)}</div> : <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "#FAF7FC", color: "#8A7895", fontSize: 11.5 }}>There are no established personal suggestions to correct yet.</div>}
    </div>
  </>;
}
