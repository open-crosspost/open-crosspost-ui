import { Platform } from "@crosspost/types";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React from "react";
import { PlatformAccountItem } from "../../../../components/platform-account";
import { PlatformAccountList } from "../../../../components/platform-account-list";
import { BackButton } from "../../../../components/back-button";
import { Button } from "../../../../components/ui/button";
import {
  useConnectedAccounts,
  useNearSocialAccount,
  usePlatformAccountsStore,
} from "../../../../store/platform-accounts-store";
import { RefreshCw } from "lucide-react";

const SUPPORTED_PLATFORMS = [Platform.TWITTER];

export const Route = createFileRoute("/_layout/_crosspost/manage/")({
  component: ManageAccountsPage,
});

function ManageAccountsPage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useConnectedAccounts();
  const { data: profile, isLoading: isLoadingProfile } = useNearSocialAccount();
  const selectedAccountIds = usePlatformAccountsStore(
    (state) => state.selectedAccountIds,
  );

  const handleContinue = () => {
    navigate({ to: "/editor" });
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        <div className="border-b pb-4 mb-6">
          <div className="flex items-center mb-4">
            <BackButton />
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

            {isLoadingProfile ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={16} className={"animate-spin"} />
              </div>
            ) : profile ? (
              <div className="space-y-4 w-full">
                <PlatformAccountItem account={profile} showActions={false} />
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
              isLoading={isLoading}
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
    </>
  );
}
