import { ConnectedAccount } from "@crosspost/types";
import React from "react";
import { Button } from "./ui/button";
import { ProfileCard } from "./profile-card";

interface AccountItemProps {
  account: ConnectedAccount;
  isSelected: boolean;
  onSelect: () => void;
  actions?: React.ReactNode;
  variant?: "default" | "compact"; // New prop for layout variants
}

export function AccountItem({
  account,
  isSelected,
  onSelect,
  actions,
  variant = "default",
}: AccountItemProps) {
  // Compact variant is used in the grid layout of PlatformAccountsSelector
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "border-2 border-green-500 bg-green-50"
            : "border-2 border-gray-200 hover:bg-gray-50"
        }`}
        onClick={onSelect}
      >
        <div className="flex-grow">
          <ProfileCard account={account} size="sm" />
        </div>

        <div className="flex-shrink-0 ml-2">
          <div
            className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? "border-green-500 bg-green-500" : "border-gray-300"
            }`}
          >
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-white"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant (used in the manage page)
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border-2 p-3 sm:p-4 gap-3 ${
        isSelected ? "border-green-500 bg-green-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-center space-x-4">
        <ProfileCard account={account} size="md" />
      </div>

      <div className="flex items-center space-x-2 ml-0 sm:ml-auto">
        {actions}
        <Button
          size="sm"
          onClick={onSelect}
          className={
            isSelected ? "bg-green-200 text-black hover:bg-green-300" : ""
          }
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </div>
  );
}
