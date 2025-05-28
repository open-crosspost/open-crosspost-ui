import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DraftsModal } from "../../../../components/drafts-modal";
import { PlatformAccountsSelector } from "../../../../components/platform-accounts-selector";
import { PostEditorCore } from "../../../../components/post-editor-core";
import {
  PostInteractionSelector,
  PostType,
} from "../../../../components/post-interaction-selector";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { PlatformName, SUPPORTED_PLATFORMS } from "@crosspost/types";
import {
  detectPlatformFromUrl,
  extractPostIdFromUrl,
} from "../../../../lib/utils/url-utils";
import { useNavigate } from "@tanstack/react-router";
import { useSubmissionResultsStore } from "../../../../store/submission-results-store";
import { usePostManagement } from "../../../../hooks/use-post-management";
import { usePostMedia } from "../../../../hooks/use-post-media";
import { useSubmitPost } from "../../../../hooks/use-submit-post";
import {
  useSchedulePost,
  useScheduleReplyPost,
  useScheduleQuotePost,
} from "../../../../hooks/use-post-mutations";
import { toast } from "../../../../hooks/use-toast";
import {
  EditorContent,
  EditorMedia,
  useDraftsStore,
} from "../../../../store/drafts-store";
import { useSelectedAccounts } from "../../../../store/platform-accounts-store";
import { MediaPreviewModal } from "../../../../components/media-preview-modal";

export const Route = createFileRoute("/_layout/_crosspost/editor/")({
  component: EditorPage,
});

function EditorPage() {
  const selectedAccounts = useSelectedAccounts();
  const { submitPost, isPosting } = useSubmitPost();
  const navigate = useNavigate();
  const { setSubmissionOutcome } = useSubmissionResultsStore();

  // Scheduling hooks
  const schedulePostMutation = useSchedulePost();
  const scheduleReplyMutation = useScheduleReplyPost();
  const scheduleQuoteMutation = useScheduleQuotePost();

  const {
    setModalOpen,
    autosave,
    saveAutoSave,
    clearAutoSave,
    saveDraft,
    isModalOpen,
  } = useDraftsStore();

  const [posts, setPosts] = useState<EditorContent[]>([
    { text: "", media: [] as EditorMedia[] },
  ]);
  const [postType, setPostType] = useState<PostType>("post");
  const [targetUrl, setTargetUrl] = useState("");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalMediaContent, setModalMediaContent] = useState<{
    src: string;
    type: string;
  } | null>(null);

  // Scheduling state
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Detect platform from URL and determine which platforms to disable
  const disabledPlatforms = useMemo<PlatformName[]>(() => {
    if (postType === "post") {
      return []; // No platforms disabled for regular posts
    }

    const detectedPlatform = detectPlatformFromUrl(targetUrl);
    if (!detectedPlatform) {
      return []; // If no platform detected, don't disable any yet
    }

    // Return all platforms except the detected one
    return Object.values(SUPPORTED_PLATFORMS).filter(
      (platform) => platform !== detectedPlatform,
    ) as PlatformName[];
  }, [postType, targetUrl]);

  const { handleMediaUpload, removeMedia } = usePostMedia(
    setPosts,
    toast,
    saveAutoSave,
  );

  const { handleTextChange, addThread, removeThread, cleanup } =
    usePostManagement(posts, setPosts, saveAutoSave);

  // Load auto-saved content on mount and handle cleanup
  useEffect(() => {
    if (autosave && autosave.posts && autosave.posts.length > 0) {
      setPosts(autosave.posts);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [autosave, cleanup]);

  // Memoized draft save handler
  const handleSaveDraft = useCallback(() => {
    saveDraft(posts);
    toast({
      title: "Draft Saved",
      description: "Your draft has been saved successfully.",
    });
    clearAutoSave();
    setPosts([{ text: "", media: [] as EditorMedia[] }]);
  }, [saveDraft, posts, toast, setPosts, clearAutoSave]);

  // Helper function to extract MIME type from data URL
  function getMimeTypeFromDataUrl(dataUrl: string): string {
    if (!dataUrl || !dataUrl.startsWith("data:"))
      return "application/octet-stream";
    const match = dataUrl.match(/^data:([^;]+);/);
    return match ? match[1] : "application/octet-stream";
  }

  // Handle posts change (e.g., after drag and drop)
  const handlePostsChange = useCallback(
    (newPosts: EditorContent[]) => {
      setPosts(newPosts);
      saveAutoSave(newPosts);
    },
    [saveAutoSave],
  );

  // Handle post submission
  const handleSubmit = useCallback(async () => {
    // Convert posts to EditorContent format
    const editorContents: EditorContent[] = posts.map((post) => {
      // Handle multiple media items
      const media =
        post.media && post.media.length > 0
          ? post.media.map((item) => ({
              data: item.preview || "",
              mimeType:
                item.mimeType || getMimeTypeFromDataUrl(item.preview || ""),
              id: item.id,
              preview: item.preview,
            }))
          : [];

      return {
        text: post.text || "",
        media,
      };
    });

    // Submit the post
    const postStatus = await submitPost(
      editorContents,
      selectedAccounts,
      postType,
      targetUrl,
    );

    // Only clear form on complete success
    if (postStatus === "success" && editorContents.length > 0) {
      setPosts([{ text: "", media: [] as EditorMedia[] }]);
      clearAutoSave();
    }
    // Keep the editor content for partial success or failure
  }, [
    posts,
    selectedAccounts,
    postType,
    targetUrl,
    submitPost,
    setPosts,
    clearAutoSave,
  ]);

  // Handle load draft
  const handleLoadDraft = useCallback(
    (draftPosts: EditorContent[]) => {
      if (draftPosts.length > 0) {
        // Convert to the format expected by the editor
        const formattedPosts = draftPosts.map((post) => {
          const media =
            post.media?.map((media) => ({
              id: null,
              preview: media.data,
              mimeType: media.mimeType,
            })) || [];

          return {
            text: post.text,
            media: media,
          } as EditorContent;
        });

        setPosts(formattedPosts);
      }
    },
    [setPosts],
  );

  const openMediaModal = useCallback((src: string, type: string) => {
    setModalMediaContent({ src, type });
    setIsMediaModalOpen(true);
  }, []);

  const closeMediaModal = useCallback(() => {
    setIsMediaModalOpen(false);
    setModalMediaContent(null);
  }, []);

  // Handle schedule button click
  const handleScheduleClick = useCallback(async () => {
    if (!isScheduleMode) {
      // Enable schedule mode to show date/time inputs
      setIsScheduleMode(true);
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      return;
    }

    // Validation
    const nonEmptyPosts = posts.filter((p) => (p.text || "").trim());
    if (nonEmptyPosts.length === 0) {
      toast({
        title: "Empty Post",
        description: "Please enter your post text",
        variant: "destructive",
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one account to schedule to",
        variant: "destructive",
      });
      return;
    }

    // Filter accounts for quote/reply posts
    let processingAccounts = [...selectedAccounts];
    if ((postType === "quote" || postType === "reply") && targetUrl) {
      const detectedPlatform = detectPlatformFromUrl(targetUrl);

      if (!detectedPlatform) {
        toast({
          title: "Invalid URL",
          description: "Could not detect platform from the provided URL",
          variant: "destructive",
        });
        return;
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
        return;
      }
    }

    setIsScheduling(true);

    try {
      // Create ISO timestamp from date and time
      const scheduledAt = new Date(
        `${scheduledDate}T${scheduledTime}`,
      ).toISOString();

      // Convert posts to EditorContent format
      const editorContents = nonEmptyPosts.map((post) => {
        const media =
          post.media && post.media.length > 0
            ? post.media.map((item) => ({
                data: item.preview || "",
                mimeType:
                  item.mimeType || getMimeTypeFromDataUrl(item.preview || ""),
                id: item.id,
                preview: item.preview,
              }))
            : [];

        return {
          text: post.text || "",
          media,
        };
      });

      // Prepare request
      const scheduleRequest = {
        targets: processingAccounts.map((account) => ({
          platform: account.platform,
          userId: account.profile?.userId || "",
        })),
        content: editorContents,
        scheduledAt,
      };

      let response;

      // Call appropriate scheduling mutation based on post type
      if (postType === "reply" && targetUrl) {
        const platform = detectPlatformFromUrl(targetUrl);
        const postId = extractPostIdFromUrl(targetUrl, platform);

        if (!platform || !postId) {
          throw new Error("Invalid URL format or unsupported platform");
        }

        response = await scheduleReplyMutation.mutateAsync({
          ...scheduleRequest,
          platform,
          postId,
        });
      } else if (postType === "quote" && targetUrl) {
        const platform = detectPlatformFromUrl(targetUrl);
        const postId = extractPostIdFromUrl(targetUrl, platform);

        if (!platform || !postId) {
          throw new Error("Invalid URL format or unsupported platform");
        }

        response = await scheduleQuoteMutation.mutateAsync({
          ...scheduleRequest,
          platform,
          postId,
        });
      } else {
        // Regular post
        response = await schedulePostMutation.mutateAsync(scheduleRequest);
      }

      // Store the detailed outcome
      const submissionRequest = {
        posts: nonEmptyPosts,
        selectedAccounts: processingAccounts,
        postType: postType,
        targetUrl: targetUrl || undefined,
      };

      setSubmissionOutcome({
        summary: response.summary,
        results: response.results || [],
        errors: response.errors || [],
        request: submissionRequest,
      });

      // Determine success status
      const { summary } = response;
      if (summary.succeeded === summary.total && summary.total > 0) {
        toast({
          title: "Post Scheduled Successfully!",
          description: `Your post has been scheduled for ${scheduledDate} at ${scheduledTime} across ${summary.total} account${summary.total > 1 ? "s" : ""}.`,
          variant: "success",
        });

        // Clear form on success
        setPosts([{ text: "", media: [] as EditorMedia[] }]);
        clearAutoSave();
        setIsScheduleMode(false);
        setScheduledDate("");
        setScheduledTime("");
      } else if (summary.succeeded > 0) {
        toast({
          title: "Partially Scheduled",
          description: `Scheduled for ${summary.succeeded} of ${summary.total} accounts.`,
          variant: "default",
          action: (
            <button onClick={() => navigate({ to: "/results" })}>
              See Results
            </button>
          ),
        });
      } else {
        toast({
          title: "Scheduling Failed",
          description: `Failed to schedule post for any of the ${summary.total} selected account${summary.total > 1 ? "s" : ""}.`,
          variant: "destructive",
          action: (
            <button onClick={() => navigate({ to: "/results" })}>
              See Details
            </button>
          ),
        });
      }
    } catch (error) {
      console.error("Scheduling error:", error);
      toast({
        title: "Scheduling Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  }, [
    isScheduleMode,
    scheduledDate,
    scheduledTime,
    posts,
    selectedAccounts,
    postType,
    targetUrl,
    schedulePostMutation,
    scheduleReplyMutation,
    scheduleQuoteMutation,
    setSubmissionOutcome,
    navigate,
    toast,
    setPosts,
    clearAutoSave,
  ]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-4 mb-4">
        <PlatformAccountsSelector disabledPlatforms={disabledPlatforms} />
        {/* Controls Bar */}
        <div className="flex justify-between items-center mb-2">
          <PostInteractionSelector
            postType={postType}
            targetUrl={targetUrl}
            onPostTypeChange={setPostType}
            onTargetUrlChange={setTargetUrl}
          />
          <Button onClick={() => setModalOpen(true)} size="sm">
            Drafts
          </Button>
        </div>
      </div>

      <PostEditorCore
        posts={posts}
        onPostsChange={handlePostsChange}
        onTextChange={handleTextChange}
        onMediaUpload={handleMediaUpload}
        onMediaRemove={removeMedia}
        onAddThread={addThread}
        onRemoveThread={removeThread}
        onOpenMediaModal={openMediaModal}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4">
        <span className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
          {`${posts.length} parts`}
        </span>
        <div className="flex  gap-2 order-1 ssm:order-2">
          <Button
            onClick={handleSaveDraft}
            disabled={posts.every((p) => !(p.text || "").trim())}
            className="flex-1 sm:flex-auto"
          >
            Save Draft
          </Button>
          {/* Scheduling inputs - shown when schedule mode is active */}
          {isScheduleMode && (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input
                type="date"
                disabled={posts.every((p) => !(p.text || "").trim())}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="base-component text-sm rounded-none border-black shadow-black shadow-[3px_3px_0px_0px]"
                min={new Date().toISOString().split("T")[0]}
              />
              <Input
                type="time"
                disabled={posts.every((p) => !(p.text || "").trim())}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="base-component text-sm rounded-none border-black shadow-black shadow-[3px_3px_0px_0px]"
              />
            </div>
          )}

          {/* Button row */}
          <div className="flex gap-2">
            <Button
              onClick={handleScheduleClick}
              disabled={
                isScheduling ||
                posts.every((p) => !(p.text || "").trim()) ||
                (isScheduleMode && (!scheduledDate || !scheduledTime)) ||
                selectedAccounts.length === 0
              }
            >
              {isScheduling
                ? "Scheduling..."
                : isScheduleMode && scheduledDate && scheduledTime
                  ? "Schedule Post"
                  : "Schedule"}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={
                isPosting ||
                posts.every((p) => !(p.text || "").trim()) ||
                selectedAccounts.length === 0
              }
              className="flex-1 sm:flex-auto"
            >
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && <DraftsModal onSelect={handleLoadDraft} />}
      <MediaPreviewModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        mediaSrc={modalMediaContent?.src || null}
        mediaType={modalMediaContent?.type || null}
      />
    </div>
  );
}
