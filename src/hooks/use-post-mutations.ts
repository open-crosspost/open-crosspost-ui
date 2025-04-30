import { SuccessDetail } from "@crosspost/sdk";
import { PlatformName, PostContent } from "@crosspost/types";
import { createAuthenticatedMutation } from "../lib/authentication-service";

export interface CreatePostParams {
  targets: Array<{ platform: PlatformName; userId: string }>;
  content: PostContent[];
}

export interface ReplyPostParams extends CreatePostParams {
  platform: PlatformName;
  postId: string;
}

export interface QuotePostParams extends CreatePostParams {
  platform: PlatformName;
  postId: string;
}

export interface PostResponse {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  results: SuccessDetail[];
  errors: any[];
}

/**
 * Hook for creating a new post across multiple platforms
 */
export const useCreatePost = createAuthenticatedMutation<
  PostResponse,
  Error,
  CreatePostParams
>({
  mutationKey: ["createPost"],
  clientMethod: (client, params) => client.post.createPost(params),
  getAuthDetails: () => "createPost",
});

/**
 * Hook for replying to an existing post
 */
export const useReplyPost = createAuthenticatedMutation<
  PostResponse,
  Error,
  ReplyPostParams
>({
  mutationKey: ["replyPost"],
  clientMethod: (client, params) => client.post.replyToPost(params),
  getAuthDetails: () => "replyToPost",
});

/**
 * Hook for quoting an existing post
 */
export const useQuotePost = createAuthenticatedMutation<
  PostResponse,
  Error,
  QuotePostParams
>({
  mutationKey: ["quotePost"],
  clientMethod: (client, params) => client.post.quotePost(params),
  getAuthDetails: () => "quotePost",
});
