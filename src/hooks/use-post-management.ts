import { useCallback } from "react";
import { useDebounce } from "../lib/utils/debounce";
import { EditorContent } from "../store/drafts-store";

export function usePostManagement(
  posts: EditorContent[],
  setPosts: React.Dispatch<React.SetStateAction<EditorContent[]>>,
  saveAutoSave?: (posts: EditorContent[]) => void,
) {
  const saveCallback = useCallback(
    (postsToSave: EditorContent[]) => {
      if (saveAutoSave) {
        saveAutoSave(postsToSave);
      }
    },
    [saveAutoSave],
  );

  const { debouncedFn: debouncedSave, cleanup } = useDebounce(saveCallback);

  const handleTextChange = useCallback(
    (index: number, text: string) => {
      setPosts((currentPosts) => {
        const newPosts = [...currentPosts];
        newPosts[index] = { ...newPosts[index], text };
        debouncedSave(newPosts);
        return newPosts;
      });
    },
    [setPosts, debouncedSave],
  );

  const addThread = useCallback(() => {
    setPosts((currentPosts) => {
      const newPosts = [...currentPosts, { text: "", media: [] }];
      if (saveAutoSave) {
        saveAutoSave(newPosts);
      }
      return newPosts;
    });
  }, [setPosts, saveAutoSave]);

  const removeThread = useCallback(
    (index: number) => {
      setPosts((currentPosts) => {
        const newPosts = currentPosts.filter((_, i) => i !== index);
        if (saveAutoSave) {
          saveAutoSave(newPosts);
        }
        return newPosts;
      });
    },
    [setPosts, saveAutoSave],
  );

  const convertToThread = useCallback(
    (text: string) => {
      const parts = text
        .split(/\n\s*\n/)
        .filter((part) => part.trim().length > 0);

      if (parts.length === 0) {
        setPosts([{ text: "", media: [] }]);
        return;
      }

      const threadPosts = parts.map((part) => ({
        text: part.trim(),
        media: [],
      }));

      setPosts(threadPosts);
    },
    [setPosts],
  );

  const convertToSingle = useCallback(() => {
    setPosts((currentPosts) => {
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
