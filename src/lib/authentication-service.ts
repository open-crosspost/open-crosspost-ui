import { generateNonce, NearAuthData } from "near-sign-verify";
import { toast } from "../hooks/use-toast";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { getClient } from "./authorization-service";
import { ApiResponse, getErrorMessage } from "@crosspost/sdk";

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
    const { wallet, signedAccountId } = useWalletSelector();
    const queryClient = useQueryClient();

    return useMutation<TData, TError, TVariables, TContext>({
      mutationKey,
      mutationFn: async (variables: TVariables): Promise<TData> => {
        if (!wallet || !signedAccountId) {
          throw new Error("Wallet not connected or account ID unavailable.");
        }

        try {
          const client = getClient();
          const authDetailsString = getAuthDetails(variables);
          const authData = await authenticate(
            wallet,
            signedAccountId,
            authDetailsString,
          );
          client.setAuthentication(authData);

          const response = await clientMethod(client, variables);

          if (response.success && response.data) {
            return response.data;
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

/**
 * Creates the ephemeral authentication data needed for a specific API request.
 * This involves signing a message with the user's NEAR wallet.
 * This data should be generated immediately before making an authenticated API call.
 */
export async function authenticate(
  wallet: any,
  accountId: string,
  requestDetails?: string,
): Promise<NearAuthData> {
  if (!wallet || !accountId) {
    throw new Error("Wallet and account ID are required for authentication");
  }

  const message = `Authenticating request for NEAR account: ${accountId}${requestDetails ? ` (${requestDetails})` : ""}`;

  const nonce = generateNonce();
  const recipient = "crosspost.near";
  const callbackUrl = location.href;

  toast({
    title: "Authenticating...",
    description: "Please sign the message in your wallet",
    variant: "default",
  });

  const signedMessage = await wallet.signMessage({
    message,
    nonce: Buffer.from(nonce),
    recipient,
    callbackUrl,
  });

  return {
    message,
    nonce,
    recipient,
    callback_url: callbackUrl,
    signature: signedMessage.signature,
    account_id: signedMessage.accountId,
    public_key: signedMessage.publicKey,
  };
}
