// Chains for EVM Wallets
interface EVMChain {
  chainId: number;
  name: string;
  explorer: string;
  rpc: string;
}

interface EVMWalletChains {
  [key: string]: EVMChain;
}

const evmWalletChains: EVMWalletChains = {
  mainnet: {
    chainId: 397,
    name: "Near Mainnet",
    explorer: "https://eth-explorer.near.org",
    rpc: "https://eth-rpc.mainnet.near.org",
  },
  testnet: {
    chainId: 398,
    name: "Near Testnet",
    explorer: "https://eth-explorer-testnet.near.org",
    rpc: "https://eth-rpc.testnet.near.org",
  },
};

export const NETWORK_ID = "mainnet";
export const EVMWalletChain = evmWalletChains[NETWORK_ID];

export const NEAR_SOCIAL_ENABLED = true;
export const TWITTER_ENABLED = true;

// API Configuration
export const OPEN_CROSSPOST_PROXY_API = process.env.NEXT_PUBLIC_OPEN_CROSSPOST_PROXY_API || 'http://0.0.0.0:3000';

// Supported platforms
export type SupportedPlatform = 'twitter' | 'near';
export const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['twitter', 'near'];

// Authentication configuration
export const AUTH_STORAGE_PREFIX = 'crosspost_auth_';
export const APP_NAME = 'Crosspost';
