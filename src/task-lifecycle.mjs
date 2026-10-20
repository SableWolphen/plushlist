export async function removeTrackerTask(client, ownerId, taskKey) {
  if (!ownerId || !taskKey) throw new Error("Sign in before deleting a task.");
  const { data, error } = await client.from("tracker_tasks").delete()
    .eq("user_id", ownerId).eq("task_key", taskKey).select("task_key");
  if (error) throw error;
  if (!Array.isArray(data) || !data.some(row => row.task_key === taskKey)) {
    throw new Error("The server did not confirm the deletion.");
  }
  // Completion history is retained. Deleting or undoing a task is not a new
  // completion event and must never erase history or grant another reward.
}

export async function restoreTrackerTask(client, ownerId, snapshot) {
  if (!ownerId || snapshot?.user_id !== ownerId || !snapshot.task_key) throw new Error("This task belongs to another account.");
  const { label, wasCompleted, ...row } = snapshot;
  const { data, error } = await client.from("tracker_tasks")
    .upsert(row, { onConflict: "user_id,task_key" }).select("task_key").single();
  if (error) throw error;
  if (data?.task_key !== row.task_key) throw new Error("The server did not confirm the restore.");
  return row;
}
