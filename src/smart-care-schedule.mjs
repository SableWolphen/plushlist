// A derived view only: never moves, completes, or saves an existing item.
export function careMinute(value) {
  const match = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/.exec(String(value || ''));
  return match && +match[1] < 24 ? +match[1] * 60 + +match[2] : null;
}

export function buildSmartCareSchedule({ rows = [], viewDone = {}, entries = [], energy, restDay = false, now = new Date(), date, timezone } = {}) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = type => parts.find(p => p.type === type)?.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const clock = +part('hour') * 60 + +part('minute');
  const items = [];
  let uncertain = false;
  const add = (source, label, time, done, id) => {
    const start = careMinute(time);
    const duration = Number(source.estimated_minutes);
    const explicitEnd = careMinute(source.end_time);
    const end = explicitEnd !== null && explicitEnd > start ? explicitEnd : Number.isFinite(duration) && duration > 0 ? Math.min(1440, start + duration) : null;
    // Untimed incomplete commitments mean we cannot promise a free slot.
    if (start === null) { if (!done) uncertain = true; }
    items.push({ id, kind: 'existing', label, start, end: start === null ? null : end, done: !!done });
  };
  rows.forEach((row, i) => {
    const task = row.sourceTask || row;
    add(task, row.label || task.title || 'Task', task.reminder_time || task.time, viewDone[row.key], `task-${row.key || i}`);
  });
  entries.forEach((entry, i) => add(entry, entry.text || entry.label || entry.title || 'Scheduled item', entry.time, false, `schedule-${i}`));
  const suggestions = [];
  if ((!date || date === today) && !uncertain) {
    const blocks = items.filter(item => item.start !== null).map(item => ({ start: item.start, end: item.end ?? 1440 })).sort((a, b) => a.start - b.start);
    let cursor = clock;
    const suggest = end => {
      const minutes = restDay || ['low', 'empty'].includes(energy) ? 10 : 5;
      if (end - cursor >= minutes) suggestions.push({ id: `care-${cursor}`, kind: 'optional', start: cursor, end: cursor + minutes, label: restDay ? 'Quiet rest or a comfort item' : ['low', 'empty'].includes(energy) ? 'Rest, water, or a soft sensory pause' : 'Water and a gentle stretch', littleLabel: 'Little Mode: cuddle a plush or enjoy quiet coloring' });
    };
    blocks.forEach(block => { if (block.end <= cursor) return; suggest(block.start); cursor = Math.max(cursor, block.end); });
    suggest(1440);
  }
  return { clock, uncertain, restDay, items: [...items, ...suggestions].sort((a, b) => (a.start ?? 1441) - (b.start ?? 1441)) };
}
