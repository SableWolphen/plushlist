import { makeGuardianBackup, parseGuardianBackup, MAX_GUARDIAN_BACKUP_BYTES } from "../guardian-portable-backup.mjs";

export function GuardianPortableBackup({ userId, state, update }) {
  const [busy, setBusy] = React.useState(false);
  const [candidate, setCandidate] = React.useState(null);
  const [message, setMessage] = React.useState("");
  React.useEffect(() => { setCandidate(null); setMessage(""); }, [userId]);

  const download = async () => {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const envelope = await makeGuardianBackup(userId, state);
      const url = URL.createObjectURL(new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" }));
      try {
        const link = document.createElement("a");
        link.href = url; link.download = "plushlife-private-companion-backup.json";
        document.body.appendChild(link); link.click(); link.remove();
        setMessage("Your private backup was prepared. Keep it somewhere only you can access.");
      } finally { URL.revokeObjectURL(url); }
    } catch (error) { setMessage(error.message || "Could not export your backup."); }
    finally { setBusy(false); }
  };

  const inspect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setCandidate(null); setMessage("");
    if (!file) return;
    if (file.size > MAX_GUARDIAN_BACKUP_BYTES + 1024) { setMessage("The selected backup is too large."); return; }
    setBusy(true);
    try {
      const parsed = await parseGuardianBackup(await file.text(), userId);
      setCandidate(parsed);
    } catch (error) { setMessage(error.message || "This backup could not be read."); }
    finally { setBusy(false); }
  };

  return <details className="pl-guardian-portable-backup">
    <summary>My companion backup & restore</summary>
    <p>Save an account-bound copy of your personal routines, memories, photos and rewards. This file is <strong>not encrypted</strong>, so keep it private. No data is sent to a server by this tool.</p>
    <button type="button" onClick={download} disabled={busy || !userId}>Download my companion copy</button>
    <label>Restore a backup from this Cozy account
      <input type="file" accept=".json,application/json" onChange={inspect} disabled={busy || !userId} />
    </label>
    {candidate && <div className="pl-companion-review">
      <h4>Review before restoring</h4>
      <p>Saved on: {candidate.preview.createdAt || "Unknown date"}</p>
      <p>{candidate.preview.memories} memories · {candidate.preview.reflections} reflections · {candidate.preview.routines} custom routines · {candidate.preview.rewards} rewards · {candidate.preview.letters} letters</p>
      <p>{candidate.preview.note}</p>
      <button type="button" disabled={busy} onClick={() => {
        if (update(candidate.restored)) {
          setMessage("Companion restored on this device. Review notifications and privacy settings before using them.");
          setCandidate(null);
        } else setMessage("The device refused to save the restore. Existing data is unchanged.");
      }}>Replace this device's companion data</button>
      <button type="button" onClick={() => setCandidate(null)} disabled={busy}>Cancel restore</button>
    </div>}
    {message && <p role="status">{message}</p>}
  </details>;
}
