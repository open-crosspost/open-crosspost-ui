import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onImageUpload?: (file: File) => void;
  acceptImages?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onImageUpload, acceptImages = false, ...props }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [dragCounter, setDragCounter] = React.useState(0);

    const handleDragEnter = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter((prev) => prev + 1);
        if (acceptImages && onImageUpload) {
          setIsDragOver(true);
        }
      },
      [acceptImages, onImageUpload],
    );

    const handleDragLeave = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter((prev) => prev - 1);
        if (dragCounter <= 1) {
          setIsDragOver(false);
        }
      },
      [dragCounter],
    );

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        setDragCounter(0);

        if (!acceptImages || !onImageUpload) return;

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((file) =>
          file.type.startsWith("image/"),
        );

        if (imageFiles.length > 0) {
          // Upload the first image file
          onImageUpload(imageFiles[0]);
        }
      },
      [acceptImages, onImageUpload],
    );

    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent) => {
        if (!acceptImages || !onImageUpload) return;

        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find((item) => item.type.startsWith("image/"));

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            onImageUpload(file);
          }
        }
      },
      [acceptImages, onImageUpload],
    );

    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md px-4 py-4 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm base-component",
          isDragOver &&
            acceptImages &&
            onImageUpload &&
            "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
          className,
        )}
        ref={ref}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
