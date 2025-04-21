import { ConnectedAccount } from "@crosspost/types";
import React from "react";
import { Button } from "../ui/button";
import { ProfileCard } from "../profile-card";

interface AccountItemProps {
  account: ConnectedAccount;
  isSelected: boolean;
  onSelect: () => void;
  actions?: React.ReactNode;
}

export function AccountItem({
  account,
  isSelected,
  onSelect,
  actions,
}: AccountItemProps) {
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
          className={isSelected ? "bg-green-200 text-black hover:bg-green-300" : ""}
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </div>
  );
}
