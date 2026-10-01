import { deviceStorage } from '../private-save.js';
import { readStudio, writeStudio, defaultGoal, validateGoal, goalResult, shiftDate } from '../habit-studio-model.js';
export const HabitStudioContext = React.createContext(null);
const Core=React.lazy(()=>import('./habit-studio-core.jsx').then(module=>({default:module.HabitStudioCore})));
export function HabitStudioProvider({userId,tasks=[],rows=[],done={},history=[],date,editableDay=true,onToggle,children}) {
  const key=`plushlife:habit-studio:${userId}:v1`;
  const [state,setState]=React.useState(()=>readStudio(deviceStorage(),key));
  const [message,setMessage]=React.useState('');
  const save=next=>{const clean=writeStudio(deviceStorage(),key,next);if(!clean){setMessage('Couldn’t save on this device. Your previous choices are safe.');return false;}setState(clean);setMessage('Saved privately on this device.');return true;};
  React.useEffect(()=>{setState(readStudio(deviceStorage(),key));setMessage('');const refresh=event=>{if(event.key===key)setState(readStudio(deviceStorage(),key));};window.addEventListener('storage',refresh);return()=>window.removeEventListener('storage',refresh);},[key]);
  const active=tasks.filter(task=>!task.archived_at);
  const saveGoal=(taskKey,value)=>{const error=validateGoal(value,taskKey,state.goals);if(error){setMessage(error);return false;}return save({...state,goals:{...state.goals,[taskKey]:{...value,created:state.goals[taskKey]?.created||date}}});};
  const logGoal=(taskKey,amount,note='')=>{if(!editableDay||!rows.some(row=>row.key===taskKey)){setMessage('Log goals from today’s scheduled list.');return false;}const value=Number(amount);if(amount===''||!Number.isFinite(value)||value<0||value>100000){setMessage('Enter an amount between 0 and 100,000.');return false;}const goal=state.goals[taskKey]||defaultGoal(active.find(t=>t.task_key===taskKey));return save({...state,logs:{...state.logs,[date]:{...state.logs[date],[taskKey]:{amount:value,...goalResult(goal,value),unit:goal.unit,note,at:new Date().toISOString()}}}});};
  const beginExperiment=(taskKey,change)=>{if(!change.trim()){setMessage('Choose one change to try.');return false;}if(state.experiments.some(e=>e.taskKey===taskKey&&e.status==='active')){setMessage('Finish or stop the current experiment for this habit first.');return false;}return save({...state,experiments:[{id:crypto.randomUUID(),taskKey,change:change.trim(),start:date,end:shiftDate(date,6),status:'active'},...state.experiments]});};
  const scheduled=(task,date)=>window.PlushLifeSchedule.taskIsScheduledForDate(task,date)&&!(task.paused_since&&date>=task.paused_since&&(!task.paused_until||date<=task.paused_until));
  const currentHistory=[...history.filter(h=>h.progress_date!==date),{progress_date:date,completed_keys:Object.keys(done).filter(key=>done[key])}];
  const value={state,message,save,saveGoal,logGoal,beginExperiment,tasks:active,rows,done,history:currentHistory,date,editableDay,scheduled,onToggle};
  return <HabitStudioContext.Provider value={value}>{children}</HabitStudioContext.Provider>;
}
export function HabitStudio({initialTab='plan',compact=false}) {
  const [open,setOpen]=React.useState(!compact);
  if(compact&&!open)return <button type="button" className="pl-studio-door" onClick={()=>setOpen(true)}><span>🌱 My Habit Studio</span><small>Small goals, weekly reviews & routines</small><span aria-hidden="true">›</span></button>;
  return <React.Suspense fallback={<div role="status" className="pl-studio-loading">Opening your little routines…</div>}><Core initialTab={initialTab}/></React.Suspense>;
}
export function HabitGoalCaption({taskKey}) {
  const studio=React.useContext(HabitStudioContext);const goal=studio?.state.goals[taskKey];
  if(!goal)return null;
  const anchor=studio.tasks.find(task=>task.task_key===goal.afterTask)?.task;
  return <small className="pl-goal-caption">{goal.direction==='at_most'?'Up to':'Minimum'} {goal.minimum} {goal.unit} · Stretch {goal.stretch}{goal.cue?` · ${goal.cue}`:anchor?` · After ${anchor}`:''}</small>;
}
