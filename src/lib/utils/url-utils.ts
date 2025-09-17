import { Platform, PlatformName } from "@crosspost/types";

// TODO: Store platform url with platform itself in crosspost SDK

/**
 * Detects the social media platform from a given URL.
 *
 * @param url The URL to analyze.
 * @returns The detected PlatformName or null if no known platform is detected.
 */
export function detectPlatformFromUrl(url: string): PlatformName | null {
  if (!url) {
    return null;
  }

  try {
    const { hostname } = new URL(url);

    if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
      return Platform.TWITTER;
    }
    if (hostname.includes("warpcast.com") || hostname.includes("farcaster.xyz")) {
      return Platform.FARCASTER;
    }
    // Add more platform detection rules here as needed
    // e.g.,
    // if (hostname.includes('linkedin.com')) {
    //   return Platform.LINKEDIN;
    // }
    // if (hostname.includes('facebook.com')) {
    //   return Platform.FACEBOOK;
    // }
  } catch (error) {
    // Invalid URL format
    console.error("Invalid URL provided for platform detection:", error);
    return null;
  }

  return null; // No known platform detected
}

/**
 * Extracts the post ID from a platform URL.
 * Currently supports Twitter/X URLs.
 *
 * @param url The URL of the post.
 * @param platform The platform detected from the URL.
 * @returns The extracted post ID or null if extraction fails.
 */
export function extractPostIdFromUrl(
  url: string,
  platform: PlatformName | null,
): string | null {
  if (!url || !platform) {
    return null;
  }

  try {
    const pathSegments = new URL(url).pathname.split("/").filter(Boolean); // Filter out empty strings

    if (platform === Platform.TWITTER) {
      // Look for 'status' or 'statuses' followed by the ID
      const statusIndex = pathSegments.findIndex(
        (segment) => segment === "status" || segment === "statuses",
      );
      if (statusIndex !== -1 && statusIndex + 1 < pathSegments.length) {
        const potentialId = pathSegments[statusIndex + 1];
        // Basic validation: check if it's a numeric string
        if (/^\d+$/.test(potentialId)) {
          return potentialId;
        }
      }
    }
    
    if (platform === Platform.FARCASTER) {
      // Farcaster URLs typically have format: /posts/{hash}
      const postsIndex = pathSegments.findIndex(
        (segment) => segment === "posts",
      );
      if (postsIndex !== -1 && postsIndex + 1 < pathSegments.length) {
        const potentialId = pathSegments[postsIndex + 1];
        // Farcaster post IDs are typically alphanumeric hashes
        if (/^[a-zA-Z0-9]+$/.test(potentialId)) {
          return potentialId;
        }
      }
    }
    // Add extraction logic for other platforms here
  } catch (error) {
    console.error("Error extracting post ID from URL:", error);
    return null;
  }

  return null; // Extraction failed
}
