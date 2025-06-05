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

/**
 * Generic function to check NFT ownership or a similar contract state.
 * @param accountId The NEAR account ID to check.
 * @param contractId The contract ID to query.
 * @param methodName The view method name on the contract.
 * @param args Optional arguments for the contract method.
 * @param validationFn A function that takes the method result and returns true if valid.
 * @returns Promise resolving to a boolean indicating validity based on validationFn.
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
        Buffer.from((result as any).result).toString(),
      );
      return validationFn(parsedResult);
    }
    return validationFn(null);
  } catch (error) {
    console.error(
      `Error calling ${methodName} on ${contractId} for ${accountId}:`,
      error,
    );
    return false;
  }
}

/**
 * Specific function to check if an account owns a Shitzu NFT (staked).
 * Uses the generic checkNFTOwnership.
 * @param accountId The NEAR account ID to check
 * @returns Promise resolving to a boolean indicating ownership
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
 * Checks if a given NEAR account owns at least one Blackdragon NFT.
 *
 * This function queries the `nft_tokens_for_owner` view method on the
 * `blackdragonforevernft.near` smart contract using the NEAR RPC.
 *
 * The result is validated to confirm that the returned data is an array
 * of tokens and that the array is not empty, indicating ownership of at
 * least one NFT from the Blackdragon collection.
 *
 * @param accountId - The NEAR account ID to verify NFT ownership for.
 * @returns A Promise that resolves to `true` if the account owns one or more
 *          Blackdragon NFTs, or `false` otherwise (including on error).
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
