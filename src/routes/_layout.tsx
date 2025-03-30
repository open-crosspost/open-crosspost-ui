import { Outlet, createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useRef } from "react";
import { WindowContainer } from "../components/window-container";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "../store/nearAuthStore";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  const { signedAccountId, wallet } = useWalletSelector();
  const { isAuthorized, checkStatus, isChecking } = useNearAuth();
  const hasCheckedRef = useRef(false);

  // Check authorization status when component mounts
  useEffect(() => {
    // Always check status if we have a wallet and account ID
    // This will prioritize persisted state and only call the API if needed
    if (signedAccountId && wallet && !hasCheckedRef.current && !isChecking) {
      console.log("Initial authorization check for", signedAccountId);
      checkStatus(wallet);
      hasCheckedRef.current = true;
    }
  }, [signedAccountId, wallet, checkStatus, isChecking]);

  return (
    <WindowContainer>
      <Outlet />
    </WindowContainer>
  );
}
