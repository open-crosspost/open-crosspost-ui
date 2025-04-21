import { capitalize } from "@/lib/utils/string";
import { Platform, PlatformName } from "@crosspost/types";
import { Twitter } from "lucide-react";
import React from "react";
import { usePopupWindow } from "../hooks/use-popup-window";
import { useToast } from "../hooks/use-toast";
import {
  useConnectAccount,
  useConnectedAccounts,
} from "../store/platform-accounts-store";
import { Button } from "./ui/button";

interface ConnectPlatformProps {
  platform: PlatformName;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function ConnectPlatform({
  platform,
  className = "",
  variant = "default",
  size = "sm",
  showIcon = true,
}: ConnectPlatformProps) {
  const connectAccount = useConnectAccount();
  const { refetch } = useConnectedAccounts();

  interface AuthCallbackData {
    userId: string;
    error?: string;
  }

  const { toast, dismiss } = useToast();

  const { openPopup } = usePopupWindow<AuthCallbackData>({
    type: "AUTH_CALLBACK",
    onSuccess: (data) => {
      // Dismiss all toasts (including connecting toast)
      dismiss();

      // Add small delay before refetch to ensure backend is ready
      setTimeout(() => {
        refetch();
      }, 500);

      toast({
        title: `${capitalize(platform)} Account Connected!`,
        description: "Your account is now linked and ready to use.",
        variant: "success",
      });
    },
    onError: (error) => {
      // Dismiss all toasts (including connecting toast)
      dismiss();

      toast({
        title: "Connection Failed",
        description:
          error?.error ||
          `Failed to connect ${capitalize(platform)} account. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleConnect = async () => {
    toast({
      title: `Connecting to ${capitalize(platform)}...`,
      description: "Please follow the instructions in the popup window.",
      duration: Infinity,
    });

    try {
      const authUrl = await connectAccount.mutateAsync({
        platform: platform as any,
      });

      openPopup(authUrl);
    } catch (error) {
      dismiss();

      toast({
        title: "Connection Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to connect ${capitalize(platform)} account`,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={connectAccount.isPending}
      size={size}
      variant={variant}
      className={`gap-2 ${className}`}
    >
      {showIcon && (
        <>
          {platform === Platform.TWITTER ? (
            <Twitter size={size === "sm" ? 18 : 24} />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={size === "sm" ? 16 : 20}
              height={size === "sm" ? 16 : 20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          )}
        </>
      )}
      {connectAccount.isPending
        ? "Connecting..."
        : `Connect ${capitalize(platform)} Account`}
    </Button>
  );
}
