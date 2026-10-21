import { PLAN_VIEWS } from "../navigation.mjs";

export function PlanNavigation({ view, onSelect, onEditSchedule }) {
  return <section className="pl-plan-navigation" aria-label="Plan">
    <div className="pl-plan-heading"><div><h1>Plan</h1><p>Your tasks, habits and calendar in one place.</p></div>
      <button type="button" onClick={onEditSchedule}>Edit schedule</button>
    </div>
    <nav aria-label="Plan views">{PLAN_VIEWS.map(([id, label]) =>
      <button key={id} type="button" aria-pressed={view === id} onClick={() => onSelect(id)}>{label}</button>
    )}</nav>
  </section>;
}
