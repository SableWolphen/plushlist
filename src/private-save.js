// Account-scoped, last-write-wins outbox for private profile/wardrobe edits.
// Task completions continue to use the existing per-task queue.
export function privateSave({ storage, key, client, table, userId }) {
  const pendingKey = `${key}-pending`;
  let pending = null, running = null, active = true;
  try { pending = JSON.parse(storage?.getItem(pendingKey) || 'null'); } catch (_) {}
  const read = () => {
    if (pending) return pending.value;
    try { return JSON.parse(storage?.getItem(key) || 'null'); } catch (_) { return null; }
  };
  const flush = () => {
    if (running) return running;
    running = (async () => {
      while (active && pending) {
        const item = pending;
        try {
          const { error } = await client.from(table).upsert({ ...item.row, user_id: userId }, { onConflict: 'user_id' });
          if (error) return false;
        } catch (_) { return false; }
        if (!active) return false;
        if (pending === item) {
          pending = null;
          try {
            storage?.setItem(key, JSON.stringify(item.value));
            storage?.removeItem(pendingKey);
          } catch (_) { /* Keep the disk outbox if the cache cannot be updated. */ }
        }
      }
      return active;
    })().finally(() => { running = null; });
    return running;
  };
  const write = async (value, row) => {
    if (!active || !userId) return { saved: false, synced: false };
    const item = { value, row };
    let durable = false;
    try {
      if (storage) {
        storage.setItem(pendingKey, JSON.stringify(item));
        durable = true;
        storage.setItem(key, JSON.stringify(value));
      }
    } catch (_) {}
    pending = item;
    const synced = await flush();
    return { saved: synced || durable, synced };
  };
  return { read, write, flush, hasPending: () => Boolean(pending), isActive: () => active, dispose: () => { active = false; } };
}

export function deviceStorage() {
  try { return window.localStorage; } catch (_) { return null; }
}
