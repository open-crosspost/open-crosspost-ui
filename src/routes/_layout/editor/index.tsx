import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useCallback } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "../../../store/near-auth-store";
import { useSelectedAccounts } from "../../../store/platform-accounts-store";
import { useDraftsStore, PostContent } from "../../../store/drafts-store";
import { apiClient } from "../../../lib/api-client";
import { SupportedPlatform } from "../../../config";
import { Button } from "../../../components/ui/button";
import { DraftsModal } from "../../../components/drafts-modal";
import { PlatformAccountsSelector } from "../../../components/platform-accounts-selector";
import { toast } from "../../../hooks/use-toast";
import { requireAuthorization } from "../../../lib/auth/route-guards";
import { usePostManagement } from "../../../hooks/use-post-management";
import { usePostMedia } from "../../../hooks/use-post-media";
import { PostEditorCore, EditorPost } from "../../../components/post-editor-core";

export const Route = createFileRoute("/_layout/editor/")({
  beforeLoad: () => {
    // Check if user is authorized before loading the route
    requireAuthorization();
  },
  component: EditorPage,
});

function EditorPage() {
  const navigate = useNavigate();
  const { signedAccountId } = useWalletSelector();
  const { isAuthorized } = useNearAuth();
  const selectedAccounts = useSelectedAccounts();
  const { 
    addDraft, 
    setModalOpen, 
    autosave, 
    saveAutoSave, 
    clearAutoSave,
    saveDraft,
    isModalOpen
  } = useDraftsStore();
  
  const [posts, setPosts] = useState<EditorPost[]>([
    { text: "", mediaId: null, mediaPreview: null }
  ]);
  const [isPosting, setIsPosting] = useState(false);
  
  // Custom hooks
  const { handleMediaUpload, removeMedia } = usePostMedia(
    setPosts as any,
    toast,
    saveAutoSave
  );
  
  const {
    handleTextChange,
    addThread,
    removeThread,
    cleanup
  } = usePostManagement(posts as any, setPosts as any, saveAutoSave);
  
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
  const handlePostsChange = useCallback((newPosts: EditorPost[]) => {
    setPosts(newPosts);
    saveAutoSave(newPosts as any);
  }, [saveAutoSave]);
  
  
  // Handle post submission
  const handleSubmit = useCallback(async () => {
    const nonEmptyPosts = posts.filter((p) => p.text.trim());
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
        description: "Please select at least one account to post to",
        variant: "destructive",
      });
      return;
    }
    
    setIsPosting(true);
    
    try {
      // Convert posts to PostContent format
      const postContents: PostContent[] = posts.map(post => ({
        text: post.text,
        media: post.mediaPreview ? [
          {
            data: post.mediaPreview,
            mimeType: post.mediaPreview.startsWith('data:image/') ? 'image/jpeg' : 'video/mp4',
          }
        ] : undefined
      }));
      
      const postRequest = {
        targets: selectedAccounts.map((account: { platform: SupportedPlatform; userId: string }) => ({
          platform: account.platform,
          userId: account.userId,
        })),
        content: postContents,
      };
      
      const response = await apiClient.createPost(postRequest);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Your post has been published successfully",
        });
        
        // Clear form
        setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
        clearAutoSave();
      } else {
        throw new Error(response.error || "Failed to publish post");
      }
    } catch (error) {
      toast({
        title: "Post Failed",
        description: error instanceof Error ? error.message : "Failed to publish post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  }, [posts, selectedAccounts, setPosts, clearAutoSave, setIsPosting]);
  
  // Handle load draft
  const handleLoadDraft = useCallback((draftPosts: PostContent[]) => {
    if (draftPosts.length > 0) {
      // Convert to the format expected by the editor
      const formattedPosts = draftPosts.map(post => {
        return {
          text: post.text,
          mediaId: post.mediaId === undefined ? null : post.mediaId,
          mediaPreview: post.media && post.media.length > 0 ? post.media[0].data : null,
        } as EditorPost;
      });
      
      setPosts(formattedPosts);
    }
  }, [setPosts]);
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-4 mb-4">
        {/* Header Controls */}
        <div className="flex justify-end items-center">
          <div className="flex gap-2">
            <Button 
              onClick={() => setModalOpen(true)} 
              size="sm"
              
            >
              Drafts
            </Button>
          </div>
        </div>
        
        <PlatformAccountsSelector />
      </div>

      <PostEditorCore
        posts={posts}
        onPostsChange={handlePostsChange}
        onTextChange={handleTextChange}
        onMediaUpload={handleMediaUpload}
        onMediaRemove={removeMedia}
        onAddThread={addThread}
        onRemoveThread={removeThread}
        isConnected={true}
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
