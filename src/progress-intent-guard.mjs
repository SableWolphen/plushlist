// Prevent remote snapshots from overwriting a newer local completion intent.
// A confirmed local write is compared to remote updated_at to reject late
// Realtime events from earlier requests. Missing remote timestamps are allowed
// only while there are no newer local writes in this session.
export function canApplyRemoteProgress({ unsynced = false, atRequest = 0, current = 0, remoteUpdatedAt = "", lastLocalWriteAt = "" } = {}) {
  if (unsynced || atRequest !== current) return false;
  if (!lastLocalWriteAt) return true;
  const remote = Date.parse(remoteUpdatedAt);
  const local = Date.parse(lastLocalWriteAt);
  return !Number.isFinite(local) || (Number.isFinite(remote) && remote >= local);
}

export function pendingProgressForDate(queue, date, active = 0) {
  return active > 0 || (Array.isArray(queue) && queue.some((item) => item?.progressDate === date));
}
