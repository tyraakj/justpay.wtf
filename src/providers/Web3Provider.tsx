'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/web3/wagmi'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { useCallback, useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_HELIUS_RPC ?? 'https://api.mainnet-beta.solana.com', [])
  const wallets = useMemo(() => [], [])
  const onError = useCallback((error: Error) => {
    console.error(error);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
