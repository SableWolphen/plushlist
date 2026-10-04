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
        .pl-calendar-cozy{display:grid;gap:8px;padding-bottom:calc(116px + env(safe-area-inset-bottom))}
        .pl-calendar-cozy>button{min-height:44px!important;border-radius:14px!important;border:1px solid var(--pl-theme-line)!important;background:var(--pl-theme-surface)!important;color:var(--pl-theme-ink)!important;box-shadow:none!important}
        .pl-calendar-cozy [role="tablist"]{background:var(--pl-theme-surface-2)!important;border:1px solid var(--pl-theme-line)!important;border-radius:13px!important;padding:3px!important}
        .pl-calendar-cozy [role="tab"]{border-radius:10px!important;min-height:44px!important;color:var(--pl-theme-ink)!important}
        .pl-calendar-cozy [role="tab"][aria-selected="true"]{background:var(--pl-theme-surface)!important;border-color:var(--pl-theme-line)!important;color:var(--pl-theme-ink)!important;box-shadow:0 4px 14px rgba(154,80,189,.08)!important}
        .pl-calendar-cozy>div,.pl-calendar-cozy>section,.pl-calendar-cozy details{border-color:var(--pl-theme-line)!important;border-radius:15px!important;background:var(--pl-theme-surface)!important;box-shadow:0 8px 22px rgba(101,63,115,.05),inset 0 1px 0 var(--pl-theme-line)!important}
        .pl-calendar-cozy input,.pl-calendar-cozy select,.pl-calendar-cozy textarea{border-color:var(--pl-theme-line)!important;border-radius:10px!important;background:var(--pl-theme-surface)!important;color:var(--pl-theme-ink)!important}.pl-calendar-cozy input[type="date"]{min-width:0;flex:1}.pl-calendar-cozy section label{display:grid!important;grid-template-columns:minmax(0,1fr) 76px!important;align-items:center!important}.pl-calendar-cozy section label>span{min-width:0;overflow-wrap:break-word}.pl-calendar-cozy section label>strong{white-space:nowrap!important;justify-self:end!important}
        .pl-calendar-cozy button{border-radius:10px!important}@media(max-width:520px){.pl-calendar-cozy{gap:6px}.pl-calendar-cozy>div,.pl-calendar-cozy>section,.pl-calendar-cozy details{padding:8px!important}.pl-calendar-cozy [role="tab"]{font-size:12px!important}}
      `}</style>
      {content}
    </div>
  );
}
