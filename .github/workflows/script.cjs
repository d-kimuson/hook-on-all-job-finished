// @ts-check

/**
 * @typedef {import("@octokit/rest").Octokit} OctokitClient
 * @link https://octokit.github.io/rest.js/v20#usage
 */

/** @typedef {import("@actions/github").context} WorkflowRunContext */

/** @type {(arg: { github: { rest: OctokitClient }, context: WorkflowRunContext }) => Promise<void>} */
module.exports = async ({ github, context }) => {
  console.log(`For ${context.job} in ${context.payload.workflow_run.path}`);

  console.log(context);

  const checks = await github.rest.checks
    .listForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.sha,
    })
    .then((res) => res.data.check_runs);

  const suites = await github.rest.checks
    .listSuitesForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.sha,
    })
    .then((res) => res.data.check_suites);

  console.log("checks", checks);
  console.log("suites", suites);
};
