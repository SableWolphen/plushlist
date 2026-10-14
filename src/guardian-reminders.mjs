// Rule-based companion language. No AI/chat, network request, or new permission.
// The native scheduler applies quiet hours, app notification opt-in and discreet mode.
export function virtualGuardianReminderCopy(voice = "neutral", taskLabel = "", guidance = "gentle") {
  const task = String(taskLabel || "").replace(/[\r\n]+/g, " ").trim().slice(0, 100);
  const step = task ? `One little step: ${task}.` : "Your little plan is ready when you are.";
  const ending = guidance === "structured" ? " Open your list to begin, snooze or skip." : " There's no rush — you can move it later.";
  const headings = {
    neutral: "Your Plush has a gentle reminder 🧸",
    mommy: "Mommy's little reminder 🧸",
    daddy: "Daddy's little reminder 🧸",
    playful: "A tiny mission from your Plush ✨",
  };
  return { title: headings[voice] || headings.neutral, body: step + ending };
}

export function guardianRoutineCopy(routineName = "", step = "", voice = "neutral", guidance = "gentle") {
  const label = String(step || "").replace(/[\r\n]+/g, " ").trim().slice(0, 100);
  const routine = String(routineName || "your routine").replace(/[\r\n]+/g, " ").trim().slice(0, 80);
  const text = label ? `Your next step in ${routine}: ${label}.` : `Your ${routine} is ready when you are.`;
  return { ...virtualGuardianReminderCopy(voice, "", guidance), body: text + " You can pause or skip it in PlushLife." };
}
export function guardianTomorrowCopy(voice = "neutral", guidance = "gentle") {
  return { ...virtualGuardianReminderCopy(voice, "", guidance), body: "Tomorrow is getting ready. Take a peek at your little plan whenever you're comfortable." };
}
