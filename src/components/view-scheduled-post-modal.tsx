import React from "react";
import { Button } from "./ui/button";
import { Clock, Eye, Twitter } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScheduledPost } from "@/store/scheduled-posts-store";

interface ViewScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ScheduledPost | null;
}

export function ViewScheduledPostModal({
  isOpen,
  onClose,
  post,
}: ViewScheduledPostModalProps) {
  if (!post) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <Twitter size={16} className="text-blue-400" />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye size={20} />
            View Scheduled Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Content */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Post Content</label>
            <div className="bg-gray-50 p-3 rounded-md border">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {post.content[0]?.text || "No content"}
              </p>
            </div>
          </div>

          {/* Thread Info */}
          {post.content.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Thread Parts</label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {post.content.length} parts
                </Badge>
              </div>
            </div>
          )}

          {/* Platform Info */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {post.selectedAccounts.map((account, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
                  {getPlatformIcon(account.platform)}
                  <span className="text-sm text-gray-700">{account.platform}</span>
                </div>
              ))}
            </div>
          </div>

          

          {/* Target URL (if applicable) */}
          {post.targetUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target URL</label>
              <div className="bg-gray-50 p-2 rounded-md">
                <p className="text-xs text-gray-600 break-all">{post.targetUrl}</p>
              </div>
            </div>
          )}

          {/* Schedule Info */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Schedule Information</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock size={12} className="mr-1" />
                  {post.status}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p>Scheduled for: {format(post.scheduledDate, "PPP 'at' h:mm a")}</p>
                <p>Created: {format(post.createdAt, "PPP 'at' h:mm a")}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
