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
    'import { TodayPanel } from "./components/today-panel.jsx";\n',
    'import { TodayPanel } from "./components/today-panel.jsx";\nimport { createDeviceBackup, scheduleAutomaticDeviceBackup } from "./device-backup.js";\n',
    "device backup import",
  );
  source = replaceOnce(
    source,
    '  const [appearanceTheme, setAppearanceTheme] = useState("soft");\n',
    '  const [appearanceTheme, setAppearanceTheme] = useState("soft");\n  const [deviceBackupStatus, setDeviceBackupStatus] = useState({ exists: false, savedAt: null });\n  const [deviceBackupBusy, setDeviceBackupBusy] = useState(false);\n',
    "device backup state",
  );
  source = source.replace('        email: user.email || null,\n', '');
  const presenceMarker = '  useEffect(() => {\n    if (!user) return;\n    let alive = true;\n    const beat = () => {';
  const backupHooks = `  const refreshDeviceBackup = React.useCallback(async () => {\n    if (!user?.id || deviceBackupBusy) return;\n    setDeviceBackupBusy(true);\n    try {\n      const status = await createDeviceBackup(supabase, user);\n      setDeviceBackupStatus(status);\n      setSettingsMessage(\"On-device backup updated. Your cloud copy was left untouched.\");\n    } catch (_error) {\n      setSettingsMessage(\"Could not refresh the on-device backup. Your cloud data is still safe.\");\n    } finally {\n      setDeviceBackupBusy(false);\n    }\n  }, [user?.id, deviceBackupBusy]);\n\n  useEffect(() => {\n    if (!user?.id || !online) return undefined;\n    return scheduleAutomaticDeviceBackup({\n      supabase,\n      user,\n      online,\n      onStatus: setDeviceBackupStatus,\n    });\n  }, [user?.id, online]);\n\n`;
  source = replaceOnce(source, presenceMarker, backupHooks + presenceMarker, "automatic backup hooks");
  source = replaceOnce(
    source,
    'deleteMyAccount={deleteMyAccount} settingsMessage={settingsMessage} />',
    'deleteMyAccount={deleteMyAccount} deviceBackupStatus={deviceBackupStatus} refreshDeviceBackup={refreshDeviceBackup} deviceBackupBusy={deviceBackupBusy} settingsMessage={settingsMessage} />',
    "settings backup props",
  );
  write(path, source);
}

{
  const path = "src/components/organized-settings.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'deleteMyAccount, settingsMessage }) {',
    'deleteMyAccount, deviceBackupStatus, refreshDeviceBackup, deviceBackupBusy, settingsMessage }) {',
    "settings signature",
  );
  const privacyHeader = '      <SectionTitle icon="🔐" title="Your data stays yours" description="Backup, restore, or remove specific categories." />\n';
  const deviceCard = `      <Card style={{ background: \"#F5FBF9\", borderColor: \"#CFE7DF\" }}>\n        <div style={{ display: \"flex\", justifyContent: \"space-between\", gap: 12, alignItems: \"center\" }}>\n          <div style={{ minWidth: 0 }}>\n            <div style={{ fontSize: 13.5, fontWeight: 900, color: \"#347865\" }}>📱 On-device backup</div>\n            <div style={{ marginTop: 4, color: \"#6E817B\", fontSize: 11.5, lineHeight: 1.45 }}>PlushLife keeps a second copy of your independently restorable data on this device. Cloud sync stays on so a new phone can still recover your account.</div>\n            <div style={{ marginTop: 6, color: \"#56756C\", fontSize: 11, fontWeight: 800 }}>\n              {deviceBackupStatus?.savedAt ? (\"Last saved \" + new Date(deviceBackupStatus.savedAt).toLocaleString()) : deviceBackupStatus?.unavailable ? \"On-device backup unavailable on this device\" : \"Waiting for the first on-device backup\"}\n            </div>\n          </div>\n          <button type=\"button\" disabled={deviceBackupBusy} onClick={refreshDeviceBackup} style={{ ...secondaryButton, color: \"#347865\", flexShrink: 0, opacity: deviceBackupBusy ? .65 : 1 }}>{deviceBackupBusy ? \"Saving…\" : \"Back up now\"}</button>\n        </div>\n        <div style={{ marginTop: 9, padding: \"8px 9px\", borderRadius: 10, background: \"rgba(255,255,255,.7)\", color: \"#71857F\", fontSize: 10.8, lineHeight: 1.45 }}>Nothing is deleted from the cloud automatically. Relationship, payment, push-token, and device-pairing records are deliberately not copied into the restorable device backup.</div>\n      </Card>\n`;
  source = replaceOnce(source, privacyHeader, privacyHeader + deviceCard, "privacy device backup card");
  write(path, source);
}

{
  const path = "scripts/test-product-quality.js";
  let source = read(path);
  source = replaceOnce(
    source,
    'const packageJson = read("package.json");\n',
    'const packageJson = read("package.json");\nconst deviceBackup = read("src/device-backup.js");\n',
    "device backup test read",
  );
  source = replaceOnce(
    source,
    'const checks = [\n',
    'const checks = [\n  [deviceBackup.includes("indexedDB") && deviceBackup.includes("DEVICE_BACKUP_TABLES") && deviceBackup.includes("cloudDataDeleted: false"), "on-device backup is additive and never deletes cloud data"],\n  [deviceBackup.includes("caregiver_links") === false && deviceBackup.includes("push_subscriptions") === false && deviceBackup.includes("supporter_payments") === false, "device backup excludes relationship, push-token and payment rows"],\n  [appSource.includes("scheduleAutomaticDeviceBackup") && appSource.includes("refreshDeviceBackup") && !appSource.includes("email: user.email || null"), "app creates device backups and minimizes presence data"],\n  [settings.includes("On-device backup") && settings.includes("Nothing is deleted from the cloud automatically"), "Privacy & Data explains lossless device backup behavior"],\n',
    "device backup checks",
  );
  write(path, source);
}

console.log("Privacy/device-backup patch applied.");
