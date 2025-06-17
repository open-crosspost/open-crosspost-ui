import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface LeaderboardBronzeBadgeProps {
  className?: string;
}

export function LeaderboardBronzeBadge({
  className = "",
}: LeaderboardBronzeBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${className}`}
          >
            <img
              src="/Leaderboard_Bronze.png"
              alt="Bronze Medal"
              className="w-5 h-5 rounded-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Leaderboard #3</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
