export const accessCopy = {
  heading: "Enter the salon",
  intro: "This portfolio preview is private. Enter the access key provided by the site owner.",
  inputLabel: "Access key",
  submitButton: "Enter",
  checking: "Checking your access…",
  retryButton: "Try again",
  expired: "This access key has expired. Please request a new one from the site owner and enter it below.",
  invalid: "That access key isn't valid for this project. Check it for a typo and try again.",
  malformed: "That access key isn't the right shape. Use the form ABCD-EFGH-JKLM-NPQ and try again.",
  unavailable: "We couldn't verify your access right now. Please try again.",
  rateLimited: (secondsRemaining: number) =>
    `Too many attempts. Try again in ${secondsRemaining} ${secondsRemaining === 1 ? "second" : "seconds"}.`,
  misconfigured: "This site cannot verify access because of a configuration problem. Please contact the site owner.",
} as const;
