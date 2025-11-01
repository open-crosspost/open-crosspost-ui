import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useLeaderboardQuery } from "@/lib/api/leaderboard";
import { BadgeProps } from "./inline-badges";

export function LeaderboardBadge({ accountId }: BadgeProps) {
  const { data: leaderboard } = useLeaderboardQuery(3);

  if (!leaderboard || !Array.isArray(leaderboard)) {
    return null;
  }

  const userRankInfo = leaderboard.find(
    (entry) => entry.signerId === accountId,
  );

  if (!userRankInfo) {
    return null;
  }

  const rank = userRankInfo.rank;
  let badgeImage = "";
  let tooltipText = "";

  switch (rank) {
    case 1:
      badgeImage = "/badges/leaderboard-gold.png";
      tooltipText = "Leaderboard #1";
      break;
    case 2:
      badgeImage = "/badges/leaderboard-silver.png";
      tooltipText = "Leaderboard #2";
      break;
    case 3:
      badgeImage = "/badges/leaderboard-bronze.png";
      tooltipText = "Leaderboard #3";
      break;
    default:
      return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full`}
          >
            <img
              src={badgeImage}
              alt={tooltipText}
              className="w-5 h-5 rounded-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
