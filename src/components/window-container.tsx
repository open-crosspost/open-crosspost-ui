import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PenSquare, Trophy, User, LogOut, ChevronDown } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { ConnectToNearButton } from "./connect-to-near";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/auth-context";

export const WindowControls: React.FC = () => {
  const { isSignedIn, currentAccountId, handleSignOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative border-b-2 border-gray-800 p-4 sm:p-6">
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
        <Link to="/editor">
          <div className="flex items-center gap-2">
            <PenSquare size={24} />
            <h1 className="text-3xl font-bold">crosspost</h1>
          </div>
        </Link>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {!isSignedIn && <ConnectToNearButton />}
          {isSignedIn && currentAccountId && (
            <>
              <Link to="/leaderboard">
                <Button className="flex items-center gap-2">
                  <Trophy size={16} />
                  Leaderboard
                </Button>
              </Link>
              
              {/* Profile Dropdown - visible dropdown */}
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-gray-800 shadow-[4px_4px_0_rgba(0,0,0,1)] z-50">
                    <Link 
                      to="/profile/$accountId" 
                      params={{ accountId: currentAccountId }}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
                        <User size={16} />
                        Profile
                      </div>
                    </Link>
                    <div 
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer text-red-600"
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
      
      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

interface WindowContainerProps {
  children: React.ReactNode;
}

export function WindowContainer({ children }: WindowContainerProps) {
  return (
    <div className="min-h-screen p-2 relative">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto min-h-[calc(100vh-1rem)] w-full border-2 border-gray-800 bg-white shadow-[4px_4px_0_rgba(0,0,0,1)]"
      >
        <WindowControls />
        <div className="p-2 sm:p-4 md:p-8">{children}</div>
      </motion.div>
    </div>
  );
}
