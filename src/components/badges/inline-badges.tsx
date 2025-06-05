import React from "react";
import { ShitzuBadge } from "./shitzu-badge";
import { BlackdragonBadge } from "./blackdragon-badge";

interface InlineBadgesProps {
  accountId: string;
  className?: string;
}

/**
 * Displays badges for a user in an inline list
 * Currently supports:
 * - Shitzu NFT badge
 * - Blackdragon NFT badge
 */
export function InlineBadges({ accountId, className = "" }: InlineBadgesProps) {
  if (!accountId) return null;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <ShitzuBadge accountId={accountId} />
      <BlackdragonBadge accountId={accountId} />
    </div>
  );
}
