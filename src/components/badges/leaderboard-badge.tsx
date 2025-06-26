import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface LeaderboardBadgeProps {
  className?: string;
}

export function LeaderboardBadge({ className = "" }: LeaderboardBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${className}`}
          >
            <img
              src="/Open_Crosspost-Badge.png"
              alt="Leaderboard #1"
              className="w-5 h-5 rounded-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Leaderboard #1</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
