import { toast } from "@/hooks/use-toast";
import { near } from "@/lib/near";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";
import { Button } from "./ui/button";

export function ManageAccountsButton(): React.ReactElement {
  const navigate = useNavigate();
  const signedAccountId = near.accountId();

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
