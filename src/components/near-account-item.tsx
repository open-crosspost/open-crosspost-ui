import React from "react";
import { ConnectedAccount } from "@crosspost/types";
import { usePlatformAccountsStore } from "../store/platform-accounts-store";
import { AccountItem } from "./shared/account-item";

interface NearAccountItemProps {
  account: ConnectedAccount;
}

export function NearAccountItem({ account }: NearAccountItemProps) {
  const { selectedAccountIds, selectAccount, unselectAccount } =
    usePlatformAccountsStore();
  const isSelected = selectedAccountIds.includes(account.userId);

  const handleSelect = () => {
    if (isSelected) {
      unselectAccount(account.userId);
    } else {
      selectAccount(account.userId);
    }
  };

  return (
    <AccountItem
      account={account}
      isSelected={isSelected}
      onSelect={handleSelect}
    />
  );
}
