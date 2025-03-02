import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import bosConfig from "bos.config.json";
import React from "react";
import { getAccountId } from "web4-api-js";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { ThingComponent } from "./components/Thing";
import { Thing } from "./types/Thing";

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

// App component can be used as a Thing component with path parameter
export default function App({ path, data }: { path?: string; data?: Thing }) {
  // If path or data is provided, render the Thing component directly
  if (path || data) {
    return <ThingComponent path={path} data={data} />;
  }

  // Otherwise, render the router for the full application
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
