import { PostContent } from "@crosspost/types";

/**
 * Transforms post content for NEAR Social posting.
 * Combines text from multiple posts into a single string.
 * @param posts - Array of post content objects.
 * @returns A single string combining the text of all posts.
 */
export function transformNearSocialPost(posts: PostContent[]): string {
  const combinedText = posts.map((p) => p.text).join("\n\n");
  return combinedText;
}
