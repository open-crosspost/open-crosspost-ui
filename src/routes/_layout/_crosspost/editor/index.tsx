import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DraftsModal } from "../../../../components/drafts-modal";
import { PlatformAccountsSelector } from "../../../../components/platform-accounts-selector";
import { PostEditorCore } from "../../../../components/post-editor-core";
import {
  PostInteractionSelector,
  PostType,
} from "../../../../components/post-interaction-selector";
import { SchedulePostPanel } from "../../../../components/schedule-post-panel";
import { SchedulePopup } from "../../../../components/schedule-popup";
import { TabSwitcher } from "../../../../components/tab-switcher";
import { Button } from "../../../../components/ui/button";
import { PlatformName, SUPPORTED_PLATFORMS } from "@crosspost/types";
import { detectPlatformFromUrl } from "../../../../lib/utils/url-utils";
import { usePostManagement } from "../../../../hooks/use-post-management";
import { usePostMedia } from "../../../../hooks/use-post-media";
import { useSubmitPost } from "../../../../hooks/use-submit-post";
import {
  useCreatePost,
  useReplyPost,
  useQuotePost,
} from "../../../../hooks/use-post-mutations";
import { toast } from "../../../../hooks/use-toast";
import {
  EditorContent,
  EditorMedia,
  useDraftsStore,
} from "../../../../store/drafts-store";
import { useScheduledPostsStore } from "../../../../store/scheduled-posts-store";

const DEFAULT_EMPTY_POST: EditorContent = {
  text: "ㅤ",
  media: [] as EditorMedia[],
};
import { useSelectedAccounts } from "../../../../store/platform-accounts-store";
import { MediaPreviewModal } from "../../../../components/media-preview-modal";

export const Route = createFileRoute("/_layout/_crosspost/editor/")({
  component: EditorPage,
});

function EditorPage() {
  const selectedAccounts = useSelectedAccounts();
  const { submitPost, isPosting } = useSubmitPost();
  const createPostMutation = useCreatePost();
  const replyPostMutation = useReplyPost();
  const quotePostMutation = useQuotePost();
  const addScheduledPost = useScheduledPostsStore(
    (state) => state.addScheduledPost,
  );
  const setModalOpen = useDraftsStore((state) => state.setModalOpen);
  const autosave = useDraftsStore((state) => state.autosave);
  const saveAutoSave = useDraftsStore((state) => state.saveAutoSave);
  const clearAutoSave = useDraftsStore((state) => state.clearAutoSave);
  const saveDraft = useDraftsStore((state) => state.saveDraft);
  const isModalOpen = useDraftsStore((state) => state.isModalOpen);

  const [posts, setPosts] = useState<EditorContent[]>([DEFAULT_EMPTY_POST]);
  const [postType, setPostType] = useState<PostType>("post");
  const [targetUrl, setTargetUrl] = useState("");
  const [isSchedulePopupOpen, setIsSchedulePopupOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalMediaContent, setModalMediaContent] = useState<{
    src: string;
    type: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "scheduled">("editor");

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

  const handleTextFocus = useCallback((index: number) => {
    // Only clear placeholder on first focus
    setPosts((currentPosts) => {
      if (currentPosts[index]?.text === "ㅤ") {
        const newPosts = [...currentPosts];
        newPosts[index] = { ...newPosts[index], text: "" };
        return newPosts;
      }
      return currentPosts;
    });
  }, []);

  const handleTextBlur = useCallback((index: number) => {
    // Don't add placeholder back - let user type freely
  }, []);

  const handlePostsChange = useCallback(
    (newPosts: EditorContent[]) => {
      setPosts(newPosts);
      saveAutoSave(newPosts);
    },
    [saveAutoSave],
  );

  const handleSubmit = useCallback(async () => {
    if (posts.every((p) => !(p.text || "").trim())) {
      toast({
        title: "No content to post",
        description: "Please add some text to your post.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await submitPost(
        posts,
        selectedAccounts,
        postType,
        targetUrl,
      );
      if (result.success) {
        toast({
          title: "Post published successfully!",
          description:
            "Your post has been published to all selected platforms.",
        });
        clearAutoSave();
        setPosts([DEFAULT_EMPTY_POST]);
        setTargetUrl("");
        setPostType("post");
      } else {
        toast({
          title: "Failed to publish post",
          description:
            result.error || "An error occurred while publishing your post.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while publishing your post.",
        variant: "destructive",
      });
    }
  }, [
    posts,
    selectedAccounts,
    postType,
    targetUrl,
    submitPost,
    clearAutoSave,
    toast,
  ]);

  const handleScheduleClick = useCallback(() => {
    if (posts.every((p) => !(p.text || "").trim())) {
      toast({
        title: "No content to schedule",
        description: "Please add some text to your post.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }

    setIsSchedulePopupOpen(true);
  }, [posts, selectedAccounts, toast]);

  const handleScheduleClose = useCallback(() => {
    setIsSchedulePopupOpen(false);
  }, []);

  const handleScheduleConfirm = useCallback(
    async (scheduledDate: Date) => {
      try {
        // Prepare the post request for authentication
        const postRequest = {
          targets: selectedAccounts.map((account) => ({
            platform: account.platform,
            userId: account.profile?.userId || "",
          })),
          content: posts.map((post) => ({
            text: post.text || "",
            media: post.media || [],
          })),
        };

        // Authenticate the scheduled post by making a test API call
        // This will trigger the NEAR wallet popup
        let apiResponse;

        if (postType === "reply" && targetUrl) {
          // For reply posts, we need to extract platform and postId from URL
          // This is a simplified version - you might need to implement URL parsing
          apiResponse = await replyPostMutation.mutateAsync({
            ...postRequest,
            platform: selectedAccounts[0]?.platform || "twitter",
            postId: "temp-post-id", // You'll need to extract this from URL
          });
        } else if (postType === "quote" && targetUrl) {
          // For quote posts
          apiResponse = await quotePostMutation.mutateAsync({
            ...postRequest,
            platform: selectedAccounts[0]?.platform || "twitter",
            postId: "temp-post-id", // You'll need to extract this from URL
          });
        } else {
          // Regular post
          apiResponse = await createPostMutation.mutateAsync(postRequest);
        }

        // If authentication was successful, schedule the post
        const postContent = posts.map((post) => ({
          text: post.text || "",
          media: post.media || [],
        }));

        addScheduledPost({
          id: Date.now().toString(),
          content: postContent,
          selectedAccounts,
          scheduledDate,
          postType,
          targetUrl,
          status: "scheduled",
          createdAt: new Date(),
        });

        toast({
          title: "Post scheduled successfully!",
          description: `Your post has been scheduled for ${scheduledDate.toLocaleString()}`,
        });

        clearAutoSave();
        setPosts([DEFAULT_EMPTY_POST]);
        setTargetUrl("");
        setPostType("post");
        setIsSchedulePopupOpen(false);
      } catch (error) {
        console.error("Error scheduling post:", error);
        toast({
          title: "Scheduling Failed",
          description: "Authentication failed. Please try again.",
          variant: "destructive",
        });
      }
    },
    [
      posts,
      selectedAccounts,
      postType,
      targetUrl,
      addScheduledPost,
      clearAutoSave,
      toast,
      createPostMutation,
      replyPostMutation,
      quotePostMutation,
    ],
  );

  const handleSaveDraft = useCallback(() => {
    if (posts.every((p) => !(p.text || "").trim())) {
      toast({
        title: "No content to save",
        description: "Please add some text to your post.",
        variant: "destructive",
      });
      return;
    }

    saveDraft(posts, postType, targetUrl);
    toast({
      title: "Draft saved successfully!",
      description: "Your draft has been saved and can be accessed later.",
    });
  }, [posts, postType, targetUrl, saveDraft, toast]);

  const handleLoadDraft = useCallback(
    (draft: {
      content: EditorContent[];
      postType: PostType;
      targetUrl: string;
    }) => {
      setPosts(draft.content);
      setPostType(draft.postType);
      setTargetUrl(draft.targetUrl);
      setModalOpen(false);
      toast({
        title: "Draft loaded",
        description: "Your draft has been loaded successfully.",
      });
    },
    [setModalOpen, toast],
  );

  const openMediaModal = useCallback((src: string, type: string) => {
    setModalMediaContent({ src, type });
    setIsMediaModalOpen(true);
  }, []);

  const closeMediaModal = useCallback(() => {
    setIsMediaModalOpen(false);
    setModalMediaContent(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Editor Content Component
  const EditorContent = () => (
    <div className="space-y-4">
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
        onTextFocus={handleTextFocus}
        onTextBlur={handleTextBlur}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4">
        <span className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
          {`${posts.length} parts`}
        </span>
        <div className="flex gap-2 order-1 sm:order-2">
          <Button
            onClick={handleSaveDraft}
            disabled={posts.every((p) => !(p.text || "").trim())}
            className="flex-1 sm:flex-auto"
          >
            Save Draft
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
          <Button
            onClick={handleScheduleClick}
            disabled={
              isPosting ||
              posts.every((p) => !(p.text || "").trim()) ||
              selectedAccounts.length === 0
            }
            className="flex-1 sm:flex-auto"
          >
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );

  // Scheduled Posts Content Component
  const ScheduledPostsContent = () => (
    <div className="space-y-4">
      <SchedulePostPanel isPosting={isPosting} />
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden mb-6">
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="max-w-md mx-auto"
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {activeTab === "editor" ? <EditorContent /> : <ScheduledPostsContent />}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {/* Main Editor - Takes up 2/3 of the space */}
        <div className="lg:col-span-2">
          <EditorContent />
        </div>

        {/* Schedule Panel - Takes up 1/3 of the space */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <ScheduledPostsContent />
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
      <SchedulePopup
        isOpen={isSchedulePopupOpen}
        onClose={handleScheduleClose}
        onSchedule={handleScheduleConfirm}
        isPosting={isPosting}
      />
    </div>
  );
}
