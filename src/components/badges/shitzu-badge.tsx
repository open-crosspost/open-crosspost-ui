import React from "react";
import { useQuery } from "@tanstack/react-query";
import { hasShitzuNft } from "../../lib/nft";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ShitzuBadgeProps {
  accountId: string;
  className?: string;
}

export function ShitzuBadge({ accountId, className = "" }: ShitzuBadgeProps) {
  const { data: hasNft, isLoading } = useQuery({
    queryKey: ["shitzuNft", accountId],
    queryFn: () => hasShitzuNft(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !hasNft) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 ${className}`}
          >
            <span role="img" aria-label="Shitzu NFT" className="text-xs">
              🐕
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Shitzu NFT Owner</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
