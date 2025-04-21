import { Outlet, createFileRoute } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { AuthorizationModal } from "../../components/authorization-modal";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useAuthorizationStatus } from "../../hooks/use-authorization-status";
import { getClient } from "../../lib/authorization-service";

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
      ) : (
        <AuthorizationModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}
