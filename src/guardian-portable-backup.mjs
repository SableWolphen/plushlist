import { freshGuardianState, normalizeGuardianState } from "./plush-guardian-model.mjs";

export const MAX_GUARDIAN_BACKUP_BYTES = 12 * 1024 * 1024;
const VALID_OWNER = /^[0-9a-z-]{12,}$/i;
const utf8 = value => new TextEncoder().encode(value);
async function sha256(text, subtle) {
  if (!subtle?.digest) throw new Error("Secure backup verification is unavailable on this device.");
  const bytes = await subtle.digest("SHA-256", utf8(text));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, "0")).join("");
}
function safeState(value) {
  const normalized = normalizeGuardianState(value);
  const defaults = freshGuardianState();
  const allowed = Object.fromEntries(Object.keys(defaults).map(key => [key, normalized[key]]));
  allowed.prefs = Object.fromEntries(Object.keys(defaults.prefs).map(key => [key, normalized.prefs[key]]));
  // A restored file must never turn on external AI calls or device notifications.
  allowed.prefs.aiConsent = false;
  allowed.prefs.automaticReminders = false;
  allowed.prefs.reminders = false;
  allowed.prefs.shareTasks = false;
  allowed.prefs.shareMood = false;
  allowed.prefs.shareMemories = false;
  allowed.prefs.keepChat = false;
  return allowed;
}
export async function makeGuardianBackup(owner, state, subtle = globalThis.crypto?.subtle) {
  if (!VALID_OWNER.test(owner || "")) throw new Error("Sign in before exporting your companion.");
  const payload = JSON.stringify(safeState(state));
  if (utf8(payload).length > MAX_GUARDIAN_BACKUP_BYTES) throw new Error("This backup is too large. Remove oversized photos and try again.");
  return {
    app: "PlushLife",
    type: "guardian-private-backup",
    version: 2,
    owner,
    created_at: new Date().toISOString(),
    companion: JSON.parse(payload),
    sha256: await sha256(payload, subtle),
  };
}
export async function parseGuardianBackup(text, owner, subtle = globalThis.crypto?.subtle) {
  if (!VALID_OWNER.test(owner || "")) throw new Error("Sign in to restore your companion.");
  if (typeof text !== "string" || utf8(text).length > MAX_GUARDIAN_BACKUP_BYTES + 1024) throw new Error("Backup file exceeds the safe size limit.");
  let record;
  try { record = JSON.parse(text); } catch { throw new Error("This isn't a valid JSON backup."); }
  if (record?.app !== "PlushLife" || record?.type !== "guardian-private-backup" || record?.version !== 2) throw new Error("This file is not a supported private PlushLife companion backup.");
  if (record.owner !== owner) throw new Error("This backup belongs to a different Cozy account and cannot be restored here.");
  if (!record.companion || typeof record.companion !== "object" || Array.isArray(record.companion)) throw new Error("This backup does not contain companion data.");
  const expected = await sha256(JSON.stringify(record.companion), subtle);
  if (record.sha256 !== expected) throw new Error("Backup integrity check failed. Nothing was changed.");
  const restored = safeState(record.companion);
  return {
    restored,
    preview: {
      createdAt: record.created_at || "",
      memories: restored.memories.length,
      reflections: restored.reflections.length,
      routines: restored.routines.length,
      rewards: restored.rewards.length,
      letters: restored.letters.length,
      note: "Restoring replaces this device's current companion tools. AI and automatic reminders remain off until you opt in again.",
    },
  };
}
