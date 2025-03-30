import { redirect } from "@tanstack/react-router";
import { useNearAuth } from "../../store/nearAuthStore";
import { useWalletSelector } from "@near-wallet-selector/react-hook";

/**
 * Route guard to check if user is authorized
 * This function can be used in route loaders to protect routes
 * that require authorization
 * 
 * It prioritizes persisted authorization state and only redirects
 * if the user is definitely not authorized
 */
export function requireAuthorization() {
  const { isAuthorized, accountId } = useNearAuth.getState();
  
  // If we have persisted authorization state, allow access
  if (isAuthorized && accountId) {
    return true;
  }
  
  // If we don't have persisted state, redirect to home
  throw redirect({
    to: "/",
    search: {
      // Add a query parameter to indicate authorization is required
      // This can be used to show the authorization dialog
      authRequired: "true",
    },
  });
}
