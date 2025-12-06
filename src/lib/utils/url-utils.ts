import { Platform, PlatformName } from "@crosspost/types";

export function detectPlatformFromUrl(url: string): PlatformName | null {
  if (!url) {
    return null;
  }

  try {
    const { hostname } = new URL(url);

    if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
      return Platform.TWITTER;
    }
    if (
      hostname.includes("warpcast.com") ||
      hostname.includes("farcaster.xyz")
    ) {
      return Platform.FARCASTER;
    }
  } catch (error) {
    console.error("Invalid URL provided for platform detection:", error);
    return null;
  }

  return null;
}

export function extractPostIdFromUrl(
  url: string,
  platform: PlatformName | null,
): string | null {
  if (!url || !platform) {
    return null;
  }

  try {
    const pathSegments = new URL(url).pathname.split("/").filter(Boolean);

    if (platform === Platform.TWITTER) {
      const statusIndex = pathSegments.findIndex(
        (segment) => segment === "status" || segment === "statuses",
      );
      if (statusIndex !== -1 && statusIndex + 1 < pathSegments.length) {
        const potentialId = pathSegments[statusIndex + 1];
        if (/^\d+$/.test(potentialId)) {
          return potentialId;
        }
      }
    }

    if (platform === Platform.FARCASTER) {
      const postsIndex = pathSegments.findIndex(
        (segment) => segment === "posts",
      );
      if (postsIndex !== -1 && postsIndex + 1 < pathSegments.length) {
        const potentialId = pathSegments[postsIndex + 1];
        if (/^[a-zA-Z0-9]+$/.test(potentialId)) {
          return potentialId;
        }
      }
    }
  } catch (error) {
    console.error("Error extracting post ID from URL:", error);
    return null;
  }

  return null;
}
