import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/_layout/")({
  component: Home,
});

function Home() {
  return (
    <>
      <div>Home Route</div>
      <Link to="/profile">profile</Link>
    </>
  );
}
