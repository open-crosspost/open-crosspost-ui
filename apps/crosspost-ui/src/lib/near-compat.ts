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
    signature: Uint8Array;
    publicKey: string;
  } | null>;
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

// Helper to sign a message using the wallet
export async function signMessage(
  message: string,
  recipient: string
): Promise<{ signature: string; publicKey: string }> {
  if (!walletInstance) {
    throw new Error("Wallet not initialized. Make sure WalletProvider is set up.");
  }

  const result = await walletInstance.signMessage(message, recipient);
  
  if (!result) {
    throw new Error("Message signing failed or was cancelled");
  }

  // Convert Uint8Array signature to base64 string
  const signatureBase64 = Buffer.from(result.signature).toString("base64");

  return {
    signature: signatureBase64,
    publicKey: result.publicKey,
  };
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
      throw new Error("NEAR instance not initialized. Make sure WalletProvider is set up.");
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

    // Use near-kit to send transaction
    if (typeof nearInstance.sendTransaction === "function") {
      return await nearInstance.sendTransaction({
        receiverId: params.receiverId,
        actions: params.actions,
      });
    }

    // Fallback: use wallet connector
    const wallet = await getWallet();
    const transactions = params.actions.map((action: any) => ({
      receiverId: params.receiverId,
      actions: [action],
    }));

    if (transactions.length === 1) {
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: transactions[0].receiverId,
        actions: transactions[0].actions,
      });
    } else {
      await wallet.signAndSendTransactions({
        transactions: transactions.map((tx) => ({
          signerId: accountId,
          receiverId: tx.receiverId,
          actions: tx.actions,
        })),
      });
    }
  },
  subscribe: (callback: (state: { accountId: string | null }) => void) => {
    // Subscribe to wallet account changes
    // This is a simplified version - in a real implementation, you'd want to
    // properly subscribe to wallet events
    let lastAccountId: string | null = null;
    const interval = setInterval(async () => {
      const accountId = await getAccountId();
      if (accountId !== lastAccountId) {
        lastAccountId = accountId;
        callback({ accountId });
      }
    }, 1000);

    return () => clearInterval(interval);
  },
  onTx: (callback: (tx: unknown) => void) => {
    // Wallet selector handles transactions, so this is a no-op
    return () => {}; // Return unsubscribe function
  },
  requestSignIn: async (params: { contractId: string }) => {
    await signIn();
  },
};

