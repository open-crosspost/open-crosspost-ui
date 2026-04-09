import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { NearConnector } from '@hot-labs/near-connect';
import { Near, fromHotConnect } from 'near-kit';
import { Buffer } from 'buffer';
import { setWalletInstance as setNearCompatWalletInstance } from '@/lib/near';

export type NetworkId = 'mainnet' | 'testnet';

interface WalletContextType {
  near: Near | null;
  accountId: string | null;
  isConnecting: boolean;
  connector: NearConnector | null;
  connect: () => void;
  disconnect: () => void;
  signMessage: (message: string, recipient?: string) => Promise<{
    signature: string;
    publicKey: string;
  }>;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
  network?: NetworkId;
  enableSignMessage?: boolean;
}

export function WalletProvider({
  children,
  network = 'mainnet',
  enableSignMessage = true,
}: WalletProviderProps) {
  const [near, setNear] = useState<Near | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connector, setConnector] = useState<NearConnector | null>(null);

  useEffect(() => {
    const nearConnector = new NearConnector({
      network,
      features: enableSignMessage
        ? {
            signMessage: true,
          }
        : undefined,
    });

    setConnector(nearConnector);

    nearConnector.on('wallet:signIn', async (data) => {
      const nearInstance = new Near({
        network,
        wallet: fromHotConnect(nearConnector),
      });

      setNear(nearInstance);
      setAccountId(data.accounts?.[0]?.accountId ?? null);
      setIsConnecting(false);
    });

    nearConnector.on('wallet:signOut', () => {
      setNear(null);
      setAccountId(null);
      setNearCompatWalletInstance(null);
    });

    // Check if wallet is already connected on mount
    nearConnector.wallet()
      .then(async (wallet) => {
        try {
          const accounts = await wallet.getAccounts();
          if (accounts && accounts.length > 0) {
            const nearInstance = new Near({
              network,
              wallet: fromHotConnect(nearConnector),
            });

            setNear(nearInstance);
            setAccountId(accounts[0]?.accountId ?? null);
          }
        } catch (error) {
          // Silently handle "No accounts found" error - this is expected when wallet is not connected
          if (error instanceof Error && error.message.includes('No accounts found')) {
            // Wallet is not connected, which is fine
            console.log('Wallet not connected yet');
          } else if (error instanceof Error && (
            error.message.includes('origins don\'t match') ||
            error.message.includes('postMessage') ||
            error.message.includes('metamask')
          )) {
            // Suppress wallet extension conflicts - these are non-critical
            // These errors occur when multiple wallet extensions are installed
          } else {
            console.error('Error getting wallet accounts:', error);
          }
        }
      })
      .catch((error) => {
        // Handle case where wallet() itself fails (e.g., no wallet extension installed)
        if (error instanceof Error && error.message.includes('No accounts found')) {
          // This is expected when no wallet is connected
          console.log('No wallet connected');
        } else if (error instanceof Error && (
          error.message.includes('origins don\'t match') ||
          error.message.includes('postMessage') ||
          error.message.includes('metamask')
        )) {
          // Suppress wallet extension conflicts - these are non-critical
        } else {
          console.error('Error accessing wallet:', error);
        }
      });

    return () => {
      nearConnector.removeAllListeners();
    };
  }, [network, enableSignMessage]);

  const connect = useCallback(() => {
    if (connector) {
      setIsConnecting(true);
      Promise.resolve(connector.connect()).catch((error: unknown) => {
        setIsConnecting(false);
        if (
          error instanceof Error &&
          (error.message.includes('User rejected') ||
            error.message.toLowerCase().includes('rejected') ||
            error.message.toLowerCase().includes('cancelled') ||
            error.message.toLowerCase().includes('denied'))
        ) {
          // User closed/rejected wallet prompt; keep this non-fatal.
          return;
        }
        console.error('Wallet connect error:', error);
      });
    }
  }, [connector]);

  const disconnect = useCallback(() => {
    if (connector) {
      connector.disconnect();
    }
  }, [connector]);

  const signMessage = useCallback(
    async (message: string, recipient?: string) => {
      console.log("WalletProvider.signMessage called:", {
        hasNear: !!near,
        accountId,
        messageLength: message.length,
        recipient: recipient || accountId,
      });

      if (!near || !accountId) {
        const errorMsg = !near 
          ? "NEAR instance not available. Please ensure wallet is connected."
          : "Account ID not available. Please connect your wallet first.";
        console.error("signMessage precondition failed:", { hasNear: !!near, accountId });
        throw new Error(errorMsg);
      }

      try {
        // Use near-kit's signMessage method (NEP-413 standard)
        // Generate a proper 32-byte nonce as Uint8Array
        const nonce = new Uint8Array(32);
        crypto.getRandomValues(nonce);
        
        console.log("Calling near.signMessage with:", {
          messageLength: message.length,
          recipient: recipient || accountId,
          hasNonce: !!nonce,
        });
        
        // Use near-kit's signMessage method
        const signedMessage = await near.signMessage({
          message,
          recipient: recipient || accountId,
          nonce,
        });

        console.log('Signed message result (near-kit):', {
          accountId: signedMessage.accountId,
          publicKey: signedMessage.publicKey,
          signature: signedMessage.signature,
          signatureType: typeof signedMessage.signature,
        });

        // Validate the response
        if (!signedMessage || !signedMessage.signature || !signedMessage.publicKey) {
          throw new Error("Invalid signature response from wallet");
        }

        // Ensure publicKey is a string
        let publicKeyString: string;
        if (typeof signedMessage.publicKey === 'string') {
          publicKeyString = signedMessage.publicKey;
        } else if (signedMessage.publicKey && typeof signedMessage.publicKey.toString === 'function') {
          publicKeyString = signedMessage.publicKey.toString();
        } else {
          throw new Error("Invalid publicKey format in signature response");
        }

        // Ensure signature is a string (near-kit should return base64 encoded string)
        let signatureString: string;
        if (typeof signedMessage.signature === 'string') {
          signatureString = signedMessage.signature;
        } else {
          throw new Error("Invalid signature format in signature response");
        }

        // near-kit returns signature as string (base64 encoded)
        return {
          signature: signatureString,
          publicKey: publicKeyString,
        };
      } catch (error) {
        console.error('Error signing message with near-kit:', error);
        // Re-throw with more context if it's not already an Error
        if (error instanceof Error) {
          // Check if it's a user cancellation
          if (error.message.includes("rejected") || error.message.includes("cancelled") || error.message.includes("denied")) {
            throw new Error("Message signing was cancelled by user");
          }
          throw error;
        }
        throw new Error(`Failed to sign message: ${String(error)}`);
      }
    },
    [near, accountId]
  );

  // Update compatibility layer whenever wallet state changes
  useEffect(() => {
    if (connector && accountId && near) {
      console.log("Setting wallet instance:", {
        hasConnector: !!connector,
        accountId,
        hasNear: !!near,
        hasSignMessage: typeof signMessage === 'function',
      });
      
      setNearCompatWalletInstance({
        near,
        accountId,
        isConnecting,
        connector,
        connect,
        disconnect,
        signMessage,
      });
    } else {
      console.log("Clearing wallet instance:", {
        hasConnector: !!connector,
        accountId,
        hasNear: !!near,
      });
      setNearCompatWalletInstance(null);
    }
  }, [near, accountId, isConnecting, connector, connect, disconnect, signMessage]);

  return (
    <WalletContext.Provider
      value={{
        near,
        accountId,
        isConnecting,
        connector,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

