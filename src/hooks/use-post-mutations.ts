import {
  CreatePostRequest,
  DeletePostRequest,
  MultiStatusData,
  QuotePostRequest,
  ReplyToPostRequest,
} from "@crosspost/types";
import { createAuthenticatedMutation } from "../lib/authentication-service";

export {
  useSchedulePost,
  useScheduleReplyPost,
  useScheduleQuotePost,
  type SchedulePostRequest,
  type ScheduleQuotePostRequest,
  type ScheduleReplyPostRequest,
} from "./use-schedule-post";

export const useCreatePost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  CreatePostRequest
>({
  mutationKey: ["createPost"],
  clientMethod: (client, params) => client.post.createPost(params),
  getAuthDetails: () => "createPost",
});

export const useReplyPost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  ReplyToPostRequest
>({
  mutationKey: ["replyPost"],
  clientMethod: (client, params) => client.post.replyToPost(params),
  getAuthDetails: () => "replyPost",
});

export const useQuotePost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  QuotePostRequest
>({
  mutationKey: ["quotePost"],
  clientMethod: (client, params) => client.post.quotePost(params),
  getAuthDetails: () => "quotePost",
});

export const useDeletePost = createAuthenticatedMutation<
  unknown,
  Error,
  DeletePostRequest
>({
  mutationKey: ["deletePost"],
  clientMethod: (client, params) => client.post.deletePost(params),
  getAuthDetails: (variables) => `delete posts: ${variables.targets}`,
});
