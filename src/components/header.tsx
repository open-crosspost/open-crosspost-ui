import { Link } from "@tanstack/react-router";
import {
  PenSquare,
  Trophy,
  User,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { ConnectToNearButton } from "./connect-to-near";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";

export const Header: React.FC = () => {
  const { isSignedIn, currentAccountId, handleSignOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative border-b-2 border-gray-800 dark:border-gray-600 bg-white dark:bg-black p-4 sm:p-6">
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
        <Link to="/editor">
          <div className="flex items-center gap-2">
            <PenSquare size={24} />
            <h1 className="text-3xl font-bold">crosspost</h1>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {!isSignedIn && <ConnectToNearButton />}
          {isSignedIn && currentAccountId && (
            <>
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 border-black dark:border-white"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Link to="/leaderboard">
                <Button className="flex items-center gap-2">
                  <Trophy size={16} />
                  Leaderboard
                </Button>
              </Link>

              <div className="relative">
                <Button
                  className="flex items-center gap-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <User size={16} />
                  Profile
                  <ChevronDown size={14} />
                </Button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-black border-2 border-gray-800 dark:border-gray-600 shadow-[4px_4px_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_rgba(255,255,255,0.3)] z-50">
                    <Link
                      to="/profile/$accountId"
                      params={{ accountId: currentAccountId }}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-600">
                        <User size={16} />
                        Profile
                      </div>
                    </Link>
                    <div
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-red-600"
                      onClick={() => {
                        handleSignOut();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <LogOut size={16} />
                      Disconnect
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};
