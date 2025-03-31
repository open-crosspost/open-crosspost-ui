import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { PlatformAccount } from '../lib/api-types';
import { SupportedPlatform } from '../config';

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
          selectedAccountIds: state.selectedAccountIds.filter(id => id !== userId),
        }));
      },
      
      clearSelectedAccounts: () => {
        set({ selectedAccountIds: [] });
      },
    }),
    {
      name: 'crosspost-selected-accounts',
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence across browser sessions
    }
  )
);

// React Query hooks for platform accounts

// Fetch all connected accounts
export function useConnectedAccounts() {
  return useQuery({
    queryKey: ['connectedAccounts'],
    queryFn: async () => {
      const response = await apiClient.fetchConnectedAccounts();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch connected accounts');
      }
      return response.data || [];
    },
  });
}

// Connect a platform account
export function useConnectAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ platform, returnUrl }: { platform: SupportedPlatform, returnUrl: string }) => {
      const response = await apiClient.connectPlatformAccount(platform, returnUrl);
      if (!response.success) {
        throw new Error(response.error || `Failed to connect ${platform} account`);
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the connected accounts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['connectedAccounts'] });
    },
  });
}

// Disconnect a platform account
export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ platform, userId }: { platform: SupportedPlatform, userId: string }) => {
      const response = await apiClient.disconnectPlatformAccount(platform, userId);
      if (!response.success) {
        throw new Error(response.error || `Failed to disconnect ${platform} account`);
      }
      return userId;
    },
    onSuccess: (userId) => {
      // Invalidate the connected accounts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['connectedAccounts'] });
      
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
  
  return useMutation({
    mutationFn: async ({ platform, userId }: { platform: SupportedPlatform, userId: string }) => {
      const response = await apiClient.refreshPlatformAccount(platform, userId);
      if (!response.success) {
        throw new Error(response.error || `Failed to refresh ${platform} account`);
      }
      return userId;
    },
    onSuccess: () => {
      // Invalidate the connected accounts query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['connectedAccounts'] });
    },
  });
}

// Check a platform account's status
export function useCheckAccountStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ platform, userId }: { platform: SupportedPlatform, userId: string }) => {
      const response = await apiClient.checkPlatformAccountStatus(platform, userId);
      if (!response.success) {
        throw new Error(response.error || `Failed to check ${platform} account status`);
      }
      return { userId, isConnected: response.data?.isConnected || false };
    },
    onSuccess: (data) => {
      // Update the account in the cache
      queryClient.setQueryData(['connectedAccounts'], (oldData: PlatformAccount[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map((account: PlatformAccount) => 
          account.userId === data.userId 
            ? { ...account, isConnected: data.isConnected } 
            : account
        );
      });
    },
  });
}

// Hook to get selected accounts
export function useSelectedAccounts() {
  const { data: accounts = [] } = useConnectedAccounts();
  const selectedAccountIds = usePlatformAccountsStore(state => state.selectedAccountIds);
  
  // Filter accounts to only include selected ones
  return accounts.filter((account: PlatformAccount) => selectedAccountIds.includes(account.userId));
}
