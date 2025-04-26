import { ConnectedAccount, Platform, PlatformName } from "@crosspost/types";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useState } from "react";
import { NearSocialService } from "../lib/near-social-service";
import { transformNearSocialPost } from "../lib/utils/near-social-utils";
import { parseCrosspostError } from "../lib/utils/error-utils";
import { PostContent } from "../store/drafts-store";
import { toast } from "./use-toast";
import { useCreatePost, useReplyPost } from "./use-post-mutations";

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
  results?: any[];
  errors?: any[];
}

/**
 * Hook to manage the post submission process across platforms
 */
export function useSubmitPost() {
  const { wallet, signedAccountId } = useWalletSelector();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [result, setResult] = useState<SubmitResult>({ status: "idle" });

  const createPostMutation = useCreatePost();
  const replyPostMutation = useReplyPost();

  const submitPost = async (
    posts: PostContent[],
    selectedAccounts: ConnectedAccount[],
    isReply: boolean = false,
    replyUrl: string = "",
  ): Promise<SubmitStatus> => {
    if (!wallet || !signedAccountId) {
      toast({
        title: "Error",
        description: "Wallet not connected or account ID unavailable.",
        variant: "destructive",
      });
      setStatus("failure");
      setResult({ status: "failure" });
      return "failure";
    }

    const nonEmptyPosts = posts.filter((p) => p.text.trim());
    if (nonEmptyPosts.length === 0) {
      toast({
        title: "Empty Post",
        description: "Please enter your post text",
        variant: "destructive",
      });
      setStatus("idle");
      return "idle";
    }

    if (selectedAccounts.length === 0) {
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

    // Separate NEAR Social accounts
    const nearSocialAccounts = selectedAccounts.filter(
      (account) => account.platform === ("Near Social" as PlatformName),
    );
    const otherAccounts = selectedAccounts.filter(
      (account) => account.platform !== ("Near Social" as PlatformName),
    );

    // Initial toast
    const uniquePlatforms = new Set([
      ...otherAccounts.map((a) => a.platform),
      ...(nearSocialAccounts.length > 0 ? ["Near Social" as PlatformName] : []),
    ]);
    const totalAccounts = selectedAccounts.length;
    toast({
      title: "Crossposting...",
      description: `Publishing to ${uniquePlatforms.size} platform${uniquePlatforms.size > 1 ? "s" : ""} and ${totalAccounts} account${totalAccounts > 1 ? "s" : ""}`,
      variant: "default",
    });

    // Results tracking
    let nearSocialSuccess = true;
    let nearSocialError: any = null;
    let apiResponse: any = null;
    let apiError: any = null;

    // --- Post to NEAR Social ---
    if (nearSocialAccounts.length > 0) {
      try {
        const nearSocialService = new NearSocialService(wallet);
        const combinedText = transformNearSocialPost(nonEmptyPosts);
        const transaction = await nearSocialService.createPost([
          { text: combinedText },
        ]);

        if (!transaction) {
          throw new Error("Failed to create NEAR Social post transaction");
        }

        await wallet.signAndSendTransactions({
          transactions: [
            {
              receiverId: transaction.contractId,
              actions: transaction.actions,
            },
          ],
        });
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

        if (isReply && replyUrl) {
          // Extract platform and postId from URL
          let platform: PlatformName;
          let postId: string;

          if (replyUrl.includes("x.com") || replyUrl.includes("twitter.com")) {
            platform = Platform.TWITTER;
            postId = replyUrl.split("/").pop() || "";
          } else {
            throw new Error("Unsupported platform URL format for reply");
          }

          if (!postId) {
            throw new Error("Invalid reply URL format");
          }

          apiResponse = await replyPostMutation.mutateAsync({
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

    // --- Process Results ---
    let finalStatus: SubmitStatus = "idle";
    let finalSummary = {
      total: 0,
      succeeded: 0,
      failed: 0,
    };
    let finalResults: any[] = [];
    let finalErrors: any[] = [];

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

      if (finalErrors.length === 0 && errorData.message) {
        // If no specific errors but we have a message, create a generic error
        finalErrors = otherAccounts.map((acc) => ({
          platform: acc.platform,
          userId: acc.userId,
          status: "error",
          error: errorData.message,
          recoverable: false,
        }));
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
          platform: acc.platform,
          userId: acc.profile?.userId || "",
          status: "error",
          error: nearSocialError?.message || "NEAR Social post failed",
          recoverable: false,
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
    setResult({
      status: finalStatus,
      summary: combinedSummary,
      results: finalResults,
      errors: finalErrors,
    });

    if (finalStatus === "success") {
      toast({
        title: "Success",
        description: `Your post has been published successfully to all ${combinedSummary.total} account${combinedSummary.total > 1 ? "s" : ""}`,
      });
    } else if (finalStatus === "partial-success") {
      toast({
        title: "Partial Success",
        description: `Posted to ${combinedSummary.succeeded} of ${combinedSummary.total} accounts`,
        variant: "destructive",
      });
    } else if (finalStatus === "failure") {
      toast({
        title: "Post Failed",
        description: "Failed to publish post to any platform",
        variant: "destructive",
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
