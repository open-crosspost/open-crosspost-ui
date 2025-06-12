import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@crosspost/sdk";
import type { ApiResponse } from "@crosspost/types";
import {
  QueryClient,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { sign } from "near-sign-verify";
import { toast } from "../hooks/use-toast";
import { getClient } from "./authorization-service";
import { near } from "./near";

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
          if (!isSignedIn) {
            throw new Error("Wallet not connected or account ID unavailable.");
          }

          toast({
            title: "Authenticating...",
            description: "Please sign the message in your wallet",
            variant: "default",
          });

          const message = `Authenticating request for NEAR account: ${currentAccountId}${authDetails ? ` (${authDetails})` : ""}`;
          const authToken = await sign({
            signer: near,
            recipient: "crosspost.near",
            message,
          });

          client.setAuthentication(authToken);

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
