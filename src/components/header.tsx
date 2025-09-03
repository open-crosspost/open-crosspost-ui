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
import { ConnectToNearButton } from "./connect-to-near";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";

export const Header: React.FC = () => {
  const { isSignedIn, currentAccountId, handleSignOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="relative border-b-2 border-primary  bg-white dark:bg-black p-4 sm:p-6">
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
                size="sm"
                className="flex items-center gap-2"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Link to="/leaderboard">
                <Button className="flex items-center gap-2">
                  <Trophy size={16} />
                  Leaderboard
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <User size={16} />
                    {currentAccountId}
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile/$accountId"
                      params={{ accountId: currentAccountId }}
                      className="flex items-center gap-2"
                    >
                      <User size={16} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <LogOut size={16} />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
