// Shared Guardian workspace domain rules. These are UI helpers, never authorization.
// All mutations and participant checks must be enforced by Supabase RLS/RPC.
export const GUARDIAN_AREAS = Object.freeze([
  { id: "behavior", label: "Behavior", description: "Reflect on what happened, separately from chores." },
  { id: "reference", label: "Reference", description: "Shared notes, agreements and care preferences." },
  { id: "moods", label: "Moods", description: "Private-by-default emotional check-ins." },
  { id: "tasks", label: "Tasks", description: "Shared commitments and what is due today." },
]);

export function canEvaluateBehavior({ agreement, link, evaluatorId, userId }) {
  return Boolean(
    agreement?.id && agreement.status === "accepted" &&
    agreement.mode === "accountability" &&
    link?.active === true && link?.accepted_at &&
    evaluatorId && userId && evaluatorId === userId
  );
}

export function behaviorScore(entry) {
  if (entry?.status !== "evaluated" || !Number.isFinite(entry?.score)) return null;
  return entry.score;
}

export function isTaskDueToday(task, today) {
  if (!task || !/^\\d{4}-\\d{2}-\\d{2}$/.test(today)) return false;
  if (task.status !== "accepted" && task.status !== "completed") return false;
  return typeof task.due_date === "string" && task.due_date.slice(0,10) === today;
}

export function isMoodVisibleToPartner(entry, agreement, link) {
  return Boolean(entry?.shared === true && entry.agreement_id === agreement?.id &&
    agreement?.status === "accepted" && link?.active === true && link?.accepted_at);
}

export function applyNotebookRevision({ currentVersion, submittedVersion, currentText, nextText }) {
  if (!Number.isSafeInteger(currentVersion) || currentVersion < 0 ||
      submittedVersion !== currentVersion) {
    return { ok: false, reason: "conflict" };
  }
  if (typeof currentText !== "string" || typeof nextText !== "string") {
    return { ok: false, reason: "invalid" };
  }
  if (currentText === nextText) return { ok: true, version: currentVersion, text: currentText, changed: false };
  return { ok: true, version: currentVersion + 1, text: nextText, changed: true };
}
