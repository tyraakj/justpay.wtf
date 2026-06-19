import { createDefaultWagmiConfig } from '@lifi/widget-provider-ethereum'

// LI.FI's createDefaultWagmiConfig starts with mainnet only.
// useSyncWagmiConfig (called in Web3Provider) dynamically adds all LI.FI-supported
// chains at runtime — the same pattern Jumper Exchange uses.
// No WalletConnect projectId configured yet; injected wallets (MetaMask, Rabby,
// browser extension wallets) are discovered automatically via EIP-6963.
export const { config, connectors } = createDefaultWagmiConfig({
  wagmiConfig: { ssr: true },
  lazy: true, // only load connector SDKs when needed — keeps initial bundle small
})
