// Read-only release authorization check. Never sets repository variables or uploads.
export async function verifyPlayAuthorization(env, api = fetch) {
  const sha = env.GITHUB_SHA || "";
  if (!/^[a-f0-9]{40}$/.test(sha) || env.GITHUB_REF !== "refs/heads/main" || env.PLAY_PRODUCTION_RELEASE_SHA !== sha) {
    throw new Error("Production publishing requires explicit authorization for this exact main commit.");
  }
  const repository = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || "")) throw new Error("Invalid repository");
  const get = async (path) => {
    const response = await api(`https://api.github.com/repos/${repository}/${path}`, {
      headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Cannot verify CodeQL status");
    return response.json();
  };
  const { workflow_runs: runs } = await get(`actions/workflows/codeql.yml/runs?head_sha=${sha}&event=push&per_page=10`);
  const run = runs?.find(item => item.head_sha === sha && item.head_branch === "main");
  if (!run) throw new Error("No trusted main CodeQL run for this revision");
  const { jobs } = await get(`actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
  for (const name of ["Analyze actions", "Analyze javascript-typescript", "Analyze Java and Kotlin"]) {
    if (!jobs?.some(job => job.name === name && job.status === "completed" && job.conclusion === "success")) {
      throw new Error(`Required analysis has not passed: ${name}`);
    }
  }
}
if (process.argv[1]?.endsWith("verify-play-authorization.mjs")) {
  await verifyPlayAuthorization(process.env);
  console.log("Exact main revision authorized; all three CodeQL jobs passed.");
}
