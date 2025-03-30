import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "../../../store/nearAuthStore";
import { 
  useConnectedAccounts, 
  useConnectAccount, 
  useDisconnectAccount, 
  useRefreshAccount, 
  useCheckAccountStatus,
  usePlatformAccountsStore
} from "../../../store/platformAccountsStore";
import { Button } from "../../../components/ui/button";
import { Twitter, Trash2, RefreshCw, AlertCircle, PlusCircle, ArrowLeft } from "lucide-react";
import { SUPPORTED_PLATFORMS } from "../../../config";
import { toast } from "../../../hooks/use-toast";
import { requireAuthorization } from "../../../lib/auth/route-guards";

export const Route = createFileRoute("/_layout/manage/")({
  beforeLoad: () => {
    // Check if user is authorized before loading the route
    requireAuthorization();
  },
  component: ManageAccountsPage,
});

function ManageAccountsPage() {
  const navigate = useNavigate();
  const { signedAccountId } = useWalletSelector();
  const { isAuthorized } = useNearAuth();
  const { data: accounts = [], isLoading, refetch } = useConnectedAccounts();
  const connectAccount = useConnectAccount();
  const disconnectAccount = useDisconnectAccount();
  const refreshAccount = useRefreshAccount();
  const checkAccountStatus = useCheckAccountStatus();
  const { selectedAccountIds, selectAccount, unselectAccount } = usePlatformAccountsStore();
  
  
  // Handle OAuth callback parameters if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const userId = params.get('userId');
    
    if (success === 'true' && userId) {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh the accounts list
      refetch();
    } else if (success === 'false') {
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
        returnUrl 
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : `Failed to connect ${platform} account`,
        variant: "destructive",
      });
    }
  };
  
  // Handle disconnect account
  const handleDisconnectAccount = async (platform: string, userId: string) => {
    try {
      await disconnectAccount.mutateAsync({ 
        platform: platform as any, 
        userId 
      });
    } catch (error) {
      toast({
        title: "Disconnection Error",
        description: error instanceof Error ? error.message : `Failed to disconnect ${platform} account`,
        variant: "destructive",
      });
    }
  };
  
  // Handle refresh account
  const handleRefreshAccount = async (platform: string, userId: string) => {
    try {
      await refreshAccount.mutateAsync({ 
        platform: platform as any, 
        userId 
      });
      await checkAccountStatus.mutateAsync({ 
        platform: platform as any, 
        userId 
      });
    } catch (error) {
      toast({
        title: "Refresh Error",
        description: error instanceof Error ? error.message : `Failed to refresh ${platform} account`,
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
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate({ to: "/" })}
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
      
      <div className="rounded-md bg-blue-50 p-4 text-sm mb-6">
        <p className="font-medium text-blue-800">Connected NEAR Account:</p>
        <p className="mt-1 text-blue-700">
          <span className="font-bold">{signedAccountId}</span>
        </p>
      </div>
      
      <div className="space-y-6">
        {SUPPORTED_PLATFORMS.map(platform => (
          <div key={platform} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold capitalize">{platform} Accounts</h2>
              <Button 
                onClick={() => handleConnectAccount(platform)} 
                disabled={connectAccount.isPending}
                size="sm"
                className="gap-2"
              >
                <PlusCircle size={16} />
                {connectAccount.isPending ? "Connecting..." : "Connect Account"}
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {accounts.filter(account => account.platform === platform).length === 0 ? (
                  <div className="rounded-md border-2 border-dashed border-gray-200 p-8 text-center">
                    {platform === 'twitter' && <Twitter className="mx-auto h-12 w-12 text-gray-400" />}
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No {platform} accounts connected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Connect your {platform} accounts to start crossposting
                    </p>
                    <div className="mt-6">
                      <Button 
                        onClick={() => handleConnectAccount(platform)} 
                        disabled={connectAccount.isPending}
                      >
                        {platform === 'twitter' && <Twitter size={18} className="mr-2" />}
                        {connectAccount.isPending ? "Connecting..." : `Connect ${platform} Account`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accounts
                      .filter(account => account.platform === platform)
                      .map((account) => (
                        <div 
                          key={account.userId}
                          className={`flex items-center justify-between rounded-md border-2 p-4 ${
                            selectedAccountIds.includes(account.userId) 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {account.profileImageUrl ? (
                                <img
                                  src={account.profileImageUrl}
                                  alt={account.username}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {platform === 'twitter' && <Twitter size={20} className="text-gray-400" />}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">@{account.username}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                {account.isConnected ? (
                                  <span className="flex items-center text-green-600">
                                    <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
                                    Connected
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-600">
                                    <AlertCircle size={14} className="mr-1" />
                                    Disconnected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefreshAccount(account.platform, account.userId)}
                              title="Refresh token"
                              disabled={refreshAccount.isPending}
                            >
                              <RefreshCw size={16} className={refreshAccount.isPending ? "animate-spin" : ""} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnectAccount(account.platform, account.userId)}
                              title="Disconnect account"
                              disabled={disconnectAccount.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                            <Button
                              variant={selectedAccountIds.includes(account.userId) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAccountSelection(account.userId)}
                              disabled={!account.isConnected}
                            >
                              {selectedAccountIds.includes(account.userId) ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleContinue}
            disabled={selectedAccountIds.length === 0}
            className="gap-2"
          >
            Continue to Editor
          </Button>
        </div>
      </div>
    </div>
  );
}
