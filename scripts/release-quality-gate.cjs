#!/usr/bin/env node
"use strict";
// Critical user journey gate. Runs existing deterministic tests without creating users,
// contacting production, modifying data or asserting a real device was tested.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const JOURNEYS = Object.freeze([
  { id: "onboarding", label: "Signup, onboarding and recovery", checks: ["test-gentle-onboarding.cjs","test-auth-theme-readiness.js","test-startup-recovery.cjs"] },
  { id: "tasks", label: "Create, update and finish tasks", checks: ["test-short-task-flow.cjs","test-e2e-regressions.mjs"] },
  { id: "calendar", label: "Calendar, repeating routines and saving", checks: ["test-gentle-calendar.mjs","test-calendar-account-guards.mjs","test-private-save.mjs"] },
  { id: "guardian", label: "Guardian consent and account boundaries", checks: ["test-synthetic-cozy-guardian.mjs","test-companion-account-boundary.mjs","test-guardian-2-navigation.mjs"] },
  { id: "progress", label: "Progress and reward integrity", checks: ["test-progress-week.mjs","test-reward-moment.cjs"] },
  { id: "mobile", label: "Android compatibility and usability", checks: ["test-mobile-ux.js","test-android-release-contract.mjs","test-simple-view.mjs"] },
  { id: "billing", label: "Billing safety and free beta boundaries", checks: ["test-subscription-policy.mjs","test-entitlements.js","test-plush-billing.js"] },
]);
function validateCatalog(journeys = JOURNEYS, exists = p => fs.existsSync(p)) {
  const ids = new Set();
  for (const journey of journeys) {
    if (!journey.id || ids.has(journey.id) || !Array.isArray(journey.checks) || !journey.checks.length)
      throw new Error("Invalid or duplicate journey: " + journey.id);
    ids.add(journey.id);
    for (const filename of journey.checks) {
      if (!/^test-[a-z0-9-]+\.(?:js|cjs|mjs|py)$/.test(filename) || !exists(path.join(ROOT,"scripts",filename)))
        throw new Error("Missing or unsafe critical check: " + filename);
    }
  }
  return journeys.reduce((n, journey) => n + journey.checks.length, 0);
}
function summarize(results, revision = "unknown") {
  const failed = results.filter(result => result.status !== "passed");
  return {
    revision,
    passed: failed.length === 0 && results.length === JOURNEYS.length,
    journeys: results,
    failingJourneys: failed.map(result => result.id),
    // Deterministic CI tests cannot establish these external facts.
    requiredExternalEvidence: {
      androidPhysicalDevice: "not_verified",
      backendProductionAccountIsolation: "not_verified",
      googlePlayProductionRelease: "not_verified",
      livePurchaseAndRefund: "not_verified",
      accessibilityScreenReaderDevice: "not_verified"
    },
    conclusion: failed.length ? "code_checks_failed" : "automated_code_checks_passed_external_verification_required"
  };
}
function markdown(report) {
  const rows = report.journeys.map(x => "| " + x.label + " | " + (x.status==="passed"?"PASS":"FAIL") + " | " + x.passedChecks + "/" + x.totalChecks + " |");
  return [
    "# PlushLife critical journey quality gate",
    "",
    "Revision: `" + report.revision + "`",
    "",
    "| Journey | Result | Checks |",
    "| --- | --- | ---: |",
    ...rows,
    "",
    "**Decision:** " + report.conclusion,
    "",
    "**Not verified here:** physical Android device, live backend authorization, Google Play production release, real purchases/refunds, and screen-reader device behavior.",
    "",
    "All of those need separately documented evidence before a public production release."
  ].join("\n");
}
function commandFor(file) {
  if (file.endsWith(".py")) return [process.env.PYTHON || "python3",path.join("scripts",file)];
  return [process.execPath,path.join("scripts",file)];
}
function runAll({exec = spawnSync} = {}) {
  validateCatalog();
  const results = JOURNEYS.map(journey => {
    const failures = [];
    let passedChecks=0;
    for (const check of journey.checks) {
      const [cmd,arg] = commandFor(check);
      const r = exec(cmd,[arg],{cwd:ROOT,encoding:"utf8",timeout:120000,maxBuffer:4*1024*1024});
      if (!r.error && r.status === 0) passedChecks++;
      else failures.push({check,exitCode:r.status??null,error:r.error?.message??null,output:String(r.stderr||r.stdout||"").slice(-1200)});
    }
    return {id:journey.id,label:journey.label,status:failures.length?"failed":"passed",passedChecks,totalChecks:journey.checks.length,failures};
  });
  return summarize(results,process.env.GITHUB_SHA || process.env.RELEASE_SHA || "local");
}
if (require.main === module) {
  try {
    const args=process.argv.slice(2);
    const asJson=args.includes("--json");
    const outputIndex=args.indexOf("--output");
    if(args.some(x=>!["--json","--output"].includes(x) && (outputIndex<0 || args[outputIndex+1]!==x)) || (outputIndex>=0 && (!args[outputIndex+1] || args[outputIndex+1].startsWith("--"))))
      throw new Error("Usage: node scripts/release-quality-gate.cjs [--json] [--output report-file]");
    const report=runAll();
    const rendered=asJson?JSON.stringify(report,null,2):markdown(report);
    if(outputIndex>=0)fs.writeFileSync(args[outputIndex+1],rendered+"\n",{flag:"w",mode:0o600});
    process.stdout.write(rendered+"\n");
    if(!report.passed) process.exitCode=1;
  }catch(error){console.error(error.message);process.exitCode=2;}
}
module.exports={JOURNEYS,validateCatalog,summarize,markdown,runAll};
