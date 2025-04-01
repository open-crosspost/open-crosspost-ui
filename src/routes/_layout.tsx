import { Outlet, createFileRoute } from "@tanstack/react-router";
import React from "react";
import { WindowContainer } from "../components/window-container";
import { Footer } from "../components/footer";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <>
      <WindowContainer>
        <Outlet />
      </WindowContainer>
      <Footer />
    </>
  );
}
