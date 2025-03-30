import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME } from '../config';
import {
  checkAuthorizationStatus,
  initWithNearAuth,
  NearAuthData,
  signInWithNear
} from '../lib/auth/near-auth';

interface NearAuthState {
  // State
  isAuthorized: boolean;
  isAuthorizing: boolean;
  isChecking: boolean;
  error: string | null;
  accountId: string | null;
  lastChecked: number | null;

  // Computed properties
  isAuthenticated: boolean;

  // Actions
  authorize: (wallet: any, accountId: string) => Promise<boolean>;
  checkStatus: (wallet: any) => Promise<boolean>;
  reset: () => void;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const useNearAuth = create<NearAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthorized: false,
      isAuthorizing: false,
      isChecking: false,
      error: null,
      accountId: null,
      lastChecked: null,

      // Computed property to check if user is authenticated
      get isAuthenticated() {
        return get().accountId !== null;
      },

      /**
       * Authorize the app with the proxy API
       * This function signs a message with the NEAR wallet and sends it to the proxy API
       * to authorize the app to post on behalf of the user
       */
      authorize: async (wallet, accountId) => {
        if (!wallet || !accountId) {
          set({ error: 'Wallet and account ID are required' });
          return false;
        }

        set({ isAuthorizing: true, error: null });

        try {
          // Create the auth message
          const message = `I authorize ${APP_NAME} to post on my behalf to connected social platforms using my NEAR account: ${accountId}`;

          // Sign the message with the wallet
          const authData: NearAuthData = await signInWithNear(wallet, message);

          // Initialize with the proxy API
          const returnUrl = window.location.origin + '/manage';
          const response = await initWithNearAuth(authData, returnUrl);

          // Check if the response indicates success
          if (response && (response.success || (response.data && response.data.success))) {
            const now = Date.now();
            set({
              isAuthorized: true,
              isAuthorizing: false,
              accountId: accountId,
              lastChecked: now,
            });
            return true;
          } else {
            throw new Error((response.error || response.data?.error) || 'Authorization failed');
          }
        } catch (error) {
          console.error('App authorization error:', error);
          set({
            isAuthorizing: false,
            error: error instanceof Error ? error.message : 'Unknown error during authorization',
          });
          return false;
        }
      },

      /**
       * Check authorization status
       * This function checks if the user is authorized to use the app
       * It prioritizes persisted state and only checks with the API if necessary
       */
      checkStatus: async (wallet) => {
        if (!wallet) {
          return false;
        }

        const { isAuthorized, accountId, lastChecked } = get();
        const now = Date.now();
        
        // If we have a stored authorization state and account ID, use that
        if (isAuthorized && accountId) {
          // If we've checked recently, don't check again
          if (lastChecked && (now - lastChecked < CACHE_DURATION)) {
            return true;
          }
          
          // Update the last checked timestamp even if we're using cached data
          set({ lastChecked: now });
          return true;
        }

        // Only check with API if we don't have persisted state
        if (!isAuthorized) {
          set({ isChecking: true });

          try {
            const { isAuthorized } = await checkAuthorizationStatus(wallet);
            
            set({
              isAuthorized,
              isChecking: false,
              accountId: isAuthorized ? wallet.accountId : null,
              lastChecked: now,
            });
            
            return isAuthorized;
          } catch (error) {
            console.error('Error checking authorization status:', error);
            set({
              isChecking: false,
              isAuthorized: false,
            });
            return false;
          }
        }
        
        return isAuthorized;
      },

      /**
       * Reset authorization state
       * This function clears all authorization state and logs the user out
       */
      reset: () => {
        set({
          isAuthorized: false,
          isAuthorizing: false,
          isChecking: false,
          error: null,
          accountId: null,
          lastChecked: null,
        });
      },
    }),
    {
      name: 'near-auth-storage', // Name for the persisted store
      partialize: (state) => ({
        isAuthorized: state.isAuthorized,
        accountId: state.accountId,
        lastChecked: state.lastChecked,
      }), // Only persist these fields
    }
  )
);
