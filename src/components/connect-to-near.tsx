import { toast } from "@/hooks/use-toast";
import { signalAuthorizationRevoked } from "@/lib/authorization-events";
import { getClient } from "@/lib/authorization-service";
import { near } from "@/lib/near";
import { Wallet } from "lucide-react";
import React, { type ReactElement, useEffect, useRef, useState } from "react";
import { useDraftsStore } from "../store/drafts-store";
import { usePlatformAccountsStore } from "../store/platform-accounts-store";
import { Button } from "./ui/button";
import { SOCIAL_CONTRACT } from "../lib/near-social-service";
import { NETWORK_ID } from "@/config";

export function ConnectToNearButton(): ReactElement {
  const { clearSelectedAccounts } = usePlatformAccountsStore();
  const { drafts, deleteDraft, clearAutoSave } = useDraftsStore();
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(
    near.accountId() ?? null,
  );
  const [isUserSignedIn, setIsUserSignedIn] = useState<boolean>(
    near.authStatus() === "SignedIn",
  );
  const wasConnectedRef = useRef<boolean>(isUserSignedIn);
  const isSigningInRef = useRef<boolean>(false);

  useEffect(() => {
    const client = getClient();

    const accountListener = near.event.onAccount((newAccountId) => {
      console.log("Account ID Update", newAccountId);
      setCurrentAccountId(newAccountId);
      setIsUserSignedIn(!!newAccountId);

      if (newAccountId) {
        toast({
          title: "Success!",
          description: `Connected as: ${newAccountId}`,
          variant: "success",
        });
        wasConnectedRef.current = true;
        if (isSigningInRef.current) {
          isSigningInRef.current = false;
        }
        client.setAccountHeader(newAccountId);
      } else {
        if (wasConnectedRef.current && !isSigningInRef.current) {
          signalAuthorizationRevoked(); // this will clear the client
          clearSelectedAccounts();
          clearAutoSave();
          if (drafts.length > 0) {
            drafts.forEach((draft) => {
              deleteDraft(draft.id);
            });
          }
          toast({
            title: "Signed out",
            description:
              "You have been signed out successfully. All connected accounts and drafts have been cleared.",
            variant: "success",
          });
        }
        wasConnectedRef.current = false;
      }
    });

    return () => {
      near.event.offAccount(accountListener);
    };
  }, [clearSelectedAccounts, deleteDraft, clearAutoSave, drafts]);

  const handleSignIn = async (): Promise<void> => {
    isSigningInRef.current = true;
    near
      .requestSignIn({
        contractId: SOCIAL_CONTRACT[NETWORK_ID],
      })
      .catch((e: Error) => {
        toast({
          title: "Sign-in failed",
          description: e.message,
          variant: "destructive",
        });
        isSigningInRef.current = false;
      });
  };

  const handleSignOut = (): void => {
    if (isUserSignedIn) {
      wasConnectedRef.current = true;
    }
    near.signOut();
  };

  return (
    <Button
      onClick={isUserSignedIn ? handleSignOut : handleSignIn}
      className="text-sm sm:text-base"
    >
      <Wallet size={18} className="mr-2" />
      {isUserSignedIn && currentAccountId
        ? window.innerWidth < 640
          ? "Disconnect"
          : `Disconnect @${currentAccountId}`
        : "Connect NEAR"}
    </Button>
  );
}
