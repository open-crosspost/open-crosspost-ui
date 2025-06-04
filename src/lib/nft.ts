import { providers } from "near-api-js";
import { Buffer } from "buffer";

// Define the NFT token type
export type NftToken = {
  token_id: string;
  owner_id: string;
  metadata: {
    title: string | null;
    description: string | null;
    media: string | null;
    media_hash: string | null;
  };
};

// Shitzu NFT contract ID
export const SHITZU_CONTRACT_ID = "shitzu.bodega-lab.near";
export const SHITZU_REWARDS_CONTRACT_ID = "rewards.0xshitzu.near"; // for staked NFTs

// Blackdragon NFT contract ID
export const BLACKDRAGON_NFT_CONTRACT_ID = "blackdragonforevernft.near";

// RPC endpoint for NEAR mainnet
const NEAR_RPC_ENDPOINT = "https://rpc.mainnet.near.org";

interface CheckNFTOwnershipParams {
  accountId: string;
  contractId: string;
  methodName: string;
  args?: Record<string, any>;
  validationFn: (result: any) => boolean;
}

/* Generic function to check NFT ownership or a similar contract state.
 */
export async function checkNFTOwnership({
  accountId,
  contractId,
  methodName,
  args = { account_id: accountId },
  validationFn,
}: CheckNFTOwnershipParams): Promise<boolean> {
  if (!accountId || !contractId || !methodName) return false;

  try {
    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_ENDPOINT });

    const queryArgs = args || { account_id: accountId };

    const result = await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: methodName,
      args_base64: btoa(JSON.stringify(queryArgs)),
      finality: "final",
    });

    if (result && "result" in result && (result as any).result) {
      const parsedResult = JSON.parse(
        Buffer.from((result as any).result).toString()
      );
      return validationFn(parsedResult);
    }
    return validationFn(null);
  } catch (error) {
    console.error(
      `Error calling ${methodName} on ${contractId} for ${accountId}:`,
      error
    );
    return false;
  }
}

/* Check if an account owns a Shitzu NFT (staked).
 */
export async function hasShitzuNft(accountId: string): Promise<boolean> {
  return checkNFTOwnership({
    accountId,
    contractId: SHITZU_REWARDS_CONTRACT_ID,
    methodName: "primary_nft_of",
    args: { account_id: accountId },
    validationFn: (tokens) => Array.isArray(tokens) && tokens.length > 0,
  });
}

/**
 * Check if an account owns a Blackdragon NFT.
 */
export async function hasBlackdragonNft(accountId: string): Promise<boolean> {
  return checkNFTOwnership({
    accountId,
    contractId: BLACKDRAGON_NFT_CONTRACT_ID,
    methodName: "nft_tokens_for_owner",
    args: { account_id: accountId },
    validationFn: (tokens) => Array.isArray(tokens) && tokens.length > 0,
  });
}