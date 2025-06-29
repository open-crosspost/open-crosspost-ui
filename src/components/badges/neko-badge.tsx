import React from "react";
import { useQuery } from "@tanstack/react-query";
import { hasNekoCookie } from "../../lib/token";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { BadgeProps } from "./inline-badges";

export function NekoBadge({ accountId }: BadgeProps) {
  const { data: hasBadge, isLoading } = useQuery({
    queryKey: ["nekoCookie", accountId],
    queryFn: () => hasNekoCookie(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // cache for 5 mins
  });

  if (isLoading || !hasBadge) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full`}
          >
            <img
              src="/badges/neko-badge.png"
              alt="Neko COOKIE Holder"
              className="w-5 h-5 rounded-full"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Holds 100k+ $COOKIE</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
