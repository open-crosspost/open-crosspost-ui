import { useNavigate } from "@tanstack/react-router";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar } from "./avatar";

interface ProfileHighlightProps {
  accountId: string;
  tooltipContent: string;
  size?: number;
}

export function ProfileHighlight({
  accountId,
  tooltipContent,
  size = 64,
}: ProfileHighlightProps) {
  const navigate = useNavigate();

  return (
    <div className={"relative"}>
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger asChild>
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={() => navigate({ to: `/profile/${accountId}` })}
            >
              <Avatar
                accountId={accountId}
                size={size}
                className="hover:opacity-80 transition-opacity"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="font-bold px-3 py-2 rounded-xl base-component animate-bounce"
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
