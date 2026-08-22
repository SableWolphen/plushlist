import { monthlyMoments } from "../plush-memory.js";

export function GrowthMoments({ user }) {
  const moments = monthlyMoments(user?.id || "local");
  if (!moments.length) return <section aria-label="PlushMoments empty state" style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 15, background: "linear-gradient(145deg,#FFF9FD,#F7FCFA)", border: "1px solid #E6DDEA" }}><div style={{ fontSize: 10.5, letterSpacing: ".1em", fontWeight: 900, color: "#765F84" }}>✨ PLUSHMOMENTS</div><div style={{ marginTop: 3, fontSize: 11.2, lineHeight: 1.45, color: "#807188" }}>Nothing to review yet. Keep using PlushLife normally; meaningful moments will show up here when there is something real to remember.</div></section>;
  return <details data-growth-plush-moments="true" style={{ marginBottom: 18, padding: "9px 12px", borderRadius: 16, background: "#FFF9FD", border: "1px solid #E6D4F2" }}>
    <summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "#765F84", fontSize: 12, fontWeight: 900 }}>✨ PlushMoments · this month</summary>
    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>{moments.slice(0, 8).map((moment) => <div key={moment.fingerprint} style={{ padding: "8px 9px", borderRadius: 10, background: "white", fontSize: 11, lineHeight: 1.45, color: "#7B6888" }}>{moment.text}</div>)}</div>
  </details>;
}
