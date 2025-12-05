import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import React from "react";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { WalletProvider } from "./integrations/near-wallet";
import { BetterNearAuthProvider } from "./integrations/better-near-auth";
import { NETWORK_ID } from "./config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
    auth: { userId: "guest" }, // Default to guest, will be updated when user connects
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
// Main App component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider network={NETWORK_ID as 'mainnet' | 'testnet'} enableSignMessage={true}>
        <BetterNearAuthProvider>
          <RouterProvider router={router} />
        </BetterNearAuthProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
