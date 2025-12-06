import { useAuth } from "@/contexts/auth-context";
import { ConnectedAccount, MultiStatusData, PlatformName } from "@crosspost/types";
import { useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { PostType } from "../components/post-interaction-selector";
import {
  NearSocialService,
  transformNearSocialPost,
} from "../lib/near-social-service";
import {
  aggregateSubmissionResults,
  ProcessedSubmissionResult,
  SubmitStatus,
} from "../lib/utils/submission-utils";
import { showSubmissionResultToast, showSubmissionStartToast } from "../lib/utils/submission-toasts";
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

export type { SubmitStatus };

export interface SubmitResult {
  status: SubmitStatus;
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
  };
  results?: ProcessedSubmissionResult["results"];
  errors?: ProcessedSubmissionResult["errors"];
}

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

    showSubmissionStartToast(otherAccounts, nearSocialAccounts, processingAccounts.length);

    let nearSocialSuccess = true;
    let nearSocialError: any = null;
    let apiResponse: MultiStatusData | null = null;
    let apiError: any = null;

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
          apiResponse = await createPostMutation.mutateAsync(postRequest);
        }
      } catch (error) {
        apiError = error;
        console.error("API post error:", error);
      }
    }

    const processed = aggregateSubmissionResults(
      apiResponse,
      apiError,
      otherAccounts,
      nearSocialSuccess,
      nearSocialAccounts,
      nearSocialError,
    );

    setStatus(processed.status);
    setResult({
      status: processed.status,
      summary: processed.summary,
      results: processed.results,
      errors: processed.errors,
    });

    setSubmissionOutcome({
      summary: processed.summary,
      results: processed.results,
      errors: processed.errors,
      request: {
        posts: nonEmptyPosts,
        selectedAccounts: selectedAccounts,
        postType: postType,
        targetUrl: targetUrl || undefined,
      },
    });

    const showNoCompatible =
      processed.status === "idle" &&
      processed.summary.total === 0 &&
      nonEmptyPosts.length > 0 &&
      processingAccounts.length === 0 &&
      selectedAccounts.length > 0;

    showSubmissionResultToast(
      processed.status,
      processed.summary,
      () => navigate({ to: "/results" }),
      showNoCompatible,
    );

    return processed.status;
  };

  return {
    status,
    result,
    submitPost,
    isPosting: status === "posting",
  };
}
