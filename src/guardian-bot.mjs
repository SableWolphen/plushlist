// A local, rule-based substitute for routine Guardian nudges when a Cozy has
// no human Guardian. Never calls chat, AI, remote services or another account.
export const BOT_GUARDIAN_NAMES = Object.freeze({
  neutral: "Gentle Guardian",
  mommy: "Bot Mommy",
  daddy: "Bot Daddy",
  playful: "Playful Guardian",
});
export function botGuardianName(voice) {
  return BOT_GUARDIAN_NAMES[voice] || BOT_GUARDIAN_NAMES.neutral;
}
export function activateBotMommy(prefs = {}) {
  // The user presses a clearly named opt-in button. OS notification permission
  // and the app's existing notification toggle remain separate.
  return {
    ...prefs,
    voice: "mommy",
    aiConsent: false,
    shareTasks: false,
    shareMood: false,
    shareMemories: false,
    keepChat: false,
    automaticReminders: true,
    routineNudges: true,
    tomorrowNudges: true,
  };
}
export function botGuardianDailyPlan(rows = [], done = {}, voice = "mommy", resting = false) {
  const eligible = (Array.isArray(rows) ? rows : []).filter(row =>
    row?.key && row?.label && !row.isBonus && !row.sourceTask?.archived_at
  );
  const left = eligible.filter(row => !done[row.key]);
  const completed = eligible.length - left.length;
  let encouragement;
  if (resting) encouragement = "Rest counts too. Your list can wait until you're ready.";
  else if (!eligible.length) encouragement = "Sweetheart, your day can start with one little thing.";
  else if (!left.length) encouragement = "You finished your little jobs. I'm proud of your effort!";
  else if (voice === "mommy") encouragement = `Sweetheart, ${left.length} little ${left.length === 1 ? "job is" : "jobs are"} waiting. Let's try just one.`;
  else if (voice === "daddy") encouragement = `Kiddo, you've got ${left.length} ${left.length === 1 ? "step" : "steps"} left. One at a time.`;
  else encouragement = `You have ${left.length} ${left.length === 1 ? "step" : "steps"} left. One small start is enough.`;
  return {
    title: botGuardianName(voice),
    encouragement,
    next: resting ? null : (left[0] || null),
    remaining: left.length,
    completed,
    total: eligible.length,
  };
}
