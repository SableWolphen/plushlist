import assert from "node:assert/strict";
import { verifyPlayAuthorization } from "./verify-play-authorization.mjs";
const sha = "a".repeat(40);
const env = { GITHUB_SHA: sha, GITHUB_REF: "refs/heads/main", GITHUB_REPOSITORY: "SableWolphen/plushlist", PLAY_PRODUCTION_RELEASE_SHA: sha };
const jobs = ["Analyze actions", "Analyze javascript-typescript", "Analyze Java and Kotlin"].map(name => ({ name, status: "completed", conclusion: "success" }));
const api = (overrides = {}) => async url => ({ ok: true, json: async () => url.includes("/jobs?") ? { jobs: overrides.jobs ?? jobs } : { workflow_runs: [{ id: 1, head_sha: sha, head_branch: "main", ...overrides.run }] } });
await verifyPlayAuthorization(env, api());
for (const patch of [{ PLAY_PRODUCTION_RELEASE_SHA: "" }, { PLAY_PRODUCTION_RELEASE_SHA: "b".repeat(40) }, { GITHUB_REF: "refs/heads/feature" }, { GITHUB_SHA: "" }]) {
  await assert.rejects(verifyPlayAuthorization({ ...env, ...patch }, () => { throw Error("must not call API"); }));
}
await assert.rejects(verifyPlayAuthorization(env, api({ run: { head_sha: "b".repeat(40) } })));
await assert.rejects(verifyPlayAuthorization(env, api({ jobs: jobs.slice(0, 2) })));
await assert.rejects(verifyPlayAuthorization(env, api({ jobs: jobs.map(j => ({ ...j, conclusion: "failure" })) })));
await assert.rejects(verifyPlayAuthorization(env, async () => ({ ok: false })));
console.log("Play authorization denies missing/stale approval and incomplete or failed analysis.");
