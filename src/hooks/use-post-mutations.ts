import { CreatePostRequest, MultiStatusData, QuotePostRequest, ReplyToPostRequest } from "@crosspost/types";
import { createAuthenticatedMutation } from "../lib/authentication-service";

/**
 * Hook for creating a new post across multiple platforms
 */
export const useCreatePost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  CreatePostRequest
>({
  mutationKey: ["createPost"],
  clientMethod: (client, params) => client.post.createPost(params),
  getAuthDetails: () => "createPost",
});

/**
 * Hook for replying to an existing post
 */
export const useReplyPost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  ReplyToPostRequest
>({
  mutationKey: ["replyPost"],
  clientMethod: (client, params) => client.post.replyToPost(params),
  getAuthDetails: () => "replyToPost",
});

/**
 * Hook for quoting an existing post
 */
export const useQuotePost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  QuotePostRequest
>({
  mutationKey: ["quotePost"],
  clientMethod: (client, params) => client.post.quotePost(params),
  getAuthDetails: () => "quotePost",
});
