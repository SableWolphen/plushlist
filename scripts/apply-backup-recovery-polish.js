const fs = require("fs");

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, value) { fs.writeFileSync(path, value); }
function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing marker: ${label}`);
  return source.replace(needle, replacement);
}

{
  const path = "src/app-source.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'import { createDeviceBackup, scheduleAutomaticDeviceBackup } from "./device-backup.js";',
    'import { createDeviceBackup, getDeviceBackupStatus, scheduleAutomaticDeviceBackup, verifyDeviceBackup } from "./device-backup.js";',
    "device backup imports",
  );
  source = replaceOnce(
    source,
    '  const [deviceBackupBusy, setDeviceBackupBusy] = useState(false);',
    '  const [deviceBackupBusy, setDeviceBackupBusy] = useState(false);\n  const [deviceBackupVerifyBusy, setDeviceBackupVerifyBusy] = useState(false);',
    "device backup verification state",
  );

  const refreshTail = '  }, [user?.id, deviceBackupBusy]);\n\n  useEffect(() => {\n    if (!user?.id || !online) return undefined;';
  const verifyBlock = [
    '  }, [user?.id, deviceBackupBusy]);',
    '',
    '  const verifyDeviceBackupNow = React.useCallback(async () => {',
    '    if (!user?.id || deviceBackupVerifyBusy) return;',
    '    setDeviceBackupVerifyBusy(true);',
    '    try {',
    '      const result = await verifyDeviceBackup(user.id);',
    '      const status = await getDeviceBackupStatus(user.id);',
    '      setDeviceBackupStatus(status);',
    '      setSettingsMessage(result.ok ? "On-device backup verified. The latest recovery copy is readable." : (result.reason || "The on-device backup could not be verified."));',
    '    } catch (_error) {',
    '      setSettingsMessage("The on-device backup could not be verified. Your cloud copy is still untouched.");',
    '    } finally {',
    '      setDeviceBackupVerifyBusy(false);',
    '    }',
    '  }, [user?.id, deviceBackupVerifyBusy]);',
    '',
    '  useEffect(() => {',
    '    if (!user?.id) return undefined;',
    '    let cancelled = false;',
    '    getDeviceBackupStatus(user.id).then((status) => { if (!cancelled) setDeviceBackupStatus(status); });',
    '    return () => { cancelled = true; };',
    '  }, [user?.id]);',
    '',
    '  useEffect(() => {',
    '    if (!user?.id || !online) return undefined;',
  ].join("\n");
  source = replaceOnce(source, refreshTail, verifyBlock, "backup verification hooks");

  source = replaceOnce(
    source,
    '      user_id: user?.id || null,\n      email: user?.email || null,\n      message: trimmed.slice(0, 2000),',
    '      user_id: user?.id || null,\n      message: trimmed.slice(0, 2000),',
    "feedback email minimization",
  );

  const oldRestoreConfirm = '    if (!window.confirm("Restore this backup? Anything in it will overwrite matching tasks, days, and entries you currently have. Guardian connections aren\'t restored this way — you\'ll need to re-invite any Guardian afterward.")) {\n      return;\n    }\n    setSettingsMessage("Restoring your backup…");';
  const restoreSafety = [
    '    const restorePreview = RESTORABLE_DATA_TABLES.map((spec) => {',
    '      const raw = payload[spec.payloadKey];',
    '      const count = spec.single ? (raw ? 1 : 0) : (Array.isArray(raw) ? raw.length : 0);',
    '      return { label: spec.payloadKey.replace(/_/g, " "), count };',
    '    }).filter((item) => item.count > 0);',
    '    const totalRecords = restorePreview.reduce((sum, item) => sum + item.count, 0);',
    '    const categorySummary = restorePreview.slice(0, 10).map((item) => "• " + item.label + ": " + item.count).join("\\n");',
    '    const extraCategories = restorePreview.length > 10 ? "\\n• +" + (restorePreview.length - 10) + " more categories" : "";',
    '    const previewText = "Restore preview\\n\\n" + (categorySummary || "No independently restorable records found") + extraCategories + "\\n\\n" + totalRecords + " record" + (totalRecords === 1 ? "" : "s") + " would be added or updated. Existing cloud records are not bulk-deleted. A fresh on-device Safety copy will be created before restoring. Guardian connections are not restored.";',
    '    if (!window.confirm(previewText)) return;',
    '    setSettingsMessage("Creating a Safety copy before restoring…");',
    '    try {',
    '      const safetyStatus = await createDeviceBackup(supabase, user);',
    '      setDeviceBackupStatus(safetyStatus);',
    '    } catch (_error) {',
    '      setSettingsMessage("Restore stopped because PlushLife could not create a Safety copy first. Nothing was changed.");',
    '      return;',
    '    }',
    '    setSettingsMessage("Safety copy created before restoring. Restoring your backup…");',
  ].join("\n");
  source = replaceOnce(source, oldRestoreConfirm, restoreSafety, "restore safety preview");

  source = replaceOnce(
    source,
    'deleteMyAccount={deleteMyAccount} deviceBackupStatus={deviceBackupStatus} refreshDeviceBackup={refreshDeviceBackup} deviceBackupBusy={deviceBackupBusy} settingsMessage={settingsMessage} />',
    'deleteMyAccount={deleteMyAccount} deviceBackupStatus={deviceBackupStatus} refreshDeviceBackup={refreshDeviceBackup} deviceBackupBusy={deviceBackupBusy} verifyDeviceBackupNow={verifyDeviceBackupNow} deviceBackupVerifyBusy={deviceBackupVerifyBusy} settingsMessage={settingsMessage} />',
    "settings backup verification props",
  );
  write(path, source);
}

{
  const path = "src/components/organized-settings.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'deleteMyAccount, deviceBackupStatus, refreshDeviceBackup, deviceBackupBusy, settingsMessage }) {',
    'deleteMyAccount, deviceBackupStatus, refreshDeviceBackup, deviceBackupBusy, verifyDeviceBackupNow, deviceBackupVerifyBusy, settingsMessage }) {',
    "settings signature",
  );

  const oldBackupBody = [
    '            <div style={{ marginTop: 6, color: "#56756C", fontSize: 11, fontWeight: 800 }}>',
    '              {deviceBackupStatus?.savedAt ? ("Last saved " + new Date(deviceBackupStatus.savedAt).toLocaleString()) : deviceBackupStatus?.unavailable ? "On-device backup unavailable on this device" : "Waiting for the first on-device backup"}',
    '            </div>',
    '          </div>',
    '          <button type="button" disabled={deviceBackupBusy} onClick={refreshDeviceBackup} style={{ ...secondaryButton, color: "#347865", flexShrink: 0, opacity: deviceBackupBusy ? .65 : 1 }}>{deviceBackupBusy ? "Saving…" : "Back up now"}</button>',
    '        </div>',
    '        <div style={{ marginTop: 9, padding: "8px 9px", borderRadius: 10, background: "rgba(255,255,255,.7)", color: "#71857F", fontSize: 10.8, lineHeight: 1.45 }}>Nothing is deleted from the cloud automatically. Relationship, payment, push-token, and device-pairing records are deliberately not copied into the restorable device backup.</div>',
  ].join("\n");
  const newBackupBody = [
    '            <div style={{ marginTop: 6, color: deviceBackupStatus?.stale ? "#A56D14" : "#56756C", fontSize: 11, fontWeight: 800 }}>',
    '              {deviceBackupStatus?.savedAt ? (deviceBackupStatus.stale ? "Backup needs refreshing · last saved " : "Last saved ") + new Date(deviceBackupStatus.savedAt).toLocaleString() : deviceBackupStatus?.unavailable ? "On-device backup unavailable on this device" : "Waiting for the first on-device backup"}',
    '            </div>',
    '            {deviceBackupStatus?.exists && <div style={{ marginTop: 3, color: "#71857F", fontSize: 10.5, lineHeight: 1.4 }}>{deviceBackupStatus.verified ? "✓ Latest backup verified" : "Verification recommended"} · Recovery snapshots: {deviceBackupStatus.snapshotCount || 1}/3</div>}',
    '          </div>',
    '          <div style={{ display: "grid", gap: 6, flexShrink: 0 }}>',
    '            <button type="button" disabled={deviceBackupBusy} onClick={refreshDeviceBackup} style={{ ...secondaryButton, color: "#347865", opacity: deviceBackupBusy ? .65 : 1 }}>{deviceBackupBusy ? "Saving…" : "Back up now"}</button>',
    '            <button type="button" disabled={deviceBackupVerifyBusy || !deviceBackupStatus?.exists} onClick={verifyDeviceBackupNow} style={{ ...secondaryButton, color: "#3F78B8", opacity: (deviceBackupVerifyBusy || !deviceBackupStatus?.exists) ? .55 : 1 }}>{deviceBackupVerifyBusy ? "Verifying…" : "Verify backup"}</button>',
    '          </div>',
    '        </div>',
    '        <div style={{ marginTop: 9, padding: "8px 9px", borderRadius: 10, background: "rgba(255,255,255,.7)", color: "#71857F", fontSize: 10.8, lineHeight: 1.45 }}>PlushLife keeps up to 3 recent recovery snapshots on this device. Nothing is deleted from the cloud automatically. Relationship, payment, push-token, and device-pairing records are deliberately not copied into the restorable device backup.</div>',
  ].join("\n");
  source = replaceOnce(source, oldBackupBody, newBackupBody, "backup status and verify UI");
  write(path, source);
}

{
  const path = "src/components/compact-anchor.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'padding: "5px 4px", minHeight: 30, cursor: "pointer", flexShrink: 0',
    'padding: "12px 4px", minHeight: 44, margin: "-7px 0", cursor: "pointer", flexShrink: 0',
    "focus change hit target",
  );
  source = replaceOnce(
    source,
    'padding: "5px 8px", minHeight: 30, cursor: "pointer", flexShrink: 0',
    'padding: "12px 8px", minHeight: 44, margin: "-7px 0", cursor: "pointer", flexShrink: 0',
    "focus done hit target",
  );
  write(path, source);
}

{
  const path = "src/components/today-panel-core.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    '<button type="button" onClick={() => toggle(nextStepTask.key)} style={{ minHeight: 34, padding: "6px 10px",',
    '<button type="button" data-plushlife-compact-hit-target="next-step-done" onClick={() => toggle(nextStepTask.key)} style={{ minHeight: 44, margin: "-5px 0", padding: "11px 10px",',
    "next-step done hit target",
  );
  source = replaceOnce(
    source,
    '<button type="button" onClick={() => pickEasierSuggestion(nextStepTask.key)} style={{ minHeight: 32, padding: "5px 8px",',
    '<button type="button" data-plushlife-compact-hit-target="make-easier" onClick={() => pickEasierSuggestion(nextStepTask.key)} style={{ minHeight: 44, margin: "-6px 0", padding: "11px 8px",',
    "make easier hit target",
  );
  source = replaceOnce(
    source,
    '<button type="button" onClick={() => setNextStepMoreOpen((open) => !open)} aria-expanded={nextStepMoreOpen} aria-label="More next-step choices" style={{ minWidth: 34, minHeight: 32, padding: "5px 8px",',
    '<button type="button" data-plushlife-compact-hit-target="next-step-more" onClick={() => setNextStepMoreOpen((open) => !open)} aria-expanded={nextStepMoreOpen} aria-label="More next-step choices" style={{ minWidth: 44, minHeight: 44, margin: "-6px 0", padding: "11px 8px",',
    "next-step more hit target",
  );
  source = replaceOnce(
    source,
    'style={{ minHeight: 30, padding: "4px 6px", border: 0, background: "transparent",',
    'data-plushlife-compact-hit-target="plushweek-edit" style={{ minHeight: 44, margin: "-7px 0", padding: "11px 6px", border: 0, background: "transparent",',
    "plushweek edit hit target",
  );
  write(path, source);
}

{
  const path = "scripts/test-product-quality.js";
  let source = read(path);
  source = replaceOnce(
    source,
    '  [deviceBackup.includes("indexedDB") && deviceBackup.includes("DEVICE_BACKUP_TABLES") && deviceBackup.includes("cloudDataDeleted: false"), "on-device backup is additive and never deletes cloud data"],',
    '  [deviceBackup.includes("indexedDB") && deviceBackup.includes("DEVICE_BACKUP_TABLES") && deviceBackup.includes("cloudDataDeleted: false"), "on-device backup is additive and never deletes cloud data"],\n  [deviceBackup.includes("MAX_DEVICE_SNAPSHOTS = 3") && deviceBackup.includes("verifyDeviceBackup") && deviceBackup.includes("SHA-256"), "device backup keeps verified recovery snapshots"],',
    "backup quality checks",
  );
  write(path, source);
}

console.log("Backup/recovery polish patch applied.");
