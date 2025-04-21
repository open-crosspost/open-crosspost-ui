import { useCallback } from "react";
import { PostContent } from "../store/drafts-store";
import { useDebounce } from "../lib/utils/debounce";

export function usePostManagement(
  posts: PostContent[],
  setPosts: React.Dispatch<React.SetStateAction<PostContent[]>>,
  saveAutoSave?: (posts: PostContent[]) => void,
) {
  // Use the shared debounce utility
  const saveCallback = useCallback(
    (postsToSave: PostContent[]) => {
      if (saveAutoSave) {
        saveAutoSave(postsToSave);
      }
    },
    [saveAutoSave],
  );

  const { debouncedFn: debouncedSave, cleanup } = useDebounce(saveCallback);

  // Handle text change in a post with debouncing
  const handleTextChange = useCallback(
    (index: number, text: string) => {
      // Update the posts state immediately for UI responsiveness
      setPosts((currentPosts) => {
        const newPosts = [...currentPosts];
        newPosts[index] = { ...newPosts[index], text };

        // Use the debouncedSave helper
        debouncedSave(newPosts);

        return newPosts;
      });
    },
    [setPosts, debouncedSave],
  );

  // Add a new thread post
  const addThread = useCallback(() => {
    setPosts((currentPosts) => {
      const newPosts = [
        ...currentPosts,
        { text: "", mediaId: null, mediaPreview: null },
      ];

      // No need to debounce here as this is a user-initiated action
      if (saveAutoSave) {
        saveAutoSave(newPosts);
      }

      return newPosts;
    });
  }, [setPosts, saveAutoSave]);

  // Remove a thread post
  const removeThread = useCallback(
    (index: number) => {
      setPosts((currentPosts) => {
        const newPosts = currentPosts.filter((_, i) => i !== index);

        // No need to debounce here as this is a user-initiated action
        if (saveAutoSave) {
          saveAutoSave(newPosts);
        }

        return newPosts;
      });
    },
    [setPosts, saveAutoSave],
  );

  // Convert single post to thread
  const convertToThread = useCallback(
    (text: string) => {
      // Split text by double newlines to create thread parts
      const parts = text
        .split(/\n\s*\n/)
        .filter((part) => part.trim().length > 0);

      if (parts.length === 0) {
        setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
        return;
      }

      // Create a post for each part
      const threadPosts = parts.map((part) => ({
        text: part.trim(),
        mediaId: null,
        mediaPreview: null,
      }));

      setPosts(threadPosts);
    },
    [setPosts],
  );

  // Convert thread to single post
  const convertToSingle = useCallback(() => {
    setPosts((currentPosts) => {
      // Join all post texts with double newlines
      const combinedText = currentPosts.map((post) => post.text).join("\n\n");

      // Keep the first media if any
      const firstMediaPost = currentPosts.find(
        (post) => post.mediaId !== null || post.mediaPreview !== null,
      );

      return [
        {
          text: combinedText,
          mediaId: firstMediaPost?.mediaId || null,
          mediaPreview: firstMediaPost?.mediaPreview || null,
        },
      ];
    });
  }, [setPosts]);

  return {
    handleTextChange,
    addThread,
    removeThread,
    convertToThread,
    convertToSingle,
    cleanup,
  };
}
