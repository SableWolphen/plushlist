// Pure calendar recurrence and gentle planning helpers.
export function calendarOccurrences(items, start, end) {
  const output = [];
  const valid = /^\d{4}-\d{2}-\d{2}$/;
  if (!valid.test(start || "") || !valid.test(end || "") || start > end) return output;
  for (const item of items || []) {
    if (!item || !valid.test(item.date || "") || !["once","daily","weekly","monthly"].includes(item.repeat)) continue;
    const seed = new Date(item.date + "T12:00:00");
    if (Number.isNaN(seed.getTime())) continue;
    let cursor = new Date(start + "T12:00:00");
    const last = new Date(end + "T12:00:00");
    for (let n=0; cursor <= last && n < 370; n++, cursor.setDate(cursor.getDate()+1)) {
      const iso = [cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,"0"),String(cursor.getDate()).padStart(2,"0")].join("-");
      if (iso < item.date) continue;
      const days = Math.round((Date.UTC(cursor.getFullYear(),cursor.getMonth(),cursor.getDate())-Date.UTC(seed.getFullYear(),seed.getMonth(),seed.getDate()))/86400000);
      const matches = item.repeat === "once" ? iso === item.date :
        item.repeat === "daily" ? true :
        item.repeat === "weekly" ? days >= 0 && days % 7 === 0 :
        cursor.getDate() === Math.min(seed.getDate(),new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate());
      if (matches) output.push({ ...item, occurrence: iso });
    }
  }
  return output.sort((a,b)=>a.occurrence.localeCompare(b.occurrence) || (a.time || "").localeCompare(b.time || ""));
}
export const occurrenceKey = event => event.id + ":" + event.occurrence;
export function importantUpcoming(items, today, days=7) {
  const from=new Date(today+"T12:00:00");
  if(Number.isNaN(from.getTime())) return [];
  from.setDate(from.getDate()+Math.max(0,Math.min(60,days)));
  const until=[from.getFullYear(),String(from.getMonth()+1).padStart(2,"0"),String(from.getDate()).padStart(2,"0")].join("-");
  return calendarOccurrences(items,today,until).filter(item=>item.important || item.category==="bill");
}
export function brainDumpLines(raw) {
  return String(raw||"").split(/\n|;/).map(text=>text.replace(/^[-*•\s]+/,"").trim().slice(0,120)).filter(Boolean).slice(0,25);
}
export const GENTLE_TEMPLATES = [
 { title:"Pay rent",category:"bill",repeat:"monthly",important:true },
 { title:"Take out trash",category:"home",repeat:"weekly",important:false },
 { title:"Drink some water",category:"care",repeat:"daily",important:false },
 { title:"Check upcoming appointments",category:"life",repeat:"weekly",important:false },
 { title:"Gather keys and wallet",category:"leaving",repeat:"daily",important:false }
];
