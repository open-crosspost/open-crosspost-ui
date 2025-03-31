import React from "react";
import { AlertCircle, RefreshCw, Trash2, Twitter } from "lucide-react";
import { Button } from "./ui/button";
import { SupportedPlatform } from "../config";
import { PlatformAccount, UserProfile } from "../lib/api-types";
import { ProfileCard } from "./profile-card";

interface PlatformAccountListProps {
  platform: SupportedPlatform;
  accounts: PlatformAccount[];
  selectedAccountIds: string[];
  isLoading: boolean;
  onConnect: (platform: SupportedPlatform) => void;
  onDisconnect: (platform: SupportedPlatform, userId: string) => void;
  onRefresh: (platform: SupportedPlatform, userId: string) => void;
  onSelect: (userId: string) => void;
  isConnectPending: boolean;
  isDisconnectPending: boolean;
  isRefreshPending: boolean;
}

export function PlatformAccountList({
  platform,
  accounts,
  selectedAccountIds,
  isLoading,
  onConnect,
  onDisconnect,
  onRefresh,
  onSelect,
  isConnectPending,
  isDisconnectPending,
  isRefreshPending,
}: PlatformAccountListProps) {
  const filteredAccounts = accounts.filter(
    (account) => account.platform === platform.toLowerCase()
  );

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold capitalize">{platform} Accounts</h2>
        <Button
          onClick={() => onConnect(platform)}
          disabled={isConnectPending}
          size="sm"
          className="gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          {isConnectPending ? "Connecting..." : "Connect Account"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {filteredAccounts.length === 0 ? (
            <div className="rounded-md border-2 border-dashed border-gray-200 p-4 sm:p-8 text-center">
              {platform === "Twitter" && (
                <Twitter className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No {platform} accounts connected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect your {platform} accounts to start crossposting
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => onConnect(platform)}
                  disabled={isConnectPending}
                  
                >
                  {platform === "Twitter" && (
                    <Twitter size={18} className="mr-2" />
                  )}
                  {isConnectPending
                    ? "Connecting..."
                    : `Connect ${platform} Account`}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {filteredAccounts.map((account) => (
                <div
                  key={account.userId}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border-2 p-3 sm:p-4 gap-3 ${
                    selectedAccountIds.includes(account.userId)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <ProfileCard
                      account={account}
                      size="md"
                    />
                  </div>

                  <div className="flex items-center space-x-2 ml-0 sm:ml-auto">
                    <Button
                      size="sm"
                      onClick={() => onRefresh(account.platform, account.userId)}
                      title="Refresh token"
                      disabled={isRefreshPending}
                      
                    >
                      <RefreshCw
                        size={16}
                        className={isRefreshPending ? "animate-spin" : ""}
                      />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        onDisconnect(account.platform, account.userId)
                      }
                      title="Disconnect account"
                      disabled={isDisconnectPending}
                      
                    >
                      <Trash2 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelect(account.userId)}
                      
                    >
                      {selectedAccountIds.includes(account.userId)
                        ? "Selected"
                        : "Select"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
