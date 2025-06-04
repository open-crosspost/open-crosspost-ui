import React from "react";
import { useQuery } from "@tanstack/react-query";
import { hasBlackdragonNft } from "../../lib/nft";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface BlackdragonBadgeProps {
  accountId: string;
  className?: string;
}

export function BlackdragonBadge({
  accountId,
  className = "",
}: BlackdragonBadgeProps) {
  const { data: hasNft, isLoading } = useQuery({
    queryKey: ["blackdragonNft", accountId],
    queryFn: () => hasBlackdragonNft(accountId),
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
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${className}`}
          >
            <img
              src="/blackdragon-badge.png"
              alt="Blackdragon NFT"
              className="w-4 h-4"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Blackdragon NFT Holder</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
