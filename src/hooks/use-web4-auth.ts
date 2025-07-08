import { AgentSecret, AuthMethod, AuthResult, ID, Account } from "jazz-tools";
import Cookies from "js-cookie";
import { useMemo, useState } from "react";

const WEB4_STORAGE_KEY = "web4-jazz-account";

// export function AuthDebugger() {
//     useEffect(() => {
//         const logState = () => {
//             console.log('Auth State:', {
//                 cookies: {
//                     web4_account_id: Cookies.get('web4_account_id'),
//                     web4_private_key: Cookies.get('web4_private_key'),
//                 },
//                 jazzStorage: {
//                     hasStoredCredentials: !!localStorage.getItem(WEB4_STORAGE_KEY),
//                     storedData: localStorage.getItem(WEB4_STORAGE_KEY)
//                 }
//             });
//         };

//         logState();
//         const interval = setInterval(logState, 2000);
//         return () => clearInterval(interval);
//     }, []);

//     return null;
// }

export class BrowserWeb4Auth implements AuthMethod {
  constructor(public driver: BrowserWeb4Auth.Driver) {}

  async start(): Promise<AuthResult> {
    const accountId = Cookies.get("web4_account_id");
    const privateKey = Cookies.get("web4_private_key");

    if (accountId && privateKey) {
      // TODO: This only works in the current session, which means signing out
      // or using a different browser/device/incognito will be fresh account
      const storedCredentials = localStorage.getItem(`jazz-web4-${accountId}`);

      if (storedCredentials) {
        const { jazzAccountID, jazzAccountSecret } =
          JSON.parse(storedCredentials);
        return {
          type: "existing",
          credentials: {
            accountID: jazzAccountID as ID<Account>,
            secret: jazzAccountSecret as AgentSecret
          },
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            window.location.href = "/web4/logout";
          }
        };
      } else {
        return {
          type: "new",
          creationProps: {
            name: accountId
          },
          saveCredentials: async (credentials: {
            accountID: ID<Account>;
            secret: AgentSecret;
          }) => {
            localStorage.setItem(
              `jazz-web4-${accountId}`,
              JSON.stringify({
                jazzAccountID: credentials.accountID,
                jazzAccountSecret: credentials.secret
              })
            );
          },
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            window.location.href = "/web4/logout";
          }
        };
      }
    } else {
      throw new Error("Not signed in");
    }

    // getSigner() {
    //     const keyStore = new keyStores.InMemoryKeyStore();
    //     const privateKey = Cookies.get('web4_private_key') || localStorage.getItem('anon_private_key');

    //     if (!privateKey) {
    //         const newKeyPair = KeyPair.fromRandom('ed25519');
    //         localStorage.setItem('anon_private_key', newKeyPair.toString());
    //         return new InMemorySigner(keyStore);
    //     }

    //     const accountId = Cookies.get('web4_account_id') || 'anon';
    //     keyStore.setKey(networkId, accountId, KeyPair.fromString(privateKey));
    //     return new InMemorySigner(keyStore);
    // }
  }
}

export namespace BrowserWeb4Auth {
  export interface Driver {
    onError: (error: string | Error) => void;
  }
}

export function useJazzWeb4Auth() {
  const [state, setState] = useState<{ errors: string[] }>({ errors: [] });

  const authMethod = useMemo(() => {
    const accountId = Cookies.get("web4_account_id");

    if (accountId) {
      return new BrowserWeb4Auth({
        onError: (error) => {
          localStorage.removeItem(WEB4_STORAGE_KEY);
          window.location.href = "/web4/logout";
          setState((state) => ({
            ...state,
            errors: [...state.errors, error.toString()]
          }));
        }
      });
    } else {
      return undefined;
    }
  }, [Cookies.get("web4_account_id")]);

  return [authMethod, state] as const;
}

// Helper hooks for common Web4 auth operations
export function useWeb4Auth() {
  const [authMethod, state] = useJazzWeb4Auth();

  return {
    isSignedIn: !!Cookies.get("web4_account_id"),
    accountId: Cookies.get("web4_account_id"),
    // signer: authMethod?.getSigner(),
    errors: state.errors,
    login: (callbackPath?: string) => {
      const callbackUrl = encodeURIComponent(window.origin);
      window.location.href = `/web4/login?web4_callback_url=${callbackUrl}${callbackPath}`;
    },
    logout: () => {
      window.location.href = "/web4/logout";
    }
  };
}
