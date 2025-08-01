import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface LeaderboardGoldBadgeProps {
  className?: string;
}

export function LeaderboardGoldBadge({
  className = "",
}: LeaderboardGoldBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${className}`}
          >
            <img
              src="/Leaderboard_Gold.png"
              alt="Gold Medal"
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
