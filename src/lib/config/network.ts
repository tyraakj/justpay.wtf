// EVM chains are stored and resolved as LI.FI chain IDs (e.g. "8453", "42161").
// Non-EVM chains use LI.FI's string IDs: "sol" and "sui".
// LI.FI also uses numeric IDs for non-EVM: Solana = 1151111081099710, Sui = 9270000000000000
// This file only defines helpers used outside the widget.

export const SOLANA_NATIVE_TOKEN =
  "So11111111111111111111111111111111111111112";
export const SUI_NATIVE_TOKEN = "0x2::sui::SUI";

export const SOLANA_CHAIN_ID = "1151111081099710";
export const SUI_CHAIN_ID = "9270000000000000";

export const NON_EVM_CHAIN_IDS = [
  "sol",
  "sui",
  SOLANA_CHAIN_ID,
  SUI_CHAIN_ID,
] as const;
export type NonEvmChainId = (typeof NON_EVM_CHAIN_IDS)[number];

/** Check if a chain ID represents Solana (either "sol" or its numeric LI.FI ID) */
export function isSolana(chainId: string): boolean {
  return chainId === "sol" || chainId === SOLANA_CHAIN_ID;
}

/** Check if a chain ID represents Sui (either "sui" or its numeric LI.FI ID) */
export function isSui(chainId: string): boolean {
  return chainId === "sui" || chainId === SUI_CHAIN_ID;
}

/**
 * Returns the native token address for a given LI.FI chain ID.
 * All EVM chains use the zero address convention.
 * Non-EVM chains have explicit native mints.
 */
export function getNativeTokenAddress(chainId: string): string {
  if (isSolana(chainId)) return SOLANA_NATIVE_TOKEN;
  if (isSui(chainId)) return SUI_NATIVE_TOKEN;
  return "0x0000000000000000000000000000000000000000";
}

/**
 * Parse a stored destinationChain value into what LI.FI widget expects.
 * EVM: stored as numeric string "8453" → widget wants number 8453
 * Non-EVM: stored as "sol" / "sui" → widget wants it as-is
 */
export function parseChainIdForWidget(chainId: string): number | string {
  const n = Number(chainId);
  return isNaN(n) ? chainId : n;
}
