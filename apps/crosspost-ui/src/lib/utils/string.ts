import BigNumber from "bignumber.js";

export const capitalize = (input: string) => {
  return input.charAt(0).toUpperCase() + input.slice(1);
};

/**
 * Converts an atomic amount (string) to a standard decimal representation.
 * @param atomicAmount The amount in atomic units.
 * @param decimals The number of decimals for the token.
 * @returns The amount in standard units as a string.
 */
export function convertAtomicToStandard(
  atomicAmount: string,
  decimals: number,
): string {
  if (
    !atomicAmount ||
    typeof atomicAmount !== "string" ||
    !atomicAmount.match(/^\d+$/)
  ) {
    return "0";
  }

  BigNumber.config({ ROUNDING_MODE: 0 });

  return new BigNumber(atomicAmount)
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed();
}
