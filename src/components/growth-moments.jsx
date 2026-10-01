import { WeeklyKeepsake } from "./weekly-keepsake.jsx";
import { CozyComfortContext } from "./cozy-space.jsx";
import { monthlyMoments } from "../plush-memory.js";

export function GrowthMoments({ user }) {
  const cozy=React.useContext(CozyComfortContext);
  const moments = monthlyMoments(user?.id || "local");

  return <details data-growth-plush-moments="true" className="pl-moments-banner">
    <summary><span className="pl-moments-icon" aria-hidden="true">✨</span><span className="pl-moments-heading"><strong>PlushMoments</strong><small>Your weekly keepsake</small></span></summary>
    <WeeklyKeepsake memories={cozy?.profile?.memories || []} petName={cozy?.profile?.pet_name || ""}/>
    {!moments.length && <p className="pl-moments-empty">Nothing to review yet — meaningful moments will show up here when there is something real to remember.</p>}
    {!!moments.length && <div className="pl-moments-list">{moments.slice(0, 8).map((moment) => <div key={moment.fingerprint}>{moment.text}</div>)}</div>}
  </details>;
}
