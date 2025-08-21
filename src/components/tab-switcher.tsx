import React from "react";
import { cn } from "../lib/utils";

interface TabSwitcherProps {
  activeTab: "editor" | "scheduled";
  onTabChange: (tab: "editor" | "scheduled") => void;
  className?: string;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn("flex bg-gray-100 rounded-lg p-1", className)}>
      <button
        onClick={() => onTabChange("editor")}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
          activeTab === "editor"
            ? "bg-white text-gray-900 shadow-sm border border-gray-200"
            : "text-gray-600 hover:text-gray-800"
        )}
      >
        Editor
      </button>
      <button
        onClick={() => onTabChange("scheduled")}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
          activeTab === "scheduled"
            ? "bg-white text-gray-900 shadow-sm border border-gray-200"
            : "text-gray-600 hover:text-gray-800"
        )}
      >
        Scheduled Posts
      </button>
    </div>
  );
};
