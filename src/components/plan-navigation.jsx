import { PLAN_VIEWS } from "../navigation.mjs";

export function PlanNavigation({ view, onSelect, onEditSchedule }) {
  return <section className="pl-plan-navigation" aria-label="Plan">
    <div className="pl-plan-heading"><div><span className="pl2-eyebrow">🌷 YOUR COZY PLANNER</span><h1>My little plans</h1><p>One day, one week, one gentle step at a time.</p></div>
      <button type="button" onClick={onEditSchedule}>Edit schedule</button>
    </div>
    <nav aria-label="Plan views">{PLAN_VIEWS.map(([id, label]) =>
      <button key={id} type="button" aria-pressed={view === id} onClick={() => onSelect(id)}>{label}</button>
    )}</nav>
    <p className="pl2-plan-helper" role="status">{view === "calendar" ? "See what is coming up, without needing to catch up." : view === "habits" ? "Small things count, even on difficult days." : view === "later" ? "Everything here can wait until you are ready." : "Today is enough. Choose one thing to begin."}</p>
  </section>;
}
