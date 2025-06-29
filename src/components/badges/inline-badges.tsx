import React from "react";
import { ShitzuBadge } from "./shitzu-badge";
import { BlackdragonBadge } from "./blackdragon-badge";
import { NekoBadge } from "./neko-badge";
import { LeaderboardBadge } from "./leaderboard-badge";

export interface BadgeProps {
  accountId: string;
}

/**
 * Displays badges for a user in an inline list
 * Currently supports:
 * - Leaderboard top 3 badges
 * - Shitzu NFT badge
 * - Blackdragon NFT badge
 * - Neko Cookie badge
 */
export function InlineBadges({ accountId }: BadgeProps) {
  if (!accountId) return null;

  return (
    <div className={`inline-flex items-center gap-1`}>
      <LeaderboardBadge accountId={accountId} />
      <ShitzuBadge accountId={accountId} />
      <BlackdragonBadge accountId={accountId} />
      <NekoBadge accountId={accountId} />
    </div>
  );
}
