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
        .pl-calendar-cozy>section,.pl-calendar-cozy details{border-color:var(--pl-theme-line)!important;border-radius:15px!important;background:var(--pl-theme-surface)!important;box-shadow:0 8px 22px rgba(101,63,115,.05),inset 0 1px 0 var(--pl-theme-line)!important}
        .pl-calendar-cozy input,.pl-calendar-cozy select,.pl-calendar-cozy textarea{border-color:var(--pl-theme-line)!important;border-radius:10px!important;background:var(--pl-theme-surface)!important;color:var(--pl-theme-ink)!important}.pl-calendar-cozy input[type="date"]{min-width:0;flex:1}.pl-calendar-cozy .pl-day-task-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:10px!important}.pl-calendar-cozy .pl-day-task-main{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important}.pl-calendar-cozy .pl-day-task-label{min-width:0!important;overflow-wrap:break-word!important;word-break:normal!important;line-height:1.35!important}.pl-calendar-cozy .pl-day-task-status{white-space:nowrap!important;justify-self:end!important;align-self:center!important}.pl-calendar-cozy .pl-calendar-day-pct{white-space:nowrap!important;overflow-wrap:normal!important;word-break:keep-all!important;line-height:1.05!important}.pl-calendar-cozy .pl-calendar-day-number{display:block!important;white-space:nowrap!important;line-height:1.05!important}.pl-calendar-cozy .pl-calendar-day-mood{display:block!important;line-height:1!important}
        .pl-calendar-cozy button{border-radius:10px!important}@media(max-width:520px){.pl-calendar-cozy{gap:8px}.pl-calendar-cozy>section,.pl-calendar-cozy details{padding:11px!important}.pl-calendar-cozy [role="tab"]{font-size:12px!important}.pl-calendar-cozy .pl-calendar-day{min-height:62px!important;padding:5px 2px!important}.pl-calendar-cozy .pl-day-task-row{min-height:50px!important;padding:8px 10px!important}}
      `}</style>
      {content}
    </div>
  );
}
