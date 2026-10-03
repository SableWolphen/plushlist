const fs = require("fs");
const path = require("path");

function read(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8").replace(/\r\n/g, "\n");
}

const auto = read(".github/workflows/auto-play-release.yml");
const historical44 = read(".github/workflows/closed-testing-version-44.yml");
const historical45 = read(".github/workflows/closed-testing.yml");
const manual = read(".github/workflows/android-release.yml");
const pages = read(".github/workflows/deploy-pages.yml");
const cloudflare = read(".github/workflows/deploy-cloudflare.yml");
const codeql = read(".github/workflows/codeql.yml");

const failures = [];
function check(ok, label) { if (!ok) failures.push(label); }

check(auto.includes("workflow_call:") && !auto.includes("workflow_run:"), "automatic Play release must be reusable and must not run from workflow_run");
check(codeql.includes("release-android:") && codeql.includes("analyze-source") && codeql.includes("analyze-android"), "CodeQL must call Android publishing only after all analysis jobs succeed");
check(codeql.includes("github.event_name == 'push'") && codeql.includes("refs/heads/main") && codeql.includes("secrets: inherit"), "Android publishing must only receive secrets from trusted main pushes");\ncheck(!auto.includes("github.event.workflow_run.head_sha"), "automatic Play release must never use a workflow_run supplied SHA");\ncheck(auto.includes("PLAY_TRACK: ${{ vars.PLAY_AUTO_TRACK || 'alpha' }}"), "automatic Play release must default to closed testing");
check(auto.includes("group: google-play-publish") && manual.includes("group: google-play-publish") && historical44.includes("group: google-play-publish"), "all Play publishers must share one concurrency lock");
check(!historical44.includes("push:\n") && historical44.includes("workflow_dispatch:"), "historical v44 release must stay manual-only");
check(!historical45.includes("push:\n") && historical45.includes("workflow_dispatch:"), "historical v45 release must stay manual-only");
check(pages.includes("branches: [main]") && codeql.includes("branches: [main]"), "Pages and CodeQL must stay scoped to main");
check(!cloudflare.includes("push:\n") && cloudflare.includes("workflow_dispatch:"), "redundant GitHub Cloudflare deployment must stay manual-only");
check(codeql.includes("Run complete app tests") && codeql.includes("run: npm test"), "CodeQL must run the full app test gate before Android analysis");
check(auto.includes("ready=false") && auto.includes("needs.gate.outputs.ready == 'true'"), "missing Play credentials must skip publishing instead of failing the release job");

if (failures.length) {
  console.error("Workflow safety checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Workflow safety checks passed.");
