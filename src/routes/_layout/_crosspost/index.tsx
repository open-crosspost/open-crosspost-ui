import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import React from "react";
import { ManageAccountsButton } from "../../../components/manage-accounts-button";
import { useAuth } from "../../../contexts/auth-context";
import { Button } from "../../../components/ui/button";
import { Edit, User, Settings } from "lucide-react";

export const Route = createFileRoute("/_layout/_crosspost/")({
  component: HomePage,
});

function HomePage() {
  const { currentAccountId, isSignedIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {isSignedIn && (
          <div className="flex items-center justify-center mb-4">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <p className="text-sm text-green-600 font-medium">
              Connected as @{currentAccountId}
            </p>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Open Crosspost</h1>
        <p className="text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
          Connect your social media accounts and start crossposting your
          content.
        </p>

        <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
          <ManageAccountsButton />
        </div>

        {/* Navigation Buttons - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
          <Link to="/editor" className="block">
            <Button className="w-full h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 base-component text-sm sm:text-base">
              <Edit size={20} className="sm:w-6 sm:h-6" />
              <span className="font-medium">Create Post</span>
              <span className="text-xs text-gray-600 hidden sm:block">
                Write and schedule posts
              </span>
            </Button>
          </Link>

          <Link to={`/profile/${currentAccountId}`} className="block">
            <Button className="w-full h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 base-component text-sm sm:text-base">
              <User size={20} className="sm:w-6 sm:h-6" />
              <span className="font-medium">My Profile</span>
              <span className="text-xs text-gray-600 hidden sm:block">
                View your posts and activity
              </span>
            </Button>
          </Link>

          <Link to="/manage" className="block sm:col-span-2 lg:col-span-1">
            <Button className="w-full h-14 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 base-component text-sm sm:text-base">
              <Settings size={20} className="sm:w-6 sm:h-6" />
              <span className="font-medium">Manage Accounts</span>
              <span className="text-xs text-gray-600 hidden sm:block">
                Connect social media accounts
              </span>
            </Button>
          </Link>
        </div>

        {/* Quick Access - Mobile Optimized */}
        {isSignedIn && (
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg w-full max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Quick Access
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/editor">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  New Post
                </Button>
              </Link>
              <Link to={`/profile/${currentAccountId}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  View Profile
                </Button>
              </Link>
              <Link to="/manage">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  Manage Accounts
                </Button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
