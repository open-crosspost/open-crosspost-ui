import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PenSquare } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ConnectToNearButton } from "../../components/connect-to-near";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "../../store/nearAuthStore";
import { ManageAccountsButton } from "../../components/manage-accounts-button";
import { AppAuthorization } from "../../components/app-authorization";

export const Route = createFileRoute("/_layout/")({
  component: HomePage,
});

function HomePage() {
  const { signedAccountId } = useWalletSelector();
  const { isAuthorized, isChecking } = useNearAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  // Check URL search params for authRequired
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  
  // Check URL for authRequired param on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('authRequired') === 'true') {
      setAuthRequired(true);
      
      // Remove the query parameter from the URL
      searchParams.delete('authRequired');
      const newUrl = window.location.pathname + 
        (searchParams.toString() ? `?${searchParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Show authorization dialog if user is connected but not authorized
  useEffect(() => {
    // Show dialog if redirected from a protected route
    if (authRequired && signedAccountId) {
      setShowAuthDialog(true);
      return;
    }
    
    // Only show the dialog if we're sure the user is not authorized
    if (signedAccountId && !isAuthorized && !isChecking) {
      // Small delay to avoid flashing the dialog during initial load
      const timer = setTimeout(() => {
        setShowAuthDialog(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [signedAccountId, isAuthorized, isChecking, authRequired]);

  // If not authenticated, show connect wallet UI
  if (!signedAccountId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PenSquare size={64} className="mb-6 text-gray-400" />
          <h1 className="text-3xl font-bold mb-4">Welcome to Crosspost</h1>
          <p className="text-gray-500 mb-8 max-w-md">
            Connect your NEAR wallet to get started with crossposting to
            multiple platforms.
          </p>
          <ConnectToNearButton />
        </motion.div>
      </div>
    );
  }

  // If authenticated but not authorized, show authorization dialog
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <p className="text-sm text-green-600 font-medium">
              Connected as @{signedAccountId}
            </p>
          </div>

          <h1 className="text-3xl font-bold mb-4">Authorize Crosspost</h1>
          <p className="text-gray-500 mb-8 max-w-md">
            Authorize this app to post on your behalf to connected social
            platforms.
          </p>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setShowAuthDialog(true)}
          >
            Authorize App
          </button>

          <AppAuthorization
            isOpen={showAuthDialog}
            onClose={() => setShowAuthDialog(false)}
          />
        </motion.div>
      </div>
    );
  }

  // If authenticated and authorized, show connect accounts or editor UI
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-4">
          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
          <p className="text-sm text-green-600 font-medium">
            Connected as @{signedAccountId}
          </p>
        </div>

        <h1 className="text-3xl font-bold mb-4">Connect Your Accounts</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Connect your social media accounts to start crossposting.
        </p>

        <div className="flex flex-col space-y-4">
          <ManageAccountsButton />
        </div>
      </motion.div>
    </div>
  );
}
