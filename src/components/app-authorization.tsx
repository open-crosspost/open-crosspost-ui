import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_NAME } from "@/config";
import { toast } from "@/hooks/use-toast";
import { useNearAuth } from "@/store/nearAuthStore";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import * as React from "react";
import { useState } from "react";

interface AppAuthorizationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppAuthorization({ isOpen, onClose }: AppAuthorizationProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { signedAccountId, wallet } = useWalletSelector();
  const { authorize } = useNearAuth();
  const navigate = useNavigate();

  const handleAuthorize = async () => {
    if (!signedAccountId) {
      toast({
        title: "Error",
        description: "Please connect your NEAR wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsAuthorizing(true);

    try {
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Call the authorize function with wallet and accountId
      const returnUrl = window.location.origin + '/manage';
      const success = await authorize(wallet, signedAccountId);

      if (success) {
        toast({
          title: "Success",
          description: "App authorized successfully",
        });

        // Close the dialog
        onClose();

        // Redirect to manage accounts page
        navigate({ to: "/manage" });
      } else {
        throw new Error("Authorization failed");
      }
    } catch (error) {
      console.error("App authorization error:", error);

      toast({
        title: "Authorization Failed",
        description:
          error instanceof Error ? error.message : "Failed to authorize app",
        variant: "destructive",
      });
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authorize {APP_NAME}
          </DialogTitle>
          <DialogDescription>
            Before connecting social accounts, you need to authorize this app to
            post on your behalf.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md border-2 border-gray-200 p-4">
            <h3 className="font-medium">You are authorizing {APP_NAME} to:</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              <li>Post content to social platforms you connect</li>
              <li>Access your connected social accounts</li>
              <li>Upload media on your behalf</li>
            </ul>
          </div>

          <div className="rounded-md bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-800">Important:</p>
            <p className="mt-1 text-amber-700">
              Your NEAR account{" "}
              <span className="font-bold">{signedAccountId}</span> will be used
              to sign all requests. You can revoke access at any time by
              disconnecting your accounts.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAuthorize}
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
