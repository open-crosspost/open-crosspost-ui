import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import React from "react";
import { ManageAccountsButton } from "../../../components/manage-accounts-button";
import { useAuth } from "../../../contexts/auth-context";

export const Route = createFileRoute("/_layout/_crosspost/")({
  component: HomePage,
});

function HomePage() {
  const { currentAccountId, isUserSignedIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isUserSignedIn && (
          <div className="flex items-center justify-center mb-4">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <p className="text-sm text-green-600 font-medium">
              Connected as @{currentAccountId}
            </p>
          </div>
        )}

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
