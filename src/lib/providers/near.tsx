import { NETWORK_ID } from "@/config";
import * as near from "fastintear";
import React, { useEffect } from "react";
import { create as createStore } from "zustand";

interface StoreState {
  wallet: Wallet | undefined;
  signedAccountId: string;
  networkId: NetworkId;
  setNetworkId: (networkId: NetworkId) => void;
  setWallet: (wallet: Wallet) => void;
  setSignedAccountId: (signedAccountId: string | undefined) => void;
}

// Store to share wallet and signed account
export const useWallet = createStore<StoreState>((set) => ({
  wallet: undefined,
  signedAccountId: "",
  networkId: NETWORK_ID,
  setNetworkId: (networkId: NetworkId) => set({ networkId }),
  setWallet: (wallet: Wallet) => set({ wallet }),
  setSignedAccountId: (signedAccountId: string | undefined) => {
    return set({ signedAccountId });
  }
}));

type NearProviderProps = {
  children: React.ReactNode;
};

// const getNearContract = (networkId: NetworkId) => GUESTBOOK_CONTRACT[networkId];
const getNearContract = (networkId: NetworkId) =>
  "everything.mintspace2.testnet";

export default function NearProvider({ children }: NearProviderProps) {
  const { setWallet, setSignedAccountId, networkId } = useWallet();

  useEffect(() => {
    const wallet = new Wallet({
      createAccessKeyFor: getNearContract(networkId as NetworkId),
      networkId: networkId as NetworkId
    });
    wallet.startUp((accountId) => setSignedAccountId(accountId));

    setWallet(wallet);
  }, [networkId]);

  return <>{children}</>;
}
