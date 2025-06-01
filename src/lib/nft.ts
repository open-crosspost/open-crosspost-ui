import { providers } from "near-api-js";

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

// RPC endpoint for NEAR mainnet
const NEAR_RPC_ENDPOINT = "https://rpc.mainnet.near.org";

/**
 * Check if an account owns a Shitzu NFT
 * @param accountId The NEAR account ID to check
 * @returns Promise resolving to a boolean indicating ownership
 */
export async function hasShitzuNft(accountId: string): Promise<boolean> {
  if (!accountId) return false;

  try {
    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_ENDPOINT });

    const result = await provider.query({
      request_type: "call_function",
      account_id: SHITZU_CONTRACT_ID,
      method_name: "nft_tokens_for_owner",
      args_base64: Buffer.from(
        JSON.stringify({ account_id: accountId }),
      ).toString("base64"),
      finality: "optimistic",
    });
    if (result && "result" in result) {
      const tokens = JSON.parse(
        Buffer.from((result as any).result).toString(),
      ) as NftToken[];
      return tokens.length > 0;
    }

    return false;
  } catch (error) {
    console.error("Error checking Shitzu NFT ownership:", error);
    return false;
  }
}
