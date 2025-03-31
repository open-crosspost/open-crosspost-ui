import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import React, { useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { PlatformAccountList } from "../../../components/platform-account-list";
import { ProfileCard } from "../../../components/profile-card";
import { SUPPORTED_PLATFORMS } from "../../../config";
import { toast } from "../../../hooks/use-toast";
import { requireAuthorization } from "../../../lib/auth/route-guards";
import {
  useCheckAccountStatus,
  useConnectAccount,
  useConnectedAccounts,
  useDisconnectAccount,
  useNearAccount,
  usePlatformAccountsStore,
  useRefreshAccount,
} from "../../../store/platform-accounts-store";

export const Route = createFileRoute("/_layout/manage/")({
  beforeLoad: () => {
    // Check if user is authorized before loading the route
    requireAuthorization();
  },
  component: ManageAccountsPage,
});

function ManageAccountsPage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading, refetch } = useConnectedAccounts();
  const { data: nearAccount, isLoading: isLoadingNearAccount } = useNearAccount();
  const connectAccount = useConnectAccount();
  const disconnectAccount = useDisconnectAccount();
  const refreshAccount = useRefreshAccount();
  const checkAccountStatus = useCheckAccountStatus();
  const { selectedAccountIds, selectAccount, unselectAccount } =
    usePlatformAccountsStore();

  // Handle OAuth callback parameters if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const userId = params.get("userId");

    if (success === "true" && userId) {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Refresh the accounts list
      refetch();
    } else if (success === "false") {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Show error message
      toast({
        title: "Connection Failed",
        description: "Failed to connect account. Please try again.",
        variant: "destructive",
      });
    }
  }, [refetch]);

  // Handle connect account
  const handleConnectAccount = async (platform: string) => {
    try {
      // Use the current URL as the return URL
      const returnUrl = `${window.location.origin}/manage`;
      await connectAccount.mutateAsync({
        platform: platform as any,
        returnUrl,
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to connect ${platform} account`,
        variant: "destructive",
      });
    }
  };

  // Handle disconnect account
  const handleDisconnectAccount = async (platform: string, userId: string) => {
    try {
      await disconnectAccount.mutateAsync({
        platform: platform as any,
        userId,
      });
    } catch (error) {
      toast({
        title: "Disconnection Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to disconnect ${platform} account`,
        variant: "destructive",
      });
    }
  };

  // Handle refresh account
  const handleRefreshAccount = async (platform: string, userId: string) => {
    try {
      await refreshAccount.mutateAsync({
        platform: platform as any,
        userId,
      });
      await checkAccountStatus.mutateAsync({
        platform: platform as any,
        userId,
      });
    } catch (error) {
      toast({
        title: "Refresh Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to refresh ${platform} account`,
        variant: "destructive",
      });
    }
  };

  // Handle account selection
  const handleAccountSelection = (userId: string) => {
    if (selectedAccountIds.includes(userId)) {
      unselectAccount(userId);
    } else {
      selectAccount(userId);
    }
  };

  // Handle continue to editor
  const handleContinue = () => {
    navigate({ to: "/editor" });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-6">
        <div className="flex items-center mb-4">
          <Button
            size="sm"
            className="mr-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Manage Social Accounts</h1>
        <p className="text-gray-500">
          Connect and manage your social media accounts for crossposting
        </p>
      </div>

      <div className="space-y-6">
        {/* NEAR Account Section */}
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-semibold">Near Social Account</h2>
          </div>
          
          {isLoadingNearAccount ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin text-gray-400">⟳</div>
            </div>
          ) : nearAccount ? (
            <div className="space-y-4 w-full">
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border-2 p-3 sm:p-4 gap-3 ${
                  selectedAccountIds.includes(nearAccount.userId)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <ProfileCard account={nearAccount} size="md" />
                </div>

                <div className="flex items-center space-x-2 ml-0 sm:ml-auto">
                  <Button
                    size="sm"
                    onClick={() => handleAccountSelection(nearAccount.userId)}
                  >
                    {selectedAccountIds.includes(nearAccount.userId)
                      ? "Selected"
                      : "Select"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border-2 border-dashed border-gray-200 p-4 sm:p-8 text-center">
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No NEAR account connected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please sign in with your NEAR wallet to use NEAR Social
              </p>
            </div>
          )}
        </div>

        {/* Other Platform Accounts */}
        {SUPPORTED_PLATFORMS.map((platform) => (
          <PlatformAccountList
            key={platform}
            platform={platform}
            accounts={accounts}
            selectedAccountIds={selectedAccountIds}
            isLoading={isLoading}
            onConnect={handleConnectAccount}
            onDisconnect={handleDisconnectAccount}
            onRefresh={handleRefreshAccount}
            onSelect={handleAccountSelection}
            isConnectPending={connectAccount.isPending}
            isDisconnectPending={disconnectAccount.isPending}
            isRefreshPending={refreshAccount.isPending}
          />
        ))}

        <div className="flex justify-center sm:justify-end pt-4 border-t">
          <Button
            onClick={handleContinue}
            disabled={selectedAccountIds.length === 0}
            className="gap-2 w-full sm:w-auto"
          >
            Continue to Editor
          </Button>
        </div>
      </div>
    </div>
  );
}
