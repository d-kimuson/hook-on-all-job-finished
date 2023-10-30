// @ts-check

/**
 * @typedef {import("@octokit/rest").Octokit} OctokitClient
 * @link https://octokit.github.io/rest.js/v20#usage
 */
/** @typedef {import("@actions/github").context} WorkflowRunContext */

/** @type {(arg: { github: OctokitClient, context: WorkflowRunContext }) => Promise<void>} */
module.exports = async ({ github, context }) => {
  const list = await github.checks.listForRef({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: context.ref,
  });
  console.log("context", context);
  console.log("list", list);
};
