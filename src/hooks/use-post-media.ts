import { useCallback } from "react";
import { useDebounce } from "../lib/utils/debounce";
import { EditorMedia, EditorContent } from "../store/drafts-store";
import { toast as toastFunction } from "./use-toast";

export function usePostMedia(
  setPosts: React.Dispatch<React.SetStateAction<EditorContent[]>>,
  toast = toastFunction,
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

      // First check if we can add this media type
      const checkMediaCompatibility = (currentPosts: EditorContent[]) => {
        const post = currentPosts[index];
        const existingmedia = post.media || [];

        // Check if we're trying to add a video when multiple images already exist
        const hasMultipleImages =
          existingmedia.length > 0 &&
          existingmedia.some((item) => item.mimeType?.startsWith("image/"));

        if (file.type.startsWith("video/") && hasMultipleImages) {
          toast({
            title: "Cannot Add Video",
            description:
              "Videos cannot be added when multiple images are attached",
            variant: "destructive",
          });
          return false;
        }

        const hasVideo = existingmedia.some((item) =>
          item.mimeType?.startsWith("video/"),
        );
        if (file.type.startsWith("image/") && hasVideo) {
          toast({
            title: "Cannot Add Image",
            description:
              "Multiple images cannot be added when a video is attached",
            variant: "destructive",
          });
          return false;
        }

        return true;
      };

      // Read the file and update state only once
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPosts((currentPosts) => {
            // Check compatibility before adding
            if (!checkMediaCompatibility(currentPosts)) {
              return currentPosts;
            }

            const updatedPosts = [...currentPosts];
            const updatedPost = updatedPosts[index];

            const newMediaItem: EditorMedia = {
              data: event.target!.result as string,
              mimeType: file.type,
              id: URL.createObjectURL(file),
              preview: event.target!.result as string,
            };

            const media = updatedPost.media || [];

            updatedPosts[index] = {
              ...updatedPost,
              media: [...media, newMediaItem],
            };

            debouncedSave(updatedPosts);
            return updatedPosts;
          });
        }
      };
      reader.readAsDataURL(file);
    },
    [setPosts, toast, debouncedSave],
  );

  const removeMedia = useCallback(
    (index: number, mediaIndex: number = 0) => {
      setPosts((currentPosts) => {
        const newPosts = [...currentPosts];
        const post = newPosts[index];
        const media = post.media || [];

        const mediaToRemove = media[mediaIndex];

        // Revoke object URL if it exists
        if (
          mediaToRemove.id &&
          typeof mediaToRemove.id === "string" &&
          mediaToRemove.id.startsWith("blob:")
        ) {
          URL.revokeObjectURL(mediaToRemove.id);
        }

        // Remove the media item
        const updatedmedia = [
          ...media.slice(0, mediaIndex),
          ...media.slice(mediaIndex + 1),
        ];

        newPosts[index] = {
          ...post,
          media: updatedmedia,
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
