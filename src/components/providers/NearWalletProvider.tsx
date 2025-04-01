import { SOCIAL_CONTRACT } from "@/lib/near-social";
import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import React, { ReactNode } from "react";
import { NETWORK_ID } from "../../config";

interface NearWalletProviderProps {
  children: ReactNode;
}

export function NearWalletProvider({ children }: NearWalletProviderProps) {
  return (
    <WalletSelectorProvider
      config={{
        network: NETWORK_ID,
        createAccessKeyFor: SOCIAL_CONTRACT[NETWORK_ID],
        modules: [
          setupMyNearWallet(),
          setupMeteorWallet(),
          // setupHereWallet(),
          setupNearMobileWallet(),
          // @ts-ignore
          setupBitteWallet({ contractId: SOCIAL_CONTRACT[NETWORK_ID] }),
        ],
      }}
    >
      {children}
    </WalletSelectorProvider>
  );
}
