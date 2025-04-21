import { Outlet, createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { AuthorizationModal } from "../../components/authorization-modal";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useAuthorizationStatus } from "../../hooks/use-authorization-status";
import { getClient } from "../../lib/authorization-service";
import { ConnectToNearButton } from "../../components/connect-to-near";

export const Route = createFileRoute("/_layout/_crosspost")({
  beforeLoad: ({ location }) => {},
  component: CrosspostContainer,
});

function CrosspostContainer() {
  const isAuthorized = useAuthorizationStatus();
  const { walletSelector } = useWalletSelector();

  useEffect(() => {
    if (!walletSelector) return;

    const client = getClient();
    client.clear();

    walletSelector.then((selector) => {
      if (!selector) return;

      const updateClientState = (state: {
        accounts: Array<{ accountId: string; active?: boolean }>;
      }) => {
        const accountId = state.accounts.find((acc) => acc.active)?.accountId;
        accountId ? client.setNearAccount(accountId) : client.clear();
      };

      updateClientState(selector.store.getState());
      const subscription =
        selector.store.observable.subscribe(updateClientState);

      return () => subscription.unsubscribe();
    });
  }, [walletSelector]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const { signedAccountId } = useWalletSelector();

  useEffect(() => {
    if (signedAccountId && !isAuthorized) {
      setShowAuthModal(true);
    }
  }, [signedAccountId, isAuthorized]);

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
      ) : signedAccountId ? (
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
