import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  Play,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  useScheduledPostsStore,
  ScheduledPost,
} from "../store/scheduled-posts-store";
import { toast } from "../hooks/use-toast";

const StatusIcon: React.FC<{ status: ScheduledPost["status"] }> = ({
  status,
}) => {
  switch (status) {
    case "pending":
      return <Clock size={16} className="text-blue-500" />;
    case "executing":
      return <Play size={16} className="text-yellow-500" />;
    case "completed":
      return <CheckCircle2 size={16} className="text-green-500" />;
    case "failed":
      return <XCircle size={16} className="text-red-500" />;
    default:
      return <AlertCircle size={16} className="text-gray-500" />;
  }
};

const StatusBadge: React.FC<{ status: ScheduledPost["status"] }> = ({
  status,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "executing":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "completed":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "failed":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface ScheduledPostItemProps {
  post: ScheduledPost;
  onDelete: (id: string) => void;
  onEdit?: (post: ScheduledPost) => void;
}

const ScheduledPostItem: React.FC<ScheduledPostItemProps> = ({
  post,
  onDelete,
  onEdit,
}) => {
  const scheduledDate = new Date(post.scheduledFor);
  const now = new Date();
  const isPast = scheduledDate < now;
  const isUpcoming = scheduledDate > now && post.status === "pending";

  const handleDelete = () => {
    if (
      window.confirm("Are you sure you want to delete this scheduled post?")
    ) {
      onDelete(post.id);
    }
  };

  return (
    <div className="p-4 base-component rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon status={post.status} />
          <StatusBadge status={post.status} />
        </div>
        <Button
          size="sm"
          onClick={handleDelete}
          className="p-0 w-9 h-9 text-red-500 hover:text-red-700 base-component flex items-center justify-center min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px]"
          title="Delete scheduled post"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="space-y-2">
        {post.posts && post.posts.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-black rounded">
            <div className="text-gray-700 dark:text-white line-clamp-2">
              {post.posts[0]?.text?.replace("ㅤ", "").trim() ||
                "No text content"}
            </div>
            {post.posts[0]?.media && post.posts[0].media.length > 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                + {post.posts[0].media.length} media file
                {post.posts[0].media.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {post.status === "failed" && post.error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900 rounded text-sm text-red-700 dark:text-red-300">
            <strong>Error:</strong> {post.error}
          </div>
        )}

        {post.executedAt && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {post.status === "completed" ? "Completed" : "Failed"} at:{" "}
            {new Date(post.executedAt).toLocaleDateString()} •{" "}
            {new Date(post.executedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const ScheduledPostsFeed: React.FC = () => {
  const { scheduledPosts, deleteScheduledPost } = useScheduledPostsStore();
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("all");

  const filteredPosts = scheduledPosts.filter((post) => {
    if (filter === "all") return true;
    return post.status === filter;
  });

  const sortedPosts = filteredPosts.sort((a, b) => {
    // Sort by scheduled time, with pending posts first
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return (
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  });

  const handleDelete = (id: string) => {
    deleteScheduledPost(id);
    toast({
      title: "Scheduled Post Deleted",
      description: "The scheduled post has been removed.",
      variant: "success",
    });
  };

  const pendingCount = scheduledPosts.filter(
    (p) => p.status === "pending",
  ).length;
  const completedCount = scheduledPosts.filter(
    (p) => p.status === "completed",
  ).length;
  const failedCount = scheduledPosts.filter(
    (p) => p.status === "failed",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Scheduled Posts</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2 max-w-32">
              {filter === "all" && `All (${scheduledPosts.length})`}
              {filter === "pending" && `Pending (${pendingCount})`}
              {filter === "completed" && `Completed (${completedCount})`}
              {filter === "failed" && `Failed (${failedCount})`}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-accent" : ""}
            >
              All ({scheduledPosts.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilter("pending")}
              className={filter === "pending" ? "bg-accent" : ""}
            >
              Pending ({pendingCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilter("completed")}
              className={filter === "completed" ? "bg-accent" : ""}
            >
              Completed ({completedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilter("failed")}
              className={filter === "failed" ? "bg-accent" : ""}
            >
              Failed ({failedCount})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {sortedPosts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar
            size={48}
            className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
          />
          <p className="text-lg font-medium mb-2">No scheduled posts</p>
          <p>
            {filter === "all"
              ? "You haven't scheduled any posts yet. Use the editor to schedule your first post!"
              : `No ${filter} scheduled posts found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <ScheduledPostItem
              key={post.id}
              post={post}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
