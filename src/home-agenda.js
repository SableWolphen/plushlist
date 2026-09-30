const minutes = time => {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(String(time || ''));
  return match && Number(match[1]) < 24 ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export function upcomingSchedule(entries, date, now = new Date(), timezone) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone || undefined, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(now);
  } catch (_) { return null; }
  const value = type => parts.find(part => part.type === type)?.value;
  const today = `${value('year')}-${value('month')}-${value('day')}`;
  if (!date || date < today) return null;
  const clock = date === today ? Number(value('hour')) * 60 + Number(value('minute')) : 0;
  return entries.map(entry=>({entry,minute:minutes(entry.time)}))
    .filter(item=>item.minute !== null && item.minute >= clock)
    .sort((a,b)=>a.minute-b.minute)[0]?.entry || null;
}
