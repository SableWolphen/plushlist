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
