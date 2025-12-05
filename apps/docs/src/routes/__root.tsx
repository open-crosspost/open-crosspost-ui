import { Outlet, createRootRoute } from "@tanstack/react-router";
import { DocsLayout } from "../components/docs-layout";

export const Route = createRootRoute({
  component: () => (
    <DocsLayout>
      <Outlet />
    </DocsLayout>
  ),
});

