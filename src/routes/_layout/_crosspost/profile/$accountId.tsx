import { AccountPost, PlatformName } from "@crosspost/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Link as LinkIcon, Trash2, Twitter, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import React, { useMemo } from "react";
import { InlineBadges } from "../../../../components/badges/inline-badges";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { useDeletePost } from "../../../../hooks/use-post-mutations";
import { toast } from "../../../../hooks/use-toast";
import { getClient } from "../../../../lib/authorization-service";
import { getProfile } from "../../../../lib/utils/near-social-node";
import { useAuth } from "@/contexts/auth-context";
import { useScheduledPostsStore, ScheduledPost } from "@/store/scheduled-posts-store";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_layout/_crosspost/profile/$accountId")({
  loader: async ({ params }) => {
    try {
      const profile = await getProfile(params.accountId);
      return {
        accountId: params.accountId,
        profile,
      };
    } catch (error) {
      // Return null to indicate profile fetch failed
      return null;
    }
  },
  component: ProfilePage,
});

export function ProfilePage() {
  const data = Route.useLoaderData();
  const accountId = useParams({
    from: "/_layout/_crosspost/profile/$accountId",
    select: (params) => params.accountId,
  });

  if (data === null) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
        <p>Profile for {accountId} not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>{accountId}</span>
          <InlineBadges accountId={accountId} />
        </h1>
      </div>
      <UserPostsFeed accountId={accountId || "Anonymous"} />
    </div>
  );
}

const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({
  platform,
  className,
}) => {
  switch (platform.toLowerCase()) {
    case "twitter":
      return <Twitter className={className} />;
    default:
      return <LinkIcon className={className} />; // Default icon
  }
};

const StatusIcon: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  switch (status) {
    case "published":
      return <CheckCircle className={`${className} text-green-600`} />;
    case "scheduled":
      return <Clock className={`${className} text-blue-600`} />;
    case "publishing":
      return <AlertCircle className={`${className} text-yellow-600 animate-pulse`} />;
    case "failed":
      return <XCircle className={`${className} text-red-600`} />;
    default:
      return <Clock className={className} />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "published":
      return "default" as const;
    case "scheduled":
      return "secondary" as const;
    case "publishing":
      return "secondary" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const fetchAccountPosts = async (accountId: string): Promise<AccountPost[]> => {
  if (!accountId) {
    return [];
  }
  try {
    const client = getClient();
    const response = await client.activity.getAccountPosts(accountId);
    return response.data?.posts || [];
  } catch (err) {
    console.error("Error fetching posts:", err);
    throw new Error("Failed to load posts. Please try again later.");
  }
};

// Combined post type for both published and scheduled posts
interface CombinedPost {
  id: string;
  type: 'published' | 'scheduled';
  content: string;
  platform: string;
  status: string;
  createdAt: Date;
  scheduledDate?: Date;
  publishedAt?: Date;
  url?: string;
  errorMessage?: string;
  postType?: string;
  targetUrl?: string;
}

const UserPostsFeed: React.FC<{ accountId: string }> = ({ accountId }) => {
  const { currentAccountId } = useAuth();
  const scheduledPosts = useScheduledPostsStore((state) => state.scheduledPosts);
  const removeScheduledPost = useScheduledPostsStore((state) => state.removeScheduledPost);
  
  const {
    data: publishedPosts,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AccountPost[], Error>({
    queryKey: ["accountPosts", accountId],
    queryFn: () => fetchAccountPosts(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const queryClient = useQueryClient();
  const deletePostMutation = useDeletePost();

  // Combine and sort posts
  const combinedPosts = useMemo(() => {
    const posts: CombinedPost[] = [];

    // Add published posts
    if (publishedPosts) {
      publishedPosts.forEach((post) => {
        posts.push({
          id: post.id,
          type: 'published',
          content: post.content || 'No content available',
          platform: post.platform,
          status: 'published',
          createdAt: new Date(post.createdAt),
          url: post.url,
          postType: post.type,
        });
      });
    }

    // Add scheduled posts (only for current user)
    if (accountId === currentAccountId) {
      scheduledPosts.forEach((post) => {
        // Get the first platform from selected accounts
        const platform = post.selectedAccounts[0]?.platform || 'Unknown';
        
        posts.push({
          id: post.id,
          type: 'scheduled',
          content: post.content[0]?.text || 'No content available',
          platform,
          status: post.status,
          createdAt: post.createdAt,
          scheduledDate: post.scheduledDate,
          publishedAt: post.publishedAt,
          errorMessage: post.errorMessage,
          postType: post.postType,
          targetUrl: post.targetUrl,
        });
      });
    }

    // Sort by creation date (latest first)
    return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [publishedPosts, scheduledPosts, accountId, currentAccountId]);

  const handleDeletePost = async (
    postId: string,
    platform: PlatformName,
    platformUserId: string,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this post from ${platform}?`,
      )
    ) {
      return;
    }

    try {
      await deletePostMutation.mutateAsync({
        targets: [{ platform, userId: platformUserId }],
        posts: [{ platform, userId: platformUserId, postId }],
      });
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted.",
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["accountPosts", accountId],
      });
    } catch (err) {
      toast({
        title: "Error Deleting Post",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScheduledPost = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this scheduled post?")) {
      return;
    }
    
    removeScheduledPost(postId);
    toast({
      title: "Scheduled Post Deleted",
      description: "The scheduled post has been removed.",
      variant: "success",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts Feed</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts Feed</h2>
        <div className="p-4 text-center text-red-600">
          <p>{error?.message || "An unknown error occurred."}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (combinedPosts.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts Feed</h2>
        <p className="text-center text-gray-500 py-8">
          No posts found for this account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Posts Feed</h2>
      <div className="space-y-4">
        {combinedPosts.map((post) => (
          <div
            key={`${post.type}-${post.id}`}
            className="p-4 hover:bg-gray-50 transition-colors base-component rounded-lg"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <PlatformIcon
                  platform={post.platform}
                  className="w-5 h-5 text-gray-600"
                />
                <span className="font-medium capitalize text-gray-700">
                  {post.platform}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500 capitalize">
                  {post.postType || "post"}
                </span>
                <span className="text-gray-400">•</span>
                <StatusIcon status={post.status} className="w-4 h-4" />
                <Badge variant={getStatusBadgeVariant(post.status)} className="text-xs">
                  {post.status}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </span>
                
                {accountId === currentAccountId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (post.type === 'published') {
                        handleDeletePost(post.id, post.platform as PlatformName, post.id);
                      } else {
                        handleDeleteScheduledPost(post.id);
                      }
                    }}
                    disabled={deletePostMutation.isPending}
                    title="Delete post"
                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-3">
              <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Post Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {post.scheduledDate && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Scheduled for {format(post.scheduledDate, "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
              
              {post.publishedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} />
                  <span>Published {format(post.publishedAt, "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
              
              {post.errorMessage && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle size={14} />
                  <span>Error: {post.errorMessage}</span>
                </div>
              )}
              
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  title={`View on ${post.platform}`}
                >
                  <LinkIcon size={14} />
                  View post
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
