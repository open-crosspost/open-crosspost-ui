import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { AuthorizationModal } from "../../components/authorization-modal";
import { ConnectToNearButton } from "../../components/connect-to-near";
import { ScheduledPostManager } from "../../components/scheduled-post-manager";
import { useAuth } from "@/contexts/auth-context";
import { getClient } from "@/lib/authorization-service";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Calendar, Zap, Shield, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_layout/_crosspost")({
  component: CrosspostContainer,
});

function CrosspostContainer() {
  const { isSignedIn, currentAccountId } = useAuth();
  const navigate = useNavigate();

  type AuthStatus = "idle" | "checking" | "authorized" | "unauthorized";
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (isSignedIn && currentAccountId) {
      setAuthStatus("checking");
      setShowAuthModal(false);
      const client = getClient();
      client.setAccountHeader(currentAccountId);

      client.auth
        .getNearAuthorizationStatus()
        .then((response) => {
          if (response.success && response.data && response.data.isAuthorized) {
            setAuthStatus("authorized");
            navigate({ to: "/editor", replace: true });
          } else {
            setAuthStatus("unauthorized");
            setShowAuthModal(true);
            if (!response.success || !response.data) {
              console.error(
                "NEAR authorization status check failed:",
                response.errors,
              );
              toast({
                title: "Authorization Check Failed",
                description: response.errors?.length
                  ? response.errors[0].message
                  : "Could not verify authorization status.",
                variant: "destructive",
              });
            }
          }
        })
        .catch((error) => {
          setAuthStatus("unauthorized");
          setShowAuthModal(true);
          console.error("Error calling NEAR authorization status API:", error);
          toast({
            title: "Authorization Check Error",
            description:
              "An unexpected error occurred while checking authorization status.",
            variant: "destructive",
          });
        });
    } else {
      setAuthStatus("idle");
      setShowAuthModal(false);
    }
  }, [isSignedIn, currentAccountId, navigate]);

  if (!isSignedIn) {
    return (
      <div className="min-h-[80vh]">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Share Your Content
              <br />
              Everywhere at Once
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Post to Twitter, Farcaster, and more social platforms simultaneously. 
              Save time, reach more people, and manage everything from one place.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <ConnectToNearButton />
              <Button asChild>
                <a
                  href="https://github.com/open-crosspost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                  <ArrowRight size={16} />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Marquee Section */}
        <div className="border-y-2 border-primary bg-white dark:bg-black py-4 overflow-hidden">
          <div className="flex items-center animate-marquee whitespace-nowrap">
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
              </svg>
              MULTI-PLATFORM POSTING
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
              SCHEDULE POSTS
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <Zap size={20} className="text-yellow-600 dark:text-yellow-400" />
              LIGHTNING FAST
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <Shield size={20} className="text-green-600 dark:text-green-400" />
              SECURE & PRIVATE
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-400">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
              </svg>
              MULTI-PLATFORM POSTING
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
              SCHEDULE POSTS
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <Zap size={20} className="text-yellow-600 dark:text-yellow-400" />
              LIGHTNING FAST
            </span>
            <span className="mx-8 text-lg font-bold inline-flex items-center gap-2">
              <Shield size={20} className="text-green-600 dark:text-green-400" />
              SECURE & PRIVATE
            </span>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="px-4 py-12 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Supported Platforms</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-base font-medium">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  fill="currentColor"
                />
              </svg>
              <span>Twitter</span>
            </div>
            <div className="flex items-center gap-2 text-base font-medium">
              <img
                src="/platforms/farcaster.svg"
                alt="Farcaster"
                className="w-5 h-5"
              />
              <span>Farcaster</span>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              + More coming soon
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === "checking") {
    return <LoadingSpinner />;
  }

  if (authStatus === "authorized") {
    return (
      <>
        <ScheduledPostManager />
        <Outlet />
      </>
    );
  }

  if (authStatus === "unauthorized") {
    if (showAuthModal) {
      return (
        <AuthorizationModal
          isOpen={true}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setAuthStatus("authorized");
            navigate({ to: "/editor", replace: true });
          }}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center gap-4 h-[60vh]">
          <p className="text-lg">
            Authorization is required to use this application.
          </p>
          <Button onClick={() => setShowAuthModal(true)} size="lg">
            Authorize App
          </Button>
        </div>
      );
    }
  }

  return null;
}
