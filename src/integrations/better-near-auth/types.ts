export interface AuthSession {
  accountId: string;
  publicKey: string;
  signature?: Uint8Array;
  signedAt?: number;
  expiresAt?: number;
}

export interface BetterNearAuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticate: (message?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}




