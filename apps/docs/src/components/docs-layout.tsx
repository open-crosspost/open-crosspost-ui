import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, Menu, X } from "lucide-react";
import React, { useState } from "react";
import { useTheme } from "../contexts/theme-context";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/getting-started", label: "Getting Started" },
  { path: "/api", label: "API Reference" },
  { path: "/guides", label: "Guides" },
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouterState();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="font-bold text-lg">
              Crosspost UI Docs
            </Link>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-accent"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform md:block`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                  router.location.pathname === item.path
                    ? "bg-accent font-medium"
                    : ""
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

