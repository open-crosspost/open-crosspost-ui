import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import bosConfig from "bos.config.json";
import React from "react";
import { getAccountId } from "web4-api-js";
import "./index.css";
import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    auth: { userId: "guest" },
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const accountId =
  window !== undefined
    ? window.location.hostname.includes("near.page")
      ? window.location.hostname.split(".")[0] + ".near"
      : bosConfig.account
    : bosConfig.account; // Fallback for local development

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={router}
        context={{
          auth: { userId: getAccountId() || "guest" },
        }}
      />
    </QueryClientProvider>
  );
}
