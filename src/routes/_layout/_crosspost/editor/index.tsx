import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DraftsModal } from "../../../../components/drafts-modal";
import { PreviewModal } from "../../../../components/preview-modal";
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
import { useSelectedAccounts } from "../../../../store/platform-accounts-store";
import { MediaPreviewModal } from "../../../../components/media-preview-modal";
import { SchedulePostModal } from "../../../../components/schedule-post-modal";
import { ScheduledPostsFeed } from "../../../../components/scheduled-posts-feed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { MoreHorizontal, Eye, FileText } from "lucide-react";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalMediaContent, setModalMediaContent] = useState<{
    src: string;
    type: string;
  } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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

  const handleSchedulePost = useCallback(() => {
    setPosts([DEFAULT_EMPTY_POST]);
    clearAutoSave();
  }, [clearAutoSave]);

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
    <div className="w-full h-full lg:px-6 lg:pb-6">
      {/* Mobile Tab Navigation - Only visible on mobile */}
      <div className="lg:hidden border-b border-gray-200  mb-6">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "editor"
                ? "border-black dark:border-white text-black dark:text-white bg-gray-50 dark:bg-gray-800"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("editor")}
          >
            Editor
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "scheduled"
                ? "border-black dark:border-white text-black dark:text-white bg-gray-50 dark:bg-gray-800"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("scheduled")}
          >
            Scheduled Posts
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-8 w-full h-full">
        {/* Left Side - Editor (50%) */}
        <div
          className={`flex-1 lg:w-1/2 min-w-0 px-4 lg:px-0 ${activeTab === "editor" ? "block" : "hidden lg:block"}`}
        >
          <div className="h-full flex flex-col">
            <div className="space-y-4 mb-4">
              <PlatformAccountsSelector disabledPlatforms={disabledPlatforms} />
              {/* Controls Bar */}
              <div className="flex items-center gap-2 mb-2">
                <PostInteractionSelector
                  postType={postType}
                  targetUrl={targetUrl}
                  onPostTypeChange={setPostType}
                  onTargetUrlChange={setTargetUrl}
                />
                {/* Mobile Dropdown */}
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsPreviewOpen(true)}
                        disabled={posts.every(
                          (p) => !(p.text || "").trim() || p.text === "ㅤ",
                        )}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setModalOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Drafts
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden lg:flex gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={posts.every(
                      (p) => !(p.text || "").trim() || p.text === "ㅤ",
                    )}
                    size="sm"
                  >
                    Preview
                  </Button>
                  <Button onClick={() => setModalOpen(true)} size="sm">
                    Drafts
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
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
                <span className="text-sm text-gray-500 order-2 sm:order-1 text-left">
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
                    onClick={() => setIsScheduleModalOpen(true)}
                    disabled={
                      posts.every((p) => !(p.text || "").trim()) ||
                      selectedAccounts.length === 0
                    }
                    className="flex-1 sm:flex-auto"
                  >
                    Schedule
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
          </div>
        </div>

        {/* Right Side - Scheduled Posts Queue (50%) */}
        <div
          className={`flex-1 lg:w-1/2 px-4 lg:px-0 ${activeTab === "scheduled" ? "block" : "hidden lg:block"}`}
        >
          <div className="h-full overflow-auto">
            <ScheduledPostsFeed />
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
      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        posts={posts}
        selectedPlatforms={selectedAccounts.map((account) => account.platform)}
        onScheduled={handleSchedulePost}
      />
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        posts={posts}
        selectedAccounts={selectedAccounts}
      />
    </div>
  );
}

const DEFAULT_EMPTY_POST: EditorContent = {
  text: "ㅤ",
  media: [] as EditorMedia[],
};
