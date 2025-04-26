import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { APP_NAME } from "../config";
import {
  createAuthorizationPayload,
  authorize,
} from "../lib/authorization-service";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { Shield } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { toast } from "../hooks/use-toast";
import {
  isAuthError,
  isPlatformError,
  isNetworkError,
  getErrorMessage,
} from "@crosspost/sdk";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

export function AuthorizationModal({
  isOpen,
  onClose,
  onSuccess,
  message,
}: AuthorizationModalProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { wallet, signedAccountId } = useWalletSelector();

  const handleRequestAuthorization = async () => {
    if (!wallet || !signedAccountId) {
      console.error("Wallet not connected");
      return;
    }

    setIsAuthorizing(true);
    try {
      const authorizationPayload = await createAuthorizationPayload(
        wallet,
        signedAccountId,
      );
      await authorize(authorizationPayload);

      toast({
        title: "Authorization successful",
        description: "You can now post to connected platforms",
      });

      onSuccess?.();

      onClose();
    } catch (error) {
      // Use SDK error utilities to handle different error types
      if (isAuthError(error)) {
        toast({
          title: "Authentication error",
          description: getErrorMessage(
            error,
            "Unable to authenticate with NEAR wallet",
          ),
          variant: "destructive",
        });
      } else if (isNetworkError(error)) {
        toast({
          title: "Network error",
          description: getErrorMessage(
            error,
            "Unable to connect to the server",
          ),
          variant: "destructive",
        });
      } else if (isPlatformError(error)) {
        toast({
          title: `${(error as any).platform} error`,
          description: getErrorMessage(error, "Error connecting to platform"),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authorization error",
          description: getErrorMessage(
            error,
            "An unexpected error occurred during authorization",
          ),
          variant: "destructive",
        });
      }

      console.error("Authorization error:", error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-0.5rem)] mx-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authorize {APP_NAME}
          </DialogTitle>
          <DialogDescription>
            {message ||
              "Before proceeding, you need to authorize this app to post on your behalf."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 sm:py-4">
          <div className="rounded-md border-2 border-gray-200 p-3 sm:p-4">
            <h3 className="font-medium">You are authorizing {APP_NAME} to:</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              <li>Post content to social platforms you connect</li>
              <li>Access your connected social accounts</li>
              <li>Upload media on your behalf</li>
            </ul>
          </div>

          <div className="rounded-md bg-amber-50 p-3 sm:p-4 text-sm">
            <p className="font-medium text-amber-800">Important:</p>
            <p className="mt-1 text-amber-700">
              Your NEAR account{" "}
              <span className="font-bold">{signedAccountId}</span> will be used
              to sign all requests. You can revoke access at any time by
              disconnecting your accounts.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:justify-between">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleRequestAuthorization}
            disabled={isAuthorizing}
            className="gap-2"
          >
            {isAuthorizing ? "Authorizing..." : "Authorize App"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
