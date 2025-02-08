import { createFileRoute } from "@tanstack/react-router";
import { Profile } from "../../../components/Profile";
import { getProfile } from "../../../lib/social";

export const Route = createFileRoute("/_layout/profile/$accountId")({
  loader: async ({ params }) => {
    try {
      return await getProfile(params.accountId);
    } catch (error) {
      // Return null to indicate profile fetch failed
      return null;
    }
  },
  component: Profile,
});
