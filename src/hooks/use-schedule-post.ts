import { CreatePostRequest, MultiStatusData, QuotePostRequest, ReplyToPostRequest } from "@crosspost/types";
import { createAuthenticatedMutation } from "../lib/authentication-service";

// Schedule post request extends the base create post request with scheduling
export interface SchedulePostRequest extends CreatePostRequest {
  scheduledAt: string; // ISO timestamp
}

// Schedule quote post request
export interface ScheduleQuotePostRequest extends QuotePostRequest {
  scheduledAt: string; // ISO timestamp
}

// Schedule reply post request
export interface ScheduleReplyPostRequest extends ReplyToPostRequest {
  scheduledAt: string; // ISO timestamp
}

/**
 * Hook for scheduling a new post across multiple platforms
 */
export const useSchedulePost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  SchedulePostRequest
>({
  mutationKey: ["schedulePost"],
  clientMethod: (client, params) => client.post.schedulePost(params),
  getAuthDetails: () => "schedulePost",
});

/**
 * Hook for scheduling a reply to an existing post
 */
export const useScheduleReplyPost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  ScheduleReplyPostRequest
>({
  mutationKey: ["scheduleReplyPost"],
  clientMethod: (client, params) => client.post.scheduleReplyPost(params),
  getAuthDetails: () => "scheduleReplyPost",
});

/**
 * Hook for scheduling a quote of an existing post
 */
export const useScheduleQuotePost = createAuthenticatedMutation<
  MultiStatusData,
  Error,
  ScheduleQuotePostRequest
>({
  mutationKey: ["scheduleQuotePost"],
  clientMethod: (client, params) => client.post.scheduleQuotePost(params),
  getAuthDetails: () => "scheduleQuotePost",
});
