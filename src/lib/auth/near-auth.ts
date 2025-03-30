import { OPEN_CROSSPOST_PROXY_API } from '../../config';

// Interface for NEAR auth data as expected by the proxy server
export interface NearAuthData {
  /**
   * NEAR account ID
   */
  account_id: string;

  /**
   * Public key used for signing
   */
  public_key: string;

  /**
   * Signature of the message
   */
  signature: string;

  /**
   * Message that was signed
   */
  message: string;

  /**
   * Nonce used for signing
   */
  nonce: string;

  /**
   * Recipient of the message
   */
  recipient?: string;

  /**
   * Callback URL
   */
  callback_url?: string;
}

// In-memory cache for the current auth data
let currentAuthData: NearAuthData | null = null;

/**
 * Signs in with NEAR wallet and returns the auth object
 * @param wallet - NEAR wallet instance
 * @param message - Message to sign
 * @returns Auth object with signature, accountId, and publicKey
 */
export async function signInWithNear(wallet: any, message: string): Promise<NearAuthData> {
  if (!wallet) {
    throw new Error("Wallet is required");
  }

  // Generate nonce based on current time in milliseconds
  const nonce = new String(Date.now());
  const nonceBuffer = Buffer.from(
    new TextEncoder().encode(nonce.padStart(32, "0"))
  );

  const recipient = "crosspost.near";
  const callbackUrl = location.href;
  
  // Sign the message with the wallet
  const signedMessage = await wallet.signMessage({
    message,
    nonce: nonceBuffer,
    recipient,
    callbackUrl,
  });

  // Create auth object with signature details
  const authData: NearAuthData = {
    message,
    nonce: nonce as string,
    recipient,
    callback_url: callbackUrl,
    signature: signedMessage.signature,
    account_id: signedMessage.accountId,
    public_key: signedMessage.publicKey
  };

  // Store in memory
  currentAuthData = authData;

  return authData;
}

/**
 * Signs a message with the NEAR wallet
 * @param wallet - NEAR wallet instance
 * @param message - Message to sign
 * @returns Signature
 */
export async function signMessage(wallet: any, message: string): Promise<string> {
  if (!wallet) {
    throw new Error("Wallet is required");
  }
  
  // Generate nonce based on current time
  const nonce = new String(Date.now());
  const nonceBuffer = Buffer.from(
    new TextEncoder().encode(nonce.padStart(32, "0"))
  );

  const recipient = "crosspost.near";
  
  // Sign the message with the wallet
  const signedMessage = await wallet.signMessage({
    message,
    nonce: nonceBuffer,
    recipient,
  });

  return signedMessage.signature;
}

/**
 * Initializes authentication with the proxy API
 * @param authData - NEAR auth object
 * @param returnUrl - Optional return URL after authentication
 * @returns API response
 */
export async function initWithNearAuth(authData: NearAuthData, returnUrl?: string): Promise<any> {
  // Store in memory for future API calls
  currentAuthData = authData;
  
  const body: any = {};
  if (returnUrl) {
    body.returnUrl = returnUrl;
  }
  
  const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/auth/authorize/near`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JSON.stringify(authData)}`
    },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
  });

  return response.json();
}

/**
 * Checks the authorization status with the proxy API
 * @param wallet - NEAR wallet instance
 * @returns Promise resolving to { isAuthorized: boolean }
 */
export async function checkAuthorizationStatus(wallet: any): Promise<{ isAuthorized: boolean }> {
  try {
    if (!wallet) {
      return { isAuthorized: false };
    }
    
    // Create a simple message to sign for the status check
    const message = "Check authorization status";
    const authData = await signInWithNear(wallet, message);
    
    const response = await fetch(`${OPEN_CROSSPOST_PROXY_API}/auth/authorize/near/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.stringify(authData)}`
      }
    });
    
    const data = await response.json();
    return { isAuthorized: data.isAuthorized || false };
  } catch (error) {
    console.error("Error checking authorization status:", error);
    return { isAuthorized: false };
  }
}

/**
 * Clears the current auth data
 */
export function clearNearAuth(): void {
  currentAuthData = null;
}

/**
 * Gets the current auth data
 * @returns The NEAR auth object or null if not found
 */
export function getCurrentAuthData(): NearAuthData | null {
  return currentAuthData;
}

/**
 * Gets the Authorization header for NEAR auth
 * @returns The Authorization header value or null if not authenticated
 */
export function getNearAuthHeader(): string | null {
  if (!currentAuthData) return null;
  return JSON.stringify(currentAuthData);
}

/**
 * Creates a new auth data object using the provided wallet
 * @param wallet - NEAR wallet instance
 * @param accountId - NEAR account ID
 * @param message - Message to sign
 * @returns Promise resolving to the auth data
 */
export async function createAuthData(
  wallet: any, 
  accountId: string, 
  message: string
): Promise<NearAuthData> {
  if (!wallet || !accountId) {
    throw new Error("Wallet and account ID are required");
  }
  
  return signInWithNear(wallet, message);
}
