import { getErrorMessage } from "@crosspost/sdk";
import { ConnectedAccount, Platform } from "@crosspost/types";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthorizationStatus } from "../hooks/use-authorization-status";
import { createAuthenticatedMutation } from "../lib/authentication-service";
import { getClient } from "../lib/authorization-service";
import { NearSocialService } from "../lib/near-social-service";

// Store for managing platform accounts
interface PlatformAccountsState {
  selectedAccountIds: string[];
  selectAccount: (userId: string) => void;
  unselectAccount: (userId: string) => void;
  toggleAccountSelection: (userId: string) => void;
  clearSelectedAccounts: () => void;
  isAccountSelected: (userId: string) => boolean;
}

export const usePlatformAccountsStore = create<PlatformAccountsState>()(
  persist(
    (set, get) => ({
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

      toggleAccountSelection: (userId) => {
        const state = get();
        if (state.selectedAccountIds.includes(userId)) {
          state.unselectAccount(userId);
        } else {
          state.selectAccount(userId);
        }
      },

      isAccountSelected: (userId) => {
        return get().selectedAccountIds.includes(userId);
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
export const useConnectAccount = createAuthenticatedMutation({
  mutationKey: ["connectAccount"],
  clientMethod: async (client, { platform }: { platform: Platform }) => {
    await client.auth.loginToPlatform(platform.toLowerCase() as any);
  },
  getAuthDetails: ({ platform }: { platform: Platform }) =>
    `loginToPlatform:${platform}`,
  onSuccess: (_, __, ___, queryClient) => {
    // Invalidate the connected accounts query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
  },
});

// Disconnect a platform account
export const useDisconnectAccount = createAuthenticatedMutation({
  mutationKey: ["disconnectAccount"],
  clientMethod: async (
    client,
    { platform, userId }: { platform: Platform; userId: string },
  ) => {
    await client.auth.revokeAuth(platform.toLowerCase() as any, userId);
    return userId;
  },
  getAuthDetails: ({
    platform,
    userId,
  }: {
    platform: Platform;
    userId: string;
  }) => `revokeAuth:${platform}:${userId}`,
  onSuccess: (userId, _, __, queryClient) => {
    // Invalidate the connected accounts query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });

    // Also remove from selected accounts if it was selected
    const store = usePlatformAccountsStore.getState();
    if (store.selectedAccountIds.includes(userId)) {
      store.unselectAccount(userId);
    }
  },
});

// Refresh a platform account's token
export const useRefreshAccount = createAuthenticatedMutation({
  mutationKey: ["refreshAccount"],
  clientMethod: async (
    client,
    { platform, userId }: { platform: Platform; userId: string },
  ) => {
    await client.auth.refreshProfile(platform.toLowerCase() as any, userId);
    return userId;
  },
  getAuthDetails: ({
    platform,
    userId,
  }: {
    platform: Platform;
    userId: string;
  }) => `refreshProfile:${platform}:${userId}`,
  onSuccess: (_, __, ___, queryClient) => {
    // Invalidate the connected accounts query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
  },
});

// Check a platform account's status
export const useCheckAccountStatus = createAuthenticatedMutation({
  mutationKey: ["checkAccountStatus"],
  clientMethod: async (
    client,
    { platform, userId }: { platform: Platform; userId: string },
  ) => {
    const { authenticated, tokenStatus } = await client.auth.getAuthStatus(
      platform.toLowerCase() as any,
      userId,
    );

    // Check if the account is authenticated based on the response
    const isConnected = authenticated && tokenStatus.valid;

    return { userId, isConnected };
  },
  getAuthDetails: ({
    platform,
    userId,
  }: {
    platform: Platform;
    userId: string;
  }) => `getAuthStatus:${platform}:${userId}`,
  onSuccess: (data, _, __, queryClient) => {
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
                  : null,
              }
            : account,
        );
      },
    );
  },
});

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
