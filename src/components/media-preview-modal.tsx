import React from "react";
import { motion } from "framer-motion";
import ReactPlayer from "react-player/lazy";
import { Dialog, DialogContent } from "./ui/dialog";
import { ModalWindowControls } from "./modal-window-controls";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaSrc: string | null;
  mediaType: string | null;
}

export function MediaPreviewModal({
  isOpen,
  onClose,
  mediaSrc,
  mediaType,
}: MediaPreviewModalProps) {
  if (!isOpen || !mediaSrc || !mediaType) {
    return null;
  }

  const isVideo = mediaType.startsWith("video/");
  const isImage = mediaType.startsWith("image/");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative w-[calc(100%-0.5rem)] sm:w-full max-w-4xl mx-auto border-2 border-primary  bg-white dark:bg-black shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(255,255,255,0.3)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)] dark:sm:shadow-[4px_4px_0_rgba(255,255,255,0.3)] flex flex-col max-h-[85vh]"
        >
          <ModalWindowControls onClose={onClose} />
          <VisuallyHidden.Root>
            <DialogTitle>Media Preview</DialogTitle>
            <DialogDescription>
              Preview of the uploaded media.
            </DialogDescription>
          </VisuallyHidden.Root>
          <div className="flex-grow p-3 sm:p-6 flex items-center justify-center overflow-hidden">
            {/* Container to constrain the media */}
            <div className="w-full h-full flex items-center justify-center">
              {isImage && (
                <img
                  src={mediaSrc}
                  alt="Media Preview"
                  className="max-w-full max-h-full object-contain block" // block helps prevent extra space below image
                />
              )}
              {isVideo && (
                <ReactPlayer
                  key={mediaSrc}
                  url={mediaSrc}
                  controls
                  playing
                  width="100%"
                  height="100%"
                  config={{
                    file: {
                      attributes: {
                        style: {
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        },
                      },
                    },
                  }}
                />
              )}
              {!isImage && !isVideo && (
                <p className="text-gray-600">
                  Unsupported media type: {mediaType}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
