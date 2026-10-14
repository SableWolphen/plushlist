// Offline, rule-based Bot Guardian copy. There are no AI calls, chats,
// third-party requests or extra notification permissions.
function clean(value, limit) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, limit);
}
export function virtualGuardianReminderCopy(voice = "neutral", taskLabel = "", guidance = "gentle") {
  const task = clean(taskLabel, 100);
  const fallback = "Your little plan is ready when you are.";
  const lines = {
    neutral: task ? `One little step: ${task}.` : fallback,
    mommy: task ? `Sweetheart, let's do ${task} together, one tiny step at a time.` : "Sweetheart, it's time to look at our little plan.",
    daddy: task ? `Kiddo, let's work on ${task}. One step is enough to begin.` : "Hey kiddo, let's take a look at today's little plan.",
    playful: task ? `Your next little mission: ${task}!` : "Your next little mission is ready!",
  };
  const ending = guidance === "structured" ? " Open PlushLife to start, snooze or skip." : " You can pause or skip whenever you need.";
  const titles = {
    neutral: "Your gentle Guardian reminder 🧸",
    mommy: "Bot Mommy's little reminder 🧸",
    daddy: "Bot Daddy's little reminder 🧸",
    playful: "A tiny mission from your Guardian ✨",
  };
  return { title: titles[voice] || titles.neutral, body: (lines[voice] || lines.neutral) + ending };
}
export function guardianRoutineCopy(routineName = "", step = "", voice = "neutral", guidance = "gentle") {
  const routine = clean(routineName, 80) || "your routine";
  const label = clean(step, 100);
  const intro = voice === "mommy" ? "Sweetheart, Mommy has our next step: " : voice === "daddy" ? "Kiddo, Daddy's next step: " : "Next in your routine: ";
  const text = label ? `${intro}${label} (${routine}).` : `Your ${routine} is ready when you are.`;
  return { ...virtualGuardianReminderCopy(voice, "", guidance), body: text + " You may pause or skip it in PlushLife." };
}
export function guardianTomorrowCopy(voice = "neutral", guidance = "gentle") {
  const messages = {
    mommy: "Sweetheart, let's peek at tomorrow's little plan before bedtime. You can change anything.",
    daddy: "Tomorrow, kiddo, let's get one thing ready. No pressure.",
    neutral: "Tomorrow is getting ready. Take a peek at your little plan whenever you're comfortable.",
    playful: "Tomorrow's mission preview is ready! Just a peek, no rush.",
  };
  return { ...virtualGuardianReminderCopy(voice, "", guidance), body: messages[voice] || messages.neutral };
}

export function guardianCaretakerCopy(period = "morning", style = "gentle") {
  const bedtime = period === "bedtime";
  const messages = {
    gentle: bedtime ? "A cozy bedtime check-in is here, if you'd like one." : "Your gentle morning care routine is here when you're ready.",
    baby: bedtime ? "Sweet little one, time to get comfy and cozy for bed. 💗" : "Good morning, little one! Ready for a cozy care routine? 🍼",
    structured: bedtime ? "Bedtime routine: pick one comfortable step, or rest." : "Morning care: choose one small step at your own pace."
  };
  return { title: "A little care from Guardian 🧸", body: messages[style] || messages.gentle };
}
