import { useCallback } from "react";
import { PostContent } from "../store/drafts-store";
import { toast as toastFunction } from "./use-toast";
import { useDebounce } from "../lib/utils/debounce";

export function usePostMedia(
  setPosts: React.Dispatch<React.SetStateAction<PostContent[]>>,
  toast = toastFunction,
  saveAutoSave?: (posts: PostContent[]) => void,
) {
  const saveCallback = useCallback(
    (postsToSave: PostContent[]) => {
      if (saveAutoSave) {
        saveAutoSave(postsToSave);
      }
    },
    [saveAutoSave],
  );

  const { debouncedFn: debouncedSave, cleanup } = useDebounce(saveCallback);

  const handleMediaUpload = useCallback(
    (index: number, file: File) => {
      if (!file) return;

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Media files must be under 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.match(/^(image|video)\//)) {
        toast({
          title: "Invalid File Type",
          description: "Only images and videos are supported",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPosts((currentPosts) => {
            const newPosts = [...currentPosts];
            newPosts[index] = {
              ...newPosts[index],
              mediaId: URL.createObjectURL(file),
              mediaPreview: event.target!.result as string,
              mediaMimeType: file.type,
            };

            debouncedSave(newPosts);

            return newPosts;
          });
        }
      };
      reader.readAsDataURL(file);
    },
    [setPosts, toast, debouncedSave],
  );

  const removeMedia = useCallback(
    (index: number) => {
      setPosts((currentPosts) => {
        const newPosts = [...currentPosts];

        // If there's a mediaId that's a URL object, revoke it
        if (
          newPosts[index].mediaId &&
          typeof newPosts[index].mediaId === "string" &&
          newPosts[index].mediaId.startsWith("blob:")
        ) {
          URL.revokeObjectURL(newPosts[index].mediaId as string);
        }

        newPosts[index] = {
          ...newPosts[index],
          mediaId: null,
          mediaPreview: null,
          mediaMimeType: undefined,
        };

        debouncedSave(newPosts);

        return newPosts;
      });
    },
    [setPosts, debouncedSave],
  );

  return {
    handleMediaUpload,
    removeMedia,
    cleanup,
  };
}
