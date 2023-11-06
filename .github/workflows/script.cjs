// @ts-check

/**
 * @typedef {import("@octokit/rest").Octokit} OctokitClient
 * @link https://octokit.github.io/rest.js/v20#usage
 */

/** @typedef {import("@actions/github").context} WorkflowRunContext */

/** @typedef {'SUCCESS_ALL' | 'INITIALLY_FAILED' | 'FAILED' | 'IN_PROGRESS' | 'UNKNOWN'} CheckStatus */

const SELF_JOB_NAME = "check_if_all_job_finished";
/** @type {ReadonlyArray<string>} */
const IGNORE_WORKFLOW_NAMES = [];

/** @type {(arg: { github: { rest: OctokitClient }, context: WorkflowRunContext }) => Promise<CheckStatus>} */
module.exports = async ({ github, context }) => {
  /** @type {string} */ // @ts-expect-error
  const workflowName = context.workflow.name;

  console.log(
    `Check For ${workflowName} in ${context.payload.workflow_run.path}`
  );

  const otherJobChecks = await github.rest.checks
    .listForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.sha,
    })
    .then((res) =>
      res.data.check_runs.filter(
        ({ name }) =>
          name !== SELF_JOB_NAME && !IGNORE_WORKFLOW_NAMES.includes(name)
      )
    );

  const failedJobChecks = otherJobChecks
    .filter(
      ({ conclusion }) => conclusion === "failure" || conclusion === "timed_out"
    )
    .slice()
    .sort((a, b) => {
      if (a.completed_at === null) return 1;
      if (b.completed_at === null) return 1;

      return (
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      );
    })
    .filter(({ completed_at }) => completed_at !== null);

  const notCompletedJobChecks = otherJobChecks.filter(
    ({ status }) => status !== "completed"
  );

  console.log(context);
  console.log("failedJobChecks", failedJobChecks);
  console.log("notCompletedJobChecks", notCompletedJobChecks);

  /** @type {CheckStatus} */
  const status = (() => {
    if (failedJobChecks.length > 0) {
      return "FAILED";
    } else if (notCompletedJobChecks.length === 0) {
      if (
        otherJobChecks.every(
          ({ conclusion }) =>
            conclusion === "success" || conclusion === "skipped"
        )
      ) {
        return "SUCCESS_ALL";
      } else {
        console.log(otherJobChecks);
        return "UNKNOWN"; // 完了はしているが想定していない conclusion が帰ってきている
      }
    } else {
      console.log(notCompletedJobChecks);
      return "IN_PROGRESS";
    }
  })();

  console.log("status", status);
  return status;
};
