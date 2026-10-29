// Device-only calendar plans. No payment processing or OS notification permissions.
export function calendarOccurrences(items, start, end) {
  const output = [];
  const valid = /^\\d{4}-\\d{2}-\\d{2}$/;
  for (const item of items || []) {
    if (!item || !valid.test(item.date || "") || !["once","daily","weekly","monthly"].includes(item.repeat)) continue;
    const seed = new Date(item.date + "T12:00:00");
    if (Number.isNaN(seed.getTime())) continue;
    let cursor = new Date(start + "T12:00:00");
    const last = new Date(end + "T12:00:00");
    for (let n=0; cursor <= last && n < 370; n++, cursor.setDate(cursor.getDate()+1)) {
      const iso = [cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,"0"),String(cursor.getDate()).padStart(2,"0")].join("-");
      if (iso < item.date) continue;
      const days = Math.round((cursor.getTime()-seed.getTime())/86400000);
      const matches = item.repeat === "once" ? iso === item.date :
        item.repeat === "daily" ? true :
        item.repeat === "weekly" ? days >= 0 && days % 7 === 0 :
        // A bill due on the 31st appears on the last day of shorter months.
        cursor.getDate() === Math.min(seed.getDate(),new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate());
      if (matches) output.push({ ...item, occurrence: iso });
    }
  }
  return output.sort((a,b)=>a.occurrence.localeCompare(b.occurrence) || (a.time || "").localeCompare(b.time || ""));
}
