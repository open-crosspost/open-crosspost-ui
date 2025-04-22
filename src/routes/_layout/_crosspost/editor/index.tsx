import { PlatformName } from "@crosspost/types";
import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useEffect, useState } from "react";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Input } from "../../../../components/ui/input";
import { DraftsModal } from "../../../../components/drafts-modal";
import { PlatformAccountsSelector } from "../../../../components/platform-accounts-selector";
import {
  EditorPost,
  PostEditorCore,
} from "../../../../components/post-editor-core";
import { Button } from "../../../../components/ui/button";
import { usePostManagement } from "../../../../hooks/use-post-management";
import { usePostMedia } from "../../../../hooks/use-post-media";
import { toast } from "../../../../hooks/use-toast";
import { PostContent, useDraftsStore } from "../../../../store/drafts-store";
import { useSelectedAccounts } from "../../../../store/platform-accounts-store";
import { useSubmitPost } from "../../../../hooks/use-submit-post";

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
  const [isReply, setIsReply] = useState(false);
  const [replyUrl, setReplyUrl] = useState("");

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
    await submitPost(postContents, selectedAccounts, isReply, replyUrl);

    // Clear form on success
    if (postContents.length > 0) {
      setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
      clearAutoSave();
    }
  }, [
    posts,
    selectedAccounts,
    isReply,
    replyUrl,
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
        <PlatformAccountsSelector />
        {/* Controls Bar */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isReply"
                checked={isReply}
                onCheckedChange={(checked: boolean) => setIsReply(checked)}
                className="border-2"
              />
              <label htmlFor="isReply" className="text-sm">
                Reply to post
              </label>
            </div>
            {isReply && (
              <Input
                value={replyUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReplyUrl(e.target.value)
                }
                placeholder="Enter post URL to reply to (e.g., https://x.com/user/status/123)"
                className="w-[400px] border-2"
              />
            )}
          </div>
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
