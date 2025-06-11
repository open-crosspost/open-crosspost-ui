import { Wallet } from "lucide-react";
import React, { type ReactElement } from "react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/auth-context";

export function ConnectToNearButton(): ReactElement {
  const { currentAccountId, isUserSignedIn, handleSignIn, handleSignOut } =
    useAuth();

  return (
    <Button
      onClick={isUserSignedIn ? handleSignOut : handleSignIn}
      className="text-sm sm:text-base"
    >
      <Wallet size={18} className="mr-2" />
      {isUserSignedIn && currentAccountId
        ? window.innerWidth < 640
          ? "Disconnect"
          : `Disconnect @${currentAccountId}`
        : "Connect NEAR"}
    </Button>
  );
}
