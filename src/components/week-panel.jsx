import { WeekPanel as ExistingWeekPanel } from "./week-panel-existing.jsx";
import { PurposeCalendarViews } from "./week-panel-purpose.jsx";

export function WeekPanel(props) {
  if (!props.open) return null;
  const content = props.weekCardIndex === 0
    ? <ExistingWeekPanel {...props} />
    : <PurposeCalendarViews {...props} />;

  return (
    <div className="pl-calendar-cozy">
      <style>{`
        .pl-calendar-cozy{display:grid;gap:7px}
        .pl-calendar-cozy>button{min-height:40px!important;border-radius:12px!important;border:1px solid #E6D3EB!important;background:linear-gradient(145deg,#FFF9FD,#F8F0FF)!important;color:#82508F!important;box-shadow:0 6px 18px rgba(101,63,115,.04)!important}
        .pl-calendar-cozy [role="tablist"]{background:linear-gradient(145deg,#F8EEFA,#FFF8FC)!important;border:1px solid #EAD9EE!important;border-radius:13px!important;padding:3px!important}
        .pl-calendar-cozy [role="tab"]{border-radius:10px!important;min-height:40px!important;color:#7E6287!important}
        .pl-calendar-cozy [role="tab"][aria-selected="true"]{background:#FFFDFE!important;border-color:#D48BDE!important;color:#6D4279!important;box-shadow:0 4px 14px rgba(154,80,189,.08)!important}
        .pl-calendar-cozy>div,.pl-calendar-cozy>section,.pl-calendar-cozy details{border-color:#EBD9F0!important;border-radius:15px!important;background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,249,252,.94))!important;box-shadow:0 8px 22px rgba(101,63,115,.045)!important}
        .pl-calendar-cozy input,.pl-calendar-cozy select,.pl-calendar-cozy textarea{border-color:#E4CEE9!important;border-radius:10px!important;background:#FFFDFE!important;color:#624C6A!important}
        .pl-calendar-cozy button{border-radius:10px!important}@media(max-width:520px){.pl-calendar-cozy{gap:6px}.pl-calendar-cozy>div,.pl-calendar-cozy>section,.pl-calendar-cozy details{padding:8px!important}.pl-calendar-cozy [role="tab"]{font-size:9px!important}}
      `}</style>
      {content}
    </div>
  );
}
