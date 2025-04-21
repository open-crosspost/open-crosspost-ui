import { useNavigate } from "@tanstack/react-router";
import React from "react";
import {
  useAllAccounts,
  useConnectedAccounts,
  usePlatformAccountsStore,
} from "../store/platform-accounts-store";
import { AccountItem } from "./account-item";
import { Button } from "./ui/button";

export function PlatformAccountsSelector() {
  const navigate = useNavigate();
  const allAccounts = useAllAccounts();
  const { toggleAccountSelection, isAccountSelected } =
    usePlatformAccountsStore();

  // Get loading and error states from the API accounts hook
  const { isLoading, error } = useConnectedAccounts();

  // Handle connect accounts button click
  const handleConnectAccounts = () => {
    navigate({ to: "/manage" });
  };

  if (isLoading) {
    return (
      <div className="border-2 border-gray-200 rounded-md p-3 sm:p-4 w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Connected Accounts</h3>
          <Button size="sm" onClick={handleConnectAccounts}>
            Manage
          </Button>
        </div>
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-red-200 bg-red-50 rounded-md p-3 sm:p-4 w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-red-700">Error Loading Accounts</h3>
          <Button size="sm" onClick={handleConnectAccounts}>
            Manage
          </Button>
        </div>
        <p className="text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : "Failed to load connected accounts"}
        </p>
      </div>
    );
  }

  if (allAccounts.length === 0) {
    return (
      <div className="border-2 border-gray-200 rounded-md p-3 sm:p-4 w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Connected Accounts</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500 mb-4">No accounts connected yet</p>
          <Button onClick={handleConnectAccounts}>Connect Accounts</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-md p-3 sm:p-4 w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Post to</h3>
        <Button size="sm" onClick={handleConnectAccounts}>
          Manage
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
        {allAccounts.map((account) => (
          <AccountItem
            key={account.userId}
            account={account}
            isSelected={isAccountSelected(account.userId)}
            onSelect={() => toggleAccountSelection(account.userId)}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
