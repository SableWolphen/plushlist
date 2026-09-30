export const COZY_FIELDS = [
  ["nickname", "Preferred nickname", "identity"],
  ["comfort_item", "My comfort item", "comforts"],
  ["favorite_plush", "Favorite plush", "comforts"],
  ["drink", "Favorite drink", "comforts"],
  ["snacks", "Foods and snacks that feel safe", "comforts"],
  ["sounds", "Sounds and music", "comforts"],
  ["show", "Comfort show or game", "comforts"],
  ["scents", "Scents I like", "comforts"],
  ["textures", "Textures I like", "comforts"],
  ["places", "Places that feel cozy", "comforts"],
  ["lighting", "Lighting that feels good", "space"],
  ["colors", "Favorite colors", "space"],
  ["little_goal", "My little goal", "identity"],
  ["signals", "I’m getting overwhelmed when…", "signals"],
  ["helps", "Things that help me", "help"],
  ["please_dont", "Please don’t", "help"],
  ["quiet", "When I’m quiet", "help"],
  ["hugs", "How I feel about hugs", "help"],
  ["talking", "How I feel about talking", "help"],
  ["reminders", "How I like reminders", "help"],
  ["encouragement", "Encouragement that lands", "help"],
  ["anchors", "My routine anchors", "routine"],
  ["bedtime", "My bedtime comfort routine", "routine"],
  ["soft_plan", "My rough day plan", "routine"],
  ["support_style", "My support style", "help"],
  ["status", "How I’m feeling", "identity"],
  ["need", "Today I need", "identity"],
];
export const COZY_STATUSES = ["🌷 Okay", "🌧 Low", "🫧 Overwhelmed", "💤 Exhausted", "☀️ Doing good"];
export const COZY_NEEDS = ["Quiet", "Encouragement", "Distraction", "Help starting", "Space", "Just listen", "Check on me later", "Stay with me", "I’m okay, just low-energy"];
export const COZY_REMINDER_STYLES = ["Gentle", "Playful", "Direct", "Quiet"];
const keys = new Set(COZY_FIELDS.map(([key]) => key));
export function normalizeCozyProfile(value = {}) {
  const fields = Object.fromEntries(COZY_FIELDS.map(([key]) => [key, typeof value?.fields?.[key] === "string" ? value.fields[key].slice(0, 500) : ""]));
  return {
    fields,
    setup: ['done', 'skipped'].includes(value?.setup) ? value.setup : '',
    reminder_style: COZY_REMINDER_STYLES.includes(value?.reminder_style) ? value.reminder_style : 'Gentle',
    reminder_time: /^([01]\d|2[0-3]):[0-5]\d$/.test(value?.reminder_time || '') ? value.reminder_time : '',
    return_reminders: value?.return_reminders === true,
    comfort_uses: (Array.isArray(value?.comfort_uses) ? value.comfort_uses : []).filter(u => u && keys.has(u.key) && ['helped','not_today'].includes(u.fit)).slice(0, 80).map(u => ({key:u.key,fit:u.fit,date:String(u.date || '').slice(0,10)})),
    reflection_week: typeof value?.reflection_week === 'string' ? value.reflection_week.slice(0,10) : '',
    essentials: [...new Set(Array.isArray(value?.essentials) ? value.essentials.filter(key => typeof key === "string").map(key => key.slice(0, 100)) : [])].slice(0, 3),
    reset_sound: typeof value?.reset_sound === "string" ? value.reset_sound.slice(0, 60) : "",
    memories: (Array.isArray(value?.memories) ? value.memories : []).filter(m => m && typeof m.text === "string").slice(0, 60).map(m => ({id: String(m.id || "").slice(0, 100), text: m.text.slice(0, 500), date: String(m.date || "").slice(0, 40)})),
    feedback: (Array.isArray(value?.feedback) ? value.feedback : []).filter(f => f && typeof f.note_id === "string").slice(0, 60).map(f => ({note_id:f.note_id, value:["helped", "too_much", "space", "liked"].includes(f.value) ? f.value : "helped"})),
  };
}

export function cozyComfortSuggestions(profile) {
  const clean = normalizeCozyProfile(profile);
  const available = COZY_FIELDS.filter(([key,,group]) => (group === 'comforts' || key === 'helps') && clean.fields[key]);
  return available.map(([key,label], index) => {
    const uses = clean.comfort_uses.filter(u=>u.key===key);
    const helped = uses.filter(u=>u.fit==='helped').length;
    const score = helped - uses.filter(u=>u.fit==='not_today').length;
    return {key,label,text:clean.fields[key],helped,score,index};
  }).sort((a,b)=>b.score-a.score || a.index-b.index).slice(0,3);
}

export function cozyNextStep(profile, rows = [], done = {}, dayType = 'full') {
  const clean = normalizeCozyProfile(profile);
  if (dayType === 'rest') return null;
  return rows.find(row=>clean.essentials.includes(row.key) && !done[row.key] && !row.isBonus) || null;
}

// Reminder wording never includes comfort details, mood, or the private passport.
export function cozyReminderCopy(style, task = '', comeback = false) {
  const copy = {
    Gentle: ['A little room for you', comeback ? 'Glad you’re here whenever you’re ready. Your usual day or a softer one is waiting.' : task ? `One small step, when you’re ready: ${task}` : 'Your comforts and one caring step are here when you want them.'],
    Playful: ['A tiny cozy moment ✨', comeback ? 'A fresh little start is waiting. Pick your usual day or a softer one.' : task ? `Tiny step time: ${task}` : 'Pick a tiny step or visit your Comfort Kit.'],
    Direct: ['Your PlushLife reminder', comeback ? 'Open PlushLife to choose your usual day or your Soft Plan.' : task ? `Next step: ${task}` : 'Open Today or your Comfort Kit.'],
    Quiet: ['PlushLife', 'Open when it suits you.'],
  };
  const [title,body] = copy[style] || copy.Gentle;
  return {title,body};
}
// Build an explicit, allowlisted snapshot. No private profile or feedback travels with it.
export function cozyCardSnapshot(profile, selected = [], includeMemories = []) {
  const clean = normalizeCozyProfile(profile);
  const fields = Object.fromEntries(selected.filter(key => keys.has(key) && clean.fields[key]).map(key => [key, clean.fields[key]]));
  return { fields, memories: Array.isArray(includeMemories) ? clean.memories.filter(m=>includeMemories.includes(m.id)) : [] };
}
export function supportPreferenceSummary(profile) {
  const rows = normalizeCozyProfile(profile).feedback;
  if (rows.length < 3) return "Your feedback stays private. A few more notes will help you notice what fits.";
  const counts = Object.fromEntries(["helped", "too_much", "space", "liked"].map(value => [value, rows.filter(row => row.value === value).length]));
  if (counts.space > counts.helped + counts.liked) return "You’ve often wanted more space after a note. You can add that to How to Help Me.";
  if (counts.too_much > counts.helped + counts.liked) return "Some notes have felt like too much. You can ask for shorter, quieter encouragement.";
  return "Several notes have felt helpful. Keep the encouragement you liked in your Comfort Passport.";
}
