import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/integrations/near-wallet";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";
import { Button } from "./ui/button";

export function ManageAccountsButton(): React.ReactElement {
  const navigate = useNavigate();
  const { accountId } = useWallet();

  const handleClick = useCallback(() => {
    if (!accountId) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your NEAR wallet first.",
        variant: "destructive",
      });
      return;
    }
    navigate({ to: "/manage" });
  }, [navigate, accountId]);

  return (
    <Button onClick={handleClick} className="text-sm sm:text-base">
      <Users size={18} className="mr-2" />
      <span className="sm:inline">Manage Accounts</span>
    </Button>
  );
}
