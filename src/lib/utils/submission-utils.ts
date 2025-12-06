import {
  ApiErrorCode,
  ConnectedAccount,
  ErrorDetail,
  MultiStatusData,
  PlatformName,
  SuccessDetail,
} from "@crosspost/types";
import { parseCrosspostError } from "./error-utils";

export type SubmitStatus =
  | "idle"
  | "posting"
  | "success"
  | "partial-success"
  | "failure";

export interface SubmissionSummary {
  total: number;
  succeeded: number;
  failed: number;
}

export interface ProcessedSubmissionResult {
  status: SubmitStatus;
  summary: SubmissionSummary;
  results: SuccessDetail[];
  errors: ErrorDetail[];
}

export function processApiError(
  error: any,
  otherAccounts: ConnectedAccount[],
): {
  summary: SubmissionSummary;
  results: SuccessDetail[];
  errors: ErrorDetail[];
} {
  const errorData = parseCrosspostError(error);
  const apiResultCount = otherAccounts.length;

  const summary = errorData.summary || {
    total: apiResultCount,
    succeeded: 0,
    failed: apiResultCount,
  };

  let results = errorData.results || [];
  let errors = errorData.errors || [];

  if (errors.length === 0 && errorData.message) {
    if (otherAccounts.length > 0) {
      errors = otherAccounts.map((acc) => ({
        message: errorData.message || "Posting failed for this account.",
        code: (errorData.code as ApiErrorCode) || ApiErrorCode.PLATFORM_ERROR,
        recoverable: false,
        details: {
          platform: acc.platform,
          userId: acc.profile?.userId || "",
        },
      }));
    } else {
      errors.push({
        message: errorData.message || "An unknown error occurred.",
        code: (errorData.code as ApiErrorCode) || ApiErrorCode.UNKNOWN_ERROR,
        recoverable: false,
        details: {},
      });
    }
  }

  return { summary, results, errors };
}

export function aggregateSubmissionResults(
  apiResponse: MultiStatusData | null,
  apiError: any,
  otherAccounts: ConnectedAccount[],
  nearSocialSuccess: boolean,
  nearSocialAccounts: ConnectedAccount[],
  nearSocialError: any,
): ProcessedSubmissionResult {
  let summary: SubmissionSummary = { total: 0, succeeded: 0, failed: 0 };
  let results: SuccessDetail[] = [];
  let errors: ErrorDetail[] = [];

  if (apiResponse) {
    summary = apiResponse.summary;
    results = apiResponse.results || [];
    errors = apiResponse.errors || [];
  } else if (apiError) {
    const processed = processApiError(apiError, otherAccounts);
    summary = processed.summary;
    results = processed.results;
    errors = processed.errors;
  }

  const nearSocialResultCount = nearSocialAccounts.length;
  const totalSucceeded =
    summary.succeeded + (nearSocialSuccess ? nearSocialResultCount : 0);
  const totalFailed =
    summary.failed + (!nearSocialSuccess ? nearSocialResultCount : 0);
  const totalAttempted = totalSucceeded + totalFailed;

  const combinedSummary = {
    total: totalAttempted,
    succeeded: totalSucceeded,
    failed: totalFailed,
  };

  if (!nearSocialSuccess && nearSocialAccounts.length > 0) {
    nearSocialAccounts.forEach((acc) => {
      errors.push({
        message: nearSocialError?.message || "NEAR Social post failed",
        code: ApiErrorCode.PLATFORM_ERROR,
        recoverable: false,
        details: {
          platform: acc.platform,
          userId: acc.profile?.userId || "",
        },
      });
    });
  }

  if (nearSocialSuccess && nearSocialAccounts.length > 0) {
    nearSocialAccounts.forEach((acc) => {
      results.push({
        platform: acc.platform,
        userId: acc.profile?.userId || "",
        status: "success",
        details: { message: "Successfully posted to NEAR Social" },
      });
    });
  }

  let status: SubmitStatus = "idle";
  if (totalSucceeded === totalAttempted && totalAttempted > 0) {
    status = "success";
  } else if (totalSucceeded > 0 && totalFailed > 0) {
    status = "partial-success";
  } else if (totalFailed === totalAttempted && totalAttempted > 0) {
    status = "failure";
  }

  return {
    status,
    summary: combinedSummary,
    results,
    errors,
  };
}

