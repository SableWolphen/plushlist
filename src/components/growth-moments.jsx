import { monthlyMoments } from "../plush-memory.js";

export function GrowthMoments({ user }) {
  const moments = monthlyMoments(user?.id || "local");
  if (!moments.length) return <div className="pl-moments-empty" aria-label="PlushMoments empty state">✨ Nothing to review yet — meaningful moments will show up here when there is something real to remember.</div>;
  return <details data-growth-plush-moments="true" className="pl-moments-banner">
    <summary><span className="pl-moments-icon" aria-hidden="true">✨</span><span className="pl-moments-heading"><strong>PlushMoments</strong><small>Monthly keepsakes</small></span></summary>
    <div className="pl-moments-list">{moments.slice(0, 8).map((moment) => <div key={moment.fingerprint}>{moment.text}</div>)}</div>
  </details>;
}
