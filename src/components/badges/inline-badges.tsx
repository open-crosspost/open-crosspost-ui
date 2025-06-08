import React from "react";
import { ShitzuBadge } from "./shitzu-badge";
import { BlackdragonBadge } from "./blackdragon-badge";
import { OpenCrosspostBadge } from "./open-crosspost-badge";

interface InlineBadgesProps {
  accountId: string;
  rank?: number;
  className?: string;
}

/**
 * Displays badges for a user in an inline list
 * Currently supports:
 * - Shitzu NFT badge
 * - Blackdragon NFT badge
 */
export function InlineBadges({ accountId,rank, className = "" }: InlineBadgesProps) {
  if (!accountId) return null;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <ShitzuBadge accountId={accountId} />
      <BlackdragonBadge accountId={accountId} />
      {rank === 1 && <OpenCrosspostBadge isTopUser={true} />}
    </div>
  );
}
