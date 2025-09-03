import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { X } from "lucide-react";
import { ConnectedAccount } from "@crosspost/types";
import { EditorContent } from "@/store/drafts-store";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: EditorContent[];
  selectedAccounts: ConnectedAccount[];
}

export function PreviewModal({
  isOpen,
  onClose,
  posts,
  selectedAccounts,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-600 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            This is how your post will look when posted:
          </p>

          {selectedAccounts.map((account) => (
            <div key={account.userId} className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={account.profile?.profileImageUrl}
                      alt={account.profile?.username || account.userId}
                    />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {account.profile?.username?.charAt(0)?.toUpperCase() ||
                        account.userId.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-bold text-black dark:text-white">
                      @{account.profile?.username || account.userId}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Just now
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {posts.map((post, index) => (
                    <div key={index}>
                      {post.text &&
                        post.text.trim() !== "ㅤ" &&
                        post.text.trim() !== "" && (
                          <p className="text-black dark:text-white text-lg font-bold whitespace-pre-wrap">
                            {post.text}
                          </p>
                        )}
                      {post.media && post.media.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {post.media.map((media, mediaIndex) => (
                            <div
                              key={mediaIndex}
                              className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                            >
                              {media.mimeType?.startsWith("image/") ? (
                                <img
                                  src={media.preview || media.data}
                                  alt={`Media ${mediaIndex + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                                  Video
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {selectedAccounts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="mb-2">No accounts selected</div>
              <div className="text-sm">
                Please select at least one platform account above to see the
                preview.
              </div>
            </div>
          )}

          {selectedAccounts.length > 0 &&
            posts.every((p) => !(p.text || "").trim() || p.text === "ㅤ") && (
              <div className="text-center py-8 text-gray-400">
                <div className="mb-2">No content to preview</div>
                <div className="text-sm">
                  Add some text or media to your post to see the preview.
                </div>
              </div>
            )}

          <div className="text-xs text-gray-400 space-y-1">
            <div>
              • Preview shows how posts will appear on connected platforms
            </div>
            <div>• Media files are displayed as they would appear</div>
            <div>• Thread posts are shown in sequence</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
