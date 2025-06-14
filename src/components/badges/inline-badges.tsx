import React from "react";
import { ShitzuBadge } from "./shitzu-badge";
import { BlackdragonBadge } from "./blackdragon-badge";
<<<<<<< HEAD
import { LeaderboardBadge } from "./leaderboard-badge";
=======
import { LeaderboardGoldBadge } from "./leaderboard-gold-badge";
import { LeaderboardSilverBadge } from "./leaderboard-silver-badge";
import { LeaderboardBronzeBadge } from "./leaderboard-bronze-badge";
>>>>>>> be01c2c (crosspost badge added)

interface InlineBadgesProps {
  accountId: string;
  className?: string;
<<<<<<< HEAD
  isLeaderboardFirst?: boolean;
=======
  rank?: number;
>>>>>>> be01c2c (crosspost badge added)
}

/**
 * Displays badges for a user in an inline list
 * Currently supports:
 * - Shitzu NFT badge
 * - Blackdragon NFT badge
<<<<<<< HEAD
 * - Leaderboard #1 badge
=======
 * - Leaderboard medals (Gold, Silver, Bronze)
>>>>>>> be01c2c (crosspost badge added)
 */
export function InlineBadges({
  accountId,
  className = "",
<<<<<<< HEAD
  isLeaderboardFirst = false,
=======
  rank,
>>>>>>> be01c2c (crosspost badge added)
}: InlineBadgesProps) {
  if (!accountId) return null;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <ShitzuBadge accountId={accountId} />
      <BlackdragonBadge accountId={accountId} />
<<<<<<< HEAD
      {isLeaderboardFirst && <LeaderboardBadge />}
=======
      {rank === 1 && <LeaderboardGoldBadge />}
      {rank === 2 && <LeaderboardSilverBadge />}
      {rank === 3 && <LeaderboardBronzeBadge />}
>>>>>>> be01c2c (crosspost badge added)
    </div>
  );
}
