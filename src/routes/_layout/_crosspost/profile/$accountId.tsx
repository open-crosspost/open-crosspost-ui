import { AccountPost } from "@crosspost/types";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Link as LinkIcon, Twitter } from "lucide-react"; // Import Twitter and a default link icon
import React, { Component, lazy, Suspense } from "react";
import { Button } from "../../../../components/ui/button";
import { getClient } from "../../../../lib/authorization-service";
import { getProfile, Profile as ProfileType } from "../../../../lib/social";

// const Profile = lazy(() => import("profile/App"));

class ProfileErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Profile error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p>Unable to load profile. Please try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

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

  const fallbackProfile: ProfileType = {
    name: accountId || "Anonymous",
    description: "",
    image: undefined,
    backgroundImage: undefined,
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* <ProfileView
        accountId={accountId || "Anonymous"}
        profile={data?.profile || fallbackProfile}
      /> */}
      <AccountPostsList accountId={accountId || "Anonymous"} />
    </div>
  );
}

// const ProfileView: React.FC<{ accountId: string; profile: ProfileType }> = ({
//   accountId,
//   profile,
// }) => (
//   <ProfileErrorBoundary>
//     <Suspense fallback={<div>Loading...</div>}>
//       <Profile accountId={accountId} profile={profile} />
//     </Suspense>
//   </ProfileErrorBoundary>
// );

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
    // Re-throw the error so React Query can handle it
    throw new Error("Failed to load posts. Please try again later.");
  }
};

const AccountPostsList: React.FC<{ accountId: string }> = ({ accountId }) => {
  const {
    data: posts,
    isLoading,
    isError,
    error,
    refetch, // Added refetch for the retry button
  } = useQuery<AccountPost[], Error>({
    queryKey: ["accountPosts", accountId], // Unique query key including accountId
    queryFn: () => fetchAccountPosts(accountId),
    enabled: !!accountId, // Only run the query if accountId is available
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
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
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        <p className="text-center text-gray-500 py-8">
          No posts found for this account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Posts</h2>
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
              <span className="text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
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
