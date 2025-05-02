import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { Button } from "../../../../components/ui/button";

export const Route = createFileRoute("/_layout/_crosspost/profile/")({
  component: ProfileIndexPage,
});

export function ProfileIndexPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Profiles</h1>
      <p className="mb-6">
        View a profile by navigating to <code>/profile/accountId</code>
      </p>
      <div className="flex justify-center">
        <Button
          onClick={() => {
            // Navigate back to the main page
            window.history.back();
          }}
          className="mr-2"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
