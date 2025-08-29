import { useEffect, useRef } from "react";
import { useScheduledPostsStore } from "../store/scheduled-posts-store";
import { useSubmitPost } from "./use-submit-post";
import { useAllAccounts } from "../store/platform-accounts-store";
import { toast } from "./use-toast";
import { PlatformName, ConnectedAccount } from "@crosspost/types";
import { getClient } from "../lib/authorization-service";
import { useAuth } from "../contexts/auth-context";
import { sign } from "near-sign-verify";
import { near } from "../lib/near";

export function useScheduledPostExecutor() {
  const { getPendingPosts, markAsExecuting, markAsCompleted, markAsFailed } =
    useScheduledPostsStore();

  const { submitPost } = useSubmitPost();
  const connectedAccounts = useAllAccounts();
  const { currentAccountId, isSignedIn } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const executeScheduledPost = async (scheduledPost: any) => {
    try {
      markAsExecuting(scheduledPost.id);

      // Check if connectedAccounts is available
      if (!connectedAccounts || connectedAccounts.length === 0) {
        throw new Error("No connected accounts available");
      }

      console.log(
        "Scheduled post execution - Available accounts:",
        connectedAccounts.map((acc) => ({
          platform: acc.platform,
          userId: acc.userId,
        })),
      );
      console.log("Scheduled post platforms:", scheduledPost.platforms);

      // Find connected accounts that match the scheduled platforms
      // Use case-insensitive matching to handle platform name variations
      const selectedAccounts = connectedAccounts.filter(
        (account: ConnectedAccount) =>
          scheduledPost.platforms.some(
            (platform: string) =>
              platform.toLowerCase() === account.platform.toLowerCase(),
          ),
      );

      console.log(
        "Matched accounts for scheduled post:",
        selectedAccounts.map((acc) => ({
          platform: acc.platform,
          userId: acc.userId,
        })),
      );

      if (selectedAccounts.length === 0) {
        throw new Error(
          "No connected accounts found for the scheduled platforms",
        );
      }

      console.log(
        "Executing scheduled post with content:",
        scheduledPost.posts,
      );

      // Execute the post
      console.log("About to call submitPost with:", {
        posts: scheduledPost.posts,
        accounts: selectedAccounts,
        postType: "post",
        hasAuthToken: !!scheduledPost.authToken,
      });

      // Ensure fresh authentication before executing scheduled post
      if (!isSignedIn || !currentAccountId) {
        throw new Error(
          "NEAR wallet not connected. Please reconnect your wallet.",
        );
      }

      try {
        // Generate fresh authentication token using the same format as the authorization service
        const message = `I authorize crosspost to post on my behalf to connected social platforms using my NEAR account: ${currentAccountId}`;
        const authToken = await sign({
          signer: near,
          recipient: "crosspost.near",
          message,
        });

        // Set fresh authentication on the client
        const client = getClient();
        client.setAuthentication(authToken);

        console.log(
          "Fresh authentication token generated for scheduled post execution",
        );
      } catch (authError) {
        throw new Error(
          `Authentication failed: ${authError instanceof Error ? authError.message : "Unknown auth error"}`,
        );
      }

      const result = await submitPost(
        scheduledPost.posts,
        selectedAccounts,
        "post", // Default to regular post
        "", // No target URL for scheduled posts
      );

      console.log("Scheduled post submission result:", result);

      if (result === "success") {
        markAsCompleted(scheduledPost.id);
        toast({
          title: "Scheduled Post Published",
          description: "Your scheduled post was published successfully!",
          variant: "success",
        });
      } else if (result === "partial-success") {
        markAsCompleted(scheduledPost.id);
        toast({
          title: "Scheduled Post Partially Published",
          description: "Some platforms may have failed",
          variant: "default",
        });
      } else {
        throw new Error(`Post submission failed with status: ${result}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Check if error is related to authentication/signature
      if (
        errorMessage.includes("signature") ||
        errorMessage.includes("authentication") ||
        errorMessage.includes("Invalid")
      ) {
        console.error("Authentication error in scheduled post:", errorMessage);
        markAsFailed(
          scheduledPost.id,
          `Authentication failed: ${errorMessage}. Please reconnect your wallet.`,
        );
        toast({
          title: "Authentication Error",
          description:
            "Your wallet signature has expired. Please sign out and sign back in to refresh authentication.",
          variant: "destructive",
        });
      } else {
        markAsFailed(scheduledPost.id, errorMessage);
        toast({
          title: "Scheduled Post Failed",
          description: `Failed to publish scheduled post: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const checkAndExecutePendingPosts = async () => {
    // Only proceed if we have connected accounts
    if (!connectedAccounts || connectedAccounts.length === 0) {
      return;
    }

    const pendingPosts = getPendingPosts();

    for (const post of pendingPosts) {
      await executeScheduledPost(post);
    }
  };

  useEffect(() => {
    // Only start the interval if we have connected accounts
    if (!connectedAccounts || connectedAccounts.length === 0) {
      return;
    }

    // Check for pending posts every minute
    intervalRef.current = setInterval(() => {
      checkAndExecutePendingPosts();
    }, 60000); // 60 seconds

    // Initial check
    checkAndExecutePendingPosts();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [connectedAccounts]); // Add connectedAccounts as dependency

  return {
    executeScheduledPost,
    checkAndExecutePendingPosts,
  };
}
