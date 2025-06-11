import { Wallet } from "lucide-react";
import React, { type ReactElement } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/auth-context";

export function ConnectToNearButton(): ReactElement {
  const { currentAccountId, isSignedIn, handleSignIn, handleSignOut } =
    useAuth();

  return (
    <Button
      onClick={isSignedIn ? handleSignOut : handleSignIn}
      className="text-sm sm:text-base"
    >
      <Wallet size={18} className="mr-2" />
      {isSignedIn && currentAccountId
        ? window.innerWidth < 640
          ? "Disconnect"
          : `Disconnect @${currentAccountId}`
        : "Connect NEAR"}
    </Button>
  );
}
