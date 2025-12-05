import { near } from "./near";
import { convertAtomicToStandard } from "./utils/string";
import BigNumber from "bignumber.js";

// Neko Cookie contract ID
export const NEKO_COOKIE_CONTRACT_ID = "cookie.nekotoken.near";

/**
 * Checks if a given NEAR account holds at least 100,000 NEKO Cookies.
 *
 * This function queries the `ft_balance_of` view method on the
 * `cookie.nekotoken.near` smart contract using the NEAR RPC.
 *
 * The result is validated to confirm that the account's balance is
 * at least 100,000.
 *
 * @param accountId - The NEAR account ID to verify token balance for.
 * @returns A Promise that resolves to `true` if the account holds enough
 *          tokens, or `false` otherwise (including on error).
 */
export async function hasNekoCookie(accountId: string): Promise<boolean> {
  if (!accountId) return false;

  try {
    const result = await near.view({
      contractId: NEKO_COOKIE_CONTRACT_ID,
      methodName: "ft_balance_of",
      args: { account_id: accountId },
    });

    const standardAmount = new BigNumber(convertAtomicToStandard(result, 24));
    const threshold = new BigNumber(100000); // 100k $COOKIE

    return standardAmount.gte(threshold);
  } catch (error) {
    console.error("Error checking $COOKIE balance:", error);
    return false;
  }
}
