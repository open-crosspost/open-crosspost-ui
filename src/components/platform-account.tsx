import { capitalize } from "@/lib/utils/string";
import { ConnectedAccount, PlatformName } from "@crosspost/types";
import { RefreshCw, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "../hooks/use-toast";
import {
  useCheckAccountStatus,
  useDisconnectAccount,
  usePlatformAccountsStore,
  useRefreshAccount
} from "../store/platform-accounts-store";
import { Button } from "./ui/button";
import { AccountItem } from "./shared/account-item";

interface PlatformAccountProps {
  account: ConnectedAccount;
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
        userId: account.userId,
      });
      await checkAccountStatus.mutateAsync({
        platform: account.platform as PlatformName,
        userId: account.userId,
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
        userId: account.userId,
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
      unselectAccount(account.userId);
    } else {
      selectAccount(account.userId);
    }
  };

  const actionButtons = (
    <>
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
    </>
  );

  return (
    <AccountItem
      account={account}
      isSelected={isSelected}
      onSelect={handleSelect}
      actions={actionButtons}
    />
  );
}
