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
import { PlatformName, SUPPORTED_PLATFORMS } from "@crosspost/types";
import { detectPlatformFromUrl } from "../../../../lib/utils/url-utils";
import { usePostManagement } from "../../../../hooks/use-post-management";
import { usePostMedia } from "../../../../hooks/use-post-media";
import { useSubmitPost } from "../../../../hooks/use-submit-post";
import { toast } from "../../../../hooks/use-toast";
import {
  EditorContent,
  EditorMedia,
  useDraftsStore,
} from "../../../../store/drafts-store";

const DEFAULT_EMPTY_POST: EditorContent = {
  text: "ㅤ",
  media: [] as EditorMedia[],
};
import { useSelectedAccounts } from "../../../../store/platform-accounts-store";
import { MediaPreviewModal } from "../../../../components/media-preview-modal";
import { LivePreviewModal } from "../../../../components/live-preview-modal";

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

  const [posts, setPosts] = useState<EditorContent[]>([DEFAULT_EMPTY_POST]);
  const [postType, setPostType] = useState<PostType>("post");
  const [targetUrl, setTargetUrl] = useState("");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalMediaContent, setModalMediaContent] = useState<{
    src: string;
    type: string;
  } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

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

  const handleTextFocus = useCallback(
    (index: number) => {
      if (posts[index]?.text === "ㅤ") {
        handleTextChange(index, "");
      }
    },
    [posts, handleTextChange],
  );

  const handleTextBlur = useCallback(
    (index: number) => {
      if (posts[index]?.text === "") {
        handleTextChange(index, "ㅤ");
      }
    },
    [posts, handleTextChange],
  );

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
    setPosts([DEFAULT_EMPTY_POST]);
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
      setPosts([DEFAULT_EMPTY_POST]);
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
          <div className="flex items-center gap-2">
            <Button onClick={() => setModalOpen(true)} size="sm">
              Drafts
            </Button>
            <Button
              onClick={() => setIsPreviewModalOpen(true)}
              size="sm"
              disabled={posts.every((p) => !(p.text || "").trim())}
            >
              Preview
            </Button>
          </div>
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
        <span className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1 text-center sm:text-left">
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
        </div>
      </div>

      {isModalOpen && <DraftsModal onSelect={handleLoadDraft} />}
      <MediaPreviewModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        mediaSrc={modalMediaContent?.src || null}
        mediaType={modalMediaContent?.type || null}
      />
      <LivePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        posts={posts}
        postType={postType}
        targetUrl={targetUrl}
      />
    </div>
  );
}
