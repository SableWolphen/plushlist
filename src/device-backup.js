const DB_NAME = "plushlife-device-backup";
const DB_VERSION = 1;
const STORE_NAME = "backups";
const BACKUP_VERSION = 1;
const AUTO_BACKUP_MAX_AGE_MS = 6 * 60 * 60 * 1000;

// Only user-owned, independently restorable data belongs in the automatic
// device backup. Relationship/device-token/payment records remain cloud-side
// because replaying those rows on another device could be unsafe or invalid.
const DEVICE_BACKUP_TABLES = [
  ["profile", "tracker_profiles", "user_id"],
  ["preferences", "app_preferences", "user_id"],
  ["tasks", "tracker_tasks", "user_id"],
  ["schedules", "tracker_schedules", "user_id"],
  ["task_progress", "tracker_progress", "user_id"],
  ["daily_progress", "daily_progress", "user_id"],
  ["check_ins", "daily_check_ins", "user_id"],
  ["private_notes", "private_notes", "user_id"],
  ["care_sessions", "care_session_logs", "user_id"],
  ["path_progress", "plush_path_progress", "user_id"],
  ["rest_days", "rest_days", "user_id"],
  ["schedule_exceptions", "schedule_exceptions", "user_id"],
  ["task_snoozes", "task_snoozes", "user_id"],
  ["achievements", "user_achievements", "user_id"],
  ["weekly_intentions", "weekly_intentions", "user_id"],
  ["weekly_intention_checkins", "weekly_intention_checkins", "user_id"],
  ["private_chat_threads", "mommy_chat_threads", "user_id"],
];

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("On-device backup is not supported on this device."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error("Could not open on-device backup storage."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "userId" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function putBackup(record) {
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Could not save on-device backup."));
      tx.objectStore(STORE_NAME).put(record);
    });
  } finally {
    db.close();
  }
}

export async function getDeviceBackupStatus(userId) {
  if (!userId) return { exists: false, savedAt: null };
  try {
    const db = await openDatabase();
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(String(userId));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not read on-device backup."));
    });
    db.close();
    return record
      ? { exists: true, savedAt: record.savedAt || null, version: record.version || 0 }
      : { exists: false, savedAt: null };
  } catch (_error) {
    return { exists: false, savedAt: null, unavailable: true };
  }
}

export async function createDeviceBackup(supabase, user) {
  if (!supabase || !user?.id) throw new Error("Sign in before creating an on-device backup.");

  const results = await Promise.all(DEVICE_BACKUP_TABLES.map(async ([key, table, ownerColumn]) => {
    const { data, error } = await supabase.from(table).select("*").eq(ownerColumn, user.id);
    if (error) throw new Error(`Could not back up ${table}: ${error.message}`);
    return [key, data || []];
  }));

  const savedAt = new Date().toISOString();
  const record = {
    userId: String(user.id),
    version: BACKUP_VERSION,
    savedAt,
    payload: Object.fromEntries(results),
  };
  await putBackup(record);
  try {
    window.dispatchEvent(new CustomEvent("plushlife:device-backup-updated", { detail: { savedAt } }));
  } catch (_error) {}
  return { exists: true, savedAt, version: BACKUP_VERSION };
}

export function scheduleAutomaticDeviceBackup({ supabase, user, online = true, onStatus }) {
  if (!user?.id || !online) return () => {};
  let cancelled = false;
  let idleId = null;
  let timerId = null;

  const run = async () => {
    if (cancelled) return;
    const current = await getDeviceBackupStatus(user.id);
    if (cancelled) return;
    onStatus?.(current);
    const age = current.savedAt ? Date.now() - new Date(current.savedAt).getTime() : Infinity;
    if (current.exists && Number.isFinite(age) && age < AUTO_BACKUP_MAX_AGE_MS) return;
    try {
      const next = await createDeviceBackup(supabase, user);
      if (!cancelled) onStatus?.(next);
    } catch (_error) {
      if (!cancelled) onStatus?.({ ...current, error: true });
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    idleId = window.requestIdleCallback(() => { void run(); }, { timeout: 8000 });
  } else {
    timerId = window.setTimeout(() => { void run(); }, 4000);
  }

  return () => {
    cancelled = true;
    if (idleId != null && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
    if (timerId != null) window.clearTimeout(timerId);
  };
}

export const DEVICE_BACKUP_POLICY = Object.freeze({
  version: BACKUP_VERSION,
  automatic: true,
  maxAgeMs: AUTO_BACKUP_MAX_AGE_MS,
  cloudDataDeleted: false,
});
