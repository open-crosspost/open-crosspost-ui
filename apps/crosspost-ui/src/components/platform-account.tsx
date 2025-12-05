import { capitalize } from "@/lib/utils/string";
import { ConnectedAccount, PlatformName } from "@crosspost/types";
import { ClipboardCopy, RefreshCw, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "../hooks/use-toast";
import {
  useCheckAccountStatus,
  useDisconnectAccount,
  usePlatformAccountsStore,
  useRefreshAccount,
} from "../store/platform-accounts-store";
import { Button } from "./ui/button";
import { AccountItem } from "./account-item";

interface PlatformAccountProps {
  account: ConnectedAccount;
  showActions?: boolean;
  showSelect?: boolean;
}

export function PlatformAccountItem({
  account,
  showActions = true,
  showSelect = true,
}: PlatformAccountProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const disconnectAccount = useDisconnectAccount();
  const refreshAccount = useRefreshAccount();
  const checkAccountStatus = useCheckAccountStatus();
  const { toggleAccountSelection, isAccountSelected } =
    usePlatformAccountsStore();

  const isNearSocial =
    account.platform?.toLowerCase() === ("near social" as PlatformName);
  const isSelected = isAccountSelected(account.userId);

  const handleRefresh = async () => {
    if (isNearSocial) return; // No refresh for NEAR accounts

    setIsRefreshing(true);
    try {
      await refreshAccount.mutateAsync({
        platform: account.platform as PlatformName,
        userId: account.userId,
      });
      // await checkAccountStatus.mutateAsync({
      //   platform: account.platform as PlatformName,
      //   userId: account.userId,
      // });
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
    if (isNearSocial) return; // No disconnect for NEAR accounts

    setIsDisconnecting(true);
    try {
      await disconnectAccount.mutateAsync({
        platform: account.platform as PlatformName,
        userId: account.userId,
      });
      toast({
        title: "Account Disconnected",
        description: `Successfully disconnected ${capitalize(account.platform)} account`,
        variant: "default",
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : `Failed to disconnect ${capitalize(account.platform)} account`;
      
      // Provide more helpful error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes("cancelled") || errorMessage.includes("rejected") || errorMessage.includes("cancelled by user")) {
        displayMessage = "Authentication was cancelled. Please try again and approve the request in your wallet.";
      } else if (errorMessage.includes("not connected") || errorMessage.includes("not initialized") || errorMessage.includes("Wallet not connected")) {
        displayMessage = "Wallet is not connected. Please connect your wallet first and try again.";
      } else if (errorMessage.includes("authentication failed")) {
        displayMessage = "Authentication failed. Please ensure your wallet is connected and unlocked, then try again.";
      } else if (errorMessage.includes("Invalid")) {
        displayMessage = "Authentication failed due to invalid token. Please try again.";
      }
      
      toast({
        title: "Disconnection Error",
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyUserId = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(account.userId);
      toast({
        title: "Copied to Clipboard",
        description: `User ID copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Error",
        description: "Failed to copy user ID to clipboard",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  // Only show action buttons for non-NEAR accounts and if showActions is true
  const actionButtons =
    !isNearSocial && showActions ? (
      <>
        <Button
          size="sm"
          onClick={handleCopyUserId}
          title="Copy user ID"
          disabled={isCopying}
        >
          <ClipboardCopy
            size={16}
            className={isCopying ? "animate-spin" : ""}
          />
        </Button>
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
    ) : null;

  return (
    <AccountItem
      account={account}
      isSelected={isSelected}
      onSelect={() => toggleAccountSelection(account.userId)}
      actions={actionButtons}
    />
  );
}
