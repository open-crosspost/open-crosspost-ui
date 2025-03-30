import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { Wallet } from "lucide-react";
import * as React from "react";
import { useNearAuth } from "@/store/nearAuthStore";
import { clearNearAuth } from "@/lib/auth/near-auth";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";

export function ConnectToNearButton(): React.ReactElement {
  const { signedAccountId, signIn, signOut } = useWalletSelector();
  const { reset: resetAuthState, isAuthorized } = useNearAuth();

  const handleSignIn = async (): Promise<void> => {
    signIn();
  };

  const handleSignOut = (): void => {
    // Clear auth state when signing out
    resetAuthState();
    clearNearAuth();
    
    // Sign out from wallet
    signOut();
    
    // Show toast notification
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  return (
    <Button onClick={signedAccountId ? handleSignOut : handleSignIn}>
      <Wallet size={18} className="mr-2" />
      {signedAccountId ? `Disconnect @${signedAccountId}` : "Connect NEAR"}
    </Button>
  );
}
