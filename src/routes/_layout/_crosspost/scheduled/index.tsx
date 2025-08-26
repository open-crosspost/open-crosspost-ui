import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { ScheduledPostsFeed } from "../../../../components/scheduled-posts-feed";

export const Route = createFileRoute("/_layout/_crosspost/scheduled/")({
  component: ScheduledPostsPage,
});

function ScheduledPostsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <ScheduledPostsFeed />
    </div>
  );
}
