import { useCallback } from "react";
import { useDebounce } from "../lib/utils/debounce";
import { EditorContent } from "../store/drafts-store";

export function usePostManagement(
  posts: EditorContent[],
  setPosts: React.Dispatch<React.SetStateAction<EditorContent[]>>,
  saveAutoSave?: (posts: EditorContent[]) => void,
) {
  // Use the shared debounce utility
  const saveCallback = useCallback(
    (postsToSave: EditorContent[]) => {
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
      const newPosts = [...currentPosts, { text: "", media: [] }];

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
        setPosts([{ text: "", media: [] }]);
        return;
      }

      // Create a post for each part
      const threadPosts = parts.map((part) => ({
        text: part.trim(),
        media: [],
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

      const firstMediaPost = currentPosts.find(
        (post) => post.media && post.media.length > 0,
      );

      return [
        {
          text: combinedText,
          media: firstMediaPost?.media || [],
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
