import "@near-wallet-selector/modal-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { NearWalletProvider } from "./components/providers/NearWalletProvider";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import "./index.css";
import { routeTree } from "./routeTree.gen";

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Create the router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
    auth: { userId: "guest" }, // Default to guest, will be updated when user connects
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Auth context provider component
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { signedAccountId } = useWalletSelector();

  // Update router context when auth state changes
  useEffect(() => {
    if (signedAccountId) {
      router.update({
        context: {
          queryClient,
          auth: { userId: signedAccountId },
        },
      });
    } else {
      router.update({
        context: {
          queryClient,
          auth: { userId: "guest" },
        },
      });
    }
  }, [signedAccountId]);

  return <>{children}</>;
}

// Main App component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NearWalletProvider>
        <AuthContextProvider>
          <RouterProvider router={router} />
        </AuthContextProvider>
      </NearWalletProvider>
    </QueryClientProvider>
  );
}
