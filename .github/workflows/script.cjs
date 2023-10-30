// @ts-check

/**
 * @typedef {import("@octokit/rest").Octokit} OctokitClient
 * @link https://octokit.github.io/rest.js/v20#usage
 */

/** @typedef {import("@actions/github").context} WorkflowRunContext */

/** @typedef {'SUCCESS_ALL' | 'FAILED' | 'IN_PROGRESS' | 'UNKNOWN'} CheckStatus */

const SELF_JOB_NAME = "check_if_all_job_finished";

/** @type {(arg: { github: { rest: OctokitClient }, context: WorkflowRunContext }) => Promise<CheckStatus>} */
module.exports = async ({ github, context }) => {
  console.log(
    `Check For ${context.job} in ${context.payload.workflow_run.path}`
  );

  const checks = await github.rest.checks
    .listForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.sha,
    })
    .then((res) => res.data.check_runs);

  const otherJobs = checks.filter(({ name }) => name !== SELF_JOB_NAME);
  const failedJobs = otherJobs.filter(
    ({ conclusion }) => conclusion === "failure" || conclusion === "timed_out"
  );
  const notCompletedJobs = otherJobs.filter(
    ({ status }) => status !== "completed"
  );

  /** @type {CheckStatus} */
  const status = (() => {
    if (failedJobs.length > 0) {
      return "FAILED";
    } else if (notCompletedJobs.length === 0) {
      if (
        otherJobs.every(
          ({ conclusion }) =>
            conclusion === "success" || conclusion === "skipped"
        )
      ) {
        return "SUCCESS_ALL";
      } else {
        console.log(otherJobs);
        return "UNKNOWN"; // 完了はしているが想定していない conclusion が帰ってきている
      }
    } else {
      console.log(notCompletedJobs);
      return "IN_PROGRESS";
    }
  })();

  console.log("status", status);
  return status;
};
