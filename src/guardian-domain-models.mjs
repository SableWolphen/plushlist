// Pure domain rules for the optional Guardian workspace.
// These are NOT authorization boundaries: database RLS and authenticated RPCs
// must independently enforce every rule before any feature is enabled.
const assertId = value => { if (typeof value !== "string" || !value.trim()) throw new Error("Missing identity"); return value; };
export function evaluateBehavior({event,evaluatorId,actorId,agreement,link,score,reason,at}) {
  assertId(actorId); assertId(evaluatorId);
  if (!link?.active || !link?.accepted_at || agreement?.status !== "accepted" || agreement?.mode !== "accountability")
    throw new Error("Mutual accountability consent required");
  if (agreement.evaluator_user_id !== evaluatorId || actorId !== evaluatorId)
    throw new Error("Only the agreed evaluator can score");
  if (event?.agreement_id !== agreement.id || event?.status === "deleted")
    throw new Error("Event does not belong to this agreement");
  if (!Number.isInteger(score) || score < -10 || score > 10) throw new Error("Invalid score");
  if (typeof reason !== "string" || reason.length > 1000) throw new Error("Invalid reason");
  if (!at || !Number.isFinite(Date.parse(at))) throw new Error("Invalid timestamp");
  return Object.freeze({event_id:event.id,actor_user_id:actorId,previous_score:event.score ?? null,new_score:score,reason,created_at:at});
}
export function updateNotebook({notebook,expectedVersion,editorId,content,at}) {
  assertId(editorId);
  if (!notebook || !Number.isSafeInteger(expectedVersion) || notebook.version !== expectedVersion)
    throw new Error("Notebook edit conflict");
  if (notebook.immutable || notebook.kind === "accepted_agreement") throw new Error("Accepted terms cannot be edited");
  if (typeof content !== "string" || content.length > 20000) throw new Error("Invalid notebook content");
  if (!at || !Number.isFinite(Date.parse(at))) throw new Error("Invalid timestamp");
  return {next:{...notebook,content,version:expectedVersion+1},revision:{notebook_id:notebook.id,version:expectedVersion+1,author_user_id:editorId,previous_content:notebook.content,content,created_at:at}};
}
export function recurringDueDates({startDate,frequency,count=12}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !["daily","weekly","monthly"].includes(frequency) || !Number.isInteger(count) || count<1 || count>52)
    throw new Error("Invalid recurrence");
  const start=new Date(startDate+"T12:00:00Z");
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0,10)!==startDate) throw new Error("Invalid date");
  const dates=[];
  for(let i=0;i<count;i++){
    const d=new Date(start);
    if(frequency==="daily") d.setUTCDate(d.getUTCDate()+i);
    if(frequency==="weekly") d.setUTCDate(d.getUTCDate()+7*i);
    if(frequency==="monthly") {
      const year=start.getUTCFullYear(),month=start.getUTCMonth()+i;
      const first=new Date(Date.UTC(year,month,1,12));
      const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).getUTCDate();
      first.setUTCDate(Math.min(start.getUTCDate(),last));
      dates.push(first.toISOString().slice(0,10));continue;
    }
    dates.push(d.toISOString().slice(0,10));
  }
  return dates;
}
export function canEditMood({entry,actorId,agreement,link}) {
  return !!(entry && actorId && entry.author_user_id===actorId && agreement?.id===entry.agreement_id && agreement.status==="accepted" && link?.active && link?.accepted_at);
}
