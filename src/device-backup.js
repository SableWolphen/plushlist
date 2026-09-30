// Threat model for on-device backup encryption:
// - Protects against: casual snooping of the IndexedDB snapshot records —
//   anyone with brief access to the unlocked app or a plain file copy of the
//   browser profile sees only AES-256-GCM ciphertext, not reflections,
//   private notes, or chat content.
// - NOT a defense against: a rooted/jailbroken device, forensic imaging of a
//   device where the key is stored alongside the data, or malware running as
//   the app. The encryption key lives in the same IndexedDB as the backups
//   (per-install, randomly generated), so this is at-rest obfuscation against
//   opportunistic access, not full-disk encryption.
// - Encryption fails closed: if WebCrypto is unavailable, backup creation
//   throws instead of silently writing plaintext.
const DB_NAME = "plushlife-device-backup";
const DB_VERSION = 2;
const STORE_NAME = "backups";
const KEY_STORE_NAME = "keys";
const BACKUP_KEY_NAME = "backup-encryption-key";
const BACKUP_VERSION = 3;
const AUTO_BACKUP_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const BACKUP_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_DEVICE_SNAPSHOTS = 3;
const AUTO_BACKUP_START_DELAY_MS = 30000;
const BACKUP_QUERY_BATCH_SIZE = 4;

// Only user-owned, independently restorable data belongs in the automatic
// device backup. Relationship/device-token/payment records remain cloud-side
// because replaying those rows on another device could be unsafe or invalid.
const DEVICE_BACKUP_TABLES = [
  ["profile", "tracker_profiles", "user_id"],
  ["cozy_profile", "cozy_profiles", "user_id"],
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
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) db.createObjectStore(KEY_STORE_NAME, { keyPath: "name" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function getBackupRecord(userId) {
  if (!userId) return null;
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(String(userId));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not read on-device backup."));
    });
  } finally {
    db.close();
  }
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

function cryptoSubtle() {
  const subtle = window.crypto?.subtle;
  if (!subtle || typeof TextEncoder === "undefined") {
    throw new Error("On-device backup encryption is not supported on this device.");
  }
  return subtle;
}

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function getOrCreateBackupKey() {
  const subtle = cryptoSubtle();
  const db = await openDatabase();
  try {
    const stored = await new Promise((resolve, reject) => {
      const tx = db.transaction(KEY_STORE_NAME, "readonly");
      const request = tx.objectStore(KEY_STORE_NAME).get(BACKUP_KEY_NAME);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not read backup encryption key."));
    });
    if (stored?.jwk) {
      return subtle.importKey("jwk", stored.jwk, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    }
    const key = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const jwk = await subtle.exportKey("jwk", key);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(KEY_STORE_NAME, "readwrite");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Could not save backup encryption key."));
      tx.objectStore(KEY_STORE_NAME).put({ name: BACKUP_KEY_NAME, jwk, createdAt: new Date().toISOString() });
    });
    return key;
  } finally {
    db.close();
  }
}

async function encryptSnapshotPayload(payload) {
  const subtle = cryptoSubtle();
  const key = await getOrCreateBackupKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const bytes = new TextEncoder().encode(stablePayloadText(payload));
  const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

async function decryptSnapshotPayload(snapshot) {
  if (!snapshot?.ciphertext) return snapshot?.payload || null;
  const subtle = cryptoSubtle();
  const key = await getOrCreateBackupKey();
  const bytes = await subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(snapshot.iv) },
    key,
    fromBase64(snapshot.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(bytes));
}

function normalizeSnapshots(record) {
  if (!record) return [];
  if (Array.isArray(record.snapshots)) return record.snapshots.filter(Boolean);
  if (record.payload && record.savedAt) {
    return [{
      version: record.version || 1,
      savedAt: record.savedAt,
      payload: record.payload,
      checksum: record.checksum || null,
    }];
  }
  return [];
}

function payloadLooksValid(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  return DEVICE_BACKUP_TABLES.every(([key]) => Array.isArray(payload[key]));
}

function stablePayloadText(payload) {
  const ordered = {};
  for (const [key] of DEVICE_BACKUP_TABLES) ordered[key] = Array.isArray(payload?.[key]) ? payload[key] : [];
  return JSON.stringify(ordered);
}

async function checksumPayload(payload) {
  try {
    if (!window.crypto?.subtle || typeof TextEncoder === "undefined") return null;
    const bytes = new TextEncoder().encode(stablePayloadText(payload));
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch (_error) {
    return null;
  }
}

function rowCounts(payload) {
  return Object.fromEntries(DEVICE_BACKUP_TABLES.map(([key]) => [key, Array.isArray(payload?.[key]) ? payload[key].length : 0]));
}

export async function getDeviceBackupStatus(userId) {
  if (!userId) return { exists: false, savedAt: null, verified: false, snapshotCount: 0 };
  try {
    const record = await getBackupRecord(userId);
    const snapshots = normalizeSnapshots(record);
    const latest = snapshots[0] || null;
    if (!latest) return { exists: false, savedAt: null, verified: false, snapshotCount: 0 };
    const savedTime = new Date(latest.savedAt || 0).getTime();
    const stale = !Number.isFinite(savedTime) || Date.now() - savedTime > BACKUP_STALE_AFTER_MS;
    let payload = null;
    try {
      payload = await decryptSnapshotPayload(latest);
    } catch (_decryptError) {
      return { exists: false, savedAt: null, verified: false, snapshotCount: 0, unavailable: true };
    }
    return {
      exists: true,
      savedAt: latest.savedAt || null,
      version: latest.version || record?.version || 0,
      verified: record?.lastVerifiedChecksum === latest.checksum && !!latest.checksum,
      verifiedAt: record?.verifiedAt || null,
      snapshotCount: snapshots.length,
      stale,
      counts: rowCounts(payload),
    };
  } catch (_error) {
    return { exists: false, savedAt: null, verified: false, snapshotCount: 0, unavailable: true };
  }
}

export async function verifyDeviceBackup(userId) {
  if (!userId) return { ok: false, reason: "Sign in before verifying a backup." };
  const record = await getBackupRecord(userId);
  const snapshots = normalizeSnapshots(record);
  const latest = snapshots[0] || null;
  if (!latest) return { ok: false, reason: "No on-device backup exists yet." };
  let payload;
  try {
    payload = await decryptSnapshotPayload(latest);
  } catch (_decryptError) {
    return { ok: false, reason: "The latest on-device backup could not be decrypted on this device." };
  }
  if (!payloadLooksValid(payload)) return { ok: false, reason: "The latest on-device backup is incomplete." };

  const checksum = await checksumPayload(payload);
  if (latest.checksum && checksum && latest.checksum !== checksum) {
    return { ok: false, reason: "The latest on-device backup failed its integrity check." };
  }

  const verifiedAt = new Date().toISOString();
  await putBackup({
    ...record,
    userId: String(userId),
    snapshots,
    verifiedAt,
    lastVerifiedChecksum: checksum || latest.checksum || null,
  });
  return {
    ok: true,
    savedAt: latest.savedAt,
    verifiedAt,
    snapshotCount: snapshots.length,
    counts: rowCounts(payload),
  };
}

export async function createDeviceBackup(supabase, user) {
  if (!supabase || !user?.id) throw new Error("Sign in before creating an on-device backup.");

  const results = [];
  for (let index = 0; index < DEVICE_BACKUP_TABLES.length; index += BACKUP_QUERY_BATCH_SIZE) {
    const batch = DEVICE_BACKUP_TABLES.slice(index, index + BACKUP_QUERY_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async ([key, table, ownerColumn]) => {
      const { data, error } = await supabase.from(table).select("*").eq(ownerColumn, user.id);
      if (error) throw new Error(`Could not back up ${table}: ${error.message}`);
      return [key, data || []];
    }));
    results.push(...batchResults);
    if (index + BACKUP_QUERY_BATCH_SIZE < DEVICE_BACKUP_TABLES.length) {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
  }

  const savedAt = new Date().toISOString();
  const payload = Object.fromEntries(results);
  const checksum = await checksumPayload(payload);
  // Encrypt the snapshot before it touches IndexedDB; the checksum is
  // computed over the plaintext payload above so integrity verification
  // stays meaningful after decryption.
  const encrypted = await encryptSnapshotPayload(payload);
  const previous = await getBackupRecord(user.id).catch(() => null);
  const previousSnapshots = normalizeSnapshots(previous);
  const snapshots = [
    { version: BACKUP_VERSION, savedAt, iv: encrypted.iv, ciphertext: encrypted.ciphertext, checksum },
    ...previousSnapshots.filter((item) => item?.savedAt !== savedAt),
  ].slice(0, MAX_DEVICE_SNAPSHOTS);

  const record = {
    userId: String(user.id),
    version: BACKUP_VERSION,
    savedAt,
    snapshots,
    verifiedAt: checksum ? savedAt : null,
    lastVerifiedChecksum: checksum,
  };
  await putBackup(record);
  try {
    window.dispatchEvent(new CustomEvent("plushlife:device-backup-updated", { detail: { savedAt } }));
  } catch (_error) {}
  return {
    exists: true,
    savedAt,
    version: BACKUP_VERSION,
    verified: !!checksum,
    verifiedAt: checksum ? savedAt : null,
    snapshotCount: snapshots.length,
    stale: false,
    counts: rowCounts(payload),
  };
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

  timerId = window.setTimeout(() => {
    if (cancelled || document.visibilityState === "hidden") return;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => { void run(); }, { timeout: 15000 });
    } else {
      void run();
    }
  }, AUTO_BACKUP_START_DELAY_MS);

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
  staleAfterMs: BACKUP_STALE_AFTER_MS,
  maxSnapshots: MAX_DEVICE_SNAPSHOTS,
  autoStartDelayMs: AUTO_BACKUP_START_DELAY_MS,
  queryBatchSize: BACKUP_QUERY_BATCH_SIZE,
  cloudDataDeleted: false,
});
