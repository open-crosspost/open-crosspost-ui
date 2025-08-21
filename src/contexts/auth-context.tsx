import { NETWORK_ID } from "@/config";
import { toast } from "@/hooks/use-toast";
import { getClient } from "@/lib/authorization-service";
import { near } from "@/lib/near";
import { SOCIAL_CONTRACT } from "@/lib/near-social-service";
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
  handleSignOut: () => void;
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
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(
    pretendAccountId ?? near.accountId() ?? null,
  );
  const [isSignedIn, setIsSignedIn] = useState<boolean>(
    near.authStatus() === "SignedIn",
  );
  const isSigningInRef = useRef<boolean>(false);
  const previousAccountIdRef = useRef<string | null>(currentAccountId);

  const clearSelectedAccounts = usePlatformAccountsStore.getState().clearSelectedAccounts;
  const deleteDraft = useDraftsStore.getState().deleteDraft;
  const clearAutoSave = useDraftsStore.getState().clearAutoSave;

  useEffect(() => {
    const client = getClient();
    const accountListener = near.event.onAccount((newAccountId) => {
      setCurrentAccountId(newAccountId);
      setIsSignedIn(!!newAccountId);

      if (newAccountId) {
        client.setAccountHeader(newAccountId);
      } else {
        clearSelectedAccounts();
        clearAutoSave();
        // Get current drafts state when needed instead of depending on it
        const currentDrafts = useDraftsStore.getState().drafts;
        if (currentDrafts.length > 0) {
          currentDrafts.forEach((draft) => {
            deleteDraft(draft.id);
          });
        }
      }
    });

    const txListener = near.event.onTx((tx) => {
      console.log(tx);
    });

    return () => {
      near.event.offAccount(accountListener);
      near.event.offTx(txListener);
    };
  }, []);

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
      await near.requestSignIn({
        contractId: SOCIAL_CONTRACT[NETWORK_ID],
      });
    } catch (e: unknown) {
      toast({
        title: "Sign-in failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      isSigningInRef.current = false;
    }
  };

  const handleSignOut = (): void => {
    near.signOut();
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
