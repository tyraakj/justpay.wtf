// EVM chains are stored and resolved as LI.FI chain IDs (e.g. "8453", "42161").
// Non-EVM chains use LI.FI's string IDs: "sol" and "sui".
// This file only defines helpers used outside the widget.

export const SOLANA_NATIVE_TOKEN = 'So11111111111111111111111111111111111111112'
export const SUI_NATIVE_TOKEN    = '0x2::sui::SUI'

export const NON_EVM_CHAIN_IDS = ['sol', 'sui'] as const
export type NonEvmChainId = typeof NON_EVM_CHAIN_IDS[number]

/**
 * Returns the native token address for a given LI.FI chain ID.
 * All EVM chains use the zero address convention.
 * Non-EVM chains have explicit native mints.
 */
export function getNativeTokenAddress(chainId: string): string {
  if (chainId === 'sol') return SOLANA_NATIVE_TOKEN
  if (chainId === 'sui') return SUI_NATIVE_TOKEN
  return '0x0000000000000000000000000000000000000000'
}

/**
 * Parse a stored destinationChain value into what LI.FI widget expects.
 * EVM: stored as numeric string "8453" → widget wants number 8453
 * Non-EVM: stored as "sol" / "sui" → widget wants it as-is
 */
export function parseChainIdForWidget(chainId: string): number | string {
  const n = Number(chainId)
  return isNaN(n) ? chainId : n
}
