import {
  ApiErrorCode,
  ErrorDetail,
  MultiStatusDataSchema,
} from "@crosspost/types";

export interface ErrorResponse {
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
  };
  results?: any[];
  errors?: ErrorDetail[];
  message?: string;
  code?: string;
}

/**
 * Parses errors from the Crosspost API, handling both standard errors and multi-status errors
 */
export function parseCrosspostError(error: any): ErrorResponse {
  if (!error) return { message: "Unknown error" };

  // Check if it's a multi-status error
  if (error.code === ApiErrorCode.MULTI_STATUS && error.details) {
    try {
      // Parse the multi-status data
      const multiStatusData = MultiStatusDataSchema.parse(error.details);
      return {
        summary: multiStatusData.summary,
        results: multiStatusData.results,
        errors: multiStatusData.errors,
        code: ApiErrorCode.MULTI_STATUS,
      };
    } catch (parseError) {
      console.error("Failed to parse multi-status error details:", parseError);
      return {
        message: "Failed to parse error details",
        code: ApiErrorCode.MULTI_STATUS,
      };
    }
  }

  // Handle standard error
  return {
    message: error.message || "Unknown error",
    code: error.code,
    errors: error.details?.errors,
  };
}
