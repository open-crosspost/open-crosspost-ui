import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface OpenCrosspostBadgeProps {
  isTopUser: boolean;
  className?: string;
}

export function OpenCrosspostBadge({
  isTopUser   ,
  className = "",
}: OpenCrosspostBadgeProps) {
  if (!isTopUser) {
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
              src="/Open_Crosspost-Badge.png"
              alt="Open Crosspost Top User Badge"
              className="w-5 h-5 "
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-none">
          <p>Top 1 Crosspost User</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
