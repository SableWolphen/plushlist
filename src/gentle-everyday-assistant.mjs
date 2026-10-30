import { importantUpcoming, calendarOccurrences } from "./gentle-calendar.mjs";
export function gentleBriefing(items, done, today, period="morning") {
  const upcoming=importantUpcoming(items,today,7).filter(item=>!done[item.id+":"+item.occurrence]);
  const todayItems=calendarOccurrences(items,today,today).filter(item=>!done[item.id+":"+item.occurrence]);
  const essential=upcoming.filter(item=>item.category==="bill"||item.important);
  const flexible=todayItems.filter(item=>!item.important&&item.category!=="bill");
  return {
    title: period==="evening"?"A soft look at tomorrow":"A little look at today",
    essential:essential.slice(0,3),
    next: flexible[0]||null,
    remaining: flexible.length,
    message:essential.length?"A few dates are worth keeping in view. Everything else can be flexible.":"You can choose your own pace. Nothing needs to be perfect."
  };
}
export function parseSpokenReminder(text) {
 const source=String(text||"").trim().slice(0,300);
 const m=source.match(/^(?:remind me to|remember to|add )\s*(.+?)(?:\s+every\s+(day|week|month))?(?:\s+on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?)?$/i);
 if(!m)return {title:source,repeat:"once",dayOfMonth:null,needsReview:true};
 return {title:m[1].trim(),repeat:m[2]?({day:"daily",week:"weekly",month:"monthly"}[m[2].toLowerCase()]):"once",dayOfMonth:m[3] && Number(m[3])>=1 && Number(m[3])<=31 ? Number(m[3]) : null,needsReview:true};
}
