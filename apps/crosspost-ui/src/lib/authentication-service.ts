import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@crosspost/sdk";
import type { ApiResponse } from "@crosspost/types";
import {
  QueryClient,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "../hooks/use-toast";
import { getClient } from "./authorization-service";
import { signMessage } from "./near";

type ClientMethodExecutor<TData, TVariables> = (
  client: any, // Using any for client type to avoid circular dependencies
  variables: TVariables,
) => Promise<ApiResponse<TData>>;

type AuthDetailsGetter<TVariables> = (variables: TVariables) => string;

type OnSuccessCallback<TData, TVariables, TContext> = (
  data: TData,
  variables: TVariables,
  context: TContext | undefined,
  queryClient: QueryClient,
) => void | Promise<void>;

interface CreateAuthenticatedMutationProps<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> {
  /** Unique key for this mutation (used by React Query) */
  mutationKey: unknown[];
  /** Function that receives the authenticated client and variables, then calls the specific SDK method */
  clientMethod: ClientMethodExecutor<TData, TVariables>;
  /** Function that receives mutation variables and returns the string for authentication details */
  getAuthDetails: AuthDetailsGetter<TVariables>;
  /** Optional callback executed on mutation success */
  onSuccess?: OnSuccessCallback<TData, TVariables, TContext>;
  /** Optional callback executed on mutation error */
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>;
  /** Other standard useMutation options */
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn" | "mutationKey" | "onSuccess" | "onError"
  >;
}

/**
 * Factory function to create standardized useMutation hooks for authenticated API calls.
 * Handles wallet checks, authentication, client setup, basic error logging, and optional success/error callbacks.
 */
export function createAuthenticatedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>({
  mutationKey,
  clientMethod,
  getAuthDetails,
  onSuccess: onSuccessCallback,
  onError: onErrorCallback,
  options,
}: CreateAuthenticatedMutationProps<TData, TError, TVariables, TContext>) {
  return () => {
    const queryClient = useQueryClient();
    const { currentAccountId, isSignedIn } = useAuth();

    return useMutation<TData, TError, TVariables, TContext>({
      mutationKey,
      mutationFn: async (variables: TVariables): Promise<TData> => {
        try {
          const client = getClient();
          const authDetails = getAuthDetails(variables);
          
          // Check wallet connection first
          if (!isSignedIn || !currentAccountId) {
            throw new Error("Wallet not connected or account ID unavailable. Please connect your wallet first.");
          }

          // Set account header before authentication
          client.setAccountHeader(currentAccountId);
          
          // Verify wallet instance is available
          const { getWalletInstance } = await import("./near");
          const walletInstance = getWalletInstance();
          
          console.log("Wallet connection verified:", {
            isSignedIn,
            currentAccountId,
            hasWalletInstance: !!walletInstance,
            hasSignMessage: !!walletInstance?.signMessage,
            readyForAuth: !!walletInstance && !!walletInstance.signMessage,
          });

          if (!walletInstance || !walletInstance.signMessage) {
            throw new Error("Wallet signMessage function not available. Please reconnect your wallet and try again.");
          }

          toast({
            title: "Authenticating...",
            description: "Please sign the message in your wallet",
            variant: "default",
          });

          const message = `Authenticating request for NEAR account: ${currentAccountId}${authDetails ? ` (${authDetails})` : ""}`;
          
          console.log("Starting authentication for account:", currentAccountId);
          console.log("Authentication message:", message);
          
          // Use new signMessage helper with retry logic
          let authToken;
          let lastError: Error | null = null;
          const maxRetries = 2;
          
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              if (attempt > 0) {
                console.log(`Retrying authentication (attempt ${attempt + 1}/${maxRetries + 1})...`);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Re-check wallet instance
                const { getWalletInstance } = await import("./near");
                const walletInstance = getWalletInstance();
                if (!walletInstance || !walletInstance.signMessage) {
                  throw new Error("Wallet not ready. Please ensure your wallet is connected and unlocked.");
                }
              }
              
              authToken = await signMessage(message, "crosspost.near");
              console.log("Auth token received:", {
                hasSignature: !!authToken?.signature,
                hasPublicKey: !!authToken?.publicKey,
                signatureLength: authToken?.signature?.length,
                publicKeyLength: authToken?.publicKey?.length,
                signatureType: typeof authToken?.signature,
                publicKeyType: typeof authToken?.publicKey,
              });
              
              // Success - break out of retry loop
              break;
            } catch (error) {
              lastError = error instanceof Error ? error : new Error(String(error));
              console.error(`Message signing error (attempt ${attempt + 1}):`, error);
              
              const errorMessage = lastError.message;
              
              // Don't retry on user cancellation
              if (errorMessage.includes("cancelled") || errorMessage.includes("rejected") || errorMessage.includes("denied") || errorMessage.includes("cancelled by user")) {
                throw new Error("Authentication cancelled by user");
              }
              
              // Don't retry if wallet is not connected
              if (errorMessage.includes("not connected") || errorMessage.includes("not initialized") || errorMessage.includes("Wallet not connected") || errorMessage.includes("not available")) {
                throw new Error("Wallet not connected. Please connect your wallet first.");
              }
              
              // If this was the last attempt, throw the error
              if (attempt === maxRetries) {
                throw new Error(`NEAR authentication failed after ${maxRetries + 1} attempts: ${errorMessage}`);
              }
            }
          }
          
          // This should never happen, but TypeScript needs it
          if (!authToken) {
            throw lastError || new Error("Authentication failed: No token received");
          }

          if (!authToken || !authToken.signature || !authToken.publicKey) {
            console.error("Invalid auth token received:", authToken);
            throw new Error("NEAR authentication failed: Invalid authentication token (missing signature or publicKey)");
          }

          // Validate signature and publicKey are strings
          if (typeof authToken.signature !== 'string' || typeof authToken.publicKey !== 'string') {
            console.error("Invalid auth token types:", {
              signatureType: typeof authToken.signature,
              publicKeyType: typeof authToken.publicKey,
            });
            throw new Error("NEAR authentication failed: Invalid authentication token format (signature and publicKey must be strings)");
          }

          // SDK expects authToken as a string (JSON-encoded)
          // The backend expects: { signature: string, publicKey: string }
          client.setAuthentication(JSON.stringify(authToken));

          const response = await clientMethod(client, variables);

          console.log("response", response);

          if (response.success) {
            return response.data as TData;
          } else {
            const errorMessage = response.errors?.length
              ? response.errors[0].message
              : "Unknown error occurred";
            throw new Error(errorMessage);
          }
        } catch (error) {
          // Standardized error logging
          console.error(
            `API Mutation Error [${mutationKey.join("/")}]:`,
            getErrorMessage(error),
          );
          throw error;
        }
      },
      onSuccess: (data, variables, context) => {
        if (onSuccessCallback) {
          // Pass queryClient to the provided callback
          onSuccessCallback(data, variables, context, queryClient);
        }
      },
      onError: onErrorCallback,
      ...options,
    });
  };
}
