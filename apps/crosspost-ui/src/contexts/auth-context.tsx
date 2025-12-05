import { NETWORK_ID } from "@/config";
import { toast } from "@/hooks/use-toast";
import { getClient } from "@/lib/authorization-service";
import { useWallet } from "@/integrations/near-wallet";
import { useDraftsStore } from "@/store/drafts-store";
import { usePlatformAccountsStore } from "@/store/platform-accounts-store";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface IAuthContext {
  currentAccountId: string | null;
  isSignedIn: boolean;
  setCurrentAccountId: Dispatch<SetStateAction<string | null>>;
  setIsSignedIn: Dispatch<SetStateAction<boolean>>;
  handleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function useAuth(): IAuthContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
  pretendAccountId?: string | null;
}

export function AuthProvider({
  children,
  pretendAccountId,
}: AuthProviderProps): React.ReactElement {
  const { accountId, connect, disconnect, isConnecting } = useWallet();
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(
    pretendAccountId ?? null,
  );
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const isSigningInRef = useRef<boolean>(false);
  const previousAccountIdRef = useRef<string | null>(currentAccountId);

  const { clearSelectedAccounts } = usePlatformAccountsStore();
  const { drafts, deleteDraft, clearAutoSave } = useDraftsStore();

  // Sync with wallet account
  useEffect(() => {
    const newAccountId = pretendAccountId ?? accountId;
    setCurrentAccountId(newAccountId);
    setIsSignedIn(pretendAccountId ? true : !!accountId);

    const client = getClient();
    if (newAccountId) {
      client.setAccountHeader(newAccountId);
    } else {
      clearSelectedAccounts();
      clearAutoSave();
      if (drafts.length > 0) {
        drafts.forEach((draft) => {
          deleteDraft(draft.id);
        });
      }
    }
  }, [accountId, pretendAccountId, clearSelectedAccounts, deleteDraft, clearAutoSave, drafts]);

  useEffect(() => {
    if (currentAccountId && currentAccountId !== previousAccountIdRef.current) {
      if (isSigningInRef.current) {
        toast({
          title: "Success!",
          description: `Connected as: ${currentAccountId}`,
          variant: "success",
        });
        isSigningInRef.current = false;
      }
    } else if (!currentAccountId && previousAccountIdRef.current !== null) {
      toast({
        title: "Signed out",
        description:
          "You have been signed out successfully. All connected accounts and drafts have been cleared.",
        variant: "success",
      });
      if (isSigningInRef.current) {
        isSigningInRef.current = false;
      }
    }
    previousAccountIdRef.current = currentAccountId;
  }, [currentAccountId]);

  const handleSignIn = async (): Promise<void> => {
    isSigningInRef.current = true;
    try {
      connect();
    } catch (e: unknown) {
      console.error("Sign-in error:", e);
      toast({
        title: "Sign-in failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      isSigningInRef.current = false;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      disconnect();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const contextValue: IAuthContext = {
    currentAccountId,
    isSignedIn,
    setCurrentAccountId,
    setIsSignedIn,
    handleSignIn,
    handleSignOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
