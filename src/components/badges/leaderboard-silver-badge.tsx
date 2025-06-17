import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface LeaderboardSilverBadgeProps {
  className?: string;
}

export function LeaderboardSilverBadge({
  className = "",
}: LeaderboardSilverBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${className}`}
          >
            <img
              src="/Leaderboard_Silver.png"
              alt="Silver Medal"
              className="w-5 h-5 rounded-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Leaderboard #2</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
