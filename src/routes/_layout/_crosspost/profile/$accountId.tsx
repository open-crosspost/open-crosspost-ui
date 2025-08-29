import { AccountPost, PlatformName } from "@crosspost/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Link as LinkIcon, Trash2, Twitter } from "lucide-react";
import React from "react";
import { InlineBadges } from "../../../../components/badges/inline-badges";
import { Button } from "../../../../components/ui/button";
import { useDeletePost } from "../../../../hooks/use-post-mutations";
import { toast } from "../../../../hooks/use-toast";
import { getClient } from "../../../../lib/authorization-service";
import { getProfile } from "../../../../lib/utils/near-social-node";
import { useAuth } from "@/contexts/auth-context";

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
      <AccountPostsList accountId={accountId || "Anonymous"} />
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
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts for {accountId}</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts for {accountId}</h2>
        <div className="p-4 text-center text-red-600">
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
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts for {accountId}</h2>
        <p className="text-center text-gray-500 py-8">
          No posts found for this account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Posts for {accountId}</h2>
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-3 hover:bg-gray-50 transition-colors base-component rounded-md"
          >
            <div className="flex justify-between items-center mb-2 text-sm">
              <div className="flex items-center space-x-1.5">
                <PlatformIcon
                  platform={post.platform}
                  className="w-4 h-4 text-gray-600"
                />
                <span className="font-medium capitalize text-gray-700">
                  {post.platform}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500 capitalize">
                  {post.type ?? "post"}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(post.createdAt).toLocaleDateString()} •{" "}
                {new Date(post.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {accountId === currentAccountId && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleDeletePost(post.id, post.platform, post.userId)
                  }
                  disabled={deletePostMutation.isPending}
                  title="Delete post"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title={`View on ${post.platform}`}
              >
                view post
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
