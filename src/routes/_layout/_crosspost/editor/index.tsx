import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DraftsModal } from "../../../../components/drafts-modal";
import { PlatformAccountsSelector } from "../../../../components/platform-accounts-selector";
import {
  EditorPost,
  PostEditorCore,
} from "../../../../components/post-editor-core";
import {
  PostInteractionSelector,
  PostType,
} from "../../../../components/post-interaction-selector";
import { Button } from "../../../../components/ui/button";
import { PlatformName, SUPPORTED_PLATFORMS } from "@crosspost/types";
import { detectPlatformFromUrl } from "../../../../lib/utils/url-utils";
import { usePostManagement } from "../../../../hooks/use-post-management";
import { usePostMedia } from "../../../../hooks/use-post-media";
import { useSubmitPost } from "../../../../hooks/use-submit-post";
import { toast } from "../../../../hooks/use-toast";
import { PostContent, useDraftsStore } from "../../../../store/drafts-store";
import { useSelectedAccounts } from "../../../../store/platform-accounts-store";

export const Route = createFileRoute("/_layout/_crosspost/editor/")({
  component: EditorPage,
});

function EditorPage() {
  const selectedAccounts = useSelectedAccounts();
  const { submitPost, isPosting } = useSubmitPost();
  const {
    setModalOpen,
    autosave,
    saveAutoSave,
    clearAutoSave,
    saveDraft,
    isModalOpen,
  } = useDraftsStore();

  const [posts, setPosts] = useState<EditorPost[]>([
    { text: "", mediaId: null, mediaPreview: null },
  ]);
  const [postType, setPostType] = useState<PostType>("post");
  const [targetUrl, setTargetUrl] = useState("");

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
    setPosts as any,
    toast,
    saveAutoSave,
  );

  const { handleTextChange, addThread, removeThread, cleanup } =
    usePostManagement(posts as any, setPosts as any, saveAutoSave);

  // Load auto-saved content on mount and handle cleanup
  useEffect(() => {
    if (autosave && autosave.posts && autosave.posts.length > 0) {
      setPosts(autosave.posts as any);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [autosave, cleanup]);

  // Memoized draft save handler
  const handleSaveDraft = useCallback(() => {
    saveDraft(posts as any);
    toast({
      title: "Draft Saved",
      description: "Your draft has been saved successfully.",
    });
    clearAutoSave();
    setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
  }, [saveDraft, posts, toast, setPosts, clearAutoSave]);

  // Handle posts change (e.g., after drag and drop)
  const handlePostsChange = useCallback(
    (newPosts: EditorPost[]) => {
      setPosts(newPosts);
      saveAutoSave(newPosts as any);
    },
    [saveAutoSave],
  );

  // Handle post submission
  const handleSubmit = useCallback(async () => {
    // Convert posts to PostContent format
    const postContents: PostContent[] = posts.map((post) => ({
      text: post.text,
      media: post.mediaPreview
        ? [
            {
              data: post.mediaPreview,
              mimeType: post.mediaPreview.startsWith("data:image/")
                ? "image/jpeg"
                : "video/mp4",
            },
          ]
        : undefined,
    }));

    // Submit the post
    const postStatus = await submitPost(
      postContents,
      selectedAccounts,
      postType,
      targetUrl,
    );

    // Only clear form on complete success
    if (postStatus === "success" && postContents.length > 0) {
      setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
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
    (draftPosts: PostContent[]) => {
      if (draftPosts.length > 0) {
        // Convert to the format expected by the editor
        const formattedPosts = draftPosts.map((post) => {
          return {
            text: post.text,
            mediaId: post.mediaId === undefined ? null : post.mediaId,
            mediaPreview:
              post.media && post.media.length > 0 ? post.media[0].data : null,
          } as EditorPost;
        });

        setPosts(formattedPosts);
      }
    },
    [setPosts],
  );

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
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4">
        <span className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
          {`${posts.length} parts`}
        </span>
        <div className="flex gap-2 order-1 sm:order-2">
          <Button
            onClick={handleSaveDraft}
            disabled={posts.every((p) => !p.text.trim())}
            className="flex-1 sm:flex-auto"
          >
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPosting ||
              posts.every((p) => !p.text.trim()) ||
              selectedAccounts.length === 0
            }
            className="flex-1 sm:flex-auto"
          >
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      {isModalOpen && <DraftsModal onSelect={handleLoadDraft} />}
    </div>
  );
}
