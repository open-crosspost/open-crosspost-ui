import { ToastAction } from "@/components/ui/toast";
import { ConnectedAccount, PlatformName } from "@crosspost/types";
import { toast } from "../../hooks/use-toast";
import { SubmitStatus, SubmissionSummary } from "./submission-utils";

export function showSubmissionStartToast(
  otherAccounts: ConnectedAccount[],
  nearSocialAccounts: ConnectedAccount[],
  totalAccounts: number,
) {
  const uniquePlatforms = new Set([
    ...otherAccounts.map((a) => a.platform),
    ...(nearSocialAccounts.length > 0 ? ["Near Social" as PlatformName] : []),
  ]);

  toast({
    title: "Crossposting...",
    description: `Publishing to ${uniquePlatforms.size} platform${uniquePlatforms.size > 1 ? "s" : ""} and ${totalAccounts} account${totalAccounts > 1 ? "s" : ""}`,
    variant: "default",
  });
}

export function showSubmissionResultToast(
  status: SubmitStatus,
  summary: SubmissionSummary,
  navigateToResults: () => void,
  showNoCompatibleAccounts?: boolean,
) {
  if (status === "success") {
    toast({
      title: "Success!",
      description: `Your post has been published successfully to all ${summary.total} account${summary.total > 1 ? "s" : ""}.`,
      variant: "success",
    });
  } else if (status === "partial-success") {
    toast({
      title: "Partial Success",
      description: `Posted to ${summary.succeeded} of ${summary.total} accounts.`,
      variant: "default",
      action: (
        <ToastAction altText="See Results" onClick={navigateToResults}>
          See Results
        </ToastAction>
      ),
    });
  } else if (status === "failure") {
    toast({
      title: "Post Failed",
      description: `Failed to publish post to any of the ${summary.total} selected account${summary.total > 1 ? "s" : ""}.`,
      variant: "destructive",
      action: (
        <ToastAction altText="See Details" onClick={navigateToResults}>
          See Details
        </ToastAction>
      ),
    });
  } else if (showNoCompatibleAccounts) {
    toast({
      title: "No Compatible Accounts",
      description: "None of your selected accounts are compatible with this action.",
      variant: "default",
    });
  }
}

