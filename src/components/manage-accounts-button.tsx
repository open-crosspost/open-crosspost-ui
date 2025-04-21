import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";
import { Button } from "./ui/button";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { toast } from "@/hooks/use-toast";

export function ManageAccountsButton(): React.ReactElement {
  const navigate = useNavigate();
  const { signedAccountId } = useWalletSelector();

  const handleClick = useCallback(() => {
    if (!signedAccountId) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your NEAR wallet first.",
        variant: "destructive",
      });
      return;
    }
    navigate({ to: "/manage" });
  }, [navigate, signedAccountId]);

  return (
    <Button onClick={handleClick} className="text-sm sm:text-base">
      <Users size={18} className="mr-2" />
      <span className="sm:inline">Manage Accounts</span>
    </Button>
  );
}
