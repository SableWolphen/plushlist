import { PLAN_VIEWS } from "../navigation.mjs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";
}

function shiftDate(date, days) {
  const next = new Date(date + "T12:00:00");
  next.setDate(next.getDate() + days);
  return [next.getFullYear(), String(next.getMonth() + 1).padStart(2, "0"), String(next.getDate()).padStart(2, "0")].join("-");
}

// Monday-to-Sunday week around the chosen day.
export function planWeek(selectedDate, today) {
  const anchor = isoDate(selectedDate) || isoDate(today);
  if (!anchor) return [];
  const weekday = new Date(anchor + "T12:00:00").getDay();
  const monday = shiftDate(anchor, weekday === 0 ? -6 : 1 - weekday);
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(monday, index);
    const day = new Date(date + "T12:00:00");
    return { date, name: DAY_NAMES[day.getDay()], number: day.getDate(), selected: date === anchor, today: date === isoDate(today) };
  });
}

export function PlanNavigation({ view, onSelect, onEditSchedule, selectedDate, today, onPickDate }) {
  const week = typeof onPickDate === "function" ? planWeek(selectedDate, today) : [];
  const anchor = isoDate(selectedDate) || isoDate(today);
  const month = anchor ? new Date(anchor + "T12:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
  return <section className="pl-plan-navigation pl3-plan" aria-label="Plan">
    <div className="pl-plan-heading"><div>{month && <span className="pl3-plan-month">{month}</span>}<h1>Plan</h1></div>
      <button type="button" onClick={onEditSchedule}>Edit schedule</button>
    </div>
    {week.length > 0 && <div className="pl3-week" role="group" aria-label="Pick a day">{week.map(day =>
      <button key={day.date} type="button" aria-current={day.selected ? "date" : undefined} aria-label={`${day.name} ${day.number}${day.today ? ", today" : ""}`} className={day.today ? "is-today" : undefined} onClick={() => onPickDate(day.date)}>
        <span>{day.name}</span><strong>{day.number}</strong>
      </button>
    )}</div>}
    <nav aria-label="Plan views">{PLAN_VIEWS.map(([id, label]) =>
      <button key={id} type="button" aria-pressed={view === id} onClick={() => onSelect(id)}>{label}</button>
    )}</nav>
  </section>;
}
