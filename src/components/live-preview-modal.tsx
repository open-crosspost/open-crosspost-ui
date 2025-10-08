import React from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "./ui/dialog";
import { ModalWindowControls } from "./modal-window-controls";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { EditorContent } from "../store/drafts-store";
import {
  useSelectedAccounts,
  useAllAccounts,
} from "../store/platform-accounts-store";
import { Platform } from "@crosspost/types";

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: EditorContent[];
  postType: "post" | "quote" | "reply";
  targetUrl?: string | null;
}

export function LivePreviewModal({
  isOpen,
  onClose,
  posts,
  postType,
  targetUrl,
}: LivePreviewModalProps) {
  const selectedAccounts = useSelectedAccounts();
  const allAccounts = useAllAccounts(); // Get all available accounts as fallback

  // Debug: Log when modal opens
  console.log("Live Preview Modal - Selected Accounts:", selectedAccounts);
  console.log("Live Preview Modal - All Accounts:", allAccounts);
  console.log(
    "Live Preview Modal - Selected Accounts Length:",
    selectedAccounts.length,
  );
  console.log("Live Preview Modal - All Accounts Length:", allAccounts.length);

  if (!isOpen) {
    return null;
  }

  const renderPostPreview = (post: EditorContent, index: number) => {
    const hasMedia = post.media && post.media.length > 0;
    const isFirstPost = index === 0;
    const isLastPost = index === posts.length - 1;

    // Get the first connected account for preview (preferably Twitter)
    // Use selected accounts first, then fallback to all accounts if none selected
    const accountsToUse =
      selectedAccounts.length > 0 ? selectedAccounts : allAccounts;
    const twitterAccount = accountsToUse.find(
      (account) => account.platform === Platform.TWITTER,
    );
    const firstAccount = twitterAccount || accountsToUse[0];

    // Debug: Log the account data to see what we're getting
    console.log("Accounts to use:", accountsToUse);
    console.log("First account:", firstAccount);
    console.log("Accounts length:", accountsToUse.length);

    // Use the same pattern as ProfileCard component
    const { platform, profile, userId } = firstAccount || {};
    const username = profile?.username ?? userId ?? "Your Account";
    const profileImageUrl = profile?.profileImageUrl;

    // Format username with @ symbol
    const displayUsername = username.startsWith("@")
      ? username
      : `@${username}`;

    console.log("Platform:", platform);
    console.log("Profile:", profile);
    console.log("User ID:", userId);
    console.log("Profile image URL:", profileImageUrl);
    console.log("Display username:", displayUsername);

    return (
      <div
        key={index}
        className={`border-2 border-gray-800 dark:border-gray-200 bg-white dark:bg-gray-900 p-4 mb-4 shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(255,255,255,0.1)] ${
          isFirstPost ? "rounded-t-lg" : ""
        } ${isLastPost ? "rounded-b-lg" : ""} ${
          !isFirstPost && !isLastPost ? "border-t-0" : ""
        }`}
      >
        {/* Post Header */}
        <div className="flex items-center mb-3">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
          )}
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {displayUsername}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Just now
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {post.text === "ㅤ" ? "" : post.text}
          </p>
        </div>

        {/* Media Preview */}
        {hasMedia && (
          <div className="mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {post.media?.map((media, mediaIndex) => (
                <div key={mediaIndex} className="relative">
                  {media.mimeType?.startsWith("image/") ? (
                    <img
                      src={media.preview}
                      alt={`Media ${mediaIndex + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : media.mimeType?.startsWith("video/") ? (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        Video Preview
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        Media File
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post Type Indicator */}
        {postType !== "post" && targetUrl && (
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
            {postType === "quote" ? "🔁 Quoting" : "💬 Replying to"}{" "}
            {targetUrl || ""}
          </div>
        )}

        {/* Thread Indicator */}
        {posts.length > 1 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Part {index + 1} of {posts.length}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative w-[calc(100%-0.5rem)] sm:w-full max-w-2xl mx-auto border-2 border-gray-800 dark:border-gray-200 bg-white dark:bg-gray-900 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(255,255,255,0.1)] dark:sm:shadow-[4px_4px_0_rgba(255,255,255,0.1)]"
        >
          <ModalWindowControls onClose={onClose} />
          <div className="p-3 sm:p-6">
            <VisuallyHidden.Root>
              <DialogTitle className="font-mono text-2xl font-bold">
                Live Preview
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Preview how your posts will appear on social media
              </DialogDescription>
            </VisuallyHidden.Root>

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Preview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This is how your {postType} will look when posted:
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {posts.map((post, index) => renderPostPreview(post, index))}
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>
                • Preview shows how posts will appear on connected platforms
              </p>
              <p>• Media files are displayed as they would appear</p>
              <p>• Thread posts are shown in sequence</p>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
