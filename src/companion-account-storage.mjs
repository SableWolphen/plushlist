// Optional companion reflections are private to the currently signed-in Cozy.
// Never fall back to legacy account-agnostic localStorage records: their
// owner cannot be proved on a device that has changed accounts.
export function companionAccountKey(baseKey, userId) {
  if (typeof userId !== "string" || !/^[0-9a-z-]{12,}$/i.test(userId)) return null;
  return `plushlife:account:${userId}:${baseKey}`;
}

export function currentCompanionAccountId(storage) {
  try {
    const raw = storage?.getItem("sb-pvitdhixycegmcovapyh-auth-token");
    const saved = JSON.parse(raw || "null");
    const session = saved?.currentSession || saved;
    return session?.access_token && typeof session?.user?.id === "string" ? session.user.id : null;
  } catch (_error) {
    return null;
  }
}
