import { monthlyMoments } from "../plush-memory.js";

export function GrowthMoments({ user }) {
  const moments = monthlyMoments(user?.id || "local");
  if (!moments.length) return null;
  return <details data-growth-plush-moments="true" style={{ marginBottom: 6, padding: "4px 7px", borderRadius: 10, background: "rgba(255,255,255,.5)", border: "1px solid #EADDED" }}>
    <summary style={{ minHeight: 34, display: "flex", alignItems: "center", cursor: "pointer", color: "#765F84", fontSize: 9.5, fontWeight: 900 }}>✨ PlushMoments · this month</summary>
    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>{moments.slice(0, 8).map((moment) => <div key={moment.fingerprint} style={{ padding: "8px 9px", borderRadius: 10, background: "white", fontSize: 11, lineHeight: 1.45, color: "#7B6888" }}>{moment.text}</div>)}</div>
  </details>;
}
