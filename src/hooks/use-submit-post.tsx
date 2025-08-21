import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import {
  ApiErrorCode,
  ConnectedAccount,
  ErrorDetail,
  MultiStatusData,
  PlatformName,
  SuccessDetail,
} from "@crosspost/types";
import { useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { PostType } from "../components/post-interaction-selector";
import {
  NearSocialService,
  transformNearSocialPost,
} from "../lib/near-social-service";
import { parseCrosspostError } from "../lib/utils/error-utils";
import {
  detectPlatformFromUrl,
  extractPostIdFromUrl,
} from "../lib/utils/url-utils";
import { EditorContent } from "../store/drafts-store";
import { useSubmissionResultsStore } from "../store/submission-results-store";
import {
  useCreatePost,
  useQuotePost,
  useReplyPost,
} from "./use-post-mutations";
import { toast } from "./use-toast";

export type SubmitStatus =
  | "idle"
  | "posting"
  | "success"
  | "partial-success"
  | "failure";

export interface SubmitResult {
  status: SubmitStatus;
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
  };
  results?: SuccessDetail[];
  errors?: ErrorDetail[];
}

/**
 * Hook to manage the post submission process across platforms
 */
export function useSubmitPost() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { setSubmissionOutcome } = useSubmissionResultsStore();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [result, setResult] = useState<SubmitResult>({ status: "idle" });

  const createPostMutation = useCreatePost();
  const replyPostMutation = useReplyPost();
  const quotePostMutation = useQuotePost();

  const submitPost = async (
    posts: EditorContent[],
    selectedAccounts: ConnectedAccount[],
    postType: PostType = "post",
    targetUrl: string = "",
    scheduledDate: Date | null = null,
  ): Promise<SubmitStatus> => {
    let processingAccounts = [...selectedAccounts];

    if (!isSignedIn) {
      toast({
        title: "Error",
        description: "Wallet not connected.",
        variant: "destructive",
      });
      setStatus("failure");
      setResult({ status: "failure" });
      return "failure";
    }

    const nonEmptyPosts = posts.filter((p) => (p.text || "").trim());
    if (nonEmptyPosts.length === 0) {
      toast({
        title: "Empty Post",
        description: "Please enter your post text",
        variant: "destructive",
      });
      setStatus("idle");
      return "idle";
    }

    if (processingAccounts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one account to post to",
        variant: "destructive",
      });
      setStatus("idle");
      return "idle";
    }

    setStatus("posting");
    setResult({ status: "posting" });

    // Handle scheduled posts
    if (scheduledDate) {
      const now = new Date();
      if (scheduledDate <= now) {
        toast({
          title: "Invalid Schedule",
          description: "Scheduled date must be in the future",
          variant: "destructive",
        });
        setStatus("failure");
        setResult({ status: "failure" });
        return "failure";
      }

      // For now, we'll just show a success message for scheduled posts
      // In a real implementation, you would store this in a database or queue
      const timeUntilPost = scheduledDate.getTime() - now.getTime();
      const hoursUntilPost = Math.floor(timeUntilPost / (1000 * 60 * 60));
      const minutesUntilPost = Math.floor((timeUntilPost % (1000 * 60 * 60)) / (1000 * 60));

      toast({
        title: "Post Scheduled!",
        description: `Your post will be published in ${hoursUntilPost}h ${minutesUntilPost}m`,
        variant: "default",
      });

      setStatus("success");
      setResult({ 
        status: "success",
        summary: {
          total: processingAccounts.length,
          succeeded: processingAccounts.length,
          failed: 0,
        }
      });

      // Store the scheduled post (in a real app, this would go to a database)
      const scheduledPost = {
        posts: nonEmptyPosts,
        selectedAccounts: processingAccounts,
        postType,
        targetUrl,
        scheduledDate,
        status: "scheduled" as const,
      };

      // For demo purposes, we'll just log it
      console.log("Scheduled post:", scheduledPost);

      return "success";
    }

    // For quote or reply, validate the URL and filter accounts by platform
    if ((postType === "quote" || postType === "reply") && targetUrl) {
      const detectedPlatform = detectPlatformFromUrl(targetUrl);

      if (!detectedPlatform) {
        toast({
          title: "Invalid URL",
          description: "Could not detect platform from the provided URL",
          variant: "destructive",
        });
        setStatus("failure");
        setResult({ status: "failure" });
        return "failure";
      }

      // Filter accounts to only include those from the detected platform
      processingAccounts = processingAccounts.filter(
        (account) => account.platform === detectedPlatform,
      );

      if (processingAccounts.length === 0) {
        toast({
          title: "No Compatible Accounts",
          description: `Please select at least one ${detectedPlatform} account to ${postType}`,
          variant: "destructive",
        });
        setStatus("failure");
        setResult({ status: "failure" });
        return "failure";
      }
    }

    // Separate NEAR Social accounts - only used for regular posts
    const nearSocialAccounts =
      postType === "post"
        ? processingAccounts.filter(
            (account) => account.platform === ("Near Social" as PlatformName),
          )
        : [];

    const otherAccounts =
      postType === "post"
        ? processingAccounts.filter(
            (account) => account.platform !== ("Near Social" as PlatformName),
          )
        : processingAccounts;

    // Initial toast
    const uniquePlatforms = new Set([
      ...otherAccounts.map((a) => a.platform),
      ...(nearSocialAccounts.length > 0 ? ["Near Social" as PlatformName] : []),
    ]);
    // totalAccounts for the toast should reflect the number of accounts being processed in *this* attempt
    const totalAccountsForThisAttempt = processingAccounts.length;
    toast({
      title: "Crossposting...",
      description: `Publishing to ${uniquePlatforms.size} platform${uniquePlatforms.size > 1 ? "s" : ""} and ${totalAccountsForThisAttempt} account${totalAccountsForThisAttempt > 1 ? "s" : ""}`,
      variant: "default",
    });

    // Results tracking
    let nearSocialSuccess = true;
    let nearSocialError: any = null;
    let apiResponse: MultiStatusData | null = null;
    let apiError: any = null;

    // --- Post to NEAR Social (only for regular posts) ---
    if (nearSocialAccounts.length > 0 && postType === "post") {
      try {
        const nearSocialService = new NearSocialService();
        const combinedText = transformNearSocialPost(nonEmptyPosts);
        await nearSocialService.createPost([{ text: combinedText }]);
      } catch (error) {
        nearSocialSuccess = false;
        nearSocialError = error;
        console.error("NEAR Social post error:", error);
      }
    }

    // --- Post to Other Platforms ---
    if (otherAccounts.length > 0) {
      try {
        const postRequest = {
          targets: otherAccounts.map((account) => ({
            platform: account.platform,
            userId: account.profile?.userId || "",
          })),
          content: nonEmptyPosts,
        };

        if (postType === "reply" && targetUrl) {
          // Extract platform and postId from URL using utility functions
          const platform = detectPlatformFromUrl(targetUrl);
          const postId = extractPostIdFromUrl(targetUrl, platform);

          if (!platform || !postId) {
            throw new Error("Invalid URL format or unsupported platform");
          }

          apiResponse = await replyPostMutation.mutateAsync({
            ...postRequest,
            platform,
            postId,
          });
        } else if (postType === "quote" && targetUrl) {
          // For quote posts, use the dedicated quote mutation
          const platform = detectPlatformFromUrl(targetUrl);
          const postId = extractPostIdFromUrl(targetUrl, platform);

          if (!platform || !postId) {
            throw new Error("Invalid URL format or unsupported platform");
          }

          apiResponse = await quotePostMutation.mutateAsync({
            ...postRequest,
            platform,
            postId,
          });
        } else {
          // Regular post
          apiResponse = await createPostMutation.mutateAsync(postRequest);
        }
      } catch (error) {
        apiError = error;
        console.error("API post error:", error);
      }
    }

    // --- Process Results ---
    let finalStatus: SubmitStatus = "idle";
    let finalSummary = {
      total: 0,
      succeeded: 0,
      failed: 0,
    };
    let finalResults: SuccessDetail[] = [];
    let finalErrors: ErrorDetail[] = [];

    const nearSocialResultCount = nearSocialAccounts.length;
    const apiResultCount = otherAccounts.length;

    // Process API results
    if (apiResponse) {
      finalSummary = apiResponse.summary;
      finalResults = apiResponse.results || [];
      finalErrors = apiResponse.errors || [];
    } else if (apiError) {
      // Parse the error to extract any available data
      const errorData = parseCrosspostError(apiError);

      if (errorData.summary) {
        finalSummary = errorData.summary;
      } else {
        finalSummary = {
          total: apiResultCount,
          succeeded: 0,
          failed: apiResultCount,
        };
      }

      finalResults = errorData.results || [];
      finalErrors = errorData.errors || [];

      // If no specific errors from parseCrosspostError but we have a general message,
      // create a generic error for each account that was part of this API call.
      if (
        finalErrors.length === 0 &&
        errorData.message &&
        otherAccounts.length > 0
      ) {
        finalErrors = otherAccounts.map((acc) => ({
          message: errorData.message || "Posting failed for this account.",
          code: (errorData.code as ApiErrorCode) || ApiErrorCode.PLATFORM_ERROR,
          recoverable: false,
          details: {
            platform: acc.platform,
            userId: acc.profile?.userId || "",
          },
        }));
      } else if (finalErrors.length === 0 && errorData.message) {
        // Generic error if no accounts were processed (e.g. network error before sending to any platform)
        finalErrors.push({
          message: errorData.message || "An unknown error occurred.",
          code: (errorData.code as ApiErrorCode) || ApiErrorCode.UNKNOWN_ERROR,
          recoverable: false,
          details: {},
        });
      }
    }

    // Combine NEAR Social results
    const totalSucceeded =
      finalSummary.succeeded + (nearSocialSuccess ? nearSocialResultCount : 0);
    const totalFailed =
      finalSummary.failed + (!nearSocialSuccess ? nearSocialResultCount : 0);
    const totalAttempted = totalSucceeded + totalFailed;

    const combinedSummary = {
      total: totalAttempted,
      succeeded: totalSucceeded,
      failed: totalFailed,
    };

    // Add NEAR Social errors if any
    if (!nearSocialSuccess && nearSocialAccounts.length > 0) {
      nearSocialAccounts.forEach((acc) => {
        finalErrors.push({
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

    // Add NEAR Social successes if any
    if (nearSocialSuccess && nearSocialAccounts.length > 0) {
      nearSocialAccounts.forEach((acc) => {
        finalResults.push({
          platform: acc.platform,
          userId: acc.profile?.userId || "",
          status: "success",
          details: { message: "Successfully posted to NEAR Social" },
        });
      });
    }

    // Determine final status
    if (totalSucceeded === totalAttempted && totalAttempted > 0) {
      finalStatus = "success";
    } else if (totalSucceeded > 0 && totalFailed > 0) {
      finalStatus = "partial-success";
    } else if (totalFailed === totalAttempted && totalAttempted > 0) {
      finalStatus = "failure";
    } else {
      finalStatus = "idle";
    }

    setStatus(finalStatus);
    const submissionOutcomeData = {
      status: finalStatus,
      summary: combinedSummary,
      results: finalResults,
      errors: finalErrors,
    };
    setResult(submissionOutcomeData);

    // Store the detailed outcome
    const submissionRequest = {
      posts: nonEmptyPosts,
      selectedAccounts: selectedAccounts,
      postType: postType,
      targetUrl: targetUrl || undefined,
    };
    setSubmissionOutcome({
      summary: combinedSummary,
      results: finalResults,
      errors: finalErrors,
      request: submissionRequest,
    });

    if (finalStatus === "success") {
      toast({
        title: "Success!",
        description: `Your post has been published successfully to all ${combinedSummary.total} account${combinedSummary.total > 1 ? "s" : ""}.`,
        variant: "success",
      });
    } else if (finalStatus === "partial-success") {
      toast({
        title: "Partial Success",
        description: `Posted to ${combinedSummary.succeeded} of ${combinedSummary.total} accounts.`,
        variant: "default",
        action: (
          <ToastAction
            altText="See Results"
            onClick={() => navigate({ to: "/results" })}
          >
            See Results
          </ToastAction>
        ),
      });
    } else if (finalStatus === "failure") {
      toast({
        title: "Post Failed",
        description: `Failed to publish post to any of the ${combinedSummary.total} selected account${combinedSummary.total > 1 ? "s" : ""}.`,
        variant: "destructive",
        action: (
          <ToastAction
            altText="See Details"
            onClick={() => navigate({ to: "/results" })}
          >
            See Details
          </ToastAction>
        ),
      });
    } else if (
      finalStatus === "idle" &&
      totalAttempted === 0 &&
      nonEmptyPosts.length > 0 &&
      processingAccounts.length === 0 &&
      selectedAccounts.length > 0
    ) {
      // This case means all initially selected accounts were filtered out (e.g. for quote/reply)
      toast({
        title: "No Compatible Accounts",
        description:
          "None of your selected accounts are compatible with this action.",
        variant: "default",
      });
    }

    return finalStatus;
  };

  return {
    status,
    result,
    submitPost,
    isPosting: status === "posting",
  };
}
