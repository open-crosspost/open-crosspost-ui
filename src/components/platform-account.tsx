import { RefreshCw, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { ProfileCard } from "./profile-card";
import { Button } from "./ui/button";
import { toast } from "../hooks/use-toast";
import {
  useDisconnectAccount,
  useRefreshAccount,
  useCheckAccountStatus,
  usePlatformAccountsStore,
  PlatformAccount,
} from "../store/platform-accounts-store";
import { PlatformName } from "@crosspost/types";
import { capitalize } from "@/lib/utils/string";

interface PlatformAccountProps {
  account: PlatformAccount;
  isSelected: boolean;
}

export function PlatformAccountItem({
  account,
  isSelected,
}: PlatformAccountProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const disconnectAccount = useDisconnectAccount();
  const refreshAccount = useRefreshAccount();
  const checkAccountStatus = useCheckAccountStatus();
  const { selectAccount, unselectAccount } = usePlatformAccountsStore();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccount.mutateAsync({
        platform: account.platform as PlatformName,
        userId: account.profile.userId,
      });
      await checkAccountStatus.mutateAsync({
        platform: account.platform as PlatformName,
        userId: account.profile.userId,
      });
    } catch (error) {
      toast({
        title: "Refresh Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to refresh ${capitalize(account.platform)} account`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectAccount.mutateAsync({
        platform: account.platform as PlatformName,
        userId: account.profile.userId,
      });
    } catch (error) {
      toast({
        title: "Disconnection Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to disconnect ${capitalize(account.platform)} account`,
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSelect = () => {
    if (isSelected) {
      unselectAccount(account.profile.userId);
    } else {
      selectAccount(account.profile.userId);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border-2 p-3 sm:p-4 gap-3 ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-center space-x-4">
        <ProfileCard account={account} size="md" />
      </div>

      <div className="flex items-center space-x-2 ml-0 sm:ml-auto">
        <Button
          size="sm"
          onClick={handleRefresh}
          title="Refresh token"
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </Button>
        <Button
          size="sm"
          onClick={handleDisconnect}
          title="Disconnect account"
          disabled={isDisconnecting}
        >
          <Trash2 size={16} className={isDisconnecting ? "animate-spin" : ""} />
        </Button>
        <Button size="sm" onClick={handleSelect}>
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </div>
  );
}
