export function widgetSnapshot({ rows = [], viewDone = {}, dayType = 'full', progress = 0, weeklyProgress = 0, theme = 'soft' } = {}) {
  const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const tasks = rows.filter(row=>row && typeof row.key === 'string' && row.label).map(row=>({key:row.key,label:String(row.label).slice(0,160),done:!!viewDone[row.key],isBonus:!!row.isBonus}));
  const pending = tasks.filter(task=>!task.done && !task.isBonus);
  const extras = tasks.filter(task=>!task.done && task.isBonus);
  const complete = tasks.filter(task=>task.done);
  const resting = dayType === 'rest';
  return {
    nextTask: resting ? 'Resting counts today' : pending[0]?.label || extras[0]?.label || (tasks.length ? 'Your caring steps are complete 💜' : 'Open PlushLife for one caring step'),
    dayType: `${String(dayType).replace(/^./,letter=>letter.toUpperCase())} Day`,
    progress:clamp(progress),weeklyProgress:clamp(weeklyProgress),theme,
    tasks:resting ? [] : [...pending,...extras,...complete].slice(0,3).map(({isBonus,...task})=>task),
  };
}
