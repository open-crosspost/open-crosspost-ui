import { useAuth } from "@/contexts/auth-context";
import { AccountPost, Platform, PlatformName } from "@crosspost/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Link as LinkIcon, Trash2, Twitter } from "lucide-react";
import React from "react";
import { InlineBadges } from "../../../../components/badges/inline-badges";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { useDeletePost } from "../../../../hooks/use-post-mutations";
import { toast } from "../../../../hooks/use-toast";
import { getClient } from "../../../../lib/authorization-service";
import { getProfile } from "../../../../lib/utils/near-social-node";

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

  // Get profile image URL (but not background image)
  const profileImageUrl = data.profile?.image?.ipfs
    ? `https://ipfs.near.social/ipfs/${data.profile.image.ipfs}`
    : data.profile?.image?.url || null;

  return (
    <div className="flex flex-col space-y-4">
      {/* Profile Header */}
      <div className="base-component p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-none border-2 border-white">
            {profileImageUrl && (
              <AvatarImage src={profileImageUrl} alt={accountId} className="rounded-none" />
            )}
            <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white text-lg font-semibold rounded-none">
              {accountId.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">{accountId}</span>
            <InlineBadges accountId={accountId} />
          </div>
        </div>
      </div>

      <AccountPostsList accountId={accountId || "Anonymous"} />
    </div>
  );
}

const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({
  platform,
  className,
}) => {
  switch (platform?.toLowerCase()) {
    case Platform.TWITTER:
      return <Twitter className={className} />;
    case Platform.FARCASTER:
      return (
        <img
          src="/platforms/farcaster.svg"
          alt="Farcaster Logo"
          className={`text-gray-400 ${className}`}
        />
      );
    default:
      return <LinkIcon className={className} />; // Default icon
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

const AccountPostsList: React.FC<{ accountId: string }> = ({ accountId }) => {
  const { currentAccountId } = useAuth();
  const {
    data: posts,
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

  if (isLoading) {
    return (
      <div className="base-component p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="base-component p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
        </div>
        <div className="p-4 text-center text-red-600 dark:text-red-400">
          <p>{error?.message || "An unknown error occurred."}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="base-component p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">0 posts</span>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No posts found for this account.
        </p>
      </div>
    );
  }

  return (
    <div className="base-component p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Posts</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{posts.length} posts</span>
      </div>
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <PlatformIcon
                  platform={post.platform}
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {post.platform.charAt(0).toUpperCase() +
                    post.platform.slice(1)}
                </span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {post.type ?? "Post"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  •{" "}
                  {new Date(post.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                {accountId === currentAccountId && (
                  <button
                    onClick={() =>
                      handleDeletePost(post.id, post.platform, post.userId)
                    }
                    disabled={deletePostMutation.isPending}
                    title="Delete post"
                    className="text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title={`View on ${post.platform}`}
              >
                <LinkIcon size={14} />
                View on {post.platform.toLowerCase()}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
