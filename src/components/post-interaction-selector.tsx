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
    <div className="flex gap-2">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1">
          {types.map((type) => (
            <Button
              key={type}
              size="sm"
              onClick={() => onPostTypeChange(type)}
              className={cn(
                "capitalize",
                postType === type && "bg-green-100 text-black hover:bg-green-200",
              )}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {(postType === "quote" || postType === "reply") && (
        <div className="space-y-2">
          <Input
            value={targetUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onTargetUrlChange(e.target.value)
            }
            placeholder={`Enter URL to ${postType} (e.g., https://x.com/user/status/123)`}
            className={cn(
              "w-full sm:w-[400px] border-2",
              !detectedPlatform && targetUrl && "border-red-500", 
              detectedPlatform && "border-green-500"
            )}
          />
        </div>
      )}
    </div>
  );
}
