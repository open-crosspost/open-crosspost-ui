import React from "react";
import { ShitzuBadge } from "./shitzu-badge";

interface InlineBadgesProps {
  accountId: string;
  className?: string;
}

/**
 * Displays badges for a user in an inline list
 * Currently supports:
 * - Shitzu NFT badge
 */
export function InlineBadges({ accountId, className = "" }: InlineBadgesProps) {
  if (!accountId) return null;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <ShitzuBadge accountId={accountId} />
      {/* Additional badges can be added here in the future */}
    </div>
  );
}
