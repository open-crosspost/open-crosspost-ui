import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Twitter } from "lucide-react";

import { Platform } from "@crosspost/types";
import { PlatformAccount } from "../store/platform-accounts-store";
import { capitalize } from "@/lib/utils/string";

interface ProfileCardProps {
  account: PlatformAccount;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProfileCard({
  account,
  className = "",
  size = "md",
}: ProfileCardProps) {
  const { platform, profile } = account;
  const { username, profileImageUrl } = profile;
  // Size classes for different components
  const sizeClasses = {
    sm: {
      container: "gap-2",
      avatar: "h-6 w-6",
      username: "text-sm",
      platform: "text-xs",
    },
    md: {
      container: "gap-3",
      avatar: "h-8 w-8",
      username: "text-base",
      platform: "text-xs",
    },
    lg: {
      container: "gap-4",
      avatar: "h-10 w-10",
      username: "text-lg",
      platform: "text-sm",
    },
  };

  return (
    <div
      className={`flex items-center ${sizeClasses[size].container} ${className}`}
    >
      <Avatar className={sizeClasses[size].avatar}>
        {profileImageUrl ? (
          <AvatarImage src={profileImageUrl} alt={username} />
        ) : (
          <AvatarFallback className="bg-gray-200">
            {platform === Platform.TWITTER && (
              <Twitter
                size={size === "sm" ? 14 : size === "md" ? 18 : 22}
                className="text-gray-400"
              />
            )}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex flex-col">
        <span className={`font-medium ${sizeClasses[size].username}`}>
          @{username}
        </span>
        <span className={`text-gray-500 ${sizeClasses[size].platform}`}>
          {capitalize(platform)}
        </span>
      </div>
    </div>
  );
}
