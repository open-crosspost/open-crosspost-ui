import { getErrorMessage } from "@crosspost/sdk";
import { ConnectedAccount, Platform } from "@crosspost/types";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthorizationStatus } from "../hooks/use-authorization-status";
import { authenticate } from "../lib/authentication-service";
import { getClient } from "../lib/authorization-service";
import { NearSocialService } from "../lib/near-social-service";

// Store for managing platform accounts
interface PlatformAccountsState {
  selectedAccountIds: string[];
  selectAccount: (userId: string) => void;
  unselectAccount: (userId: string) => void;
  clearSelectedAccounts: () => void;
}

export const usePlatformAccountsStore = create<PlatformAccountsState>()(
  persist(
    (set) => ({
      selectedAccountIds: [],

      selectAccount: (userId) => {
        set((state) => ({
          selectedAccountIds: [...state.selectedAccountIds, userId],
        }));
      },

      unselectAccount: (userId) => {
        set((state) => ({
          selectedAccountIds: state.selectedAccountIds.filter(
            (id) => id !== userId,
          ),
        }));
      },

      clearSelectedAccounts: () => {
        set({ selectedAccountIds: [] });
      },
    }),
    {
      name: "crosspost-selected-accounts",
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence across browser sessions
    },
  ),
);

// React Query hooks for platform accounts

// Fetch all connected accounts
export function useConnectedAccounts() {
  const { wallet, signedAccountId } = useWalletSelector();
  const isAuthorized = useAuthorizationStatus();

  return useQuery({
    queryKey: ["connectedAccounts"],
    queryFn: async () => {
      // Ensure wallet and accountId are available
      if (!wallet || !signedAccountId) {
        throw new Error("Wallet not connected or account ID unavailable.");
      }
      try {
        const client = getClient();

        const { accounts } = await client.auth.getConnectedAccounts();
        return accounts;
      } catch (error) {
        console.error(
          "Failed to fetch connected accounts:",
          getErrorMessage(error),
        );
        throw error;
      }
    },
    enabled: !!signedAccountId && isAuthorized === true && !!wallet,
  });
}

// Connect a platform account
export function useConnectAccount() {
  const queryClient = useQueryClient();
  const { wallet, signedAccountId } = useWalletSelector();

  return useMutation({
    mutationFn: async ({ platform }: { platform: Platform }) => {
      if (!wallet || !signedAccountId) {
        throw new Error("Wallet not connected or account ID unavailable.");
      }
      try {
        const client = getClient();
        const authData = await authenticate(
          wallet,
          signedAccountId,
          `loginToPlatform:${platform}`,
        );
        client.setAuthentication(authData);
        await client.auth.loginToPlatform(platform.toLowerCase() as any);
      } catch (error) {
        console.error(
          `Failed to connect ${platform} account:`,
          getErrorMessage(error),
        );
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the connected accounts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
    },
  });
}

// Disconnect a platform account
export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  const { wallet, signedAccountId } = useWalletSelector();

  return useMutation({
    mutationFn: async ({
      platform,
      userId,
    }: {
      platform: Platform;
      userId: string;
    }) => {
      if (!wallet || !signedAccountId) {
        throw new Error(
          "Wallet not connected or account ID unavailable for disconnect.",
        );
      }
      try {
        const client = getClient();
        const authData = await authenticate(
          wallet,
          signedAccountId,
          `revokeAuth:${platform}:${userId}`,
        );
        client.setAuthentication(authData);

        await client.auth.revokeAuth(platform.toLowerCase() as any, userId);
        return userId;
      } catch (error) {
        console.error(
          `Failed to disconnect ${platform} account:`,
          getErrorMessage(error),
        );
        throw error;
      }
    },
    onSuccess: (userId) => {
      // Invalidate the connected accounts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });

      // Also remove from selected accounts if it was selected
      const store = usePlatformAccountsStore.getState();
      if (store.selectedAccountIds.includes(userId)) {
        store.unselectAccount(userId);
      }
    },
  });
}

// Refresh a platform account's token
export function useRefreshAccount() {
  const queryClient = useQueryClient();
  const { wallet, signedAccountId } = useWalletSelector();

  return useMutation({
    mutationFn: async ({
      platform,
      userId,
    }: {
      platform: Platform;
      userId: string;
    }) => {
      if (!wallet || !signedAccountId) {
        throw new Error(
          "Wallet not connected or account ID unavailable for refresh.",
        );
      }
      try {
        const client = getClient();
        const authData = await authenticate(
          wallet,
          signedAccountId,
          `refreshProfile:${platform}:${userId}`,
        );
        client.setAuthentication(authData);

        await client.auth.refreshProfile(platform.toLowerCase() as any, userId);
        return userId;
      } catch (error) {
        console.error(
          `Failed to refresh ${platform} account:`,
          getErrorMessage(error),
        );
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the connected accounts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
    },
  });
}

// Check a platform account's status
export function useCheckAccountStatus() {
  const queryClient = useQueryClient();
  const { wallet, signedAccountId } = useWalletSelector();

  return useMutation({
    mutationFn: async ({
      platform,
      userId,
    }: {
      platform: Platform;
      userId: string;
    }) => {
      if (!wallet || !signedAccountId) {
        throw new Error(
          "Wallet not connected or account ID unavailable for status check.",
        );
      }
      try {
        const client = getClient();
        // const authData = await authenticate(wallet, signedAccountId, `getAuthStatus:${platform}:${userId}`);
        // client.setAuthentication(authData);

        const { authenticated, tokenStatus } = await client.auth.getAuthStatus(
          platform.toLowerCase() as any,
          userId,
        );

        // Check if the account is authenticated based on the response
        const isConnected = authenticated && tokenStatus.valid;

        return { userId, isConnected };
      } catch (error) {
        console.error(
          `Failed to check ${platform} account status:`,
          getErrorMessage(error),
        );
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update the account in the cache
      queryClient.setQueryData(
        ["connectedAccounts"],
        (oldData: ConnectedAccount[] | undefined) => {
          if (!oldData) return oldData;

          return oldData.map((account: ConnectedAccount) =>
            account.userId === data.userId
              ? {
                  ...account,
                  profile: account.profile 
                    ? { ...account.profile, lastUpdated: Date.now() }
                    : null
                }
              : account,
          );
        },
      );
    },
  });
}

// Hook to get the current NEAR account
export function useNearAccount() {
  const { wallet } = useWalletSelector();

  return useQuery({
    queryKey: ["nearAccount"],
    queryFn: async () => {
      try {
        const nearSocialService = new NearSocialService(wallet);
        return await nearSocialService.getCurrentAccountProfile();
      } catch (error) {
        console.error("Error fetching NEAR account:", error);
        return null;
      }
    },
  });
}

// Hook to get all available accounts (API accounts + NEAR account)
export function useAllAccounts() {
  const { data: apiAccounts = [] } = useConnectedAccounts();
  const { data: nearAccount } = useNearAccount();

  return [...apiAccounts, ...(nearAccount ? [nearAccount] : [])];
}

// Hook to get selected accounts
export function useSelectedAccounts() {
  const allAccounts = useAllAccounts();
  const selectedAccountIds = usePlatformAccountsStore(
    (state) => state.selectedAccountIds,
  );

  // Filter accounts to only include selected ones
  return allAccounts.filter((account: ConnectedAccount) =>
    selectedAccountIds.includes(account.userId),
  );
}
