import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useSearch,
} from "@tanstack/react-router";
import React from "react";
import { z } from "zod";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

export const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

export const ReactQueryDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/react-query-devtools").then((d) => ({
          default: d.ReactQueryDevtools,
        })),
      );

export interface AuthContext {
  userId: string;
}

const rootSearchSchema = z.object({
  pretend: z.string().optional(), // optionally pretend to be another user
});

export const Route = createRootRouteWithContext<{
  auth: AuthContext;
  queryClient: QueryClient;
}>()({
  validateSearch: (search) => rootSearchSchema.parse(search),
  component: RootComponent,
  notFoundComponent: () => <>Not found</>,
});

function RootComponent() {
  const { pretend } = useSearch({ from: Route.id });

  return (
    <AuthProvider pretendAccountId={pretend}>
      <Outlet />
      <Toaster />
      <React.Suspense>
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </React.Suspense>
    </AuthProvider>
  );
}
