// One Guardian destination. A trusted accepted person takes precedence over
// the automatic fallback; pending, paused and other users' links never count.
export function activeHumanGuardians(links = [], ownerId) {
  if (!ownerId || !Array.isArray(links)) return [];
  return links.filter(link =>
    link?.owner_user_id === ownerId &&
    link.active === true &&
    Boolean(link.accepted_at)
  );
}
export function guardianMode(links, ownerId, loadedFor, botEnabled = false) {
  if (!ownerId || loadedFor !== ownerId) return "checking";
  return activeHumanGuardians(links, ownerId).length
    ? "person"
    : botEnabled ? "automatic" : "choose";
}
export function guardianTypeLabel(mode) {
  return mode === "person" ? "Connected person" :
    mode === "automatic" ? "Automatic · On this device" :
    mode === "checking" ? "Checking Guardian connection…" :
    "Automatic Guardian available";
}
export function guardianPersonName(link) {
  // A custom user-assigned label takes precedence over an email; never invent
  // a familiar name for another account.
  const label = String(link?.label || "").trim();
  if (label && label.toLowerCase() !== "guardian") return label.slice(0, 60);
  const email = String(link?.caregiver_email || "").trim();
  return email ? email.slice(0, 100) : "My Guardian";
}
export function guardianBotDisplayName(prefs = {}) {
  const chosen = String(prefs.guardianName || "").trim().slice(0, 36);
  if (chosen) return chosen;
  const names = { mommy: "Mommy", daddy: "Daddy", playful: "Playful Guardian", neutral: "Guardian" };
  return names[prefs.voice] || "Guardian";
}
export function automaticGuardianAllowed(mode) {
  return mode === "automatic" || mode === "choose";
}
export function guardianSuggestedReward(progress, total, resting = false) {
  const done = Math.max(0, Number(progress) || 0);
  if (resting || !total || done <= 0) return null;
  if (done >= total) return "Your Guardian's celebration: you finished your little jobs! You may enjoy a reward you've chosen.";
  return "Your Guardian noticed your effort! Pick a small reward or keep working toward one.";
}
