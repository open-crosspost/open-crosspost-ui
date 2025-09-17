import { useAuth } from "@/contexts/auth-context";
import { near } from "@/lib/near";
import { getImageUrl, getProfile } from "@/lib/utils/near-social-node";
import { getErrorMessage } from "@crosspost/sdk";
import { ConnectedAccount, Platform } from "@crosspost/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sign } from "near-sign-verify";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useToast } from "../hooks/use-toast";
import { createAuthenticatedMutation } from "../lib/authentication-service";
import { getClient } from "../lib/authorization-service";

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

export function useConnectedAccounts() {
  const { isSignedIn, currentAccountId } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["connectedAccounts"],
    queryFn: async () => {
      if (!currentAccountId) {
        throw new Error("Wallet not connected or account ID unavailable.");
      }
      try {
        const client = getClient();

        client.setAccountHeader(currentAccountId);

        const response = await client.auth.getConnectedAccounts();

        if (response.success && response.data) {
          // Ensure accounts is an array and filter out any malformed entries
          const accounts = response.data.accounts || [];
          return accounts.filter(account => 
            account && 
            typeof account === 'object' && 
            account.platform && 
            account.userId
          );
        } else {
          const errorMessage = response.errors?.length
            ? response.errors[0].message
            : "Unknown error occurred";
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Failed to fetch connected accounts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch connected accounts",
        });
        throw error;
      }
    },
    enabled: !!isSignedIn,
    retry: 1,
    retryDelay: 1000,
    gcTime: 0,
  });
}

// Interface for the variables of useConnectAccount
interface ConnectAccountVariables {
  platform: Platform;
}

// Connect a platform account
export const useConnectAccount = () => {
  const queryClient = useQueryClient();
  const { currentAccountId, isSignedIn } = useAuth();
  const { toast } = useToast();

  return useMutation<void, Error, ConnectAccountVariables>({
    mutationKey: ["connectAccount"],
    mutationFn: async ({
      platform,
    }: ConnectAccountVariables): Promise<void> => {
      try {
        const client = getClient();
        const authDetails = `loginToPlatform:${platform}`;

        if (!isSignedIn || !currentAccountId) {
          throw new Error("Wallet not connected or account ID unavailable.");
        }

        toast({
          title: "Authenticating...",
          description: "Please sign the message in your wallet",
          variant: "default",
        });

        const message = `Authenticating request for NEAR account: ${currentAccountId}${authDetails ? ` (${authDetails})` : ""}`;
        const authToken = await sign({
          signer: near,
          recipient: "crosspost.near",
          message,
        });

        client.setAuthentication(authToken);

        const response: any = await client.auth.loginToPlatform(
          platform?.toLowerCase() as any,
        );

        if (
          response &&
          response.status &&
          typeof response.status === "object" &&
          response.status.code === "AUTH_SUCCESS"
        ) {
          return; // Success: platform, userId, status.code format
        } else if (response && typeof response.success === "boolean") {
          if (response.success) {
            return; // Success: ApiResponse format (e.g., URL returned)
          } else {
            const errorMessage = response.errors?.length
              ? response.errors[0].message
              : "Unknown error occurred during platform login (ApiResponse error).";
            throw new Error(errorMessage);
          }
        } else {
          console.error(
            "Unexpected response structure from loginToPlatform:",
            response,
          );
          throw new Error(
            "Unexpected response from server during platform login.",
          );
        }
      } catch (error) {
        console.error(
          `API Mutation Error [connectAccount/${platform}]:`,
          getErrorMessage(error),
        );
        if (error instanceof Error) {
          throw error; // Re-throw original error if it's already an Error instance
        }
        throw new Error(getErrorMessage(error)); // Ensure an Error instance is thrown
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
    },
  });
};

// Disconnect a platform account
export const useDisconnectAccount = createAuthenticatedMutation<
  string,
  Error,
  { platform: Platform; userId: string }
>({
  mutationKey: ["disconnectAccount"],
  clientMethod: async (client, { platform, userId }) => {
    const response = await client.auth.revokeAuth(
      platform?.toLowerCase() as any,
      userId,
    );
    if (response.success) {
      return response;
    } else {
      throw new Error(
        response.errors?.[0]?.message || "Failed to disconnect account",
      );
    }
  },
  getAuthDetails: ({ platform, userId }) => `revokeAuth:${platform}:${userId}`,
  onSuccess: (userId, _, __, queryClient) => {
    // Invalidate the connected accounts query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });

    // Also remove from selected accounts if it was selected
    const store = usePlatformAccountsStore.getState();
    if (
      typeof userId === "string" &&
      store.selectedAccountIds.includes(userId)
    ) {
      store.unselectAccount(userId);
    }
  },
});

// Refresh a platform account's token
export const useRefreshAccount = createAuthenticatedMutation<
  string,
  Error,
  { platform: Platform; userId: string }
>({
  mutationKey: ["refreshAccount"],
  clientMethod: async (client, { platform, userId }) => {
    const response = await client.auth.refreshProfile(
      platform?.toLowerCase() as any,
      userId,
    );
    if (response.success) {
      return response;
    } else {
      throw new Error(
        response.errors?.[0]?.message || "Failed to refresh account",
      );
    }
  },
  getAuthDetails: ({ platform, userId }) =>
    `refreshProfile:${platform}:${userId}`,
  onSuccess: (_, __, ___, queryClient) => {
    // Invalidate the connected accounts query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });
  },
});

// Check a platform account's status
export const useCheckAccountStatus = createAuthenticatedMutation<
  { userId: string; isConnected: boolean },
  Error,
  { platform: Platform; userId: string }
>({
  mutationKey: ["checkAccountStatus"],
  clientMethod: async (client, { platform, userId }) => {
    const response = await client.auth.getAuthStatus(
      platform?.toLowerCase() as any,
      userId,
    );

    if (response.success) {
      const { authenticated, tokenStatus } = response.data;
      const isConnected = authenticated && tokenStatus.valid;
      return response;
    } else {
      throw new Error(
        response.errors?.[0]?.message || "Failed to check account status",
      );
    }
  },
  getAuthDetails: ({ platform, userId }) =>
    `getAuthStatus:${platform}:${userId}`,
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

export function useNearSocialAccount() {
  const { currentAccountId, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["profile", currentAccountId],
    queryFn: async () => {
      if (!isSignedIn) return null;
      try {
        const profile = await getProfile(currentAccountId!);

        // Get profile image URL or use a fallback
        const profileImageUrl = profile?.image
          ? getImageUrl(profile.image)
          : "";

        return {
          platform: "Near Social" as Platform,
          userId: currentAccountId!,
          connectedAt: "",
          profile: {
            userId: currentAccountId!,
            username: profile?.name || currentAccountId!,
            profileImageUrl,
            platform: "Near Social" as Platform,
            lastUpdated: Date.now(),
          },
        } as ConnectedAccount;
      } catch (error) {
        console.error(
          "Error getting NEAR Social account profile:",
          getErrorMessage(error),
        );
      }
    },
  });
}

// Hook to get all available accounts (API accounts + NEAR account)
export function useAllAccounts() {
  const { data: apiAccounts = [] } = useConnectedAccounts();
  const { data: profile } = useNearSocialAccount();

  // Filter out any malformed accounts that might be missing required properties
  const validApiAccounts = apiAccounts.filter(account => 
    account && 
    typeof account === 'object' && 
    account.platform && 
    account.userId
  );

  return [...validApiAccounts, ...(profile ? [profile] : [])];
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
