import { generateNonce, NearAuthData } from "near-sign-verify";

/**
 * Creates the ephemeral authentication data needed for a specific API request.
 * This involves signing a message with the user's NEAR wallet.
 * This data should be generated immediately before making an authenticated API call.
 * @param wallet - NEAR wallet instance from useWalletSelector()
 * @param accountId - NEAR account ID from useWalletSelector()
 * @param requestDetails - Optional details about the request being made (e.g., action, parameters)
 * @returns Promise resolving to the NearAuthData object for the request.
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
