import { Outlet, redirect } from "@tanstack/react-router";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "../../store/nearAuthStore";
import React, { useEffect } from "react";

/**
 * Authentication middleware - checks if user is authenticated (wallet connected)
 * Redirects to home page if not authenticated
 */
export function RequireWalletConnection() {
  const { signedAccountId } = useWalletSelector();
  
  // If not authenticated, redirect to home
  if (!signedAccountId) {
    throw redirect({ to: "/" });
  }
  
  return <Outlet />;
}

/**
 * Authorization middleware - checks if user is authorized (signed message)
 * Shows authorization UI if not authorized
 */
export function RequireAuthorization() {
  const { signedAccountId, wallet } = useWalletSelector();
  const { isAuthorized, checkStatus } = useNearAuth();
  
  // Check authorization status when component mounts
  useEffect(() => {
    if (signedAccountId && wallet) {
      checkStatus(wallet);
    }
  }, [signedAccountId, wallet, checkStatus]);
  
  // If not authenticated, redirect to home
  if (!signedAccountId) {
    throw redirect({ to: "/" });
  }
  
  // If not authorized, show authorization UI
  if (!isAuthorized) {
    throw redirect({ to: "/authorize" });
  }
  
  return <Outlet />;
}
