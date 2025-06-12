import { CrosspostClient } from "@crosspost/sdk";
import { sign } from "near-sign-verify";
import { OPEN_CROSSPOST_PROXY_API } from "../config";
import { toast } from "../hooks/use-toast";
import { near } from "./near";

let clientInstance: CrosspostClient | null = null;

/**
 * Gets or creates a CrosspostClient instance
 * @returns The CrosspostClient instance
 */
export function getClient(): CrosspostClient {
  if (!clientInstance) {
    clientInstance = new CrosspostClient({
      baseUrl: OPEN_CROSSPOST_PROXY_API,
    });
  }
  return clientInstance;
}

/**
 * Authorizes the app by verifying the payload with the backend,
 * persisting the authorization state, and notifying listeners.
 * @returns Promise resolving to true if authorization was successful, false otherwise.
 * @throws Error if the authorization process fails unexpectedly.
 */
export async function authorize(): Promise<boolean> {
  toast({
    title: "Authorizing...",
    description: "that your wallet can call the server",
    variant: "default",
  });

  try {
    const client = getClient();

    const message = `I authorize crosspost to post on my behalf to connected social platforms using my NEAR account: ${near.accountId()}`;
    const authToken = await sign({
      signer: near,
      recipient: "crosspost.near",
      message,
    });
    client.setAuthentication(authToken);

    // Call the SDK method to verify with the backend
    const response = await client.auth.authorizeNearAccount();

    // Check if the response was successful
    if (response.success) {
    } else {
      const errorMessage = response.errors?.length
        ? response.errors[0].message
        : "Authorization failed";
      throw new Error(errorMessage);
    }

    return true;
  } catch (error) {
    console.error("Authorization error:", error);
    throw error; // Re-throw for handling in UI
  }
}

/**
 * Unauthorizes the app by removing persisted state, notifying listeners,
 * and potentially informing the backend.
 * @returns Promise resolving when unauthorization is complete.
 */
export async function unauthorize(): Promise<void> {
  toast({
    title: "Revoking Authorization...",
    description: "Removing your authorization from the server",
    variant: "default",
  });

  try {
    const client = getClient();
    const response = await client.auth.unauthorizeNear();

    if (!response.success) {
      const errorMessage = response.errors?.length
        ? response.errors[0].message
        : "Unknown error occurred";
      throw new Error(errorMessage);
    }

    // Remove persisted state regardless of backend call success

    toast({
      title: "Authorization Revoked",
      description: "Successfully removed your authorization",
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Revocation Failed",
      description:
        error instanceof Error
          ? error.message
          : "Failed to revoke authorization",
      variant: "destructive",
    });
    console.error("Unauthorization error:", error);
    // Even if backend call fails, ensure local state is cleared
  }
}
