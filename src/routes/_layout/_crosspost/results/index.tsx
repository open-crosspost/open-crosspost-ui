import { ProfileCard } from "@/components/profile-card";
import {
  ConnectedAccount,
  ErrorDetail,
  PlatformName,
  SuccessDetail,
} from "@crosspost/types";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import React from "react";
import { BackButton } from "../../../../components/back-button";
import { Button } from "../../../../components/ui/button";

import { useSubmitPost } from "../../../../hooks/use-submit-post";
import { useSubmissionResultsStore } from "../../../../store/submission-results-store";

export const Route = createFileRoute("/_layout/_crosspost/results/")({
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const { summary, results, errors, request, clearSubmissionOutcome } =
    useSubmissionResultsStore();

  const { submitPost, isPosting } = useSubmitPost();

  const handleRetry = async (errorDetail: ErrorDetail) => {
    if (
      !request ||
      !errorDetail.details?.platform ||
      !errorDetail.details?.userId
    ) {
      console.error("Missing request data or error details for retry", {
        request,
        errorDetail,
      });
      return;
    }

    const { posts, selectedAccounts, postType, targetUrl } = request;

    const platformToRetry = errorDetail.details.platform as PlatformName;
    const userIdToRetry = errorDetail.details.userId as string;

    const accountToRetry = selectedAccounts.find(
      (acc: ConnectedAccount) =>
        acc.platform === platformToRetry &&
        acc.profile?.userId === userIdToRetry,
    );

    if (!accountToRetry) {
      console.error(
        "Could not find account to retry in the original request:",
        {
          platformToRetry,
          userIdToRetry,
          selectedAccounts,
        },
      );
      return;
    }

    await submitPost(
      posts,
      [accountToRetry], // Retry only this specific account
      postType,
      targetUrl || "",
    );
    // The page will re-render with updated results from the store
  };

  const handleDone = () => {
    clearSubmissionOutcome();
  };

  if (!summary && results.length === 0 && errors.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-10">
        <Info
          size={48}
          className="mx-auto mb-4 text-gray-400 dark:text-gray-500"
        />
        <h1 className="text-2xl font-bold mb-2">No Submission Results</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          It looks like you haven't submitted any posts yet, or the results have
          been cleared.
        </p>
        <Button onClick={() => navigate({ to: "/editor" })}>
          Go to Editor
        </Button>
      </div>
    );
  }

  const getAccountForError = (
    error: ErrorDetail,
  ): ConnectedAccount | undefined => {
    if (request && error.details?.platform && error.details?.userId) {
      const platform = error.details.platform as PlatformName;
      const userId = error.details.userId as string;
      return request.selectedAccounts.find(
        (acc: ConnectedAccount) =>
          acc.platform === platform && acc.profile?.userId === userId,
      );
    }
    return undefined;
  };

  const getAccountForSuccess = (
    success: SuccessDetail,
  ): ConnectedAccount | undefined => {
    if (request) {
      const platform = success.platform as PlatformName;
      const userId = success.userId;
      return request.selectedAccounts.find(
        (acc: ConnectedAccount) =>
          acc.platform === platform && acc.profile?.userId === userId,
      );
    }
    return undefined;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton cleanup={handleDone} />
        </div>
        <h1 className="text-2xl font-bold">Submission Results</h1>
        {summary && (
          <p className="text-gray-500 dark:text-gray-400">
            {`Attempted: ${summary.total} | Succeeded: ${summary.succeeded} | Failed: ${summary.failed}`}
          </p>
        )}
      </div>

      {/* Successful Posts */}
      {results.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <CheckCircle2 className="mr-2 text-green-500" />
            Successful Posts ({results.length})
          </h2>
          <div className="space-y-3">
            {results.map((success, index) => {
              const account = getAccountForSuccess(success);
              return (
                <div
                  key={index}
                  className="p-4 border rounded-md bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500"
                >
                  {account ? (
                    <ProfileCard account={account} size="md" />
                  ) : (
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Successfully posted to {success.platform} (User ID:{" "}
                      {success.userId})
                    </p>
                  )}
                  {success.details && typeof success.details === "string" && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {success.details}
                    </p>
                  )}
                  {success.details &&
                    typeof success.details === "object" &&
                    "message" in success.details &&
                    typeof success.details.message === "string" && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {success.details.message}
                      </p>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed Posts */}
      {errors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <AlertCircle className="mr-2 text-red-500" />
            Failed Posts ({errors.length})
          </h2>
          <div className="space-y-3">
            {errors.map((error, index) => {
              const account = getAccountForError(error);
              return (
                <div
                  key={index}
                  className="p-4 border rounded-md bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow mr-4">
                      {account ? (
                        <ProfileCard account={account} size="md" />
                      ) : (
                        <p className="font-medium text-red-700 dark:text-red-400">
                          Failed to post to{" "}
                          {(error.details?.platform as string) ||
                            "Unknown Platform"}{" "}
                          (User ID:{" "}
                          {(error.details?.userId as string) || "Unknown User"})
                        </p>
                      )}
                      <div className="mt-2 text-red-700 dark:text-red-400">
                        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                          {`${error.code}: `}
                        </p>
                        <p className="text-base font-semibold">
                          {error.message}
                        </p>
                      </div>
                    </div>
                    {request?.posts && (
                      <Button
                        onClick={() => handleRetry(error)}
                        disabled={isPosting}
                        variant="destructive"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {isPosting ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button onClick={handleDone} size="lg">
          Done
        </Button>
      </div>
    </div>
  );
}
