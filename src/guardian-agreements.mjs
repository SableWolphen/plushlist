// Consent is decided by the server. This client never writes permission flags,
// existing tasks, progress, rewards or daily mood records.
export function agreementMode(agreement, link) {
  return link?.active && link.accepted_at && agreement?.status === "accepted" && agreement.mode === "accountability"
    ? "accountability" : "supportive";
}
export async function loadAgreements(client, linkId) {
  const { data, error } = await client.from("guardian_agreements").select("*").eq("caregiver_link_id",linkId).order("created_at",{ascending:false}).limit(100);
  if (error) throw error;
  const agreements = data || [];
  if (!agreements.length) return { agreements, tasks:[], moods:[] };
  const ids = agreements.map(a=>a.id);
  const results = await Promise.all([
    client.from("guardian_agreement_tasks").select("*").in("agreement_id",ids).order("created_at",{ascending:false}).limit(200),
    client.from("guardian_agreement_moods").select("*").in("agreement_id",ids).order("created_at",{ascending:false}).limit(200),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return { agreements, tasks:results[0].data || [], moods:results[1].data || [] };
}
export async function agreementAction(client, action, args = {}) {
  const routes = { agreement:"guardian_agreement_action", task:"guardian_agreement_task_action", mood:"guardian_agreement_mood_action" };
  if (!routes[action]) throw new Error("Unknown agreement tool");
  const { data, error } = await client.rpc(routes[action],args);
  if (error) throw error;
  return data;
}
