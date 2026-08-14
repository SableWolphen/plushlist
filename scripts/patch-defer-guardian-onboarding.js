const fs = require('fs');

const appPath = 'src/app-source.jsx';
let source = fs.readFileSync(appPath, 'utf8');

function replaceOnce(from, to, label) {
  if (!source.includes(from)) throw new Error(`Missing ${label}`);
  source = source.replace(from, to);
}

replaceOnce(
  'const onboardingTotalSteps = onboardingMode === "supporter" ? 2 : (onboardingMode === "guardian" ? 7 : 6);',
  'const onboardingTotalSteps = onboardingMode === "supporter" ? 2 : 6;',
  'Guardian onboarding step count'
);

replaceOnce(
  '    const guardianEmail = inviteEmail.trim().toLowerCase();\n',
  '',
  'onboarding Guardian email variable'
);

replaceOnce(
  '    if (onboardingMode === "guardian" && (!guardianEmail || !guardianEmail.includes("@"))) {\n      setOnboardingMessage("Add your guardian\'s email address first.");\n      setOnboardingStep(2);\n      return;\n    }\n',
  '',
  'Guardian email completion gate'
);

const guardianSaveBlock = /\n    if \(onboardingMode === "guardian"\) \{\n      const rolePermissions = GUARDIAN_ROLE_PRESETS\.find\(\(role\) => role\.id === guardianRolePreset\)\?\.permissions \|\| GUARDIAN_ROLE_PRESETS\[0\]\.permissions;[\s\S]*?\n    \}\n    if \(onboardingMode !== "supporter" && trackerTasks\.length === 0\) \{/;
if (!guardianSaveBlock.test(source)) throw new Error('Missing Guardian invite/save block');
source = source.replace(guardianSaveBlock, '\n    if (onboardingMode !== "supporter" && trackerTasks.length === 0) {');

replaceOnce(
  '>My cozy space + a Guardian</button>',
  '>My cozy space + optional Guardian support</button>',
  'Guardian onboarding choice label'
);

const guardianStepBlock = /\n            \{onboardingStep === 2 && onboardingMode === "guardian" && <>[\s\S]*?\n            <\/\>}\n            \{\(\(onboardingMode === "cozy" && onboardingStep === 2\) \|\| \(onboardingMode === "guardian" && onboardingStep === 3\)\) && <>/;
if (!guardianStepBlock.test(source)) throw new Error('Missing Guardian setup step block');
source = source.replace(
  guardianStepBlock,
  '\n            {((onboardingMode === "cozy" || onboardingMode === "guardian") && onboardingStep === 2) && <>'
);

replaceOnce(
  '{((onboardingMode === "cozy" && onboardingStep === 3) || (onboardingMode === "guardian" && onboardingStep === 4)) && <>',
  '{((onboardingMode === "cozy" || onboardingMode === "guardian") && onboardingStep === 3) && <>',
  'starting point step mapping'
);
replaceOnce(
  '{((onboardingMode === "cozy" && onboardingStep === 4) || (onboardingMode === "guardian" && onboardingStep === 5)) && <>',
  '{((onboardingMode === "cozy" || onboardingMode === "guardian") && onboardingStep === 4) && <>',
  'goals step mapping'
);
replaceOnce(
  '{((onboardingMode === "cozy" && onboardingStep === 5) || (onboardingMode === "guardian" && onboardingStep === 6)) && <>',
  '{((onboardingMode === "cozy" || onboardingMode === "guardian") && onboardingStep === 5) && <>',
  'intention step mapping'
);
replaceOnce(
  '{((onboardingMode === "cozy" && onboardingStep === 6) || (onboardingMode === "guardian" && onboardingStep === 7)) && <>',
  '{((onboardingMode === "cozy" || onboardingMode === "guardian") && onboardingStep === 6) && <>',
  'ready step mapping'
);

replaceOnce(
  '              <h2 style={{ margin: "8px 0 6px" }}>You\'re ready ✨</h2>\n',
  '              <h2 style={{ margin: "8px 0 6px" }}>You\'re ready ✨</h2>\n              {onboardingMode === "guardian" && <div data-plushlife-onboarding-guardian-deferred="true" style={{ margin: "8px 0 12px", padding: 11, borderRadius: 11, background: "#F5FAFF", border: "1px solid #CFE4F5", color: "#4C6E8E", fontSize: 12, lineHeight: 1.5 }}><strong>Guardian setup is optional.</strong> Finish your cozy space first. You can connect a Guardian later from the Guardian area, then choose exactly what they can see. Nothing is shared automatically.</div>}\n',
  'deferred Guardian ready message'
);

replaceOnce(
  '                if (onboardingMode === "guardian" && onboardingStep === 2 && (!inviteEmail.trim() || !inviteEmail.includes("@"))) {\n                  setOnboardingMessage("Add your guardian\'s email address to continue.");\n                  return;\n                }\n',
  '',
  'Guardian email Next gate'
);

fs.writeFileSync(appPath, source);

const auditPath = 'scripts/audit-interactive-wiring.js';
let audit = fs.readFileSync(auditPath, 'utf8');
const anchor = "const mustContain = {\n";
if (!audit.includes(anchor)) throw new Error('Missing interactive audit anchor');
const appChecks = `  'src/app-source.jsx': [\n    ['const onboardingTotalSteps = onboardingMode === "supporter" ? 2 : 6;', 'Guardian onboarding no longer adds a required setup step'],\n    ['data-plushlife-onboarding-guardian-deferred="true"', 'Guardian setup is explicitly deferred and optional'],\n    ['My cozy space + optional Guardian support', 'Guardian onboarding choice explains optional support'],\n  ],\n`;
if (!audit.includes("'src/app-source.jsx': [")) audit = audit.replace(anchor, anchor + appChecks);
const forbiddenAnchor = "if (issues.length) {\n";
if (!audit.includes(forbiddenAnchor)) throw new Error('Missing audit final anchor');
const forbiddenChecks = `const appSource = fs.readFileSync(path.join(ROOT, 'src/app-source.jsx'), 'utf8');\nfor (const [needle, label] of [\n  ['Add your guardian\\'s email address to continue.', 'Guardian email must not block onboarding Next'],\n  ['Add your guardian\\'s email address first.', 'Guardian email must not block onboarding completion'],\n]) {\n  if (appSource.includes(needle)) issues.push(\`src/app-source.jsx: forbidden onboarding gate remains: \${label}\`);\n}\n\n`;
if (!audit.includes('forbidden onboarding gate remains')) audit = audit.replace(forbiddenAnchor, forbiddenChecks + forbiddenAnchor);
fs.writeFileSync(auditPath, audit);
