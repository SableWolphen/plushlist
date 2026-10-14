// Optional, on-device caretaker routines. No task history or cloud data is changed.
export const CARE_ROUTINES = [
  { id:"wake", title:"Good morning, little one", emoji:"🌤️", steps:["Get comfortable and take a breath","Potty or changing check (if wanted)","Get dressed in something cozy","Have breakfast or a drink"] },
  { id:"midday", title:"A little daytime check-in", emoji:"🧸", steps:["Have some water","Eat something if you're hungry","Take a comfort break","Pick one tiny task or rest"] },
  { id:"nap", title:"Quiet or nap time", emoji:"☁️", steps:["Find a comfy spot","Put distractions aside","Rest for a little while","Wake up gently when you're ready"] },
  { id:"night", title:"Bedtime care", emoji:"🌙", steps:["Bath or wash up if you'd like","Potty or changing check (if wanted)","Brush teeth and get cozy","Settle down and rest"] },
];
export function careWords(prefs = {}, occasion = "welcome") {
  const name = String(prefs.petName || prefs.name || "little one").trim().slice(0,40) || "little one";
  const style = prefs.careStyle || "gentle";
  const lines = {
    gentle: { welcome:"I'm here to help you feel cared for.", done:"That was lovely. You can be proud of your effort.", pause:"It's okay to stop or rest." },
    baby: { welcome:"Hello, sweet "+name+"! Ready for a cozy little care moment? 🍼", done:"Good job, "+name+"! Guardian is so proud of you! 🌟", pause:"Rest up, sweet "+name+". No rush at all. 💗" },
    structured: { welcome:"Time for one small care step, "+name+". We can do this together.", done:"All your chosen steps are complete. Well done!", pause:"Paused. You can restart whenever you choose." }
  };
  return (lines[style] || lines.gentle)[occasion] || lines.gentle.welcome;
}
export function careChecksForToday(state, date) {
  return state?.careChecks?.date === date && state.careChecks.items && typeof state.careChecks.items === "object" ? state.careChecks.items : {};
}
