import React from "react";
import { cn } from "../lib/utils";
import { detectPlatformFromUrl } from "../lib/utils/url-utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export type PostType = "post" | "quote" | "reply";

interface PostInteractionSelectorProps {
  postType: PostType;
  targetUrl: string;
  onPostTypeChange: (type: PostType) => void;
  onTargetUrlChange: (url: string) => void;
}

export function PostInteractionSelector({
  postType,
  targetUrl,
  onPostTypeChange,
  onTargetUrlChange,
}: PostInteractionSelectorProps) {
  const types: PostType[] = ["post", "quote", "reply"];

  // Detect platform from URL
  const detectedPlatform = targetUrl ? detectPlatformFromUrl(targetUrl) : null;

  return (
    <div className="flex gap-2 items-center w-full">
      <div className="flex items-center gap-1 flex-shrink-0">
        {types.map((type) => (
          <Button
            key={type}
            size="sm"
            onClick={() => onPostTypeChange(type)}
            className={cn(
              "capitalize",
              postType === type &&
                "bg-green-100 dark:bg-black text-black dark:text-white hover:bg-green-200 dark:hover:bg-gray-800",
            )}
          >
            {type}
          </Button>
        ))}
      </div>

      {(postType === "quote" || postType === "reply") && (
        <div className="flex-1 min-w-0">
          <Input
            value={targetUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onTargetUrlChange(e.target.value)
            }
            placeholder={`Enter URL to ${postType} (e.g., https://x.com/user/status/123)`}
            className={cn(
              "w-full border-2",
              !detectedPlatform && targetUrl && "border-red-500",
              detectedPlatform && "border-green-500",
            )}
          />
        </div>
      )}
    </div>
  );
}
