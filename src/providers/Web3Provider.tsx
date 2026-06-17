'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/web3/wagmi'
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
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => typeof window !== 'undefined' ? window.location.origin + '/api/rpc/solana' : 'https://api.mainnet-beta.solana.com', [])
  const wallets = useMemo(() => [], [])
  const onError = useCallback((error: Error) => {
    console.error(error);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
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
