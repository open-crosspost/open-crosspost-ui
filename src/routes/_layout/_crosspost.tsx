import { near } from "@/lib/near";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { AuthorizationModal } from "../../components/authorization-modal";
import { ConnectToNearButton } from "../../components/connect-to-near";
import { useAuthorizationStatus } from "../../hooks/use-authorization-status";
import { getClient } from "@/lib/authorization-service";

export const Route = createFileRoute("/_layout/_crosspost")({
  component: CrosspostContainer,
});

function CrosspostContainer() {
  const isAuthorized = useAuthorizationStatus();

  // Maybe this will be a simplification here, idk.

  // Near Auth provider
  // Takes authorization status, and the client
  // on account change, will call the setAccountHeader
  // can provide the token needed for an auth request?
  // provides isSignedIn

  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (near.authStatus() === "SignedIn" && !isAuthorized) {
      setShowAuthModal(true);
    }
  }, [isAuthorized]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading Authorization Status...
      </div>
    );
  }

  return (
    <>
      {isAuthorized ? (
        <Outlet />
      ) : near.authStatus() === "SignedIn" ? (
        <AuthorizationModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {}}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <h2 className="text-xl font-semibold">Welcome to Open Crosspost</h2>
          <p className="text-center max-w-md mb-4">
            Please connect your NEAR wallet to get started.
          </p>
          <ConnectToNearButton />
        </div>
      )}
    </>
  );
}
