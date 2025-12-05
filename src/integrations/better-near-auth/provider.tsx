import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useWallet } from '../near-wallet';
import type {
  BetterNearAuthContextType,
  AuthSession,
} from './types';

const BetterNearAuthContext =
  createContext<BetterNearAuthContextType | null>(null);

interface BetterNearAuthProviderProps {
  children: ReactNode;
  sessionStorageKey?: string;
  sessionDuration?: number; // in milliseconds, default 24 hours
}

const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_STORAGE_KEY = 'better-near-auth-session';

export function BetterNearAuthProvider({
  children,
  sessionStorageKey = DEFAULT_STORAGE_KEY,
  sessionDuration = DEFAULT_SESSION_DURATION,
}: BetterNearAuthProviderProps) {
  const { accountId, signMessage, connector } = useWallet();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(sessionStorageKey);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        // Check if session is expired
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(sessionStorageKey);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      localStorage.removeItem(sessionStorageKey);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStorageKey]);

  // Sync session with wallet account
  useEffect(() => {
    if (accountId && session?.accountId !== accountId) {
      // Account changed, clear session
      setSession(null);
      localStorage.removeItem(sessionStorageKey);
    }
  }, [accountId, session?.accountId, sessionStorageKey]);

  const saveSession = useCallback(
    (newSession: AuthSession) => {
      const sessionWithExpiry: AuthSession = {
        ...newSession,
        expiresAt: Date.now() + sessionDuration,
        signedAt: Date.now(),
      };

      setSession(sessionWithExpiry);
      try {
        localStorage.setItem(
          sessionStorageKey,
          JSON.stringify(sessionWithExpiry)
        );
      } catch (error) {
        console.error('Error saving session:', error);
      }
    },
    [sessionStorageKey, sessionDuration]
  );

  const authenticate = useCallback(
    async (message?: string): Promise<boolean> => {
      if (!accountId || !signMessage) {
        return false;
      }

      try {
        const authMessage =
          message ||
          `Please sign this message to authenticate with ${accountId} at ${new Date().toISOString()}`;

        // signMessage now throws errors instead of returning null
        const signature = await signMessage(authMessage, accountId);

        // Get public key from connector (fallback to signature publicKey)
        let publicKey = signature.publicKey;

        if (connector) {
          try {
            const wallet = await connector.wallet();
            const accounts = await wallet.getAccounts();
            if (accounts && accounts.length > 0) {
              publicKey = accounts[0].publicKey.toString();
            }
          } catch (error) {
            // Handle "No accounts found" error gracefully
            if (error instanceof Error && error.message.includes('No accounts found')) {
              // Wallet is not connected, use signature publicKey as fallback
              console.log('Wallet not connected, using signature publicKey');
            } else {
              console.error('Error getting public key:', error);
            }
            // Continue with signature.publicKey as fallback
          }
        }

        const newSession: AuthSession = {
          accountId,
          publicKey: publicKey,
          signature: signature.signature,
        };

        saveSession(newSession);

        return true;
      } catch (error) {
        console.error('Authentication error:', error);
        // Return false on any error (user cancellation, wallet not connected, etc.)
        return false;
      }
    },
    [accountId, signMessage, connector, saveSession]
  );

  const signOut = useCallback(async () => {
    setSession(null);
    localStorage.removeItem(sessionStorageKey);
  }, [sessionStorageKey]);

  const refreshSession = useCallback(async () => {
    if (session && accountId === session.accountId) {
      await authenticate();
    }
  }, [session, accountId, authenticate]);

  const isAuthenticated =
    !!session &&
    !!accountId &&
    session.accountId === accountId &&
    (!session.expiresAt || session.expiresAt > Date.now());

  return (
    <BetterNearAuthContext.Provider
      value={{
        session,
        isAuthenticated,
        isLoading,
        authenticate,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </BetterNearAuthContext.Provider>
  );
}

export function useBetterNearAuth() {
  const context = useContext(BetterNearAuthContext);
  if (!context) {
    throw new Error(
      'useBetterNearAuth must be used within a BetterNearAuthProvider'
    );
  }
  return context;
}



