import React, { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { EditorMedia, EditorContent } from "../store/drafts-store";

interface SortablePostProps {
  post: EditorContent;
  index: number;
  onTextChange: (index: number, text: string) => void;
  onRemove?: (index: number) => void;
  onMediaUpload: (index: number, file: File) => void;
  onMediaRemove: (index: number, mediaIndex?: number) => void;
  onOpenMediaModal: (src: string, type: string) => void;
  onTextFocus?: (index: number) => void;
  onTextBlur?: (index: number) => void;
}

function SortablePostComponent({
  post,
  index,
  onTextChange,
  onRemove,
  onMediaUpload,
  onMediaRemove,
  onOpenMediaModal,
  onTextFocus,
  onTextBlur,
}: SortablePostProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `post-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 w-full">
      <div className="flex-none w-8">
        <div
          {...attributes}
          {...listeners}
          className="sticky top-0 h-[150px] w-8 flex items-center justify-center cursor-grab bg-gray-50 dark:bg-gray-800 rounded-lg base-component touch-manipulation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      </div>
      <div className="flex-1 w-full">
        <Textarea
          value={post.text}
          onChange={(e) => onTextChange(index, e.target.value)}
          onFocus={() => onTextFocus?.(index)}
          onBlur={() => onTextBlur?.(index)}
          placeholder={`Thread part ${index + 1}`}
          className={`min-h-[150px] w-full rounded-lg resize-none focus:ring-2 focus:ring-blue-500 ${
            post.text && post.text.length > 280 ? "border-destructive" : ""
          }`}
        />
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex flex-row flex-wrap gap-2">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    for (let i = 0; i < e.target.files.length; i++) {
                      // hook
                      onMediaUpload(index, e.target.files[i]);
                    }
                  }
                }}
                className="hidden"
                id={`media-upload-${index}`}
              />
              <Button
                onClick={() =>
                  document.getElementById(`media-upload-${index}`)?.click()
                }
                size="sm"
                disabled={
                  post.media?.some((item) =>
                    item.mimeType?.startsWith("video/"),
                  ) && post.media?.length > 0
                }
              >
                Add Media
              </Button>

              {/* Media Items Grid */}
              {post.media && post.media.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.media.map(
                    (mediaItem: EditorMedia, mediaIndex: number) => (
                      <div
                        key={`media-${index}-${mediaIndex}`}
                        className="relative"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const srcForModal =
                              mediaItem.mimeType?.startsWith("video/") &&
                              mediaItem.id
                                ? mediaItem.id
                                : mediaItem.preview;
                            if (srcForModal && mediaItem.mimeType) {
                              onOpenMediaModal(srcForModal, mediaItem.mimeType);
                            }
                          }}
                          className="block h-10 w-10 rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          {mediaItem.mimeType?.startsWith("image/") ? (
                            <img
                              src={mediaItem.preview || ""}
                              alt={`Preview ${mediaIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : mediaItem.mimeType?.startsWith("video/") ? (
                            <video
                              src={mediaItem.preview || ""}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                              ?
                            </div>
                          )}
                        </button>
                        <Button
                          onClick={() => onMediaRemove(index, mediaIndex)}
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                        >
                          ×
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-sm ${(post.text || "").length > 280 ? "text-destructive" : "text-gray-500 dark:text-gray-400"}`}
              >
                {(post.text || "").length}/280 characters
              </span>
              <Button onClick={() => onTextChange(index, "")} size="sm">
                Clear
              </Button>
              {onRemove && (
                <Button
                  onClick={() => onRemove(index)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SortablePost = memo(SortablePostComponent);
