import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface PopupWindowOptions {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

interface PopupMessageHandler<T> {
  type: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export function usePopupWindow<T>({
  type,
  onSuccess,
  onError,
}: PopupMessageHandler<T>) {
  const popupRef = useRef<Window | null>(null);
  const hasReceivedSuccess = useRef(false);
  const isHandlingSuccess = useRef(false);
  const queryClient = useQueryClient();

  const expectedOrigin = window.location.origin;

  // Check if popup was closed manually
  useEffect(() => {
    if (!popupRef.current) return;

    // Check if popup was closed manually
    const checkClosedInterval = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(checkClosedInterval);

        // Only show error if we're not handling a success message
        if (!isHandlingSuccess.current && !hasReceivedSuccess.current) {
          onError?.({ error: "Authentication cancelled by user." });
        }

        // Clear popup reference if we're not in success handling
        if (!isHandlingSuccess.current) {
          popupRef.current = null;
        }
      }
    }, 500);

    return () => clearInterval(checkClosedInterval);
  }, [onError]);

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Filter out wallet extension messages (MetaMask, etc.)
      if (
        event.data?.name === 'metamask-provider' ||
        event.data?.target === 'metamask-inpage' ||
        event.source === window // Ignore messages from same window (wallet extensions)
      ) {
        // These are from wallet extensions, not our popup
        return;
      }

      // Verify the message origin
      if (event.origin !== expectedOrigin) {
        // Only warn if it's not from a known wallet extension origin
        const walletOrigins = [
          'https://wallet.meteorwallet.app',
          'chrome-extension://',
          'moz-extension://',
        ];
        const isWalletOrigin = walletOrigins.some(origin => 
          event.origin.includes(origin)
        );
        
        if (!isWalletOrigin) {
          console.warn(
            "Ignoring message from unexpected origin:",
            event.origin,
            "expected:",
            expectedOrigin,
          );
        }
        return;
      }

      // Check if it's our message type (match guide's format)
      if (event.data?.type === "AUTH_CALLBACK") {
        const { success, ...data } = event.data.data;

        if (success) {
          isHandlingSuccess.current = true;
          hasReceivedSuccess.current = true;

          // Invalidate the connected accounts query
          queryClient.invalidateQueries({ queryKey: ["connectedAccounts"] });

          onSuccess?.(data as T);

          // Clear popup and reset handling flag after a delay
          setTimeout(() => {
            popupRef.current = null;
            isHandlingSuccess.current = false;
          }, 500);
        } else {
          onError?.(data);
          popupRef.current = null;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [type, onSuccess, onError]);

  const openPopup = (url: string, options: PopupWindowOptions = {}) => {
    // Reset success state when opening new popup
    hasReceivedSuccess.current = false;
    const {
      width = 600,
      height = 700,
      left = typeof window !== "undefined"
        ? (window.innerWidth - 600) / 2
        : 400,
      top = typeof window !== "undefined"
        ? (window.innerHeight - 700) / 2
        : 100,
    } = options;

    const popup = window.open(
      url,
      "popupWindow",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }

    popupRef.current = popup;
    return popup;
  };

  return {
    openPopup,
    popup: popupRef.current,
  };
}
