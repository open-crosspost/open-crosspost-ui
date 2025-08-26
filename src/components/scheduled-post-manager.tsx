import React, { useEffect } from "react";
import { useScheduledPostExecutor } from "../hooks/use-scheduled-post-executor";
import { useAuth } from "../contexts/auth-context";

/**
 * This component runs in the background to automatically execute scheduled posts
 * It should be included in the main app layout when user is signed in
 */
export const ScheduledPostManager: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { checkAndExecutePendingPosts } = useScheduledPostExecutor();

  useEffect(() => {
    if (isSignedIn) {
      // Initial check when component mounts and user is signed in
      checkAndExecutePendingPosts();
    }
  }, [isSignedIn, checkAndExecutePendingPosts]);

  // This component doesn't render anything visible
  return null;
};
