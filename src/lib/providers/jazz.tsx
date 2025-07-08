import React from "react";
import { UserAccount } from "@/lib/schema";
import { JazzReactProvider } from "jazz-tools/react";
import { useAuth } from "@/contexts/auth-context";

const JAZZ_PEER_URL = import.meta.env.VITE_JAZZ_PEER_URL as
  | `wss://${string}`
  | `ws://${string}`;

if (!JAZZ_PEER_URL) {
  throw new Error("VITE_JAZZ_PEER_URL is not defined in your .env file");
}

export function JazzProvider({ children }: { children: React.ReactNode }) {
  const { authProvider } = useAuth();

  return (
    <JazzReactProvider
      auth={authProvider}
      sync={{ peer: JAZZ_PEER_URL, when: authProvider ? "signedUp" : "never" }}
      AccountSchema={UserAccount}
    >
      {children}
    </JazzReactProvider>
  );
}
