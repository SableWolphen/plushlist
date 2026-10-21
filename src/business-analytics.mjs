// Privacy-friendly client-side metric aggregation: no email, user ID, notes, task names or mood data.
const EVENTS=new Set(["landing_view","pricing_view","signup_started","onboarding_completed","premium_interest"]);
export function normalizeEvent(name) { return EVENTS.has(name)?name:null; }
export function tallyEvents(events) {
 const counts=Object.fromEntries([...EVENTS].map(event=>[event,0]));
 for(const entry of Array.isArray(events)?events:[]) {
   const name=typeof entry==="string"?entry:entry?.name;
   if(EVENTS.has(name)) counts[name]++;
 }
 return counts;
}
// Aggregation is local; no analytics network requests or tracking identifiers.
export const COLLECTION_ENABLED=false;
