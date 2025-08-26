import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { AuthorizationModal } from "../../components/authorization-modal";
import { ConnectToNearButton } from "../../components/connect-to-near";
import { useAuth } from "@/contexts/auth-context";
import { getClient } from "@/lib/authorization-service";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/loading-spinner";

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
  }, [isSignedIn, currentAccountId]);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
        <h2 className="text-xl font-semibold text-center">
          Welcome to Open Crosspost
        </h2>
        <p className="text-center max-w-md mb-4 text-sm sm:text-base">
          Please connect your NEAR wallet to get started.
        </p>
        <ConnectToNearButton />
      </div>
    );
  }

  if (authStatus === "checking") {
    return <LoadingSpinner />;
  }

  if (authStatus === "authorized") {
    return (
      <div className="min-h-screen">
        {/* Main Content */}
        <main className="px-3 sm:px-4">
          <Outlet />
        </main>
      </div>
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
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
          <p className="text-lg text-center">
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
