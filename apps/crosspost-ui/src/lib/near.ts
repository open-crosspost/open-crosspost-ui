// Compatibility layer for old near.ts API using new wallet provider
// This file provides backward compatibility for code that uses the old near.ts API

import { NETWORK_ID } from "../config";
import { Buffer } from "buffer";

// Wallet instance type
interface WalletInstance {
  near: any;
  accountId: string | null;
  isConnecting: boolean;
  connector: any;
  connect: () => void;
  disconnect: () => void;
  signMessage: (message: string, recipient?: string) => Promise<{
    signature: string;
    publicKey: string;
  }>;
}

let walletInstance: WalletInstance | null = null;
let nearInstance: any = null;

// Initialize the wallet instance (called from provider)
export function setWalletInstance(wallet: WalletInstance | null) {
  walletInstance = wallet;
  nearInstance = wallet?.near || null;
}

// Helper to get current account
export async function getAccountId(): Promise<string | null> {
  if (!walletInstance) {
    throw new Error("Wallet not initialized. Make sure WalletProvider is set up.");
  }
  return walletInstance.accountId;
}

// Helper to check if signed in
export async function isSignedIn(): Promise<boolean> {
  const accountId = await getAccountId();
  return !!accountId;
}

// Helper to sign in
export async function signIn(): Promise<void> {
  if (!walletInstance) {
    throw new Error("Wallet not initialized. Make sure WalletProvider is set up.");
  }
  walletInstance.connect();
}

// Helper to sign out
export async function signOut(): Promise<void> {
  if (!walletInstance) {
    throw new Error("Wallet not initialized. Make sure WalletProvider is set up.");
  }
  walletInstance.disconnect();
}

// Helper to get wallet instance
export async function getWallet() {
  if (!walletInstance || !walletInstance.connector) {
    throw new Error("Wallet not initialized. Make sure WalletProvider is set up.");
  }
  return await walletInstance.connector.wallet();
}

// Helper to get the wallet instance (for near-social-js integration)
export function getWalletInstance(): WalletInstance | null {
  return walletInstance;
}

// Helper to sign a message using the wallet
export async function signMessage(
  message: string,
  recipient: string
): Promise<{ signature: string; publicKey: string }> {
  console.log("signMessage called:", {
    hasWalletInstance: !!walletInstance,
    hasSignMessage: !!walletInstance?.signMessage,
    accountId: walletInstance?.accountId,
    messageLength: message.length,
    recipient,
  });

  if (!walletInstance) {
    throw new Error("Wallet not initialized. Make sure WalletProvider is set up and wallet is connected.");
  }

  if (!walletInstance.signMessage) {
    throw new Error("Wallet signMessage function not available. Please ensure your wallet supports message signing.");
  }

  if (!walletInstance.accountId) {
    throw new Error("Wallet account not available. Please connect your wallet first.");
  }

  try {
    console.log("Calling walletInstance.signMessage...");
    const result = await walletInstance.signMessage(message, recipient);
    
    console.log("signMessage result received:", {
      hasResult: !!result,
      hasSignature: !!result?.signature,
      hasPublicKey: !!result?.publicKey,
      signatureType: typeof result?.signature,
      publicKeyType: typeof result?.publicKey,
    });
    
    if (!result) {
      throw new Error("Message signing failed or was cancelled by user");
    }

    if (!result.signature || !result.publicKey) {
      throw new Error("Invalid signature response: missing signature or publicKey");
    }

    // The wallet already returns signature as a string, so use it directly
    // If it's a Uint8Array, convert to base64; otherwise use as-is
    let signatureString: string;
    if (result.signature instanceof Uint8Array) {
      signatureString = Buffer.from(result.signature).toString("base64");
    } else if (typeof result.signature === "string") {
      signatureString = result.signature;
    } else {
      throw new Error(`Unexpected signature type: ${typeof result.signature}`);
    }

    return {
      signature: signatureString,
      publicKey: result.publicKey,
    };
  } catch (error) {
    console.error("Error in signMessage:", error);
    console.error("Error details:", {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      walletState: {
        hasWalletInstance: !!walletInstance,
        hasAccountId: !!walletInstance?.accountId,
        isConnecting: walletInstance?.isConnecting,
      },
    });
    
    if (error instanceof Error) {
      // Preserve the original error message for better debugging
      throw error;
    }
    throw new Error(`Message signing failed: ${String(error)}`);
  }
}

// Legacy compatibility - for near-social-service.ts
export const near = {
  accountId: async () => await getAccountId(),
  authStatus: async () => {
    const signedIn = await isSignedIn();
    return signedIn ? "SignedIn" : "SignedOut";
  },
  publicKey: async () => {
    if (!walletInstance || !walletInstance.connector) {
      return null;
    }
    try {
      const wallet = await walletInstance.connector.wallet();
      const accounts = await wallet.getAccounts();
      if (accounts && accounts.length > 0) {
        return accounts[0].publicKey.toString();
      }
    } catch (error) {
      // Handle "No accounts found" error gracefully
      if (error instanceof Error && error.message.includes('No accounts found')) {
        // Wallet is not connected, return null
        return null;
      }
      console.error("Error getting public key:", error);
    }
    return null;
  },
  view: async (params: {
    contractId: string;
    methodName: string;
    args: Record<string, unknown>;
  }) => {
    // Use near-kit for view calls
    if (!nearInstance) {
      throw new Error("NEAR instance not initialized");
    }
    
    // near-kit has a view method: view(contractId, methodName, args)
    return await nearInstance.view(
      params.contractId,
      params.methodName,
      params.args || {}
    );
  },
  actions: {
    functionCall: (params: {
      methodName: string;
      args: Record<string, unknown>;
      gas: string;
      deposit: string;
    }) => {
      return {
        type: "FunctionCall",
        params: {
          method_name: params.methodName,
          args: params.args,
          gas: params.gas,
          deposit: params.deposit,
        },
      };
    },
  },
  sendTx: async (params: {
    receiverId: string;
    actions: unknown[];
  }) => {
    if (!walletInstance || !nearInstance) {
      throw new Error("Wallet not initialized");
    }

    const accountId = await getAccountId();
    if (!accountId) {
      throw new Error("Not signed in");
    }

    // Use near-kit's transaction builder
    // Convert actions to near-kit format and use transaction builder
    const builder = nearInstance.transaction(accountId);
    
    // Process each action
    for (const action of params.actions) {
      const actionObj = action as any;
      
      if (actionObj.type === "FunctionCall" && actionObj.params) {
        const { method_name, args, gas, deposit } = actionObj.params;
        
        // Convert gas from atomic units to Tgas format for near-kit
        // near-kit expects gas as "30 Tgas" format or number
        const gasAmount = gas ? `${BigInt(gas) / BigInt(1000000000000)} Tgas` : undefined;
        
        // Convert deposit from yoctoNEAR to NEAR format
        // near-kit expects deposit as "1 NEAR" format or yoctoNEAR string
        const depositAmount = deposit ? `${deposit} yoctoNEAR` : undefined;
        
        // Use near-kit's functionCall method
        builder.functionCall(
          params.receiverId,
          method_name,
          args || {},
          {
            gas: gasAmount,
            attachedDeposit: depositAmount,
          }
        );
      } else if (actionObj.type === "Transfer" && actionObj.params) {
        // Handle transfer action
        const amount = actionObj.params.deposit || "0";
        // near-kit expects amount as "1 NEAR" format
        builder.transfer(params.receiverId, `${amount} yoctoNEAR`);
      }
      // Add other action types as needed
    }
    
    // Send the transaction
    return await builder.send();
  },
  subscribe: (callback: (state: { accountId: string | null }) => void) => {
    // Subscribe to wallet account changes using connector events
    if (!walletInstance || !walletInstance.connector) {
      // Return a no-op unsubscribe if wallet not initialized
      return () => {};
    }

    const connector = walletInstance.connector;
    
    // Listen to wallet events
    const handleSignIn = (data: any) => {
      const accountId = data.accounts?.[0]?.accountId || null;
      callback({ accountId });
    };
    
    const handleSignOut = () => {
      callback({ accountId: null });
    };

    connector.on('wallet:signIn', handleSignIn);
    connector.on('wallet:signOut', handleSignOut);

    // Return unsubscribe function
    return () => {
      connector.off('wallet:signIn', handleSignIn);
      connector.off('wallet:signOut', handleSignOut);
    };
  },
  onTx: (callback: (tx: unknown) => void) => {
    // Wallet selector handles transactions, so this is a no-op
    return () => {}; // Return unsubscribe function
  },
  requestSignIn: async (params: { contractId: string }) => {
    await signIn();
  },
};

