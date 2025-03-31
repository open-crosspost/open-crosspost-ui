import { Outlet, redirect } from "@tanstack/react-router";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "@/store/near-auth-store";
import React from "react";
import { AuthModal } from "@/components/auth-modal";

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
 * Shows authorization modal if not authorized
 */
export function RequireAuthorization() {
  const { isAuthorized } = useNearAuth();
  
  // If not authorized, show authorization modal
  if (!isAuthorized) {
    return (
      <>
        <AuthModal 
          isOpen={true} 
          onClose={() => {
            // Redirect to home if they cancel
            throw redirect({ to: "/" });
          }}
          onSuccess={() => {
            // Refresh the page to continue
            window.location.reload();
          }}
          message="Authorization is required to access this page."
        />
      </>
    );
  }
  
  return <Outlet />;
}
