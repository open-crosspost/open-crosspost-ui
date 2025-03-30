import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { AppAuthorization } from "../../../components/app-authorization";

export const Route = createFileRoute("/_layout/authorize/")({
  component: AuthorizePage,
});

function AuthorizePage() {
  const { signedAccountId } = useWalletSelector();
  const [showAuthDialog, setShowAuthDialog] = useState(true);

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

        <h1 className="text-3xl font-bold mb-4">Authorize App</h1>
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
