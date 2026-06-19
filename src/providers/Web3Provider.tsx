'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config, connectors } from '@/lib/web3/wagmi'
import { useSyncWagmiConfig } from '@lifi/widget-provider-ethereum'
import { getChains, createClient, ChainType } from '@lifi/sdk'
import { useQuery } from '@tanstack/react-query'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { useCallback, useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

// Sui imports
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'

const queryClient = new QueryClient()

// Sui config
const suiNetworks = {
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
  testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
}

// LI.FI SDK client for chain fetching
const lifiClient = createClient({ integrator: 'justpay', disableVersionCheck: true })

/**
 * Inner component — must sit inside both WagmiProvider and QueryClientProvider.
 * Fetches all LI.FI-supported chains and syncs them into the wagmi config so
 * the widget (and any wagmi hook in the app) can switch to any EVM chain.
 * Mirrors the pattern used by Jumper Exchange's EVMProvider.
 */
function ChainSyncer() {
  const { data: chains } = useQuery({
    queryKey: ['lifi-chains'],
    queryFn: () => getChains(lifiClient, {
      chainTypes: [ChainType.EVM, ChainType.SVM, ChainType.UTXO, ChainType.MVM, ChainType.TVM],
    }),
    staleTime: 1000 * 60 * 60, // re-fetch at most once per hour
    gcTime: Infinity,
  })
  useSyncWagmiConfig(config, connectors, chains ?? [])
  return null
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const isTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true';
  const endpoint = useMemo(() => isTestnet ? 'https://api.devnet.solana.com' : (typeof window !== 'undefined' ? window.location.origin + '/api/rpc/solana' : 'https://api.mainnet-beta.solana.com'), [isTestnet])
  const wallets = useMemo(() => [], [])
  const onError = useCallback((error: Error) => {
    console.error(error);
  }, []);

  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ChainSyncer />
        <SuiClientProvider networks={suiNetworks} defaultNetwork="testnet">
          <SuiWalletProvider autoConnect>
            <ConnectionProvider endpoint={endpoint}>
              <SolanaWalletProvider wallets={wallets} autoConnect={false} onError={onError}>
                <WalletModalProvider>
                  {children}
                </WalletModalProvider>
              </SolanaWalletProvider>
            </ConnectionProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
